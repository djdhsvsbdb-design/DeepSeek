/** Android session registry: serialized per-session mutations and durable snapshots. */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export class AndroidSessionRegistry {
  #root; #sessions = new Map(); #locks = new Map();
  constructor(root) { this.#root = resolve(root); }
  #file(id) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new TypeError('Invalid session id');
    return resolve(this.#root, id + '.json');
  }
  async open(id) {
    const file = this.#file(id);
    if (this.#sessions.has(id)) return this.#sessions.get(id);
    try {
      const value = JSON.parse(await readFile(file, 'utf8'));
      if (value.id !== id || !Array.isArray(value.events)) throw new Error('Invalid session snapshot');
      this.#sessions.set(id, value); return value;
    } catch (e) { if (e?.code !== 'ENOENT') throw e; return null; }
  }
  async create(metadata = {}) {
    const id = randomUUID().replaceAll('-', '');
    const session = { id, createdAt: Date.now(), updatedAt: Date.now(), metadata, events: [] };
    await this.#persist(session); this.#sessions.set(id, session); return session;
  }
  async append(id, event) {
    return this.#locked(id, async () => {
      const session = await this.open(id);
      if (!session) throw new Error('Session not found');
      const item = { seq: session.events.length, at: Date.now(), ...event };
      session.events.push(item); session.updatedAt = Date.now();
      await this.#persist(session); return item;
    });
  }
  async list() { return [...this.#sessions.values()].map(({ id, createdAt, updatedAt, metadata }) => ({ id, createdAt, updatedAt, metadata })); }
  async #locked(id, fn) {
    const prior = this.#locks.get(id) ?? Promise.resolve();
    const next = prior.then(fn, fn); this.#locks.set(id, next.catch(() => {}));
    try { return await next; } finally { if (this.#locks.get(id) === next) this.#locks.delete(id); }
  }
  async #persist(session) {
    const file = this.#file(session.id); await mkdir(dirname(file), { recursive: true });
    const tmp = file + '.tmp'; await writeFile(tmp, JSON.stringify(session), { mode: 0o600 });
    await rename(tmp, file);
  }
}
