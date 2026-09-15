import { test } from 'node:test'
import assert from 'node:assert/strict'
import { THEMES, DEFAULT_THEME_ID } from '../../src/theme/themes.ts'
import { probe } from '../../src/theme/contrast.ts'
import { PALETTE_ROLES, SCALE_STEPS } from '../../../../packages/shared/src/theme-tokens.ts'

const HEX7 = /^#[0-9A-F]{6}$/

test('THEMES has exactly the three required packs with the right provenance', () => {
  assert.equal(THEMES.length, 3)
  const find = (id: string) => THEMES.find((t) => t.meta.id === id)
  assert.equal(find('charcoal-cyan')?.meta.provenance, 'reference')
  assert.equal(find('daylight-slate')?.meta.provenance, 'proposed')
  assert.equal(find('high-contrast-mono')?.meta.provenance, 'proposed')
  assert.equal(DEFAULT_THEME_ID, 'charcoal-cyan')
})

test('the charcoal-cyan reference values are verbatim in dark mode', () => {
  const charcoal = THEMES.find((t) => t.meta.id === 'charcoal-cyan')
  assert.ok(charcoal)
  const dark = charcoal.modes.dark
  assert.equal(dark.bg, '#1F1F1F')
  assert.equal(dark.surface, '#1F1F1F')
  assert.equal(dark.surfaceAlpha, 1)
  assert.equal(dark.accent, '#08B9D5')
  assert.equal(dark.focusRing, '#22CBE2')
  assert.equal(dark.text, '#D9F7FB')
  assert.equal(charcoal.components.button.hoverLiftPx, 0)
  assert.equal(charcoal.components.workflowCard.selectedRing, 'focusRing')
  assert.equal(charcoal.components.workflowCard.keyline, 'focusRing')
  // spacing 8/16/24/32px live at the 2/4/6/8 steps (0.25rem per step)
  assert.equal(charcoal.spacing['2'], 0.5)
  assert.equal(charcoal.spacing['4'], 1)
  assert.equal(charcoal.spacing['6'], 1.5)
  assert.equal(charcoal.spacing['8'], 2)
})

test('the charcoal-cyan textMuted keeps >=4.5:1 contrast on the charcoal bg', () => {
  const charcoal = THEMES.find((t) => t.meta.id === 'charcoal-cyan')
  assert.ok(charcoal)
  const dark = charcoal.modes.dark
  const check = probe(charcoal, 'dark').checks.find((c) => c.name === 'muted on surface')
  assert.ok(check)
  assert.ok(check.ratio >= 4.5, `expected textMuted ${dark.textMuted} to be >=4.5:1 on bg, got ${check.ratio}`)
})

test('the charcoal-cyan reference has no shadow and a small radius', () => {
  const charcoal = THEMES.find((t) => t.meta.id === 'charcoal-cyan')
  assert.ok(charcoal)
  assert.equal(charcoal.shadow.sm, 'none')
  assert.equal(charcoal.shadow.md, 'none')
  assert.equal(charcoal.shadow.lg, 'none')
  assert.equal(charcoal.shadow.focus, 'none')
  assert.ok(charcoal.radius.sm <= charcoal.radius.md)
  assert.ok(charcoal.radius.md < charcoal.radius.lg)
})

test('every theme passes the probe in dark mode with zero error-severity issues', () => {
  for (const t of THEMES) {
    const result = probe(t, 'dark')
    const errors = result.issues.filter((i) => i.severity === 'error')
    assert.deepEqual(errors, [], `theme ${t.meta.id} dark mode should have no contrast errors`)
    assert.equal(result.passed, true, `theme ${t.meta.id} dark mode should pass the probe`)
    assert.equal(result.checks.length, 7)
  }
})

test('the charcoal-cyan reference theme passes every check in dark mode', () => {
  const charcoal = THEMES.find((t) => t.meta.id === 'charcoal-cyan')
  assert.ok(charcoal)
  const result = probe(charcoal, 'dark')
  for (const check of result.checks) {
    assert.ok(check.passed, `expected "${check.name}" to pass (ratio ${check.ratio}, needs ${check.required})`)
  }
})

test('every theme has all PALETTE_ROLES with all 11 scale steps as 7-char hex', () => {
  for (const t of THEMES) {
    assert.equal(Object.keys(t.palette).sort().join(','), [...PALETTE_ROLES].sort().join(','), `theme ${t.meta.id} palette roles`)
    for (const role of PALETTE_ROLES) {
      const scale = t.palette[role]
      const steps = Object.keys(scale)
      assert.equal(steps.length, SCALE_STEPS.length, `theme ${t.meta.id} role ${role} step count`)
      for (const step of SCALE_STEPS) {
        const value = scale[`${step}`]
        assert.ok(value, `theme ${t.meta.id} role ${role} step ${step} present`)
        assert.match(value, HEX7, `theme ${t.meta.id} role ${role} step ${step} is 7-char hex`)
      }
    }
  }
})

test('every theme has both modes fully populated', () => {
  for (const t of THEMES) {
    for (const mode of ['light', 'dark'] as const) {
      const sem = t.modes[mode]
      for (const [key, value] of Object.entries(sem)) {
        if (key === 'surfaceAlpha') {
          assert.equal(typeof value, 'number', `theme ${t.meta.id} ${mode}.${key}`)
          continue
        }
        assert.match(String(value), HEX7, `theme ${t.meta.id} ${mode}.${key} is 7-char hex`)
      }
    }
  }
})
