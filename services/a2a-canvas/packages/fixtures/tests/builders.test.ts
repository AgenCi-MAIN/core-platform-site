import { test } from 'node:test'
import assert from 'node:assert/strict'
import { doc, NODE_GAP, NODE_W } from '../src/builders.ts'
import { asId } from '../../shared/src/ids.ts'
import type { ThemeId } from '../../shared/src/ids.ts'

const THEME: ThemeId = asId<'ThemeId'>('theme.test')

function buildSample(seed: number) {
  return doc(THEME, { seed })
    .workflow('W', 'summary')
    .lane('Lane One')
    .node('source', 'Start', { x: 1 })
    .node('transform', 'Middle', { x: 2 })
    .node('sink', 'End', { x: 3 })
    .edge('Start', 'Middle')
    .edge('Middle', 'End')
    .build()
}

test('.edge() resolves nodes by the titles passed to .node()', () => {
  const d = buildSample(1)
  const wf = d.workflows[0]
  assert.ok(wf)
  const byTitle = new Map(wf.cards.map((c) => [c.title, c.id]))
  assert.equal(wf.edges.length, 2)
  assert.equal(wf.edges[0]?.from, byTitle.get('Start'))
  assert.equal(wf.edges[0]?.to, byTitle.get('Middle'))
  assert.equal(wf.edges[1]?.from, byTitle.get('Middle'))
  assert.equal(wf.edges[1]?.to, byTitle.get('End'))
})

test('ids (and every timestamp) are deterministic across two builds with the same seed', () => {
  const a = buildSample(42)
  const b = buildSample(42)
  assert.deepEqual(a, b)
})

test('a different seed produces different ids but the same structure', () => {
  const a = buildSample(1)
  const b = buildSample(2)
  assert.notEqual(a.workflows[0]?.id, b.workflows[0]?.id)
  assert.notEqual(a.workflows[0]?.cards[0]?.id, b.workflows[0]?.cards[0]?.id)
  assert.equal(a.workflows[0]?.cards.length, b.workflows[0]?.cards.length)
})

test('nodes auto-position NODE_GAP px apart along their lane', () => {
  const d = buildSample(1)
  const cards = d.workflows[0]?.cards ?? []
  assert.equal(cards.length, 3)
  assert.deepEqual(cards[0]?.position, { x: 0, y: 0 })
  assert.deepEqual(cards[1]?.position, { x: NODE_W + NODE_GAP, y: 0 })
  assert.deepEqual(cards[2]?.position, { x: 2 * (NODE_W + NODE_GAP), y: 0 })
})

test('unknown node kind throws', () => {
  assert.throws(() => {
    // @ts-expect-error deliberately invalid kind for the runtime guard test
    doc(THEME, { seed: 1 }).workflow('W').lane('L').node('not-a-kind', 'X')
  }, /unknown node kind/)
})

test('.node() before .lane() throws; .lane() before .workflow() throws; .edge() to an unknown title throws', () => {
  assert.throws(() => doc(THEME).workflow('W').node('source', 'X'), /called before \.lane/)
  assert.throws(() => doc(THEME).lane('L'), /called before \.workflow/)
  assert.throws(() => doc(THEME).workflow('W').lane('L').node('source', 'A').edge('A', 'nope'), /unknown node "nope"/)
})

test('duplicate node titles within one workflow throw', () => {
  assert.throws(() => doc(THEME).workflow('W').lane('L').node('source', 'A').node('sink', 'A'), /duplicate node title/)
})

test('a new .workflow() resets the node-title namespace, so titles may repeat across workflows', () => {
  const d = doc(THEME, { seed: 3 })
    .workflow('W1')
    .lane('L1')
    .node('source', 'A')
    .node('sink', 'B')
    .edge('A', 'B')
    .workflow('W2')
    .lane('L2')
    .node('source', 'A')
    .node('sink', 'B')
    .edge('A', 'B')
    .build()
  assert.equal(d.workflows.length, 2)
  assert.equal(d.workflows[0]?.edges.length, 1)
  assert.equal(d.workflows[1]?.edges.length, 1)
  // the two "A" nodes are different cards with different ids
  assert.notEqual(d.workflows[0]?.cards[0]?.id, d.workflows[1]?.cards[0]?.id)
})

test('edges may cross lanes within the same workflow', () => {
  const d = doc(THEME, { seed: 4 })
    .workflow('W')
    .lane('Left')
    .node('source', 'A')
    .lane('Right')
    .node('sink', 'B')
    .edge('A', 'B')
    .build()
  const wf = d.workflows[0]
  assert.ok(wf)
  assert.equal(wf.lanes.length, 2)
  const cardA = wf.cards.find((c) => c.title === 'A')
  const cardB = wf.cards.find((c) => c.title === 'B')
  assert.ok(cardA && cardB)
  assert.notEqual(cardA.laneId, cardB.laneId)
  assert.equal(wf.edges[0]?.from, cardA.id)
  assert.equal(wf.edges[0]?.to, cardB.id)
})

test('node kind defaults to its NODE_KIND_META shape when none is given, and an explicit shape overrides it', () => {
  const d = doc(THEME, { seed: 5 }).workflow('W').lane('L').node('branch', 'Br').node('branch', 'Br2', {}, 'rect').build()
  const cards = d.workflows[0]?.cards ?? []
  assert.equal(cards[0]?.shape, 'diamond') // NODE_KIND_META.branch.defaultShape
  assert.equal(cards[1]?.shape, 'rect')
})

test('build() produces version 1 and a default viewport unless overridden', () => {
  const d = buildSample(1)
  assert.equal(d.version, 1)
  assert.deepEqual(d.viewport, { x: 0, y: 0, zoom: 1 })
  const withVp = doc(THEME).workflow('W').lane('L').node('source', 'A').viewport({ x: 10, y: 20, zoom: 2 }).build()
  assert.deepEqual(withVp.viewport, { x: 10, y: 20, zoom: 2 })
})
