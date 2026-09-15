import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withOverrides } from '../../src/theme/merge.ts'
import { THEMES } from '../../src/theme/themes.ts'
import type { ThemeTokens } from '../../src/contracts.ts'

function base(): ThemeTokens {
  const t = THEMES[0]
  if (!t) throw new Error('no themes')
  return t
}

test('withOverrides returns a new object and does not mutate the base', () => {
  const theme = base()
  const originalTags = theme.meta.tags
  const originalTagsSnapshot = [...originalTags]
  const originalAccent = theme.modes.dark.accent

  const merged = withOverrides(theme, { meta: { tags: ['x', 'y'] }, modes: { dark: { accent: '#123456' } } })

  assert.notEqual(merged, theme)
  assert.notEqual(merged.meta, theme.meta)
  assert.notEqual(merged.modes, theme.modes)
  assert.notEqual(merged.modes.dark, theme.modes.dark)

  // base is untouched
  assert.deepEqual(theme.meta.tags, originalTagsSnapshot)
  assert.equal(theme.modes.dark.accent, originalAccent)

  // merged reflects the patch
  assert.deepEqual(merged.meta.tags, ['x', 'y'])
  assert.equal(merged.modes.dark.accent, '#123456')

  // fields not touched by the patch survive from the base
  assert.equal(merged.modes.dark.bg, theme.modes.dark.bg)
  assert.equal(merged.modes.light.accent, theme.modes.light.accent)
})

test('arrays are replaced wholesale, never merged element-wise', () => {
  const theme = base()
  assert.ok(theme.meta.tags.length > 1, 'fixture should start with more than one tag')

  const merged = withOverrides(theme, { meta: { tags: ['solo'] } })
  assert.deepEqual(merged.meta.tags, ['solo'])
  assert.notEqual(merged.meta.tags.length, theme.meta.tags.length + 1)
})

test('withOverrides with no patch clones without changing values', () => {
  const theme = base()
  const merged = withOverrides(theme)
  assert.notEqual(merged, theme)
  assert.deepEqual(merged, theme)
})

test('mutating a merge result never reaches the base (deep clone, not shared refs)', () => {
  const theme = base()
  const merged = withOverrides(theme, { modes: { dark: { accent: '#FF0000' } } })
  // Mutate a subtree the patch did not touch.
  merged.modes.light.accent = '#000000'
  assert.notEqual(theme.modes.light.accent, '#000000')
})
