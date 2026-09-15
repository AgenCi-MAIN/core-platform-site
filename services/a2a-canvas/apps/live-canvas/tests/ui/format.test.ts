import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asId } from '../../../../packages/shared/src/ids.ts'
import type { RunEvent } from '../../src/contracts.ts'
import { formatDuration, formatRunEvent, parseConfig, safeJson } from '../../src/ui/format.ts'

const runId = asId<'RunId'>('run_test1')
const workflowId = asId<'WorkflowId'>('wf_test1')
const cardId = asId<'CardId'>('card_test1')
const agentId = asId<'AgentId'>('agent_test1')

function stamp(seq: number): { runId: typeof runId; workflowId: typeof workflowId; at: string; seq: number } {
  return { runId, workflowId, at: new Date(2026, 0, 1, 0, 0, seq).toISOString(), seq }
}

test('formatRunEvent: run.started contains the type', () => {
  const e: RunEvent = { type: 'run.started', nodeCount: 3, ...stamp(0) }
  const line = formatRunEvent(e)
  assert.match(line, /run\.started/)
  assert.match(line, /^\[0\]/)
})

test('formatRunEvent: node.started contains type and card id', () => {
  const e: RunEvent = { type: 'node.started', cardId, attempt: 1, ...stamp(1) }
  const line = formatRunEvent(e)
  assert.match(line, /node\.started/)
  assert.ok(line.includes(cardId))
})

test('formatRunEvent: node.finished contains type and card id', () => {
  const e: RunEvent = { type: 'node.finished', cardId, output: { ok: true }, ...stamp(2) }
  const line = formatRunEvent(e)
  assert.match(line, /node\.finished/)
  assert.ok(line.includes(cardId))
})

test('formatRunEvent: node.failed contains type, card id and error', () => {
  const e: RunEvent = { type: 'node.failed', cardId, error: 'boom', willRetry: true, ...stamp(3) }
  const line = formatRunEvent(e)
  assert.match(line, /node\.failed/)
  assert.ok(line.includes(cardId))
  assert.ok(line.includes('boom'))
})

test('formatRunEvent: a2a.request contains type and card id', () => {
  const e: RunEvent = {
    type: 'a2a.request',
    cardId,
    correlationId: 'corr1',
    to: agentId,
    message: {
      id: asId<'MessageId'>('msg1'),
      taskId: asId<'TaskId'>('task1'),
      role: 'user',
      from: agentId,
      to: agentId,
      parts: [],
      createdAt: new Date().toISOString(),
    },
    ...stamp(4),
  }
  const line = formatRunEvent(e)
  assert.match(line, /a2a\.request/)
  assert.ok(line.includes(cardId))
})

test('formatRunEvent: a2a.response contains type, card id and latency', () => {
  const e: RunEvent = {
    type: 'a2a.response',
    cardId,
    correlationId: 'corr1',
    from: agentId,
    message: {
      id: asId<'MessageId'>('msg2'),
      taskId: asId<'TaskId'>('task1'),
      role: 'agent',
      from: agentId,
      to: agentId,
      parts: [],
      createdAt: new Date().toISOString(),
    },
    latencyMs: 42,
    ...stamp(5),
  }
  const line = formatRunEvent(e)
  assert.match(line, /a2a\.response/)
  assert.ok(line.includes(cardId))
  assert.ok(line.includes('42'))
})

test('formatRunEvent: a2a.timeout contains type and card id', () => {
  const e: RunEvent = { type: 'a2a.timeout', cardId, correlationId: 'corr1', to: agentId, timeoutMs: 2000, ...stamp(6) }
  const line = formatRunEvent(e)
  assert.match(line, /a2a\.timeout/)
  assert.ok(line.includes(cardId))
})

test('formatRunEvent: run.finished contains the type', () => {
  const e: RunEvent = { type: 'run.finished', output: { done: true }, durationMs: 1234, ...stamp(7) }
  const line = formatRunEvent(e)
  assert.match(line, /run\.finished/)
})

test('formatRunEvent: run.failed contains type and card id when present', () => {
  const e: RunEvent = { type: 'run.failed', error: 'nope', cardId, ...stamp(8) }
  const line = formatRunEvent(e)
  assert.match(line, /run\.failed/)
  assert.ok(line.includes(cardId))
})

test('formatRunEvent: run.canceled contains the type', () => {
  const e: RunEvent = { type: 'run.canceled', ...stamp(9) }
  const line = formatRunEvent(e)
  assert.match(line, /run\.canceled/)
})

test('formatDuration: ms, s and m ranges', () => {
  assert.equal(formatDuration(0), '0ms')
  assert.equal(formatDuration(500), '500ms')
  assert.ok(formatDuration(1500).endsWith('s'))
  assert.ok(formatDuration(65000).includes('m'))
})

test('parseConfig: accepts a JSON object', () => {
  const r = parseConfig('{"a":1,"b":"two"}')
  assert.equal(r.ok, true)
  if (r.ok) assert.deepEqual(r.value, { a: 1, b: 'two' })
})

test('parseConfig: rejects invalid JSON', () => {
  const r = parseConfig('{not json')
  assert.equal(r.ok, false)
})

test('parseConfig: rejects arrays', () => {
  const r = parseConfig('[1,2,3]')
  assert.equal(r.ok, false)
})

test('parseConfig: rejects strings', () => {
  const r = parseConfig('"hello"')
  assert.equal(r.ok, false)
})

test('parseConfig: rejects null', () => {
  const r = parseConfig('null')
  assert.equal(r.ok, false)
})

test('safeJson: truncates at max', () => {
  const big = { data: 'x'.repeat(1000) }
  const out = safeJson(big, 50)
  assert.ok(out.length <= 50)
})

test('safeJson: never throws on circular input', () => {
  const obj: Record<string, unknown> = { name: 'loop' }
  obj.self = obj
  assert.doesNotThrow(() => safeJson(obj, 200))
  const out = safeJson(obj, 2000)
  assert.ok(out.includes('Circular'))
})

test('safeJson: handles primitives and undefined without throwing', () => {
  assert.doesNotThrow(() => safeJson(undefined))
  assert.doesNotThrow(() => safeJson(42))
  assert.doesNotThrow(() => safeJson('plain'))
})
