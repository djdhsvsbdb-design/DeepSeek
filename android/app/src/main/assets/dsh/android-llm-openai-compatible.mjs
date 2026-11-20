/**
 * Android adapter for OpenAI-compatible chat-completions providers.
 * Credential is supplied by the host at runtime and is never persisted here.
 */
export function createOpenAICompatibleModel({ baseURL = 'https://api.deepseek.com/v1', apiKey, model, temperature, maxTokens } = {}) {
  if (typeof apiKey !== 'string' || !apiKey.trim()) throw new TypeError('apiKey is required');
  if (typeof model !== 'string' || !model.trim()) throw new TypeError('model is required');
  const endpoint = baseURL.replace(/\\/+$/, '') + '/chat/completions';

  return {
    async complete({ messages = [], tools = [], signal, onChunk = () => {} } = {}) {
      signal?.throwIfAborted();
      const payload = { model, messages: normalizeMessages(messages), stream: true };
      if (temperature !== undefined) payload.temperature = temperature;
      if (maxTokens !== undefined) payload.max_tokens = maxTokens;
      if (tools.length) payload.tools = normalizeTools(tools);

      const response = await fetch(endpoint, {
        method: 'POST', signal, redirect: 'error',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + apiKey },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 4000);
        throw Object.assign(new Error('LLM request failed (' + response.status + '): ' + detail), { code: 'HTTP_' + response.status });
      }
      if (!response.body) throw new Error('LLM streaming response has no body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', text = '', finishReason = null;
      const calls = new Map();
      try {
        while (true) {
          signal?.throwIfAborted();
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split(/\\r?\\n\\r?\\n/);
          buffer = frames.pop() ?? '';
          for (const frame of frames) {
            const data = frame.split(/\\r?\\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\\n');
            if (!data || data === '[DONE]') continue;
            let packet;
            try { packet = JSON.parse(data); } catch { continue; }
            const delta = packet.choices?.[0]?.delta ?? {};
            if (typeof delta.content === 'string' && delta.content) {
              text += delta.content;
              onChunk({ type: 'text', text: delta.content });
            }
            for (const tc of delta.tool_calls ?? []) {
              const index = Number(tc.index ?? 0);
              const entry = calls.get(index) ?? { id: '', name: '', argumentsText: '' };
              if (tc.id) entry.id = tc.id;
              if (tc.function?.name) entry.name += tc.function.name;
              if (tc.function?.arguments) entry.argumentsText += tc.function.arguments;
              calls.set(index, entry);
              onChunk({ type: 'tool_call_delta', index, delta: tc });
            }
            if (packet.choices?.[0]?.finish_reason) finishReason = packet.choices[0].finish_reason;
          }
        }
        buffer += decoder.decode();
        if (buffer.trim() && buffer.trim() !== 'data: [DONE]') {
          const data = buffer.split(/\\r?\\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\\n');
          if (data && data !== '[DONE]') {
            try {
              const packet = JSON.parse(data);
              const delta = packet.choices?.[0]?.delta ?? {};
              if (typeof delta.content === 'string') text += delta.content;
              for (const tc of delta.tool_calls ?? []) {
                const index = Number(tc.index ?? 0);
                const entry = calls.get(index) ?? { id: '', name: '', argumentsText: '' };
                if (tc.id) entry.id = tc.id;
                if (tc.function?.name) entry.name += tc.function.name;
                if (tc.function?.arguments) entry.argumentsText += tc.function.arguments;
                calls.set(index, entry);
              }
              finishReason = packet.choices?.[0]?.finish_reason ?? finishReason;
            } catch { /* Ignore an incomplete terminal frame. */ }
          }
        }
      } finally {
        try { await reader.cancel(); } catch {}
        reader.releaseLock();
      }

      const toolCalls = [...calls.entries()].sort((a,b) => a[0]-b[0]).map(([,call]) => {
        let args = {};
        try { args = call.argumentsText ? JSON.parse(call.argumentsText) : {}; } catch {
          throw new Error('Model returned malformed tool-call JSON for ' + (call.name || 'unnamed tool'));
        }
        return { id: call.id || 'call-' + Math.random().toString(36).slice(2), name: call.name, arguments: args };
      });
      return { content: text, toolCalls, finishReason: finishReason ?? 'stop' };
    },
  };
}

function normalizeMessages(messages) {
  return messages.map(message => {
    if (message.role === 'tool') return { role: 'tool', tool_call_id: message.tool_call_id, content: String(message.content ?? '') };
    if (message.role === 'assistant' && Array.isArray(message.tool_calls)) {
      return { role: 'assistant', content: message.content ?? '', tool_calls: message.tool_calls.map(call => ({
        id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.arguments ?? {}) },
      })) };
    }
    return { role: message.role, content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content ?? '') };
  });
}

function normalizeTools(tools) {
  return tools.map(tool => {
    const fn = tool.function ?? tool;
    return { type: 'function', function: {
      name: fn.name, description: fn.description ?? '',
      parameters: fn.parameters ?? fn.inputSchema ?? { type: 'object', properties: {} },
    } };
  });
}
