/**
 * Establish the filesystem environment expected by DSH on Android.
 * @returns {{ home: string, runtime: string, temp: string }}
 */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const home = process.env.HOME
if (!home) throw new Error('[DSH Android] HOME must be provided by the Android host.')

const runtime = join(home, 'runtime')
const temp = join(home, 'tmp')
await mkdir(runtime, { recursive: true })
await mkdir(temp, { recursive: true })

process.env.HOME = home
process.env.TMPDIR = temp
process.env.TMP = temp
process.env.TEMP = temp
process.env.XDG_CONFIG_HOME ??= join(home, '.config')
process.env.XDG_CACHE_HOME ??= join(home, '.cache')
process.env.XDG_DATA_HOME ??= join(home, '.local', 'share')

export const androidPaths = Object.freeze({ home, runtime, temp })
