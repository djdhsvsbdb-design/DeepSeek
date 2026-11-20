/**
 * Android carrier entry for the real DSH CLI.
 *
 * The APK must stage the built @deepseek-ai/dsh installation at
 * filesDir/dsh/runtime before this entry can start. This deliberately fails
 * closed instead of falling back to the Node smoke test or a remote service.
 */
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const installRoot = join(process.env.HOME ?? '', 'runtime')
const cliEntry = join(installRoot, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'installed-bin.js')

try {
  await access(cliEntry)
} catch {
  console.error('[DSH Android] Harness runtime is not packaged.')
  console.error('[DSH Android] Expected built CLI at:', cliEntry)
  process.exitCode = 78
  process.exit()
}

process.argv = ['node', 'dsh', '--profile', 'web']
const { runCli } = await import(pathToFileURL(cliEntry).href)
await runCli()
