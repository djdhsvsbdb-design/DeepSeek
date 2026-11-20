/**
 * Validate that the packaged DSH CLI is present before attempting startup.
 */
import { access, constants, stat } from 'node:fs/promises'
import { dirname } from 'node:path'
import { paths } from './android-paths.mjs'

export async function verifyAndroidRuntime() {
  const problems = []
  try {
    await access(paths.cli, constants.R_OK)
    const info = await stat(paths.cli)
    if (!info.isFile()) problems.push(`CLI entry is not a file: ${paths.cli}`)
  } catch {
    problems.push(`Missing packaged DSH CLI: ${paths.cli}`)
  }

  try {
    await access(dirname(paths.cli), constants.R_OK)
  } catch {
    problems.push('The DSH package directory is not readable.')
  }

  if (process.arch !== 'arm64') {
    problems.push(`Expected Android arm64 Node runtime, got ${process.platform}/${process.arch}.`)
  }

  if (problems.length) {
    const error = new Error(problems.join('\n'))
    error.code = 'DSH_ANDROID_PREFLIGHT_FAILED'
    throw error
  }
  return { cli: paths.cli, arch: process.arch, platform: process.platform }
}
