import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from '../../src/state/store.ts'
import { testIds, testClock, twoWorkflowDoc } from './helpers.ts'

test('undo/redo restores the doc and flips canUndo/canRedo', () => {
  const ids = testIds()
  const clock = testClock()
  const { doc, la1, ids: cardIds } = twoWorkflowDoc(ids)
  const store = createStore(doc, { clock })

  assert.equal(store.getState().canUndo, false)
  assert.equal(store.getState().canRedo, false)

  const originalTitle = store.getState().doc.workflows.find((w) => w.lanes.some((l) => l.id === la1))!.lanes.find((l) => l.id === la1)!.title

  store.dispatch({
    type: 'workflow.event',
    event: { type: 'lane.renamed', laneId: la1, title: 'Renamed', at: '2026-01-01T00:00:01.000Z' },
  })
  assert.equal(store.getState().doc.workflows.find((w) => w.lanes.some((l) => l.id === la1))!.lanes.find((l) => l.id === la1)!.title, 'Renamed')
  assert.equal(store.getState().canUndo, true)
  assert.equal(store.getState().canRedo, false)

  store.undo()
  assert.equal(store.getState().doc.workflows.find((w) => w.lanes.some((l) => l.id === la1))!.lanes.find((l) => l.id === la1)!.title, originalTitle)
  assert.equal(store.getState().canUndo, false)
  assert.equal(store.getState().canRedo, true)
  assert.equal(store.getState().saveStatus.kind, 'dirty')

  store.redo()
  assert.equal(store.getState().doc.workflows.find((w) => w.lanes.some((l) => l.id === la1))!.lanes.find((l) => l.id === la1)!.title, 'Renamed')
  assert.equal(store.getState().canUndo, true)
  assert.equal(store.getState().canRedo, false)

  // selection/viewport/drag never enter history: undo() past this point is a no-op.
  store.dispatch({ type: 'viewport.set', viewport: { x: 5, y: 5, zoom: 1 } })
  const before = store.getState().canUndo
  store.dispatch({ type: 'selection.set', selection: { cardIds: [cardIds.a1], laneIds: [] } })
  assert.equal(store.getState().canUndo, before) // unchanged: neither action recorded a step
})

test('notify(null) is used for undo/redo, listeners receive current state', () => {
  const ids = testIds()
  const clock = testClock()
  const { doc, la1 } = twoWorkflowDoc(ids)
  const store = createStore(doc, { clock })

  const seen: Array<{ action: unknown }> = []
  store.subscribe((_state, action) => seen.push({ action }))

  store.dispatch({ type: 'workflow.event', event: { type: 'lane.renamed', laneId: la1, title: 'X', at: 't' } })
  store.undo()

  assert.equal(seen.length, 2)
  assert.notEqual(seen[0]!.action, null)
  assert.equal(seen[1]!.action, null)
})
