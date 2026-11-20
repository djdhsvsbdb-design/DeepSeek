import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export function createAndroidStorage(root) {
  const base = resolve(root);
  const target = (name) => {
    if (typeof name !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(name) || name === '.' || name === '..') {
      throw new TypeError('Invalid Android storage key');
    }
    return resolve(base, name + '.json');
  };
  return {
    async read(name, fallback = null) {
      try { return JSON.parse(await readFile(target(name), 'utf8')); }
      catch (error) { if (error?.code === 'ENOENT') return fallback; throw error; }
    },
    async write(name, value) {
      const file = target(name);
      await mkdir(dirname(file), { recursive: true });
      const temp = file + '.tmp';
      await writeFile(temp, JSON.stringify(value), { encoding: 'utf8', mode: 0o600 });
      await rename(temp, file);
    },
    async remove(name) {
      const { unlink } = await import('node:fs/promises');
      try { await unlink(target(name)); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    },
  };
}
