/** Android session history pagination, preserving message groups and source-event spans. */
const MESSAGE_TYPES = new Set(['user/message', 'assistant/message']);
export function validateHistoryRequest({ maxMessages = 50, turnWindow } = {}) {
  if (!Number.isSafeInteger(maxMessages) || maxMessages <= 0) throw new TypeError('maxMessages must be a positive safe integer');
  if (turnWindow && (!Number.isSafeInteger(turnWindow.minMessages) || turnWindow.minMessages <= 0
    || turnWindow.minMessages > maxMessages || !Number.isSafeInteger(turnWindow.minTurns) || turnWindow.minTurns <= 0)) {
    throw new TypeError('Invalid turnWindow');
  }
}
export function paginateSessionHistory(events, { beforeSeq, throughSeq, maxMessages = 50, turnWindow } = {}) {
  validateHistoryRequest({ maxMessages, turnWindow });
  const end = Math.min(events.length, beforeSeq ?? throughSeq ?? events.length);
  let count = 0, turns = 0, cut = 0;
  for (let i = end - 1; i >= 0; i--) {
    const event = events[i];
    if (turnWindow && event.type === 'turn/start') {
      turns++;
      if (count >= turnWindow.minMessages && turns >= turnWindow.minTurns) { cut = i; break; }
    }
    if (!MESSAGE_TYPES.has(event.type) || event.surfaceOp && event.surfaceOp !== 'append') continue;
    count++;
    const sourceSeqs = event.sourceEventSeqs ?? [];
    const groupStart = sourceSeqs.reduce((min, seq) => Math.min(min, seq), event.seq);
    if (count >= maxMessages) { cut = groupStart; break; }
  }
  return { events: events.slice(cut, end), hasMore: cut > 0, nextBeforeSeq: cut || undefined };
}
