import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createIdFactory, fixedClock } from '../../shared/src/ids.ts'
import { FAMILIES, VARIANTS } from '../src/families.ts'
import { buildTheme } from '../src/generate.ts'
import { validateTheme } from '../src/validate.ts'

const clock = fixedClock(Date.parse('2026-09-15T14:00:00.000Z'))

function sampleTheme(): unknown {
  return JSON.parse(JSON.stringify(buildTheme(FAMILIES[0]!, VARIANTS[0]!, createIdFactory(1), clock)))
}

test('validateTheme accepts a well-formed generated theme', () => {
  const result = validateTheme(sampleTheme())
  assert.equal(result.ok, true)
})

test('validateTheme rejects non-objects', () => {
  for (const bad of [null, undefined, 42, 'theme', [1, 2, 3]]) {
    const result = validateTheme(bad)
    assert.equal(result.ok, false)
  }
})

test('validateTheme rejects a wrong schemaVersion', () => {
  const theme = sampleTheme() as Record<string, unknown>
  theme.schemaVersion = '0.9.0'
  const result = validateTheme(theme)
  assert.equal(result.ok, false)
  if (!result.ok) assert.ok(result.error.some((i) => i.code === 'invalid_schema_version'))
})

test('validateTheme rejects a malformed hex colour', () => {
  const theme = sampleTheme() as any
  theme.modes.dark.bg = 'not-a-color'
  const result = validateTheme(theme)
  assert.equal(result.ok, false)
  if (!result.ok) assert.ok(result.error.some((i) => i.path === 'modes.dark.bg'))
})

test('validateTheme rejects a missing scale step', () => {
  const theme = sampleTheme() as any
  delete theme.palette.primary['500']
  const result = validateTheme(theme)
  assert.equal(result.ok, false)
  if (!result.ok) assert.ok(result.error.some((i) => i.path === 'palette.primary.500'))
})

test('validateTheme rejects surfaceAlpha outside 0..1', () => {
  const theme = sampleTheme() as any
  theme.modes.light.surfaceAlpha = 1.5
  const result = validateTheme(theme)
  assert.equal(result.ok, false)
  if (!result.ok) assert.ok(result.error.some((i) => i.code === 'invalid_alpha'))

  const theme2 = sampleTheme() as any
  theme2.modes.dark.surfaceAlpha = -0.1
  const result2 = validateTheme(theme2)
  assert.equal(result2.ok, false)
})

test('validateTheme rejects the contrast rule when text is too close to bg', () => {
  const theme = sampleTheme() as any
  theme.modes.dark.text = theme.modes.dark.bg
  const result = validateTheme(theme)
  assert.equal(result.ok, false)
  if (!result.ok) assert.ok(result.error.some((i) => i.code === 'low_contrast_bg'))
})

test('validateTheme rejects an invalid component semantic ref', () => {
  const theme = sampleTheme() as any
  theme.components.button.bg = 'not-a-real-semantic-key'
  const result = validateTheme(theme)
  assert.equal(result.ok, false)
  if (!result.ok) assert.ok(result.error.some((i) => i.code === 'invalid_semantic_ref'))
})

test('validateTheme rejects a missing required top-level key', () => {
  const theme = sampleTheme() as Record<string, unknown>
  delete theme.typography
  const result = validateTheme(theme)
  assert.equal(result.ok, false)
})

test('validateTheme accepts every generated theme in the full set', () => {
  const ids = createIdFactory(20260915)
  for (const family of FAMILIES) {
    for (const variant of VARIANTS) {
      const theme = buildTheme(family, variant, ids, clock)
      const result = validateTheme(theme)
      assert.equal(result.ok, true, `${theme.meta.name}: ${result.ok ? '' : JSON.stringify(result.error)}`)
    }
  }
})
