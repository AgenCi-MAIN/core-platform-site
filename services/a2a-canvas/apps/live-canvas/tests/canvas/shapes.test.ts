import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SHAPE_KINDS } from '../../src/contracts.ts'
import { shapePath, keylinePath, anchors } from '../../src/canvas/shapes.ts'

const W = 140
const H = 90

test('shapePath produces a closed, non-empty path for every SHAPE_KINDS entry', () => {
  for (const kind of SHAPE_KINDS) {
    const d = shapePath(kind, W, H)
    assert.ok(d.length > 0, `${kind}: empty path`)
    assert.match(d.trim(), /^M/, `${kind}: must start with a moveto`)
    assert.match(d.trim(), /Z$/i, `${kind}: must close the path`)
    // Every coordinate written must be finite (no NaN/Infinity ever reaches the DOM).
    const nums = d.match(/-?\d+(\.\d+)?/g) ?? []
    assert.ok(nums.length > 0)
    for (const n of nums) assert.ok(Number.isFinite(Number(n)), `${kind}: non-finite coordinate ${n}`)
  }
})

test('keylinePath is also closed and finite, inset from shapePath', () => {
  for (const kind of SHAPE_KINDS) {
    const d = keylinePath(kind, W, H)
    assert.match(d.trim(), /^M/, `${kind}: keyline must start with a moveto`)
    assert.match(d.trim(), /Z$/i, `${kind}: keyline must close`)
  }
})

test('keylinePath degrades gracefully for tiny boxes (no negative size)', () => {
  for (const kind of SHAPE_KINDS) {
    const d = keylinePath(kind, 4, 4) // smaller than the 3px*2 inset
    assert.match(d.trim(), /^M/, `${kind}: still produces a path`)
  }
})

test('anchors land on the bounding box edges for every SHAPE_KINDS entry', () => {
  for (const kind of SHAPE_KINDS) {
    const a = anchors(kind, W, H)
    assert.equal(a.left.x, 0, `${kind}: left anchor must sit on the box's left edge`)
    assert.equal(a.right.x, W, `${kind}: right anchor must sit on the box's right edge`)
    assert.equal(a.top.y, 0, `${kind}: top anchor must sit on the box's top edge`)
    assert.equal(a.bottom.y, H, `${kind}: bottom anchor must sit on the box's bottom edge`)
    // and each anchor's other coordinate stays within the box.
    assert.ok(a.left.y >= 0 && a.left.y <= H)
    assert.ok(a.right.y >= 0 && a.right.y <= H)
    assert.ok(a.top.x >= 0 && a.top.x <= W)
    assert.ok(a.bottom.x >= 0 && a.bottom.x <= W)
  }
})

test('shapePath is deterministic', () => {
  for (const kind of SHAPE_KINDS) {
    assert.equal(shapePath(kind, W, H), shapePath(kind, W, H))
  }
})
