import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reduce } from '../../src/state/reducer.ts'
import { asId } from '../../../../packages/shared/src/ids.ts'
import type { CardId } from '../../src/contracts.ts'
import { testIds, testClock, twoWorkflowDoc, stateFor } from './helpers.ts'

test('card.moved within a lane reorders correctly', () => {
  const ids = testIds()
  const clock = testClock()
  const { doc, la1, ids: cardIds } = twoWorkflowDoc(ids)
  const state = stateFor(doc)

  const next = reduce(state, {
    type: 'workflow.event',
    event: { type: 'card.moved', cardId: cardIds.a1, fromLane: la1, toLane: la1, toIndex: 2, at: '2026-01-01T00:00:01.000Z' },
  }, clock)

  const wfA = next.doc.workflows.find((w) => w.id === doc.workflows[0]!.id)!
  const byOrder = [...wfA.cards].sort((a, b) => a.order - b.order).map((c) => c.id)
  assert.deepEqual(byOrder, [cardIds.a2, cardIds.a3, cardIds.a1])
  assert.equal(next.saveStatus.kind, 'dirty')
  assert.equal(wfA.version, 2)
})

test('card.moved across workflows moves the node and removes crossing edges', () => {
  const ids = testIds()
  const clock = testClock()
  const { doc, wfA, wfB, la1, lb1, ids: cardIds } = twoWorkflowDoc(ids)
  const state = stateFor(doc)

  // a2 -> a3 edge exists in workflow A; moving a2 into workflow B must drop it.
  const next = reduce(state, {
    type: 'workflow.event',
    event: { type: 'card.moved', cardId: cardIds.a2, fromLane: la1, toLane: lb1, toIndex: 0, at: '2026-01-01T00:00:01.000Z' },
  }, clock)

  const nextA = next.doc.workflows.find((w) => w.id === wfA)!
  const nextB = next.doc.workflows.find((w) => w.id === wfB)!

  assert.deepEqual(nextA.cards.map((c) => c.id).sort(), [cardIds.a1, cardIds.a3].sort())
  assert.equal(nextA.cards.find((c) => c.id === cardIds.a1)!.order, 0)
  assert.equal(nextA.cards.find((c) => c.id === cardIds.a3)!.order, 1)
  // a1->a2 and a2->a3 both referenced the moved card and must be gone.
  assert.equal(nextA.edges.length, 0)

  assert.equal(nextB.cards.length, 2)
  const moved = nextB.cards.find((c) => c.id === cardIds.a2)!
  assert.equal(moved.laneId, lb1)
  assert.equal(moved.order, 0)
  assert.equal(nextB.cards.find((c) => c.id === cardIds.b1)!.order, 1)

  assert.equal(nextA.version, 2)
  assert.equal(nextB.version, 2)
})

test('edge.added rejects self-edges and duplicates but allows a reverse edge', () => {
  const ids = testIds()
  const clock = testClock()
  const { doc, ids: cardIds } = twoWorkflowDoc(ids)
  const state = stateFor(doc)
  const wfAId = doc.workflows[0]!.id
  const startEdgeCount = doc.workflows[0]!.edges.length

  const selfEdge = reduce(state, {
    type: 'workflow.event',
    event: { type: 'edge.added', edge: { id: asId('e-self'), from: cardIds.a1, to: cardIds.a1 }, at: '2026-01-01T00:00:01.000Z' },
  }, clock)
  assert.equal(selfEdge, state) // no-op: same reference
  assert.equal(selfEdge.doc.workflows.find((w) => w.id === wfAId)!.edges.length, startEdgeCount)

  const dupEdge = reduce(state, {
    type: 'workflow.event',
    event: { type: 'edge.added', edge: { id: asId('e-dup'), from: cardIds.a1, to: cardIds.a2 }, at: '2026-01-01T00:00:01.000Z' },
  }, clock)
  assert.equal(dupEdge, state)

  const reverseEdge = reduce(state, {
    type: 'workflow.event',
    event: { type: 'edge.added', edge: { id: asId('e-rev'), from: cardIds.a2, to: cardIds.a1 }, at: '2026-01-01T00:00:01.000Z' },
  }, clock)
  assert.notEqual(reverseEdge, state)
  assert.equal(reverseEdge.doc.workflows.find((w) => w.id === wfAId)!.edges.length, startEdgeCount + 1)
})

test('theme.apply marks saveStatus dirty; theme.preview does not', () => {
  const ids = testIds()
  const clock = testClock()
  const { doc } = twoWorkflowDoc(ids)
  const state = stateFor(doc)
  assert.equal(state.saveStatus.kind, 'idle')

  const previewed = reduce(state, { type: 'theme.preview', themeId: asId('theme-2') }, clock)
  assert.equal(previewed.saveStatus.kind, 'idle')
  assert.equal(previewed.previewThemeId, asId('theme-2'))
  assert.equal(previewed.doc.themeId, doc.themeId) // doc itself untouched

  const applied = reduce(previewed, { type: 'theme.apply', themeId: asId('theme-2') }, clock)
  assert.equal(applied.saveStatus.kind, 'dirty')
  assert.equal(applied.doc.themeId, asId('theme-2'))
  assert.equal(applied.previewThemeId, asId('theme-2'))
})

test('run.event sequence builds nodeResults and mirrors node status', () => {
  const ids = testIds()
  const clock = testClock()
  const { doc, wfA, ids: cardIds } = twoWorkflowDoc(ids)
  const state = stateFor(doc)
  const runId = asId('run-1')
  const cardId: CardId = cardIds.a1

  let s = reduce(state, { type: 'run.event', event: { type: 'run.started', runId, workflowId: wfA, at: 't0', seq: 0, nodeCount: 3 } }, clock)
  assert.equal(s.runs[runId]!.state, 'running')

  s = reduce(s, { type: 'run.event', event: { type: 'node.started', runId, workflowId: wfA, at: 't1', seq: 1, cardId, attempt: 1 } }, clock)
  assert.equal(s.runs[runId]!.nodeResults[cardId]!.state, 'working')
  assert.equal(nodeStatus(s, wfA, cardId), 'running')

  s = reduce(s, { type: 'run.event', event: { type: 'node.finished', runId, workflowId: wfA, at: 't2', seq: 2, cardId, output: { ok: true } } }, clock)
  assert.equal(s.runs[runId]!.nodeResults[cardId]!.state, 'completed')
  assert.deepEqual(s.runs[runId]!.nodeResults[cardId]!.output, { ok: true })
  assert.equal(nodeStatus(s, wfA, cardId), 'done')

  s = reduce(s, { type: 'run.event', event: { type: 'run.finished', runId, workflowId: wfA, at: 't3', seq: 3, output: { done: true }, durationMs: 3 } }, clock)
  assert.equal(s.runs[runId]!.state, 'completed')
  assert.equal(s.runs[runId]!.finishedAt, 't3')
  assert.equal(s.runs[runId]!.events.length, 4)
  // run.event never touches saveStatus
  assert.equal(s.saveStatus.kind, 'idle')
})

function nodeStatus(state: ReturnType<typeof stateFor>, workflowId: ReturnType<typeof twoWorkflowDoc>['wfA'], cardId: CardId): string {
  const wf = state.doc.workflows.find((w) => w.id === workflowId)!
  return wf.cards.find((c) => c.id === cardId)!.status
}
