/**
 * Runner integration tests. One note on the timeout scenarios: the spec
 * sketch for this deliverable pairs createFlakyTransport(dropFirst:1) with
 * timeoutMs 50 to make an A2A timeout observable. createRuntime's transport
 * is internal (CreateRuntime's deps are just { clock, ids } — no transport
 * override), so:
 *  - the flaky-transport + timeoutMs:50 combination is exercised directly
 *    against the a2a-handoff executor (bypassing the runner) in
 *    "a2a-handoff executor times out against a flaky transport" below —
 *    this is the literal scenario from the spec.
 *  - the full runner-level "run.failed names the timed-out card" scenario
 *    uses the runtime's own real default transport/agent server with a
 *    timeoutMs shorter than the agent's own minimum reply delay (5ms) —
 *    genuinely real, deterministic (Node's timers fire shorter delays
 *    first), and it proves the exact thing a flaky transport would: that a
 *    request which is never answered in time fails the node and the run.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asId } from '../../../../packages/shared/src/index.ts'
import type { RunEvent } from '../../src/contracts.ts'
import { createRuntime } from '../../src/runtime/runner.ts'
import { executors } from '../../src/runtime/executors.ts'
import type { EmitInput, ExecCtx } from '../../src/runtime/executors.ts'
import { createAgentServer, VERIFIER_AGENT_ID, PALETTE_AGENT_ID } from '../../src/runtime/a2a/agents.ts'
import { createChannelTransport, createFlakyTransport } from '../../src/runtime/a2a/transport.ts'
import { laneId, mkEdge, mkNode, mkWorkflow } from './helpers.ts'

function assertMonotonicSeq(events: RunEvent[]) {
  let last = 0
  for (const e of events) {
    assert.ok(e.seq > last, `expected seq ${e.seq} > ${last}`)
    last = e.seq
  }
}

test('linear source -> transform(uppercase) -> sink yields HELLO with ordered, monotonic events', async () => {
  const runtime = createRuntime({})
  const s = mkNode('s', laneId('lane-1'), 'source', { payload: 'hello' })
  const t = mkNode('t', laneId('lane-1'), 'transform', { transform: 'uppercase' })
  const k = mkNode('k', laneId('lane-1'), 'sink', {})
  const wf = mkWorkflow('wf-linear', [s, t, k], [mkEdge('e1', s.id, t.id), mkEdge('e2', t.id, k.id)])

  const seen: RunEvent[] = []
  const unsubscribe = runtime.subscribe((e) => seen.push(e))
  const handle = runtime.run(wf)
  const record = await handle.done
  unsubscribe()

  assert.equal(record.state, 'completed')
  assert.equal(record.output, 'HELLO')
  assert.deepEqual(seen, record.events)
  assertMonotonicSeq(record.events)

  const types = record.events.map((e) => e.type)
  assert.deepEqual(types, [
    'run.started',
    'node.started', 'node.finished',
    'node.started', 'node.finished',
    'node.started', 'node.finished',
    'run.finished',
  ])
})

test('branch -> two transforms -> join -> sink yields both outputs in edge order', async () => {
  const runtime = createRuntime({})
  const s = mkNode('s', laneId('lane-1'), 'source', { payload: 'ok' })
  const b = mkNode('b', laneId('lane-1'), 'branch', {})
  const t1 = mkNode('t1', laneId('lane-1'), 'transform', { transform: 'uppercase' })
  const t2 = mkNode('t2', laneId('lane-1'), 'transform', { transform: 'identity' })
  const j = mkNode('j', laneId('lane-1'), 'join', {})
  const k = mkNode('k', laneId('lane-1'), 'sink', {})
  const wf = mkWorkflow('wf-branch', [s, b, t1, t2, j, k], [
    mkEdge('e1', s.id, b.id),
    mkEdge('e2', b.id, t1.id),
    mkEdge('e3', b.id, t2.id),
    mkEdge('e4', t1.id, j.id),
    mkEdge('e5', t2.id, j.id),
    mkEdge('e6', j.id, k.id),
  ])
  const handle = runtime.run(wf)
  const record = await handle.done
  assert.equal(record.state, 'completed')
  assert.deepEqual(record.output, ['OK', 'ok'])
})

test('retry: flaky operation succeeding on attempt 2 fails once (willRetry) then finishes', async () => {
  const runtime = createRuntime({})
  const s = mkNode('s', laneId('lane-1'), 'source', { payload: 'keep' })
  const r = mkNode('r', laneId('lane-1'), 'retry', { operation: 'flaky', succeedOnAttempt: 2, maxAttempts: 3 })
  const k = mkNode('k', laneId('lane-1'), 'sink', {})
  const wf = mkWorkflow('wf-retry', [s, r, k], [mkEdge('e1', s.id, r.id), mkEdge('e2', r.id, k.id)])
  const handle = runtime.run(wf)
  const record = await handle.done

  assert.equal(record.state, 'completed')
  assert.equal(record.output, 'keep')
  const forR = record.events.filter((e) => 'cardId' in e && e.cardId === r.id)
  const failedEvents = forR.filter((e) => e.type === 'node.failed')
  assert.equal(failedEvents.length, 1)
  const firstFailure = failedEvents[0]
  assert.equal(firstFailure?.type === 'node.failed' && firstFailure.willRetry, true)
  const finished = forR.find((e) => e.type === 'node.finished')
  assert.ok(finished)
  assert.equal(record.nodeResults[r.id]?.attempts, 2)
})

test('opts.failOnce recovers a transform node the same way a retry node does', async () => {
  const runtime = createRuntime({})
  const s = mkNode('s', laneId('lane-1'), 'source', { payload: 'x' })
  const t = mkNode('t', laneId('lane-1'), 'transform', { transform: 'uppercase' })
  const k = mkNode('k', laneId('lane-1'), 'sink', {})
  const wf = mkWorkflow('wf-failonce', [s, t, k], [mkEdge('e1', s.id, t.id), mkEdge('e2', t.id, k.id)])
  const handle = runtime.run(wf, { failOnce: [t.id] })
  const record = await handle.done

  assert.equal(record.state, 'completed')
  assert.equal(record.output, 'X')
  const forT = record.events.filter((e) => 'cardId' in e && e.cardId === t.id)
  const failedEvents = forT.filter((e) => e.type === 'node.failed')
  assert.equal(failedEvents.length, 1)
  const firstFailure = failedEvents[0]
  assert.equal(firstFailure?.type === 'node.failed' && firstFailure.willRetry, true)
  assert.ok(forT.find((e) => e.type === 'node.finished'))
})

test('a2a-handoff to verifier-agent: request/response share a correlationId, latency >= 0, output is {verified:true}', async () => {
  const runtime = createRuntime({})
  const s = mkNode('s', laneId('lane-1'), 'source', { payload: { name: 'Ada', email: 'ada@example.com' } })
  const h = mkNode('h', laneId('lane-1'), 'a2a-handoff', { to: VERIFIER_AGENT_ID, required: ['name', 'email'] })
  const k = mkNode('k', laneId('lane-1'), 'sink', {})
  const wf = mkWorkflow('wf-a2a', [s, h, k], [mkEdge('e1', s.id, h.id), mkEdge('e2', h.id, k.id)])
  const handle = runtime.run(wf)
  const record = await handle.done

  assert.equal(record.state, 'completed')
  assert.deepEqual(record.output, { verified: true, missing: [] })

  const req = record.events.find((e) => e.type === 'a2a.request' && e.cardId === h.id)
  const res = record.events.find((e) => e.type === 'a2a.response' && e.cardId === h.id)
  assert.ok(req && res)
  if (req?.type === 'a2a.request' && res?.type === 'a2a.response') {
    assert.equal(req.correlationId, res.correlationId)
    assert.ok(res.latencyMs >= 0)
    assert.equal(res.from, VERIFIER_AGENT_ID)
  }
})

test('a2a-handoff executor times out against a flaky transport (dropFirst:1, timeoutMs:50)', async () => {
  const inner = createChannelTransport()
  createAgentServer(inner.server)
  const flaky = createFlakyTransport(inner, { dropFirst: 1 })
  const node = mkNode('h', laneId('lane-1'), 'a2a-handoff', { to: VERIFIER_AGENT_ID, required: [] })
  const events: EmitInput[] = []
  const ctx: ExecCtx = {
    node,
    inputs: [{}],
    opts: { timeoutMs: 50 },
    attempt: 1,
    signal: new AbortController().signal,
    a2a: { transport: flaky.client, from: asId('test-runtime') },
    emit: (e) => events.push(e),
  }
  await assert.rejects(executors['a2a-handoff'](ctx), /A2A timeout after 50ms/)
  const timeoutEvent = events.find((e) => e.type === 'a2a.timeout')
  assert.ok(timeoutEvent)
  if (timeoutEvent?.type === 'a2a.timeout') assert.equal(timeoutEvent.cardId, node.id)
  const requestEvent = events.find((e) => e.type === 'a2a.request')
  assert.ok(requestEvent)
  flaky.client.close()
  inner.server.close()
})

test('runner: an A2A node that times out fails the node and the run, naming the card', async () => {
  const runtime = createRuntime({})
  const s = mkNode('s', laneId('lane-1'), 'source', { payload: {} })
  const h = mkNode('h', laneId('lane-1'), 'a2a-handoff', { to: PALETTE_AGENT_ID, required: [] })
  const k = mkNode('k', laneId('lane-1'), 'sink', {})
  const wf = mkWorkflow('wf-timeout', [s, h, k], [mkEdge('e1', s.id, h.id), mkEdge('e2', h.id, k.id)])
  // The default agent's real reply delay is 5-30ms; 1ms can never win that race.
  const handle = runtime.run(wf, { timeoutMs: 1 })
  const record = await handle.done

  assert.equal(record.state, 'failed')
  const timeoutEvent = record.events.find((e) => e.type === 'a2a.timeout')
  assert.ok(timeoutEvent)
  const failedRun = record.events.find((e) => e.type === 'run.failed')
  assert.ok(failedRun)
  if (failedRun?.type === 'run.failed') assert.equal(failedRun.cardId, h.id)
  // sink never runs — the workflow failed before it.
  assert.equal(record.events.some((e) => 'cardId' in e && e.cardId === k.id), false)
})

test('cancel() called right after run() yields run.canceled and no run.finished', async () => {
  const runtime = createRuntime({})
  const s = mkNode('s', laneId('lane-1'), 'source', { payload: 'x' })
  const t = mkNode('t', laneId('lane-1'), 'transform', { transform: 'uppercase' })
  const k = mkNode('k', laneId('lane-1'), 'sink', {})
  const wf = mkWorkflow('wf-cancel', [s, t, k], [mkEdge('e1', s.id, t.id), mkEdge('e2', t.id, k.id)])

  const handle = runtime.run(wf)
  runtime.cancel(handle.runId)
  const record = await handle.done

  assert.equal(record.state, 'canceled')
  assert.ok(record.events.find((e) => e.type === 'run.canceled'))
  assert.equal(record.events.some((e) => e.type === 'run.finished'), false)
})

test('runtime.agents() exposes the three in-page agent cards', () => {
  const runtime = createRuntime({})
  const cards = runtime.agents()
  assert.equal(cards.length, 3)
})
