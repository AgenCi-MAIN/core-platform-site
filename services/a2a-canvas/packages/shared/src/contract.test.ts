/**
 * Proves the test-runner path (node --test on .ts via type stripping) and
 * pins a few structural facts of the contract.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createIdFactory, steppingClock, isoAt, ok, err, isOk, isTerminal, EMPTY_SELECTION, THEME_MODES, PALETTE_ROLES, A2A_METHODS } from './index.ts'
import type { Workflow, Task, ThemeTokens } from './index.ts'

test('seeded id factory is deterministic', () => {
  const a = createIdFactory(42)
  const b = createIdFactory(42)
  assert.equal(a.card(), b.card())
  assert.equal(a.lane(), b.lane())
  assert.notEqual(a.card(), a.card())
})

test('stepping clock advances monotonically', () => {
  const c = steppingClock(1_000, 5)
  assert.equal(c.now(), 1_000)
  assert.equal(c.now(), 1_005)
  assert.match(isoAt(c), /^\d{4}-\d{2}-\d{2}T/)
})

test('result helpers', () => {
  assert.equal(isOk(ok(1)), true)
  assert.equal(isOk(err('x')), false)
})

test('task terminal states', () => {
  assert.equal(isTerminal('completed'), true)
  assert.equal(isTerminal('working'), false)
  assert.equal(A2A_METHODS.includes('tasks/send'), true)
})

test('a minimal workflow and task are well-formed', () => {
  const ids = createIdFactory(7)
  const wfId = ids.workflow()
  const lane = { id: ids.lane(), workflowId: wfId, title: 'Lane', order: 0, collapsed: false }
  const card = { id: ids.card(), laneId: lane.id, order: 0, title: 'Card', body: '', tags: [], status: 'idle' as const }
  const wf: Workflow = { id: wfId, name: 'wf', lanes: [lane], cards: [card], edges: [], version: 1, updatedAt: '2026-09-15T00:00:00.000Z' }
  assert.equal(wf.cards[0]?.laneId, lane.id)
  const task: Task = { id: ids.task(), state: 'submitted', history: [], artifacts: [], createdAt: 'x', updatedAt: 'x' }
  assert.equal(task.history.length, 0)
  assert.deepEqual(EMPTY_SELECTION, { cardIds: [], laneIds: [] })
  assert.equal(THEME_MODES.length, 2)
  assert.equal(PALETTE_ROLES.length, 8)
  const partial: Partial<ThemeTokens> = { schemaVersion: '1.0.0' }
  assert.equal(partial.schemaVersion, '1.0.0')
})
