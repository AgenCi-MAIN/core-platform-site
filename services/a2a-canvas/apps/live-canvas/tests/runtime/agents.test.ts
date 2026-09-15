import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asId } from '../../../../packages/shared/src/index.ts'
import type { AgentId, DataPart, Message, Task, TaskId, ThemeId } from '../../../../packages/shared/src/index.ts'
import type { ThemeApi } from '../../src/contracts.ts'
import { createChannelTransport } from '../../src/runtime/a2a/transport.ts'
import {
  CONTRAST_CRITIC_ID, PALETTE_AGENT_ID, VERIFIER_AGENT_ID,
  createAgentServer, allAgentCards,
} from '../../src/runtime/a2a/agents.ts'
import type { TaskGetParams, TaskCancelParams, TaskSendParams } from '../../src/runtime/a2a/agents.ts'

const RUNTIME: AgentId = asId('test-runtime')

function taskId(s: string): TaskId {
  return asId(s)
}

function sendMessage(taskIdValue: TaskId, to: AgentId, payload: unknown, config: Record<string, unknown> = {}): Message {
  const dataPart: DataPart = { kind: 'data', data: { payload, config } }
  return {
    id: asId('msg-1'),
    taskId: taskIdValue,
    role: 'user',
    from: RUNTIME,
    to,
    parts: [dataPart],
    createdAt: '2026-09-15T00:00:00.000Z',
  }
}

async function sendTaskRaw(client: ReturnType<typeof createChannelTransport>['client'], to: AgentId, tId: TaskId, payload: unknown, config: Record<string, unknown> = {}) {
  const params: TaskSendParams = { agentId: to, taskId: tId, from: RUNTIME, message: sendMessage(tId, to, payload, config) }
  const response = await client.send({ jsonrpc: '2.0', id: `send-${tId}`, method: 'tasks/send', params })
  return response
}

function fakeThemeApi(): ThemeApi {
  return {
    list: () => [],
    get: () => undefined,
    withOverrides: (base) => base,
    apply: () => {},
    probe: (_tokens, mode = 'light') => ({
      themeId: asId<'ThemeId'>('theme-fake') as ThemeId,
      mode,
      checks: [
        { name: 'text-on-bg', foreground: '#FFFFFF', background: '#000000', ratio: 21, required: 4.5, passed: true },
        { name: 'muted-on-bg', foreground: '#AAAAAA', background: '#000000', ratio: 3, required: 4.5, passed: false },
      ],
      passed: false,
      issues: [{ code: 'low-contrast', path: 'modes.light.textMuted', message: 'too low', severity: 'warning' as const }],
    }),
    toCssVars: () => ({}),
  }
}

test('allAgentCards lists all three agents with the in-page-simulated honesty label', () => {
  const cards = allAgentCards()
  assert.equal(cards.length, 3)
  for (const card of cards) {
    assert.match(card.description, /in-page simulated agent/i)
  }
  assert.deepEqual(cards.map((c) => c.id).sort(), [CONTRAST_CRITIC_ID, PALETTE_AGENT_ID, VERIFIER_AGENT_ID].sort())
})

test('agent/card returns the right card per agentId, and errors for an unknown one', async () => {
  const { client, server } = createChannelTransport()
  createAgentServer(server)
  const ok = await client.send({ jsonrpc: '2.0', id: 1, method: 'agent/card', params: { agentId: PALETTE_AGENT_ID } })
  assert.equal('result' in ok, true)
  if ('result' in ok) assert.equal((ok.result as { id: string }).id, PALETTE_AGENT_ID)

  const bad = await client.send({ jsonrpc: '2.0', id: 2, method: 'agent/card', params: { agentId: asId('nope') } })
  assert.equal('error' in bad, true)
  client.close()
  server.close()
})

test('palette-agent proposes 3 accent variants and a rationale', async () => {
  const { client, server } = createChannelTransport()
  createAgentServer(server)
  const response = await sendTaskRaw(client, PALETTE_AGENT_ID, taskId('t1'), '#336699')
  assert.equal('result' in response, true)
  if (!('result' in response)) return
  const task = response.result as Task
  assert.equal(task.state, 'completed')
  const reply = task.history[task.history.length - 1]
  const data = reply?.parts.find((p): p is DataPart => p.kind === 'data')?.data
  assert.ok(data)
  const variants = data?.variants as { name: string; hex: string }[]
  assert.equal(variants.length, 3)
  assert.equal(typeof data?.rationale, 'string')
  assert.match(data?.rationale as string, /\S/)
  client.close()
  server.close()
})

test('contrast-critic falls back to a structural check and says so when no ThemeApi is wired in', async () => {
  const { client, server } = createChannelTransport()
  createAgentServer(server) // no themeApi in deps
  const proposal = { proposalId: 'p1', variants: [{ hex: '#111111' }, { hex: '#222222' }, { hex: '#333333' }], rationale: 'because' }
  const response = await sendTaskRaw(client, CONTRAST_CRITIC_ID, taskId('t2'), proposal)
  assert.equal('result' in response, true)
  if (!('result' in response)) return
  const task = response.result as Task
  const data = task.history[task.history.length - 1]?.parts.find((p): p is DataPart => p.kind === 'data')?.data
  assert.equal(typeof data?.score, 'number')
  assert.match(data?.notes as string, /structural check only/i)
  client.close()
  server.close()
})

test('contrast-critic uses ThemeApi.probe() when the server was built with one', async () => {
  const { client, server } = createChannelTransport()
  createAgentServer(server, { themeApi: () => fakeThemeApi() })
  const themeLikeProposal = { proposalId: 'p2', modes: { light: { accent: '#336699' } } }
  const response = await sendTaskRaw(client, CONTRAST_CRITIC_ID, taskId('t3'), themeLikeProposal)
  assert.equal('result' in response, true)
  if (!('result' in response)) return
  const task = response.result as Task
  const data = task.history[task.history.length - 1]?.parts.find((p): p is DataPart => p.kind === 'data')?.data
  assert.match(data?.notes as string, /ThemeApi\.probe\(\)/)
  assert.equal(data?.score, 0.5) // 1 of 2 checks passed in the fake
  client.close()
  server.close()
})

test('verifier-agent reports missing required fields from the handoff config', async () => {
  const { client, server } = createChannelTransport()
  createAgentServer(server)
  const response = await sendTaskRaw(client, VERIFIER_AGENT_ID, taskId('t4'), { name: 'Ada' }, { required: ['name', 'email'] })
  assert.equal('result' in response, true)
  if (!('result' in response)) return
  const task = response.result as Task
  const data = task.history[task.history.length - 1]?.parts.find((p): p is DataPart => p.kind === 'data')?.data
  assert.equal(data?.verified, false)
  assert.deepEqual(data?.missing, ['email'])
  client.close()
  server.close()
})

test('verifier-agent verifies true when every required field is present', async () => {
  const { client, server } = createChannelTransport()
  createAgentServer(server)
  const response = await sendTaskRaw(client, VERIFIER_AGENT_ID, taskId('t5'), { name: 'Ada', email: 'a@example.com' }, { required: ['name', 'email'] })
  assert.equal('result' in response, true)
  if (!('result' in response)) return
  const task = response.result as Task
  const data = task.history[task.history.length - 1]?.parts.find((p): p is DataPart => p.kind === 'data')?.data
  assert.equal(data?.verified, true)
  assert.deepEqual(data?.missing, [])
  client.close()
  server.close()
})

test('tasks/get returns the stored task, tasks/cancel transitions it, and both error for an unknown id', async () => {
  const { client, server } = createChannelTransport()
  createAgentServer(server)
  const sent = await sendTaskRaw(client, VERIFIER_AGENT_ID, taskId('t6'), {}, { required: [] })
  assert.equal('result' in sent, true)

  const getParams: TaskGetParams = { agentId: VERIFIER_AGENT_ID, taskId: taskId('t6') }
  const got = await client.send({ jsonrpc: '2.0', id: 'g1', method: 'tasks/get', params: getParams })
  assert.equal('result' in got, true)

  const cancelParams: TaskCancelParams = { agentId: VERIFIER_AGENT_ID, taskId: taskId('t6') }
  const canceled = await client.send({ jsonrpc: '2.0', id: 'c1', method: 'tasks/cancel', params: cancelParams })
  // t6 already completed by the time we try to cancel it — not cancelable.
  assert.equal('error' in canceled, true)

  const missing = await client.send({ jsonrpc: '2.0', id: 'g2', method: 'tasks/get', params: { agentId: VERIFIER_AGENT_ID, taskId: taskId('ghost') } })
  assert.equal('error' in missing, true)
  client.close()
  server.close()
})
