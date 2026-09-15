import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadSample } from '../src/index.ts'
import { SAMPLES } from '../src/samples.ts'
import type { ReadFile } from '../src/index.ts'

function readFileFromSamples(): ReadFile {
  const byPath = new Map(SAMPLES.map((f) => [`samples/${f.id}.json`, JSON.stringify(f.doc)]))
  return async (path: string) => {
    const text = byPath.get(path)
    if (text === undefined) throw new Error(`ENOENT: ${path}`)
    return text
  }
}

test('loadSample reads, parses and validates a known fixture by id', async () => {
  const fixture = SAMPLES[0]
  assert.ok(fixture)
  const result = await loadSample(readFileFromSamples(), fixture.id)
  assert.equal(result.ok, true)
  assert.ok(result.ok && result.value.workflows.length > 0)
})

test('loadSample resolves every shipped fixture id', async () => {
  const reader = readFileFromSamples()
  for (const fixture of SAMPLES) {
    const result = await loadSample(reader, fixture.id)
    assert.equal(result.ok, true, result.ok ? '' : `${fixture.id}: ${result.error.join('; ')}`)
  }
})

test('loadSample surfaces a read failure as an Err, not a throw', async () => {
  const result = await loadSample(readFileFromSamples(), 'does-not-exist')
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error[0]?.includes('does-not-exist'))
})

test('loadSample surfaces invalid JSON as an Err, not a throw', async () => {
  const reader: ReadFile = async () => '{ not valid json'
  const result = await loadSample(reader, 'broken')
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error[0]?.includes('invalid JSON'))
})

test('loadSample surfaces a structurally invalid doc as an Err', async () => {
  const reader: ReadFile = async () => JSON.stringify({ version: 2, workflows: [], themeId: 't', viewport: { x: 0, y: 0, zoom: 1 } })
  const result = await loadSample(reader, 'wrong-version')
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.error.some((m) => m.includes('version')))
})

test('loadSample accepts a synchronous ReadFile too', async () => {
  const fixture = SAMPLES[0]
  assert.ok(fixture)
  const text = JSON.stringify(fixture.doc)
  const reader: ReadFile = (_path: string) => text
  const result = await loadSample(reader, fixture.id)
  assert.equal(result.ok, true)
})
