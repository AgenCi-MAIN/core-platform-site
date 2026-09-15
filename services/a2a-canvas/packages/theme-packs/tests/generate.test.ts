import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createIdFactory, fixedClock } from '../../shared/src/ids.ts'
import { FAMILIES, VARIANTS } from '../src/families.ts'
import { buildTheme, buildThemeSet, distance, findDuplicates, DEDUPE_THRESHOLD, OBSIDIAN_AMETHYST_REFERENCE } from '../src/generate.ts'
import { validateTheme } from '../src/validate.ts'
import { contrastRatio, compositeOverBackground } from '../src/color.ts'

const clock = fixedClock(Date.parse('2026-09-15T14:00:00.000Z'))

function freshIds(): ReturnType<typeof createIdFactory> {
  return createIdFactory(20260915)
}

test('theme count is between 24 and 32 (9 families x 3 variants = 27)', () => {
  assert.equal(FAMILIES.length, 9)
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

test('obsidian-amethyst base variant carries the reference hexes verbatim in dark mode', () => {
  const ids = freshIds()
  const obsidian = FAMILIES.find((f) => f.key === 'obsidian-amethyst')
  const base = VARIANTS.find((v) => v.key === 'base')
  assert.ok(obsidian && base)
  const theme = buildTheme(obsidian, base, ids, clock)
  assert.equal(theme.meta.provenance, 'reference')
  assert.equal(theme.modes.dark.bg, OBSIDIAN_AMETHYST_REFERENCE.bg)
  assert.equal(theme.modes.dark.surface, OBSIDIAN_AMETHYST_REFERENCE.surface)
  assert.equal(theme.modes.dark.surfaceAlpha, OBSIDIAN_AMETHYST_REFERENCE.surfaceAlpha)
  assert.equal(theme.modes.dark.accent, OBSIDIAN_AMETHYST_REFERENCE.accent)
  assert.equal(theme.modes.dark.focusRing, OBSIDIAN_AMETHYST_REFERENCE.focusRing)
  assert.equal(theme.modes.dark.text, OBSIDIAN_AMETHYST_REFERENCE.text)
  assert.equal(theme.modes.dark.textMuted, OBSIDIAN_AMETHYST_REFERENCE.textMuted)
  // Exact literal check too, independent of the constant, so a future edit
  // to OBSIDIAN_AMETHYST_REFERENCE can't silently drift from the board.
  assert.equal(theme.modes.dark.bg, '#11121A')
  assert.equal(theme.modes.dark.surface, '#24193A')
  assert.equal(theme.modes.dark.accent, '#A78BFA')
  assert.equal(theme.modes.dark.focusRing, '#67E8F9')
  assert.equal(theme.modes.dark.text, '#F5F3FF')
  assert.equal(theme.modes.dark.textMuted, '#C4B5FD')
})

test('obsidian-amethyst soft/vivid variants do NOT carry the verbatim reference (they are distinct expressions)', () => {
  const ids = freshIds()
  const obsidian = FAMILIES.find((f) => f.key === 'obsidian-amethyst')!
  for (const key of ['soft', 'vivid'] as const) {
    const variant = VARIANTS.find((v) => v.key === key)!
    const theme = buildTheme(obsidian, variant, ids, clock)
    assert.notEqual(theme.modes.dark.bg, OBSIDIAN_AMETHYST_REFERENCE.bg)
  }
})

test('buildTheme is pure and reproducible given the same ids/clock inputs', () => {
  const family = FAMILIES.find((f) => f.key === 'ember')!
  const variant = VARIANTS.find((v) => v.key === 'vivid')!
  const themeA = buildTheme(family, variant, createIdFactory(1), clock)
  const themeB = buildTheme(family, variant, createIdFactory(1), clock)
  assert.deepEqual(themeA, themeB)
})
