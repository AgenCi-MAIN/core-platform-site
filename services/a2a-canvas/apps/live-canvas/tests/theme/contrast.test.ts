import { test } from 'node:test'
import assert from 'node:assert/strict'
import { probe } from '../../src/theme/contrast.ts'
import { compositeOver } from '../../src/theme/color.ts'
import { THEMES } from '../../src/theme/themes.ts'
import type { ThemeTokens } from '../../src/contracts.ts'

function obsidian(): ThemeTokens {
  const t = THEMES.find((x) => x.meta.id === 'obsidian-amethyst')
  if (!t) throw new Error('missing obsidian-amethyst fixture')
  return t
}

test('each check\'s background is the colour actually painted', () => {
  const theme = obsidian()
  const result = probe(theme, 'dark')
  const expectedSurface = compositeOver(theme.modes.dark.surface, theme.modes.dark.surfaceAlpha, theme.modes.dark.bg)

  const onSurface = result.checks.filter((c) => c.name.includes('on surface'))
  assert.ok(onSurface.length >= 3)
  for (const c of onSurface) assert.equal(c.background, expectedSurface)

  const textOnBg = result.checks.find((c) => c.name === 'text on bg')
  assert.equal(textOnBg?.background, theme.modes.dark.bg)

  const buttonTextOnAccent = result.checks.find((c) => c.name === 'button text on accent')
  assert.equal(buttonTextOnAccent?.background, theme.modes.dark.accent)
})

test('a check in the 3-4.5 warning band is reported as a warning, not an error', () => {
  const theme = obsidian()
  // Force textMuted to a mid-gray that sits in the 3-4.5 band against the
  // composited dark surface, everything else left alone.
  const patched: ThemeTokens = {
    ...theme,
    modes: { ...theme.modes, dark: { ...theme.modes.dark, textMuted: '#7A7285' } },
  }
  const result = probe(patched, 'dark')
  const mutedCheck = result.checks.find((c) => c.name === 'muted on surface')
  assert.ok(mutedCheck)
  assert.ok(mutedCheck.ratio >= 3 && mutedCheck.ratio < 4.5, `expected a borderline ratio, got ${mutedCheck.ratio}`)
  assert.equal(mutedCheck.passed, false)
  const issue = result.issues.find((i) => i.path === 'modes.dark.textMuted')
  assert.ok(issue)
  assert.equal(issue.severity, 'warning')
  // A warning alone should not fail the overall probe.
  assert.equal(result.passed, true)
})

test('a check below the warning band is reported as an error and fails the probe', () => {
  const theme = obsidian()
  const patched: ThemeTokens = {
    ...theme,
    modes: { ...theme.modes, dark: { ...theme.modes.dark, textMuted: theme.modes.dark.bg } },
  }
  const result = probe(patched, 'dark')
  const issue = result.issues.find((i) => i.path === 'modes.dark.textMuted')
  assert.ok(issue)
  assert.equal(issue.severity, 'error')
  assert.equal(result.passed, false)
})

test('probe defaults to dark mode and stamps the theme id', () => {
  const theme = obsidian()
  const result = probe(theme)
  assert.equal(result.mode, 'dark')
  assert.equal(result.themeId, theme.meta.id)
})
