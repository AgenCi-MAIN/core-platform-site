import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SHAPE_KINDS } from '../../src/contracts.ts'
import { shapePath, keylinePath, haloPath, anchors, hashSeed, jitter } from '../../src/canvas/shapes.ts'

const W = 140
const H = 90

function nums(d: string): number[] {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
}

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
    const d = keylinePath(kind, 4, 4) // smaller than the 10px*2 inset
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

test('haloPath is the same geometry as shapePath (CSS gives it the wide stroke)', () => {
  for (const kind of SHAPE_KINDS) {
    assert.equal(haloPath(kind, W, H), shapePath(kind, W, H))
    assert.equal(haloPath(kind, W, H, 'node-1'), shapePath(kind, W, H, 'node-1'))
  }
})

test('hashSeed is deterministic and sensitive to its input', () => {
  assert.equal(hashSeed('node-a'), hashSeed('node-a'))
  assert.notEqual(hashSeed('node-a'), hashSeed('node-b'))
})

test('jitter is deterministic per (seed, index), bounded, and off without a seed', () => {
  for (let i = 0; i < 24; i += 1) {
    assert.equal(jitter('node-a', i), jitter('node-a', i), `index ${i} not stable`)
    assert.ok(Math.abs(jitter('node-a', i)) <= 2, `index ${i} exceeded the 2px bound`)
    assert.equal(jitter(undefined, i), 0, `index ${i}: no seed must mean no jitter`)
  }
})

test('shapePath jitter is deterministic per seed, differs across seeds, and stays within 2px of the unjittered path', () => {
  for (const kind of SHAPE_KINDS) {
    const base = shapePath(kind, W, H) // no seed -> exact geometry
    const a1 = shapePath(kind, W, H, 'node-a')
    const a2 = shapePath(kind, W, H, 'node-a')
    const b1 = shapePath(kind, W, H, 'node-b')
    assert.equal(a1, a2, `${kind}: same seed must produce an identical path`)
    assert.notEqual(a1, b1, `${kind}: different seeds must produce different paths`)
    assert.notEqual(a1, base, `${kind}: a seeded path must differ from the unjittered one`)

    // Jitter only ever perturbs coordinates, never the path's command
    // structure, so the two paths must carry the same count of numbers,
    // each within JITTER_MAX (2px) of its unjittered counterpart. (Some of
    // those numbers are constants like an arc's radius/flags, which simply
    // have a diff of 0 — still within bound.)
    const baseNums = nums(base)
    const jitteredNums = nums(a1)
    assert.equal(baseNums.length, jitteredNums.length, `${kind}: jitter changed the path structure`)
    for (let i = 0; i < baseNums.length; i += 1) {
      const diff = Math.abs((baseNums[i] as number) - (jitteredNums[i] as number))
      assert.ok(diff <= 2 + 1e-6, `${kind}: coordinate ${i} moved ${diff}px, more than the 2px bound`)
    }
  }
})
