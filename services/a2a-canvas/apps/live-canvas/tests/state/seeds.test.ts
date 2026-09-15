import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSeedFactory } from '../../src/state/seeds.ts'
import { NODE_KIND_META } from '../../src/contracts.ts'
import { asId } from '../../../../packages/shared/src/ids.ts'
import type { CanvasWorkflow, CardId } from '../../src/contracts.ts'

function hasCycle(wf: CanvasWorkflow): boolean {
  const adjacency = new Map<CardId, CardId[]>()
  for (const c of wf.cards) adjacency.set(c.id, [])
  for (const e of wf.edges) adjacency.get(e.from)?.push(e.to)

  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map<CardId, number>(wf.cards.map((c) => [c.id, WHITE]))

  function dfs(node: CardId): boolean {
    color.set(node, GRAY)
    for (const next of adjacency.get(node) ?? []) {
      const c = color.get(next)
      if (c === GRAY) return true // back-edge: cycle
      if (c === WHITE && dfs(next)) return true
    }
    color.set(node, BLACK)
    return false
  }

  for (const c of wf.cards) {
    if (color.get(c.id) === WHITE && dfs(c.id)) return true
  }
  return false
}

test('defaultDoc has exactly four workflows', () => {
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))
  assert.equal(doc.workflows.length, 4)
  assert.deepEqual(doc.workflows.map((w) => w.name), ['Theme Forge', 'A2A Handoff', 'Workflow Lab', 'Scratch'])
  assert.equal(doc.version, 1)
  assert.equal(doc.themeId, 'theme-1')
})

test('every edge references cards that exist in the same workflow', () => {
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))
  for (const wf of doc.workflows) {
    const ids = new Set(wf.cards.map((c) => c.id))
    for (const e of wf.edges) {
      assert.ok(ids.has(e.from), `${wf.name}: edge.from ${e.from} missing`)
      assert.ok(ids.has(e.to), `${wf.name}: edge.to ${e.to} missing`)
    }
  }
})

test('no seed workflow has a cycle', () => {
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))
  for (const wf of doc.workflows) {
    assert.equal(hasCycle(wf), false, `${wf.name} should be acyclic`)
  }
})

test('every node kind used in the seed doc exists in NODE_KIND_META', () => {
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))
  for (const wf of doc.workflows) {
    for (const c of wf.cards) {
      assert.ok(c.kind in NODE_KIND_META, `${wf.name}: unknown kind ${c.kind}`)
      assert.equal(typeof NODE_KIND_META[c.kind].label, 'string')
    }
  }
})

test('every workflow has exactly one lane, and every card belongs to it', () => {
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))
  for (const wf of doc.workflows) {
    assert.equal(wf.lanes.length, 1)
    const laneId = wf.lanes[0]!.id
    for (const c of wf.cards) assert.equal(c.laneId, laneId)
  }
})

test('blankNode uses the kind default shape and the kind label as title', () => {
  const seeds = createSeedFactory()
  const doc = seeds.defaultDoc(asId<'ThemeId'>('theme-1'))
  const laneId = doc.workflows[3]!.lanes[0]!.id // Scratch
  const node = seeds.blankNode(laneId, 'probe', { x: 10, y: 20 })
  assert.equal(node.kind, 'probe')
  assert.equal(node.shape, NODE_KIND_META.probe.defaultShape)
  assert.equal(node.title, NODE_KIND_META.probe.label)
  assert.equal(node.w, 160)
  assert.equal(node.h, 72)
  assert.deepEqual(node.position, { x: 10, y: 20 })
  assert.deepEqual(node.config, {})
})

test('seed ids are deterministic for a fixed seed', () => {
  const a = createSeedFactory(undefined, undefined).defaultDoc(asId<'ThemeId'>('theme-1'))
  const b = createSeedFactory(undefined, undefined).defaultDoc(asId<'ThemeId'>('theme-1'))
  // default ids() factory seed (1) is fixed, so two independent factories
  // started fresh must line up card-for-card.
  assert.deepEqual(a.workflows.map((w) => w.cards.map((c) => c.id)), b.workflows.map((w) => w.cards.map((c) => c.id)))
})
