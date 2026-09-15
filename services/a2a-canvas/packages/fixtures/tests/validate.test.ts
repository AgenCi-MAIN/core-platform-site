import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateDoc } from '../src/validate.ts'
import { doc } from '../src/builders.ts'
import { asId } from '../../shared/src/ids.ts'
import type { ThemeId } from '../../shared/src/ids.ts'
import { SAMPLES } from '../src/samples.ts'

/** Signature `assert.ok` gives TS a type guard; helper reads cleaner than inline non-null assertions. */
function defined<T>(value: T | undefined, message: string): T {
  assert.ok(value !== undefined, message)
  return value as T
}

const THEME: ThemeId = asId<'ThemeId'>('theme.test')

function validDoc() {
  return doc(THEME, { seed: 1 }).workflow('W').lane('L').node('source', 'A').node('sink', 'B').edge('A', 'B').build()
}

test('accepts every shipped sample fixture', () => {
  for (const fixture of SAMPLES) {
    const result = validateDoc(fixture.doc)
    assert.equal(result.ok, true, result.ok ? '' : `${fixture.id}: ${result.error.join('; ')}`)
  }
})

test('a well-formed doc built by the DSL validates', () => {
  const result = validateDoc(validDoc())
  assert.equal(result.ok, true)
})

test('rejects non-objects', () => {
  for (const bad of [null, undefined, 42, 'x', [], true]) {
    const result = validateDoc(bad)
    assert.equal(result.ok, false)
  }
})

test('rejects the wrong version', () => {
  const d = { ...validDoc(), version: 2 }
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('doc.version')))
})

test('rejects an edge pointing at a node id that does not exist', () => {
  const d = validDoc()
  const wf = defined(d.workflows[0], 'workflow')
  const target = defined(wf.cards[0], 'card A')
  wf.edges.push({ id: asId<'EdgeId'>('edge_ghost'), from: asId<'CardId'>('card_ghost'), to: target.id })
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('.from')))
})

test('rejects an unknown node kind', () => {
  const d = validDoc()
  const card = d.workflows[0]?.cards[0]
  assert.ok(card)
  // @ts-expect-error deliberately invalid kind to exercise the runtime check
  card.kind = 'not-a-real-kind'
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('unknown node kind')))
})

test('rejects an unknown shape', () => {
  const d = validDoc()
  const card = d.workflows[0]?.cards[0]
  assert.ok(card)
  // @ts-expect-error deliberately invalid shape to exercise the runtime check
  card.shape = 'octagon'
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('unknown shape')))
})

test('rejects a lane whose workflowId does not match its parent workflow', () => {
  const d = validDoc()
  const lane = d.workflows[0]?.lanes[0]
  assert.ok(lane)
  // @ts-expect-error deliberately wrong branded id to exercise the runtime check
  lane.workflowId = 'wf_someone_else'
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('workflowId')))
})

test('rejects a cycle', () => {
  const d = doc(THEME, { seed: 2 }).workflow('W').lane('L').node('source', 'A').node('transform', 'B').node('sink', 'C').edge('A', 'B').edge('B', 'C').build()
  const wf = defined(d.workflows[0], 'workflow')
  const cardC = defined(wf.cards[2], 'card C')
  const cardA = defined(wf.cards[0], 'card A')
  wf.edges.push({ id: asId<'EdgeId'>('edge_back'), from: cardC.id, to: cardA.id }) // C -> A closes the loop
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('cycle')))
})

test('rejects duplicate ids anywhere in the doc', () => {
  const d = validDoc()
  const cards = d.workflows[0]?.cards
  assert.ok(cards && cards[0] && cards[1])
  cards[1].id = cards[0].id
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('duplicate id')))
})

test('a self-loop (A -> A) is reported as a cycle', () => {
  const d = doc(THEME, { seed: 6 }).workflow('W').lane('L').node('source', 'A').build()
  const wf = defined(d.workflows[0], 'workflow')
  const card = defined(wf.cards[0], 'card A')
  wf.edges.push({ id: asId<'EdgeId'>('edge_self'), from: card.id, to: card.id })
  const result = validateDoc(d)
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('cycle')))
})
