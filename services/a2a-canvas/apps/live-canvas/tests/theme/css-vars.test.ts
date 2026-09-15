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

test('toCssVars renders the reference obsidian dark values exactly', () => {
  const obsidian = THEMES.find((t) => t.meta.id === 'obsidian-amethyst')
  assert.ok(obsidian)
  const vars = toCssVars(obsidian, 'dark')
  assert.equal(vars['--c-bg'], '#11121A')
  assert.equal(vars['--c-surface-rgb'], '36 25 58')
  assert.equal(vars['--surface-alpha'], '0.82')
  assert.equal(vars['--c-accent'], '#A78BFA')
  assert.equal(vars['--c-focus'], '#67E8F9')
  assert.equal(vars['--c-text'], '#F5F3FF')
  assert.equal(vars['--c-muted'], '#C4B5FD')
  assert.equal(vars['--sp-1'], '0.5rem')
  assert.equal(vars['--sp-2'], '1rem')
  assert.equal(vars['--sp-3'], '1.5rem')
  assert.equal(vars['--sp-4'], '2rem')
  assert.equal(vars['--lift'], '-2px')
  assert.equal(vars['--motion-fast'], '120ms')
  assert.equal(vars['--motion-base'], '200ms')
})

test('toCssVars defaults to dark mode', () => {
  const obsidian = THEMES.find((t) => t.meta.id === 'obsidian-amethyst')
  assert.ok(obsidian)
  assert.deepEqual(toCssVars(obsidian), toCssVars(obsidian, 'dark'))
})
