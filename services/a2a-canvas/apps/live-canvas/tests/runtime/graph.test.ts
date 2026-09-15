import { test } from 'node:test'
import assert from 'node:assert/strict'
import { predecessors, successors, topologicalOrder, validate } from '../../src/runtime/graph.ts'
import { cardId, edgeId, laneId, mkEdge, mkNode, mkWorkflow } from './helpers.ts'

test('predecessors/successors follow edge order', () => {
  const s = mkNode('s', laneId('lane-1'), 'source')
  const t1 = mkNode('t1', laneId('lane-1'), 'transform')
  const t2 = mkNode('t2', laneId('lane-1'), 'transform')
  const j = mkNode('j', laneId('lane-1'), 'join')
  const wf = mkWorkflow('wf', [s, t1, t2, j], [
    mkEdge('e1', s.id, t1.id),
    mkEdge('e2', s.id, t2.id),
    mkEdge('e3', t1.id, j.id),
    mkEdge('e4', t2.id, j.id),
  ])
  const succ = successors(wf)
  assert.deepEqual(succ.get(s.id), [t1.id, t2.id])
  const pred = predecessors(wf)
  assert.deepEqual(pred.get(j.id), [t1.id, t2.id])
  assert.deepEqual(pred.get(s.id), [])
})

test('topologicalOrder batches independent cards into layers', () => {
  const s = mkNode('s', laneId('lane-1'), 'source')
  const b = mkNode('b', laneId('lane-1'), 'branch')
  const t1 = mkNode('t1', laneId('lane-1'), 'transform')
  const t2 = mkNode('t2', laneId('lane-1'), 'transform')
  const j = mkNode('j', laneId('lane-1'), 'join')
  const wf = mkWorkflow('wf', [s, b, t1, t2, j], [
    mkEdge('e1', s.id, b.id),
    mkEdge('e2', b.id, t1.id),
    mkEdge('e3', b.id, t2.id),
    mkEdge('e4', t1.id, j.id),
    mkEdge('e5', t2.id, j.id),
  ])
  const result = topologicalOrder(wf)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.value, [[s.id], [b.id], [t1.id, t2.id], [j.id]])
})

test('topologicalOrder reports a cycle naming the cards involved', () => {
  const a = mkNode('a', laneId('lane-1'), 'transform')
  const b = mkNode('b', laneId('lane-1'), 'transform')
  const c = mkNode('c', laneId('lane-1'), 'sink') // not part of the cycle
  const wf = mkWorkflow('wf', [a, b, c], [
    mkEdge('e1', a.id, b.id),
    mkEdge('e2', b.id, a.id),
  ])
  const result = topologicalOrder(wf)
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.error.code, 'cycle')
  assert.deepEqual(new Set(result.error.cardIds), new Set([a.id, b.id]))
  assert.match(result.error.message, /a/)
  assert.match(result.error.message, /b/)
})

test('validate reports dangling edges and joins with no input', () => {
  const s = mkNode('s', laneId('lane-1'), 'source')
  const j = mkNode('j', laneId('lane-1'), 'join')
  const wf = mkWorkflow('wf', [s, j], [
    { id: edgeId('e1'), from: s.id, to: cardId('ghost') }, // dangling: 'ghost' does not exist
  ])
  const result = validate(wf)
  assert.equal(result.ok, false)
  if (result.ok) return
  const codes = result.error.map((i) => i.code).sort()
  assert.deepEqual(codes, ['dangling-edge', 'join-needs-input'])
})

test('validate passes a well-formed workflow', () => {
  const s = mkNode('s', laneId('lane-1'), 'source')
  const j = mkNode('j', laneId('lane-1'), 'join')
  const wf = mkWorkflow('wf', [s, j], [mkEdge('e1', s.id, j.id)])
  const result = validate(wf)
  assert.equal(result.ok, true)
})
