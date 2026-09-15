import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createIdFactory, fixedClock } from '../../shared/src/ids.ts'
import { FAMILIES, VARIANTS } from '../src/families.ts'
import { buildTheme, buildThemeSet, distance, findDuplicates, DEDUPE_THRESHOLD, CHARCOAL_CYAN_REFERENCE } from '../src/generate.ts'
import { validateTheme } from '../src/validate.ts'
import { contrastRatio, compositeOverBackground } from '../src/color.ts'

const clock = fixedClock(Date.parse('2026-09-15T14:00:00.000Z'))

function freshIds(): ReturnType<typeof createIdFactory> {
  return createIdFactory(20260915)
}

test('theme count is between 24 and 32 (10 families x 3 variants = 30)', () => {
  assert.equal(FAMILIES.length, 10)
  assert.equal(VARIANTS.length, 3)
  const total = FAMILIES.length * VARIANTS.length
  assert.ok(total >= 24 && total <= 32, `expected 24..32 themes, got ${total}`)
})

test('every family has a distinct key and covers all 8 palette roles with a hue', () => {
  const keys = new Set(FAMILIES.map((f) => f.key))
  assert.equal(keys.size, FAMILIES.length, 'family keys must be unique')
  for (const family of FAMILIES) {
    for (const role of ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info'] as const) {
      assert.equal(typeof family.hues[role], 'number', `${family.key}.hues.${role} must be a hue number`)
    }
  }
})

test('buildTheme produces a ThemeTokens that validates for every family x variant', () => {
  const ids = freshIds()
  for (const family of FAMILIES) {
    for (const variant of VARIANTS) {
      const theme = buildTheme(family, variant, ids, clock)
      const result = validateTheme(theme)
      assert.equal(
        result.ok,
        true,
        `theme ${theme.meta.name} failed validation: ${result.ok ? '' : JSON.stringify(result.error, null, 2)}`,
      )
      assert.equal(theme.meta.generated, true)
      assert.equal(theme.meta.provenance, family.provenance)
      assert.equal(theme.meta.family, family.key)
    }
  }
})

test('text-on-bg and text-on-composited-surface clear the contrast floor in both modes, for every theme', () => {
  const ids = freshIds()
  for (const family of FAMILIES) {
    for (const variant of VARIANTS) {
      const theme = buildTheme(family, variant, ids, clock)
      const target = family.minContrast ?? 4.5
      for (const mode of ['light', 'dark'] as const) {
        const semantic = theme.modes[mode]
        const compositedSurface = compositeOverBackground(semantic.surface, semantic.surfaceAlpha, semantic.bg)
        const onBg = contrastRatio(semantic.text, semantic.bg)
        const onSurface = contrastRatio(semantic.text, compositedSurface)
        assert.ok(onBg >= target, `${theme.meta.name} ${mode}: text-on-bg contrast ${onBg.toFixed(2)} below ${target}`)
        assert.ok(onSurface >= target, `${theme.meta.name} ${mode}: text-on-surface contrast ${onSurface.toFixed(2)} below ${target}`)
      }
    }
  }
})

test('high-contrast family targets AAA (7:1), stricter than the 4.5 floor', () => {
  const family = FAMILIES.find((f) => f.key === 'high-contrast')
  assert.ok(family)
  assert.equal(family.minContrast, 7)
})

test('no two themes in the full set are within the dedupe threshold', () => {
  const ids = freshIds()
  const themes = buildThemeSet(ids, clock)
  const dupes = findDuplicates(themes, DEDUPE_THRESHOLD)
  assert.deepEqual(dupes, [], `found near-duplicate themes: ${dupes.map(([i, j]) => `${themes[i]!.meta.name} ~ ${themes[j]!.meta.name}`).join('; ')}`)
})

test('distance is 0 for a theme against itself and positive for two different families', () => {
  const ids = freshIds()
  const a = buildTheme(FAMILIES[0]!, VARIANTS[0]!, ids, clock)
  const b = buildTheme(FAMILIES[1]!, VARIANTS[0]!, ids, clock)
  assert.equal(distance(a, a), 0)
  assert.ok(distance(a, b) >= DEDUPE_THRESHOLD)
})

test('charcoal-cyan base variant carries the reference hexes verbatim in dark mode', () => {
  const ids = freshIds()
  const charcoal = FAMILIES.find((f) => f.key === 'charcoal-cyan')
  const base = VARIANTS.find((v) => v.key === 'base')
  assert.ok(charcoal && base)
  const theme = buildTheme(charcoal, base, ids, clock)
  assert.equal(theme.meta.provenance, 'reference')
  assert.equal(theme.modes.dark.bg, CHARCOAL_CYAN_REFERENCE.bg)
  assert.equal(theme.modes.dark.surface, CHARCOAL_CYAN_REFERENCE.surface)
  assert.equal(theme.modes.dark.surfaceAlpha, CHARCOAL_CYAN_REFERENCE.surfaceAlpha)
  assert.equal(theme.modes.dark.accent, CHARCOAL_CYAN_REFERENCE.accent)
  assert.equal(theme.modes.dark.focusRing, CHARCOAL_CYAN_REFERENCE.focusRing)
  assert.equal(theme.modes.dark.text, CHARCOAL_CYAN_REFERENCE.text)
  assert.equal(theme.modes.dark.textMuted, CHARCOAL_CYAN_REFERENCE.textMuted)
  // Exact literal check too, independent of the constant, so a future edit
  // to CHARCOAL_CYAN_REFERENCE can't silently drift from the owner's brief.
  assert.equal(theme.modes.dark.bg, '#1F1F1F')
  assert.equal(theme.modes.dark.surface, '#1F1F1F')
  assert.equal(theme.modes.dark.accent, '#08B9D5')
  assert.equal(theme.modes.dark.focusRing, '#22CBE2')
  assert.equal(theme.modes.dark.text, '#D9F7FB')
  assert.equal(theme.modes.dark.textMuted, '#A7C6CB')
})

test('charcoal-cyan soft/vivid variants do NOT carry the verbatim reference (they are distinct expressions)', () => {
  const ids = freshIds()
  const charcoal = FAMILIES.find((f) => f.key === 'charcoal-cyan')!
  for (const key of ['soft', 'vivid'] as const) {
    const variant = VARIANTS.find((v) => v.key === key)!
    const theme = buildTheme(charcoal, variant, ids, clock)
    assert.notEqual(theme.modes.dark.bg, CHARCOAL_CYAN_REFERENCE.bg)
  }
})

test('obsidian-amethyst is now a proposed family (superseded reference)', () => {
  const obsidian = FAMILIES.find((f) => f.key === 'obsidian-amethyst')
  assert.ok(obsidian)
  assert.equal(obsidian.provenance, 'proposed')
})

test('buildTheme is pure and reproducible given the same ids/clock inputs', () => {
  const family = FAMILIES.find((f) => f.key === 'ember')!
  const variant = VARIANTS.find((v) => v.key === 'vivid')!
  const themeA = buildTheme(family, variant, createIdFactory(1), clock)
  const themeB = buildTheme(family, variant, createIdFactory(1), clock)
  assert.deepEqual(themeA, themeB)
})
