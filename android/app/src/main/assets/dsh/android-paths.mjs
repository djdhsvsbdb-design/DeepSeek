/**
 * Canonical private-storage paths for the Android DSH installation.
 */
import { join } from 'node:path'

const home = process.env.HOME
if (!home) throw new Error('[DSH Android] HOME is not configured.')

export const paths = Object.freeze({
  home,
  runtime: join(home, 'runtime'),
  cli: join(home, 'runtime', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'installed-bin.js'),
  data: join(home, '.local', 'share', 'dsh'),
  config: join(home, '.config', 'dsh'),
  cache: join(home, '.cache', 'dsh'),
  temp: join(home, 'tmp'),
})
