/**
 * Store startup diagnostics only in the app-private HOME/logs directory.
 * Avoid terminal assumptions and never print environment variables.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'

export async function reportAndroidStartupFailure(error, { home = process.env.HOME, profile = 'web' } = {}) {
  const summary = error instanceof Error ? (error.stack || error.message) : String(error)
  console.error('[DSH Android] Startup failed:', error instanceof Error ? error.message : String(error))
  if (!home) return { saved: false, reason: 'HOME is not configured' }
  const dir = join(home, 'logs')
  const file = join(dir, `android-startup-${Date.now()}-${randomUUID()}.log`)
  try {
    await mkdir(dir, { recursive: true, mode: 0o700 })
    await writeFile(file, [
      'DSH Android startup diagnostic',
      `time: ${new Date().toISOString()}`,
      `node: ${process.version}`,
      `platform: ${process.platform}`,
      `arch: ${process.arch}`,
      `profile: ${profile}`,
      '',
      summary,
      '',
    ].join('\n'), { flag: 'wx', mode: 0o600 })
    console.error('[DSH Android] Diagnostic saved:', file)
    return { saved: true, file }
  } catch (writeError) {
    console.error('[DSH Android] Could not save diagnostic:', String(writeError))
    return { saved: false, reason: String(writeError) }
  }
}
