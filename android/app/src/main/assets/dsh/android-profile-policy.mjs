/**
 * Android profile policy: one app-private web profile, no desktop profile
 * replacement or arbitrary profile creation from an untrusted launcher.
 */
import { mkdir, access, constants } from 'node:fs/promises'
import { join } from 'node:path'
import { paths } from './android-paths.mjs'

export async function ensureAndroidProfile() {
  const profileDir = join(paths.home, 'profiles', 'web')
  await mkdir(profileDir, { recursive: true, mode: 0o700 })
  const packageJson = join(profileDir, 'package.json')
  try {
    await access(packageJson, constants.R_OK)
  } catch {
    throw new Error(`Android web profile is not installed: ${profileDir}. The APK must package its profile dependencies.`)
  }
  return Object.freeze({ name: 'web', dir: profileDir })
}
