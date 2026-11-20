/**
 * Android CLI argument adapter: pin the runtime to the bundled web profile
 * while preserving application arguments after the launcher flags.
 */
export function androidArgv(argv = process.argv.slice(2)) {
  const input = [...argv]
  if (input[0] === 'plugin') {
    throw new Error('Plugin installation is disabled in the Android build; install plugins in a desktop development environment.')
  }
  const output = []
  for (let i = 0; i < input.length; i++) {
    const value = input[i]
    if (value === '--profile') {
      const requested = input[++i]
      if (!requested) throw new Error('--profile requires a value.')
      if (requested !== 'web') throw new Error('Android supports only the bundled web profile.')
      continue
    }
    if (value.startsWith('--profile=')) {
      if (value.slice('--profile='.length) !== 'web') throw new Error('Android supports only the bundled web profile.')
      continue
    }
    if (value === 'desktop' || value === 'tui' || value === 'headless') {
      throw new Error(`Profile "${value}" is not available in the Android build.`)
    }
    output.push(value)
  }
  return ['--profile', 'web', ...output]
}
