import { test } from 'node:test'
import assert from 'node:assert/strict'
import { asId } from '../../../../packages/shared/src/ids.ts'
import type { NodeLayout } from '../../src/contracts.ts'
import { connectorPath, midpoint, type ConnectorRoute } from '../../src/canvas/connectors.ts'

function node(id: string, x: number, y: number, w = 140, h = 90): NodeLayout {
  return { cardId: asId<'CardId'>(id), x, y, w, h }
}

function startOf(d: string): { x: number; y: number } {
  const m = /^M(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(d.trim())
  assert.ok(m, `path has no leading M: ${d}`)
  return { x: Number(m![1]), y: Number(m![2]) }
}

function allFinite(d: string): boolean {
  const nums = d.match(/-?\d+(?:\.\d+)?/g) ?? []
  return nums.length > 0 && nums.every((n) => Number.isFinite(Number(n)))
}

const routes: ConnectorRoute[] = ['curved', 'angled']

test('connectorPath starts at from.right and ends at to.left (forward edge)', () => {
  const from = node('a', 0, 0)
  const to = node('b', 400, 40)
  const expectedStart = { x: from.x + from.w, y: from.y + from.h / 2 }
  const expectedEnd = { x: to.x, y: to.y + to.h / 2 }
  for (const route of routes) {
    const { d, arrowAt } = connectorPath(from, to, route)
    const start = startOf(d)
    assert.equal(start.x, expectedStart.x, `${route}: start x`)
    assert.equal(start.y, expectedStart.y, `${route}: start y`)
    assert.equal(arrowAt.x, expectedEnd.x, `${route}: end x`)
    assert.equal(arrowAt.y, expectedEnd.y, `${route}: end y`)
    assert.ok(Number.isFinite(arrowAt.angle), `${route}: angle must be finite`)
  }
})

test('backwards edges (to left of from) still start/end correctly and stay finite', () => {
  const from = node('a', 400, 0)
  const to = node('b', 0, 200) // well to the left, and lower
  const expectedStart = { x: from.x + from.w, y: from.y + from.h / 2 }
  const expectedEnd = { x: to.x, y: to.y + to.h / 2 }
  for (const route of routes) {
    const { d, arrowAt } = connectorPath(from, to, route)
    assert.ok(allFinite(d), `${route}: path has a non-finite coordinate: ${d}`)
    const start = startOf(d)
    assert.equal(start.x, expectedStart.x, `${route}: start x`)
    assert.equal(start.y, expectedStart.y, `${route}: start y`)
    assert.equal(arrowAt.x, expectedEnd.x, `${route}: end x`)
    assert.equal(arrowAt.y, expectedEnd.y, `${route}: end y`)
    assert.ok(Number.isFinite(arrowAt.angle), `${route}: angle must be finite`)
  }
})

test('backwards edge with equal y (straight overlap case) stays finite', () => {
  const from = node('a', 400, 100)
  const to = node('b', 0, 100)
  for (const route of routes) {
    const { d } = connectorPath(from, to, route)
    assert.ok(allFinite(d), `${route}: ${d}`)
  }
})

test('midpoint is finite for forward and backward edges, both routes', () => {
  const pairs: [NodeLayout, NodeLayout][] = [
    [node('a', 0, 0), node('b', 400, 40)],
    [node('a', 400, 0), node('b', 0, 200)],
  ]
  for (const [from, to] of pairs) {
    for (const route of routes) {
      const p = midpoint(from, to, route)
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `${route}: midpoint not finite`)
    }
  }
})

test('connectorPath is deterministic', () => {
  const from = node('a', 10, 10)
  const to = node('b', 300, 60)
  for (const route of routes) {
    assert.deepEqual(connectorPath(from, to, route), connectorPath(from, to, route))
  }
})
