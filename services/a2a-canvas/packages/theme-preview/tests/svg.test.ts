import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NODE_SHAPE_KINDS, circleShape, curvedConnector, diamondShape, hexagonShape, pentagonShape, rectShape, roundedShape, shapeByKind } from '../src/svg.ts'

test('every node shape kind produces a self-closing SVG element with the shape class', () => {
  for (const kind of NODE_SHAPE_KINDS) {
    const markup = shapeByKind(kind, 100, 100, 80, 60)
    assert.match(markup, /^<(rect|circle|polygon)\b/)
    assert.match(markup, /class="node-shape"/)
    assert.match(markup, /\/>$/)
  }
})

test('NODE_SHAPE_KINDS lists exactly the six required shapes', () => {
  assert.deepEqual([...NODE_SHAPE_KINDS].sort(), ['circle', 'diamond', 'hexagon', 'pentagon', 'rect', 'rounded'].sort())
})

test('pentagon has 5 points and hexagon has 6', () => {
  const countPoints = (markup: string): number => {
    const match = /points="([^"]*)"/.exec(markup)
    return match ? match[1].trim().split(/\s+/).length : 0
  }
  assert.equal(countPoints(pentagonShape(0, 0, 10)), 5)
  assert.equal(countPoints(hexagonShape(0, 0, 10)), 6)
})

test('diamond has 4 points', () => {
  const match = /points="([^"]*)"/.exec(diamondShape(0, 0, 20, 20))
  assert.equal(match?.[1].trim().split(/\s+/).length, 4)
})

test('curvedConnector returns a curved path and an arrowhead polygon', () => {
  const markup = curvedConnector(0, 0, 100, 40)
  assert.match(markup, /<path class="connector" d="M 0 0 Q [^"]+ 100 40" \/>/)
  assert.match(markup, /<polygon class="connector-arrow"/)
})

test('curvedConnector honours custom class names', () => {
  const markup = curvedConnector(0, 0, 50, 50, { className: 'connector active', arrowClassName: 'connector-arrow special' })
  assert.match(markup, /class="connector active"/)
  assert.match(markup, /class="connector-arrow special"/)
})

test('shape builders are pure and deterministic', () => {
  assert.equal(rectShape(1, 2, 3, 4), rectShape(1, 2, 3, 4))
  assert.equal(roundedShape(1, 2, 3, 4), roundedShape(1, 2, 3, 4))
  assert.equal(circleShape(1, 2, 3), circleShape(1, 2, 3))
  assert.equal(curvedConnector(0, 0, 10, 10), curvedConnector(0, 0, 10, 10))
})
