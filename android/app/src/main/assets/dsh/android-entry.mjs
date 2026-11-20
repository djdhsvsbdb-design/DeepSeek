/**
 * Android carrier entry for the packaged DSH CLI.
 *
 * Startup is intentionally fail-closed: it checks the Android Node runtime,
 * validates private-storage paths, and requires the complete CLI package tree.
 */
import './android-env.mjs'
import { paths } from './android-paths.mjs'
import { verifyAndroidRuntime } from './android-preflight.mjs'
import { runAndroidSmokeChecks } from './android-smoke.mjs'
import { pathToFileURL } from 'node:url'

try {
  const smoke = await runAndroidSmokeChecks()
  const runtime = await verifyAndroidRuntime()
  console.info('[DSH Android] Runtime checks passed:', JSON.stringify({ ...smoke, cli: runtime.cli }))

  process.argv = ['node', 'dsh', '--profile', 'web']
  const { runCli } = await import(pathToFileURL(paths.cli).href)
  await runCli()
} catch (error) {
  console.error('[DSH Android] Startup failed.')
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 78
}
