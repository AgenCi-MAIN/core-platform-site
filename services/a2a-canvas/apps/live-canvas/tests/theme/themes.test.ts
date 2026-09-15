import { test } from 'node:test'
import assert from 'node:assert/strict'
import { THEMES, DEFAULT_THEME_ID } from '../../src/theme/themes.ts'
import { probe } from '../../src/theme/contrast.ts'
import { PALETTE_ROLES, SCALE_STEPS } from '../../../../packages/shared/src/theme-tokens.ts'

const HEX7 = /^#[0-9A-F]{6}$/

test('THEMES has exactly the three required packs with the right provenance', () => {
  assert.equal(THEMES.length, 3)
  const byId = new Map(THEMES.map((t) => [t.meta.id, t]))
  assert.equal(byId.get('obsidian-amethyst')?.meta.provenance, 'reference')
  assert.equal(byId.get('daylight-slate')?.meta.provenance, 'proposed')
  assert.equal(byId.get('high-contrast-mono')?.meta.provenance, 'proposed')
  assert.equal(DEFAULT_THEME_ID, 'obsidian-amethyst')
})

test('the obsidian reference values are verbatim in dark mode', () => {
  const obsidian = THEMES.find((t) => t.meta.id === 'obsidian-amethyst')
  assert.ok(obsidian)
  const dark = obsidian.modes.dark
  assert.equal(dark.bg, '#11121A')
  assert.equal(dark.surface, '#24193A')
  assert.equal(dark.surfaceAlpha, 0.82)
  assert.equal(dark.accent, '#A78BFA')
  assert.equal(dark.focusRing, '#67E8F9')
  assert.equal(dark.text, '#F5F3FF')
  assert.equal(dark.textMuted, '#C4B5FD')
  assert.equal(obsidian.components.button.hoverLiftPx, 2)
  assert.equal(obsidian.components.workflowCard.selectedRing, 'accent')
  assert.equal(obsidian.components.workflowCard.keyline, 'focusRing')
  // spacing 8/16/24/32px live at the 2/4/6/8 steps (0.25rem per step)
  assert.equal(obsidian.spacing['2'], 0.5)
  assert.equal(obsidian.spacing['4'], 1)
  assert.equal(obsidian.spacing['6'], 1.5)
  assert.equal(obsidian.spacing['8'], 2)
})

test('the obsidian reference theme passes the probe in dark mode with zero error-severity issues', () => {
  const obsidian = THEMES.find((t) => t.meta.id === 'obsidian-amethyst')
  assert.ok(obsidian)
  const result = probe(obsidian, 'dark')
  const errors = result.issues.filter((i) => i.severity === 'error')
  assert.deepEqual(errors, [])
  assert.equal(result.passed, true)
  assert.equal(result.checks.length, 7)
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
