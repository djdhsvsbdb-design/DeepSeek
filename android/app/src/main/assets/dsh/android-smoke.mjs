/**
 * Non-networking smoke checks for Node APIs required by the Android carrier.
 */
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { AndroidAgentCore } from './android-agent-core.mjs'

export async function runAndroidSmokeChecks() {
  const root = await mkdtemp(join(tmpdir(), 'dsh-android-'))
  const file = join(root, 'probe.txt')
  try {
    const payload = `dsh-android:${randomUUID()}`
    await writeFile(file, payload, 'utf8')
    const actual = await readFile(file, 'utf8')
    if (actual !== payload) throw new Error('Filesystem round-trip failed.')
    const digest = createHash('sha256').update(actual).digest('hex')
    if (digest.length !== 64) throw new Error('Node crypto SHA-256 check failed.')
    if (typeof AndroidAgentCore !== 'function') throw new Error('Android agent core module failed to load')
    return { filesystem: true, crypto: true, agentCore: true, node: process.version, arch: process.arch }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
