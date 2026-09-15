import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCssVars } from '../../src/theme/css-vars.ts'
import { THEMES } from '../../src/theme/themes.ts'
import { CSS_VARS } from '../../src/contracts.ts'

const EXPECTED = [...CSS_VARS].sort()

test('toCssVars returns exactly the CSS_VARS keys for every theme and both modes', () => {
  for (const t of THEMES) {
    for (const mode of ['light', 'dark'] as const) {
      const vars = toCssVars(t, mode)
      const keys = Object.keys(vars).sort()
      assert.deepEqual(keys, EXPECTED, `theme ${t.meta.id} mode ${mode}`)
      for (const key of keys) {
        assert.equal(typeof vars[key as keyof typeof vars], 'string', `${t.meta.id} ${mode} ${key} should be a string`)
        assert.notEqual(vars[key as keyof typeof vars], '', `${t.meta.id} ${mode} ${key} should not be empty`)
      }
    }
  }
})

test('toCssVars renders the reference charcoal-cyan dark values exactly', () => {
  const charcoal = THEMES.find((t) => t.meta.id === 'charcoal-cyan')
  assert.ok(charcoal)
  const vars = toCssVars(charcoal, 'dark')
  assert.equal(vars['--c-bg'], '#1F1F1F')
  assert.equal(vars['--c-surface-rgb'], '31 31 31')
  assert.equal(vars['--surface-alpha'], '1')
  assert.equal(vars['--c-accent'], '#08B9D5')
  assert.equal(vars['--c-focus'], '#22CBE2')
  assert.equal(vars['--c-text'], '#D9F7FB')
  assert.equal(vars['--sp-1'], '0.5rem')
  assert.equal(vars['--sp-2'], '1rem')
  assert.equal(vars['--sp-3'], '1.5rem')
  assert.equal(vars['--sp-4'], '2rem')
  assert.equal(vars['--lift'], '-0px')
  assert.equal(vars['--shadow'], 'none')
  assert.equal(vars['--motion-fast'], '120ms')
  assert.equal(vars['--motion-base'], '200ms')
})

test('toCssVars defaults to dark mode', () => {
  const charcoal = THEMES.find((t) => t.meta.id === 'charcoal-cyan')
  assert.ok(charcoal)
  assert.deepEqual(toCssVars(charcoal), toCssVars(charcoal, 'dark'))
})
