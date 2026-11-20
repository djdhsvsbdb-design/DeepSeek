/**
 * Android-native DSH agent-loop core.
 *
 * This is an Android runtime implementation of the central turn driver
 * contract (durable user input -> model attempts -> tool dispatch -> durable
 * assistant settlement). It is deliberately adapter-based: the host supplies
 * the DSH-compatible model, session registry and tool executor.
 */
import { reduceContinuation, initialContinuationState } from './android-continuation.mjs';

const DEFAULT_MAX_STEPS = 32;

export class AndroidAgentCore {
  #sessions; #model; #tools; #maxSteps; #agents = new Map(); #controllers = new Map();

  constructor({ sessions, model, tools, maxSteps = DEFAULT_MAX_STEPS, onEvent = () => {} }) {
    if (!sessions?.append || !sessions?.open) throw new TypeError('sessions adapter must implement open() and append()');
    if (!model?.complete) throw new TypeError('model adapter must implement complete()');
    if (!tools?.execute) throw new TypeError('tools adapter must implement execute()');
    if (!Number.isSafeInteger(maxSteps) || maxSteps < 1 || maxSteps > 256) throw new RangeError('maxSteps must be 1..256');
    this.#sessions = sessions; this.#model = model; this.#tools = tools;
    this.#maxSteps = maxSteps; this.onEvent = onEvent;
  }

  async createSession(metadata) { return this.#sessions.create(metadata); }

  async run(sessionId, text, { signal } = {}) {
    if (typeof text !== 'string' || !text.trim()) throw new TypeError('A non-empty user message is required');
    if (this.#agents.has(sessionId)) throw new Error('This session already has an active turn');
    const token = {}; this.#agents.set(sessionId, token);
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', abort, { once: true });
    const activeSignal = controller.signal;
    this.#controllers.set(sessionId, controller);
    let continuation = initialContinuationState();
    try {
      activeSignal.throwIfAborted();
      const session = await this.#sessions.open(sessionId);
      if (!session) throw new Error('Session not found');
      const user = await this.#sessions.append(sessionId, {
        type: 'user/message', surfaceOp: 'append',
        data: { source: { kind: 'user' }, content: text },
      });
      continuation = reduceContinuation(continuation, user);
      await this.#sessions.append(sessionId, { type: 'turn/start', data: {} });
      this.onEvent({ type: 'turn/start', sessionId });
      const messages = this.#history(session.events);
            for (let step = 0; step < this.#maxSteps; step++) {
        activeSignal.throwIfAborted();
        await this.#sessions.append(sessionId, { type: 'step/start', data: { step } });
        await this.#sessions.append(sessionId, { type: 'assistant/attempt', data: { step, status: 'started' } });
        this.onEvent({ type: 'attempt/start', sessionId, step });
        let result;
        try {
          result = await this.#model.complete({
            messages: structuredClone(messages),
            tools: await this.#tools.describe(),
            signal: activeSignal,
            onChunk: chunk => this.onEvent({ type: 'assistant/chunk', sessionId, step, chunk }),
          });
        } catch (error) {
          const failure = { code: error?.code ?? 'TRANSPORT', message: String(error?.message ?? error) };
          const event = await this.#sessions.append(sessionId, {
            type: 'assistant/attempt', data: { step, status: 'failed', error: failure },
          });
          continuation = reduceContinuation(continuation, event);
          await this.#sessions.append(sessionId, {
            type: 'turn/end', data: { reason: { kind: 'error', error: failure } },
          });
          this.onEvent({ type: 'turn/error', sessionId, error: failure });
          throw error;
        }
        activeSignal.throwIfAborted();
        const calls = Array.isArray(result?.toolCalls) ? result.toolCalls : [];
        if (calls.length) {
          messages.push({ role: 'assistant', content: result.content ?? '', tool_calls: calls });
          for (const call of calls) {
            activeSignal.throwIfAborted();
            const callId = String(call.id ?? '');
            const name = String(call.name ?? call.function?.name ?? '');
            const args = call.arguments ?? call.function?.arguments ?? {};
            const invocation = await this.#sessions.append(sessionId, {
              type: 'tool/call', data: { id: callId, name, arguments: args },
            });
            this.onEvent({ type: 'tool/start', sessionId, callId, name });
            let output;
            try {
              output = await this.#tools.execute(name, args, { sessionId, signal: activeSignal });
            } catch (error) {
              output = { error: String(error?.message ?? error) };
            }
            await this.#sessions.append(sessionId, {
              type: 'tool/result', data: { callId, output },
            });
            messages.push({ role: 'tool', tool_call_id: callId, content: JSON.stringify(output) });
            this.onEvent({ type: 'tool/end', sessionId, callId, output });
          }
          continue;
        }
        const answer = String(result?.content ?? '');
        const assistant = await this.#sessions.append(sessionId, {
          type: 'assistant/message', surfaceOp: 'append',
          data: { source: { kind: 'assistant' }, content: answer, finishReason: result?.finishReason ?? 'stop' },
        });
        continuation = reduceContinuation(continuation, assistant);
        await this.#sessions.append(sessionId, {
          type: 'turn/end', data: { reason: { kind: 'success' } },
        });
        this.onEvent({ type: 'turn/end', sessionId, answer });
        return { sessionId, answer, steps: step + 1 };
      }
      throw new Error('Agent exceeded maximum tool/model steps');
    } finally {
      signal?.removeEventListener('abort', abort);
      if (this.#agents.get(sessionId) === token) this.#agents.delete(sessionId);
      if (this.#controllers.get(sessionId) === controller) this.#controllers.delete(sessionId);
    }
  }

  #history(events = []) {
    return events.flatMap(event => {
      if (event.type === 'user/message') return [{ role: 'user', content: event.data?.content ?? '' }];
      if (event.type === 'assistant/message') return [{ role: 'assistant', content: event.data?.content ?? '' }];
      return [];
    });
  }

  cancel(sessionId, reason = 'Cancelled') {
    if (!this.#agents.has(sessionId)) return false;
    const controller = this.#controllers.get(sessionId);
    if (!controller) return false;
    controller.abort(new Error(reason));
    this.onEvent({ type: 'turn/cancel-requested', sessionId, reason });
    return true;
  }
}
