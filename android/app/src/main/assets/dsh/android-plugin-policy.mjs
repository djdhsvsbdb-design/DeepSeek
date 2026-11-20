/**
 * Android policy for the CLI plugin-management surface.
 * Dynamic pnpm installs require a package manager and native build toolchain
 * that are not part of the Android app runtime; fail explicitly, never fake it.
 */
export function assertAndroidPluginOperation(args = []) {
  const command = args[0] ?? 'help'
  throw new Error(
    `"dsh plugin ${command}" is unavailable on Android. The Android build runs its packaged plugin set; `
    + 'add or update plugins in the build environment and publish a new APK.',
  )
}
