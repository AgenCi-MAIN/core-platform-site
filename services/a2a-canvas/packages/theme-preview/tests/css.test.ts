import assert from 'node:assert/strict'
import { test } from 'node:test'
import { REQUIRED_CSS_VARS, tokensToCss } from '../src/css.ts'
import { SAMPLE_THEME } from '../src/sample-theme.ts'

test('tokensToCss declares every required variable exactly once, for both modes', () => {
  for (const mode of ['dark', 'light'] as const) {
    const css = tokensToCss(SAMPLE_THEME, mode)
    for (const varName of REQUIRED_CSS_VARS) {
      const declaration = `${varName}:`
      const count = css.split(declaration).length - 1
      assert.equal(count, 1, `expected ${varName} to be declared exactly once in ${mode} mode CSS, found ${count}`)
    }
  }
})

test('tokensToCss includes component rules for glass, buttons, node shapes, selected state and reduced motion', () => {
  const css = tokensToCss(SAMPLE_THEME, 'dark')
  assert.match(css, /\.glass\s*\{/)
  assert.match(css, /\.btn\s*\{/)
  assert.match(css, /\.node-shape\s*\{/)
  assert.match(css, /\.node\.selected \.node-shape/)
  assert.match(css, /\.node\.selected \.node-keyline/)
  assert.match(css, /prefers-reduced-motion/)
  assert.match(css, /\.toast\s*\{/)
  assert.match(css, /\.status\s*\{/)
})

test('tokensToCss output differs between light and dark mode but keeps the same var names', () => {
  const dark = tokensToCss(SAMPLE_THEME, 'dark')
  const light = tokensToCss(SAMPLE_THEME, 'light')
  assert.notEqual(dark, light)
  for (const varName of REQUIRED_CSS_VARS) {
    assert.ok(light.includes(`${varName}:`))
  }
})
