#!/usr/bin/env node
/**
 * Builds the full theme pack set and writes it to disk:
 *   packages/theme-packs/themes/<family>/<variant>.json
 *   packages/theme-packs/themes/index.json
 *
 * Deterministic: the id factory is seeded and the clock is fixed, so two
 * runs (even into different directories) produce byte-identical files —
 * `tests/build-packs.test.ts` asserts this by building into two temp dirs.
 *
 * Run from services/a2a-canvas:
 *   node packages/theme-packs/scripts/build-packs.ts
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ThemeTokens } from '../../shared/src/theme-tokens.ts'
import { createIdFactory, fixedClock, isoAt } from '../../shared/src/ids.ts'
import { FAMILIES, VARIANTS } from '../src/families.ts'
import { buildTheme, findDuplicates, distance, DEDUPE_THRESHOLD } from '../src/generate.ts'
import { validateTheme } from '../src/validate.ts'
import type { ThemeIndex, ThemeIndexEntry } from '../src/index.ts'

/** Fixed so the whole build is reproducible byte-for-byte across runs. */
export const BUILD_SEED = 20260915
export const BUILD_CLOCK_ISO = '2026-09-15T14:00:00.000Z'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DEFAULT_THEMES_DIR = join(__dirname, '..', 'themes')

export interface BuildResult {
  count: number
  themes: ThemeTokens[]
  indexPath: string
}

/** Builds the full theme set and writes it (themes + index.json) under `outDir`. */
export async function buildPacks(outDir: string = DEFAULT_THEMES_DIR): Promise<BuildResult> {
  const ids = createIdFactory(BUILD_SEED)
  const clock = fixedClock(Date.parse(BUILD_CLOCK_ISO))

  // Built directly over FAMILIES x VARIANTS (fixed order) rather than via
  // buildThemeSet, so each theme's on-disk path comes straight from the
  // family/variant keys that produced it instead of being reverse-parsed
  // out of a display name.
  const built: Array<{ familyKey: string; variantKey: string; theme: ThemeTokens }> = []
  for (const family of FAMILIES) {
    for (const variant of VARIANTS) {
      built.push({ familyKey: family.key, variantKey: variant.key, theme: buildTheme(family, variant, ids, clock) })
    }
  }
  const themes = built.map((b) => b.theme)

  const dupes = findDuplicates(themes, DEDUPE_THRESHOLD)
  if (dupes.length > 0) {
    const detail = dupes
      .map(([i, j]) => `${themes[i]!.meta.name} ~ ${themes[j]!.meta.name} (d=${distance(themes[i]!, themes[j]!).toFixed(4)})`)
      .join('; ')
    throw new Error(`theme-packs build: near-duplicate themes below threshold ${DEDUPE_THRESHOLD}: ${detail}`)
  }

  const invalid: string[] = []
  for (const theme of themes) {
    const result = validateTheme(theme)
    if (!result.ok) {
      invalid.push(`${theme.meta.name}: ${result.error.map((i) => `${i.path} (${i.code})`).join(', ')}`)
    }
  }
  if (invalid.length > 0) {
    throw new Error(`theme-packs build: ${invalid.length} theme(s) failed validation:\n${invalid.join('\n')}`)
  }

  const entries: ThemeIndexEntry[] = []
  for (const { familyKey, variantKey, theme } of built) {
    const relPath = `${familyKey}/${variantKey}.json`
    const absPath = join(outDir, relPath)
    await mkdir(dirname(absPath), { recursive: true })
    await writeFile(absPath, `${JSON.stringify(theme, null, 2)}\n`, 'utf8')
    entries.push({
      id: theme.meta.id,
      name: theme.meta.name,
      family: familyKey,
      variant: variantKey,
      provenance: theme.meta.provenance,
      path: relPath,
    })
  }

  const index: ThemeIndex = { generatedAt: isoAt(clock), count: entries.length, themes: entries }
  const indexPath = join(outDir, 'index.json')
  await mkdir(outDir, { recursive: true })
  await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8')

  return { count: entries.length, themes, indexPath }
}

async function main(): Promise<void> {
  const outDir = process.argv[2] ?? DEFAULT_THEMES_DIR
  const result = await buildPacks(outDir)
  // eslint-disable-next-line no-console
  console.log(`theme-packs: wrote ${result.count} themes to ${outDir}`)
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  main().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
