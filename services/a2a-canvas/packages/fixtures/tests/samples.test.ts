import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SAMPLES } from '../src/samples.ts'
import { validateDoc } from '../src/validate.ts'

test('there are between 8 and 12 sample fixtures', () => {
  assert.ok(SAMPLES.length >= 8 && SAMPLES.length <= 12, `expected 8..12 fixtures, got ${SAMPLES.length}`)
})

test('every fixture has a non-empty id, title, description and a doc', () => {
  for (const fixture of SAMPLES) {
    assert.ok(fixture.id.length > 0, 'id')
    assert.ok(fixture.title.length > 0, `title for ${fixture.id}`)
    assert.ok(fixture.description.length > 0, `description for ${fixture.id}`)
    assert.ok(fixture.doc, `doc for ${fixture.id}`)
  }
})

test('fixture ids are unique', () => {
  const ids = SAMPLES.map((f) => f.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every fixture validates', () => {
  for (const fixture of SAMPLES) {
    const result = validateDoc(fixture.doc)
    assert.equal(result.ok, true, result.ok ? '' : `${fixture.id}: ${result.error.join('; ')}`)
  }
})

test('fixture shapes are meaningfully different (edge/card ratio + lane count vary)', () => {
  const shapes = SAMPLES.map((f) => {
    const wf = f.doc.workflows[0]
    if (!wf) throw new Error(`${f.id}: no workflow`)
    return { id: f.id, lanes: wf.lanes.length, cards: wf.cards.length, edges: wf.edges.length }
  })
  // at least one single-lane and one multi-lane fixture
  assert.ok(shapes.some((s) => s.lanes === 1), 'expected a single-lane fixture')
  assert.ok(shapes.some((s) => s.lanes >= 2), 'expected a multi-lane fixture')
  // not every fixture is the same size — real shape variety, not a template stamped out N times
  const cardCounts = new Set(shapes.map((s) => s.cards))
  assert.ok(cardCounts.size > 1, 'expected fixtures of different sizes')
})

test('the stress fixture has at least 40 nodes across at least 4 lanes', () => {
  const stress = SAMPLES.find((f) => f.id === 'layout-stress-4-lane')
  assert.ok(stress, 'layout-stress-4-lane fixture must exist')
  const wf = stress.doc.workflows[0]
  assert.ok(wf, 'stress fixture has a workflow')
  assert.ok(wf.cards.length >= 40, `expected >=40 nodes, got ${wf.cards.length}`)
  assert.ok(wf.lanes.length >= 4, `expected >=4 lanes, got ${wf.lanes.length}`)
})

test('the cross-lane-drag-scenario fixture has exactly two lanes and a cross-lane edge', () => {
  const fixture = SAMPLES.find((f) => f.id === 'cross-lane-drag-scenario')
  assert.ok(fixture, 'cross-lane-drag-scenario fixture must exist')
  const wf = fixture.doc.workflows[0]
  assert.ok(wf)
  assert.equal(wf.lanes.length, 2)
  const laneOf = new Map(wf.cards.map((c) => [c.id, c.laneId]))
  const crossesLanes = wf.edges.some((e) => laneOf.get(e.from) !== laneOf.get(e.to))
  assert.ok(crossesLanes, 'expected at least one edge to cross the lane boundary')
})

test('the theme-forge-variants fixture hands off from one lane into two other lanes', () => {
  const fixture = SAMPLES.find((f) => f.id === 'theme-forge-variants')
  assert.ok(fixture, 'theme-forge-variants fixture must exist')
  const wf = fixture.doc.workflows[0]
  assert.ok(wf)
  assert.ok(wf.lanes.length >= 3, `expected >=3 lanes, got ${wf.lanes.length}`)
  const handoff = wf.cards.find((c) => c.kind === 'a2a-handoff')
  assert.ok(handoff, 'expected an a2a-handoff node')
  const outgoing = wf.edges.filter((e) => e.from === handoff.id)
  const laneOf = new Map(wf.cards.map((c) => [c.id, c.laneId]))
  const targetLanes = new Set(outgoing.map((e) => laneOf.get(e.to)))
  assert.ok(targetLanes.size >= 2, 'expected the handoff to fan out into at least two different lanes')
})
