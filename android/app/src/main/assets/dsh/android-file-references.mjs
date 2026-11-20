/** Android-private-workspace @file reference discovery with traversal protection. */
import { readdir, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
function inside(root, path) { const rel = relative(root, path); return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !rel.startsWith(sep)); }
export async function listAndroidFileReferences(workspace, query = '', { limit = 50, signal } = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) throw new RangeError('limit must be between 1 and 200');
  const root = resolve(workspace); const needle = String(query).replace(/^@/, '').toLocaleLowerCase();
  const results = []; const queue = [root];
  while (queue.length && results.length < limit) {
    signal?.throwIfAborted();
    const dir = queue.shift();
    let entries; try { entries = await readdir(dir, { withFileTypes: true }); } catch { continue; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const path = resolve(dir, entry.name); if (!inside(root, path)) continue;
      const rel = relative(root, path); if (!rel.toLocaleLowerCase().includes(needle)) continue;
      let info; try { info = await stat(path); } catch { continue; }
      results.push({ path: rel.split(sep).join('/'), kind: info.isDirectory() ? 'directory' : 'file' });
      if (info.isDirectory() && queue.length < 500) queue.push(path);
      if (results.length >= limit) break;
    }
  }
  return results;
}
