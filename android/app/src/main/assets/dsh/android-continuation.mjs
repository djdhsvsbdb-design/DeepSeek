/** Android-compatible continuation eligibility projection for a session event stream. */
const RECOVERABLE = new Set(['RATE_LIMIT', 'SERVER', 'TIMEOUT', 'TRANSPORT', 'EMPTY_RESPONSE', 'STREAM_CLOSED']);
export function initialContinuationState() { return { admitted: false, failedAttempt: false, ending: null }; }
export function reduceContinuation(state, event) {
  switch (event.type) {
    case 'turn/start': return initialContinuationState();
    case 'step/start':
    case 'assistant/message': return state.failedAttempt ? { ...state, failedAttempt: false } : state;
    case 'user/message': {
      const source = event.data?.source;
      const admitted = event.surfaceOp === 'append' &&
        ((source?.kind === 'user' && (event.data?.content?.length ?? 0) > 0) ||
         (source?.kind === 'retry' && (event.data?.content?.length ?? 0) === 0));
      return !state.admitted && admitted ? { ...state, admitted: true } : state;
    }
    case 'assistant/attempt': return state.failedAttempt ? state : { ...state, failedAttempt: true };
    case 'turn/end': {
      const error = event.data?.reason?.kind === 'error' ? event.data.reason.error : null;
      return state.admitted && state.failedAttempt && RECOVERABLE.has(error?.code)
        ? { admitted: false, failedAttempt: false, ending: event.seq }
        : initialContinuationState();
    }
    default: return state;
  }
}
export function canContinue(state) { return Number.isSafeInteger(state.ending) && state.ending >= 0; }
