import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function withAndroidTemp(prefix, task) {
  if (typeof task !== 'function') throw new TypeError('task must be a function');
  const safePrefix = String(prefix || 'dsh-').replace(/[^a-zA-Z0-9_-]/g, '-');
  const directory = await mkdtemp(join(tmpdir(), safePrefix));
  try { return await task(directory); }
  finally { await rm(directory, { recursive: true, force: true }); }
}
