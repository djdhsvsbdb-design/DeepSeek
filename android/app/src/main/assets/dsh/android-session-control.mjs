/** Android session control stream: baseline plus bounded live projection updates. */
export class AndroidSessionControl {
  #sessions = new Map(); #subscribers = new Set();
  constructor({ maxQueue = 256 } = {}) { this.maxQueue = maxQueue; }
  setBaseline(sessionId, snapshot) { this.#sessions.set(sessionId, structuredClone(snapshot)); }
  publish(sessionId, seq, changes) {
    const current = this.#sessions.get(sessionId) ?? { asOfSeq: -1, values: {} };
    if (!Number.isSafeInteger(seq) || seq < current.asOfSeq) return false;
    const next = { asOfSeq: seq, values: { ...current.values, ...structuredClone(changes) } };
    this.#sessions.set(sessionId, next);
    const frame = { type: 'projection', sessionId, seq, changes: structuredClone(changes) };
    for (const sub of this.#subscribers) sub.push(frame);
    return true;
  }
  async *subscribe({ signal } = {}) {
    const sub = new Queue(this.maxQueue); this.#subscribers.add(sub);
    try {
      yield { type: 'baseline', value: Object.fromEntries([...this.#sessions].map(([id, value]) => [id, structuredClone(value)])) };
      yield* sub.iterate(signal);
    } finally { this.#subscribers.delete(sub); sub.close(); }
  }
}
class Queue {
  items = []; waiter = null; closed = false;
  constructor(limit) { this.limit = limit; }
  push(value) {
    if (this.closed) return;
    this.items.push(value);
    if (this.items.length > this.limit) { this.items.splice(0, this.items.length - this.limit); this.items.unshift({ type: 'resync-required' }); }
    this.waiter?.(); this.waiter = null;
  }
  close() { this.closed = true; this.waiter?.(); this.waiter = null; }
  async *iterate(signal) {
    const abort = () => this.close(); signal?.addEventListener('abort', abort, { once: true });
    try {
      while (!this.closed && !signal?.aborted) {
        if (this.items.length) { yield this.items.shift(); continue; }
        await new Promise(resolve => { this.waiter = resolve; });
      }
    } finally { signal?.removeEventListener('abort', abort); this.close(); }
  }
}
