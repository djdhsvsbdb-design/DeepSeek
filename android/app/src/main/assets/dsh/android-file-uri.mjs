import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

export function resolveAndroidFileUri(uri, allowedRoot) {
  if (typeof uri !== 'string' || !uri.startsWith('file:')) throw new TypeError('Expected a file: URI');
  const root = resolve(allowedRoot);
  const path = resolve(fileURLToPath(uri));
  if (path !== root && !path.startsWith(root + sep)) {
    throw new Error('File URI is outside the app-private allowed directory');
  }
  return path;
}
