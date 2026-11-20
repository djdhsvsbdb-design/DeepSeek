/**
 * Android carrier entry for the packaged DSH CLI.
 */
import './android-env.mjs'
import { paths } from './android-paths.mjs'
import { verifyAndroidRuntime } from './android-preflight.mjs'
import { runAndroidSmokeChecks } from './android-smoke.mjs'
import { androidArgv } from './android-argv.mjs'
import { reportAndroidStartupFailure } from './android-startup-diagnostics.mjs'
import { pathToFileURL } from 'node:url'

try {
  const smoke = await runAndroidSmokeChecks()
  const runtime = await verifyAndroidRuntime()
  console.info('[DSH Android] Runtime checks passed:', JSON.stringify({ ...smoke, cli: runtime.cli }))

  process.argv = ['node', 'dsh', ...androidArgv(process.argv.slice(2))]
  const { runCli } = await import(pathToFileURL(paths.cli).href)
  await runCli()
} catch (error) {
  await reportAndroidStartupFailure(error, { home: paths.home, profile: 'web' })
  process.exitCode = 78
}
