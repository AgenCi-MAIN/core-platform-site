import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asId } from '../../../../packages/shared/src/index.ts'
import type { AgentId } from '../../../../packages/shared/src/index.ts'
import { executors } from '../../src/runtime/executors.ts'
import type { ExecCtx } from '../../src/runtime/executors.ts'
import { createOfflineTransport } from '../../src/runtime/a2a/transport.ts'
import { laneId, mkNode } from './helpers.ts'

const DUMMY_AGENT: AgentId = asId('dummy')

function mkCtx(overrides: Partial<ExecCtx> & Pick<ExecCtx, 'node'>): ExecCtx {
  return {
    inputs: [],
    opts: {},
    attempt: 1,
    signal: new AbortController().signal,
    a2a: { transport: createOfflineTransport(), from: DUMMY_AGENT },
    emit: () => {},
    ...overrides,
  }
}

test('transform: pick keeps only the configured keys', async () => {
  const node = mkNode('t', laneId('lane-1'), 'transform', { transform: 'pick', keys: ['a', 'c'] })
  const out = await executors.transform(mkCtx({ node, inputs: [{ a: 1, b: 2, c: 3 }] }))
  assert.deepEqual(out, { a: 1, c: 3 })
})

test('transform: merge combines input with config.with', async () => {
  const node = mkNode('t', laneId('lane-1'), 'transform', { transform: 'merge', with: { extra: true } })
  const out = await executors.transform(mkCtx({ node, inputs: [{ a: 1 }] }))
  assert.deepEqual(out, { a: 1, extra: true })
})

test('transform: count handles arrays, objects and strings', async () => {
  const node = mkNode('t', laneId('lane-1'), 'transform', { transform: 'count' })
  assert.equal(await executors.transform(mkCtx({ node, inputs: [[1, 2, 3]] })), 3)
  assert.equal(await executors.transform(mkCtx({ node, inputs: [{ a: 1, b: 2 }] })), 2)
  assert.equal(await executors.transform(mkCtx({ node, inputs: ['hello'] })), 5)
})

test('transform: setAccent without a ThemeApi just stamps the accent field', async () => {
  const node = mkNode('t', laneId('lane-1'), 'transform', { transform: 'setAccent', accent: '#ABCDEF' })
  const out = await executors.transform(mkCtx({ node, inputs: [{ name: 'x' }] }))
  assert.deepEqual(out, { name: 'x', accent: '#ABCDEF' })
})

test('probe: structural probe on a plain object with no ThemeApi', async () => {
  const node = mkNode('p', laneId('lane-1'), 'probe', {})
  const out = await executors.probe(mkCtx({ node, inputs: [{ a: 1, b: 2 }] })) as { type: string; keys: string[]; size: number }
  assert.equal(out.type, 'object')
  assert.deepEqual(out.keys.sort(), ['a', 'b'])
  assert.equal(out.size, 2)
})

test('join: merges plain-object inputs, otherwise returns the array', async () => {
  const node = mkNode('j', laneId('lane-1'), 'join', {})
  const merged = await executors.join(mkCtx({ node, inputs: [{ a: 1 }, { b: 2 }] }))
  assert.deepEqual(merged, { a: 1, b: 2 })
  const arr = await executors.join(mkCtx({ node, inputs: ['x', 'y'] }))
  assert.deepEqual(arr, ['x', 'y'])
})

test('branch: passes its single input straight through', async () => {
  const node = mkNode('b', laneId('lane-1'), 'branch', {})
  const out = await executors.branch(mkCtx({ node, inputs: ['pass-through'] }))
  assert.equal(out, 'pass-through')
})

test('preview: escapes HTML-significant characters', async () => {
  const node = mkNode('pv', laneId('lane-1'), 'preview', {})
  const out = await executors.preview(mkCtx({ node, inputs: ['<script>alert(1)</script> & "quoted" \'x\''] })) as string
  assert.equal(out.includes('<script>'), false)
  assert.match(out, /&lt;script&gt;/)
  assert.match(out, /&amp;/)
  assert.match(out, /&quot;quoted&quot;/)
})

test('sink: returns its input unchanged', async () => {
  const node = mkNode('sk', laneId('lane-1'), 'sink', {})
  const out = await executors.sink(mkCtx({ node, inputs: [{ done: true }] }))
  assert.deepEqual(out, { done: true })
})

test('source: config.payload by default, opts.input overrides it', async () => {
  const node = mkNode('s', laneId('lane-1'), 'source', { payload: 'from-config' })
  assert.equal(await executors.source(mkCtx({ node })), 'from-config')
  assert.equal(await executors.source(mkCtx({ node, opts: { input: 'from-opts' } })), 'from-opts')
})

test('retry executor: echo always succeeds; flaky fails until ctx.attempt reaches succeedOnAttempt', async () => {
  const echoNode = mkNode('r1', laneId('lane-1'), 'retry', { operation: 'echo' })
  assert.equal(await executors.retry(mkCtx({ node: echoNode, inputs: ['keep'], attempt: 1 })), 'keep')

  const flakyNode = mkNode('r2', laneId('lane-1'), 'retry', { operation: 'flaky', succeedOnAttempt: 2 })
  await assert.rejects(executors.retry(mkCtx({ node: flakyNode, inputs: ['x'], attempt: 1 })))
  assert.equal(await executors.retry(mkCtx({ node: flakyNode, inputs: ['x'], attempt: 2 })), 'x')
})
