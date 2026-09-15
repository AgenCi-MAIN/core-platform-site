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
import { buildThemeSet } from '../src/generate.ts'
import { validateTheme } from '../src/validate.ts'
import type { ThemeIndex, ThemeIndexEntry } from '../src/index.ts'

/** Fixed so the whole build is reproducible byte-for-byte across runs. */
export const BUILD_SEED = 20260915
export const BUILD_CLOCK_ISO = '2026-09-15T14:00:00.000Z'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DEFAULT_THEMES_DIR = join(__dirname, '..', 'themes')

function themePath(theme: ThemeTokens): string {
  return `${theme.meta.family}/${themeVariantSlug(theme)}.json`
}

/** `meta.name` is "Family — Variant"; recover the variant slug from it. */
function themeVariantSlug(theme: ThemeTokens): string {
  const parts = theme.meta.name.split('—')
  const variantName = (parts[parts.length - 1] ?? '').trim()
  return variantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export interface BuildResult {
  count: number
  themes: ThemeTokens[]
  indexPath: string
}

/** Builds the full theme set and writes it (themes + index.json) under `outDir`. */
export async function buildPacks(outDir: string = DEFAULT_THEMES_DIR): Promise<BuildResult> {
  const ids = createIdFactory(BUILD_SEED)
  const clock = fixedClock(Date.parse(BUILD_CLOCK_ISO))
  const themes = buildThemeSet(ids, clock)

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
  for (const theme of themes) {
    const relPath = themePath(theme)
    const absPath = join(outDir, relPath)
    await mkdir(dirname(absPath), { recursive: true })
    await writeFile(absPath, `${JSON.stringify(theme, null, 2)}\n`, 'utf8')
    entries.push({
      id: theme.meta.id,
      name: theme.meta.name,
      family: theme.meta.family,
      variant: themeVariantSlug(theme),
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
