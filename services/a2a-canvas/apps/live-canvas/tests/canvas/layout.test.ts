import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createIdFactory } from '../../../../packages/shared/src/ids.ts'
import type { CanvasDoc, CanvasNode, CanvasWorkflow } from '../../src/contracts.ts'
import { computeLayout, laneAt, nodeAt, insertionIndex, LANE_MIN_H, LANE_GAP, NODE_GAP, PADDING } from '../../src/canvas/layout.ts'

const ids = createIdFactory(1)

function makeNode(over: Partial<CanvasNode> & Pick<CanvasNode, 'laneId' | 'order' | 'title'>): CanvasNode {
  return {
    id: ids.card(),
    body: '',
    tags: [],
    status: 'idle',
    shape: 'rounded',
    kind: 'transform',
    config: {},
    w: 140,
    h: 88,
    ...over,
  }
}

function makeDoc(): { doc: CanvasDoc; wfId: ReturnType<typeof ids.workflow>; laneA: ReturnType<typeof ids.lane>; laneB: ReturnType<typeof ids.lane> } {
  const wfId = ids.workflow()
  const laneA = ids.lane()
  const laneB = ids.lane()
  const cards: CanvasNode[] = [
    // deliberately out of array order: order=2 appears before order=0
    makeNode({ laneId: laneA, order: 2, title: 'C' }),
    makeNode({ laneId: laneA, order: 0, title: 'A' }),
    makeNode({ laneId: laneA, order: 1, title: 'B' }),
    makeNode({ laneId: laneB, order: 0, title: 'D', h: 260 }),
  ]
  const wf: CanvasWorkflow = {
    id: wfId,
    name: 'Workflow One',
    lanes: [
      { id: laneA, workflowId: wfId, title: 'Lane A', order: 0, collapsed: false },
      { id: laneB, workflowId: wfId, title: 'Lane B', order: 1, collapsed: false },
    ],
    cards,
    edges: [],
    version: 1,
    updatedAt: '2026-09-15T00:00:00.000Z',
  }
  const doc: CanvasDoc = {
    version: 1,
    workflows: [wf],
    themeId: ids.theme(),
    viewport: { x: 0, y: 0, zoom: 1 },
  }
  return { doc, wfId, laneA, laneB }
}

test('computeLayout is deterministic', () => {
  const { doc } = makeDoc()
  const a = computeLayout(doc, { x: 0, y: 0, zoom: 1 })
  const b = computeLayout(doc, { x: 0, y: 0, zoom: 1 })
  assert.deepEqual(a, b)
  // Viewport pan/zoom must not perturb world-space geometry.
  const c = computeLayout(doc, { x: 400, y: -200, zoom: 2.5 })
  assert.deepEqual(a, c)
})

test('lanes never overlap, vertically or with each other', () => {
  const { doc } = makeDoc()
  const layout = computeLayout(doc)
  for (let i = 0; i < layout.lanes.length; i += 1) {
    for (let j = 0; j < layout.lanes.length; j += 1) {
      if (i === j) continue
      const a = layout.lanes[i]!
      const b = layout.lanes[j]!
      const separateY = a.y + a.h <= b.y || b.y + b.h <= a.y
      const separateX = a.x + a.w <= b.x || b.x + b.w <= a.x
      assert.ok(separateY || separateX, `lanes ${a.laneId} and ${b.laneId} overlap`)
    }
  }
})

test('lane heights respect LANE_MIN_H and grow for tall content', () => {
  const { doc } = makeDoc()
  const layout = computeLayout(doc)
  for (const lane of layout.lanes) assert.ok(lane.h >= LANE_MIN_H)
  // Lane B holds a 260px-tall node — its rail must be taller than the minimum.
  const laneB = layout.lanes.find((l) => l.h > LANE_MIN_H)
  assert.ok(laneB, 'expected at least one lane taller than LANE_MIN_H')
})

test('lanes stack top-to-bottom with LANE_GAP between them, in `order`', () => {
  const { doc, laneA, laneB } = makeDoc()
  const layout = computeLayout(doc)
  const a = layout.lanes.find((l) => l.laneId === laneA)!
  const b = layout.lanes.find((l) => l.laneId === laneB)!
  assert.ok(a.y < b.y, 'Lane A (order 0) must sit above Lane B (order 1)')
  assert.equal(b.y, a.y + a.h + LANE_GAP)
  assert.equal(a.x, PADDING)
  assert.equal(a.w, b.w, 'lanes span the full workflow width')
})

test('auto-placement respects `order`, not array order, left to right with NODE_GAP', () => {
  const { doc } = makeDoc()
  const layout = computeLayout(doc)
  const nodeById = new Map(layout.nodes.map((n) => [n.cardId, n]))
  const wf = doc.workflows[0]!
  const a = wf.cards.find((c) => c.title === 'A')!
  const b = wf.cards.find((c) => c.title === 'B')!
  const c = wf.cards.find((c) => c.title === 'C')!
  const na = nodeById.get(a.id)!
  const nb = nodeById.get(b.id)!
  const nc = nodeById.get(c.id)!
  assert.ok(na.x < nb.x && nb.x < nc.x, 'nodes must be ordered A, B, C by `order`, regardless of array order')
  assert.equal(nb.x, na.x + na.w + NODE_GAP)
  assert.equal(nc.x, nb.x + nb.w + NODE_GAP)
})

test('a node with an explicit position is clamped inside its lane', () => {
  const { doc, laneA } = makeDoc()
  const wf = doc.workflows[0]!
  const wild = makeNode({ laneId: laneA, order: 9, title: 'Wild', position: { x: -99999, y: -99999 } })
  wf.cards.push(wild)
  const layout = computeLayout(doc)
  const laneLayout = layout.lanes.find((l) => l.laneId === laneA)!
  const node = layout.nodes.find((n) => n.cardId === wild.id)!
  assert.ok(node.x >= laneLayout.x && node.x + node.w <= laneLayout.x + laneLayout.w)
  assert.ok(node.y >= laneLayout.y && node.y + node.h <= laneLayout.y + laneLayout.h)
})

test('laneAt finds the lane under a point and null outside all lanes', () => {
  const { doc, laneA } = makeDoc()
  const layout = computeLayout(doc)
  const a = layout.lanes.find((l) => l.laneId === laneA)!
  assert.equal(laneAt(layout, { x: a.x + 5, y: a.y + 5 }), laneA)
  assert.equal(laneAt(layout, { x: -5000, y: -5000 }), null)
})

test('nodeAt finds the node under a point and null over empty space', () => {
  const { doc } = makeDoc()
  const layout = computeLayout(doc)
  const n = layout.nodes[0]!
  assert.equal(nodeAt(layout, { x: n.x + 2, y: n.y + 2 }), n.cardId)
  assert.equal(nodeAt(layout, { x: -5000, y: -5000 }), null)
})

test('insertionIndex picks the slot matching the pointer x position', () => {
  const { doc, laneA } = makeDoc()
  const layout = computeLayout(doc)
  const nodeById = new Map(layout.nodes.map((n) => [n.cardId, n]))
  const wf = doc.workflows[0]!
  const a = wf.cards.find((c) => c.title === 'A')!
  const b = wf.cards.find((c) => c.title === 'B')!
  const na = nodeById.get(a.id)!
  const nb = nodeById.get(b.id)!
  const laneLayout = layout.lanes.find((l) => l.laneId === laneA)!

  // Before A's center -> index 0.
  assert.equal(insertionIndex(layout, doc, laneA, { x: na.x + 1, y: na.y }), 0)
  // Between A's and B's centers -> index 1.
  const betweenX = (na.x + na.w / 2 + nb.x + nb.w / 2) / 2
  assert.equal(insertionIndex(layout, doc, laneA, { x: betweenX, y: na.y }), 1)
  // Past every node's center -> index === card count.
  assert.equal(insertionIndex(layout, doc, laneA, { x: laneLayout.x + laneLayout.w, y: na.y }), 3)
})
