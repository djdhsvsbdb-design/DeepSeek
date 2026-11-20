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
    const memory = new Map()
    const sessions = {
      async create() { const value = { id: 'smoke', events: [] }; memory.set(value.id, value); return value },
      async open(id) { return memory.get(id) ?? null },
      async append(id, event) { const value = memory.get(id); const item = { ...event, seq: value.events.length }; value.events.push(item); return item },
    }
    const tools = { async describe() { return [] }, async execute() { throw new Error('No tools expected in smoke test') } }
    const model = { async complete() { return { content: 'android-agent-ok', finishReason: 'stop' } } }
    const core = new AndroidAgentCore({ sessions, model, tools })
    await core.createSession()
    const result = await core.run('smoke', 'ping')
    if (result.answer !== 'android-agent-ok' || result.steps !== 1) throw new Error('Android agent turn smoke test failed')
    return { filesystem: true, crypto: true, agentCore: true, node: process.version, arch: process.arch }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
