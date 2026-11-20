/**
 * Android-friendly bounded shutdown controller.
 * The host owns the process; this module disposes the app tree and records
 * an exit code rather than terminating the Node process from a signal handler.
 */
export function createAndroidShutdown(dispose, { timeoutMs = 5000, onExit = code => { process.exitCode = code } } = {}) {
  let pending
  let timer
  let settled = false
  const finish = code => {
    if (settled) return
    settled = true
    if (timer) clearTimeout(timer)
    onExit(code)
  }
  const shutdown = code => {
    if (pending) return pending
    timer = setTimeout(() => finish(code || 1), timeoutMs)
    pending = Promise.resolve().then(dispose).then(() => finish(code), () => finish(1))
    return pending
  }
  return Object.freeze({ shutdown, interrupt: code => { void shutdown(code) } })
}
