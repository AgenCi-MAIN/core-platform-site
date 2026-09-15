/**
 * Builds the on-disk preview gallery: previews/gallery-dark.html,
 * previews/gallery-light.html, and one previews/<theme-id>.html per theme.
 *
 * Reads packages/theme-packs/themes/index.json if it exists (another lane
 * generates it) and falls back to the built-in SAMPLE_THEME when it's
 * absent, unreadable, or empty — this script must never fail just because
 * that lane hasn't landed yet.
 *
 * Run: node scripts/build-gallery.ts (from packages/theme-preview).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderGallery, renderPreview } from '../src/render.ts'
import { SAMPLE_THEME } from '../src/sample-theme.ts'
import type { ThemeTokens } from '../../shared/src/theme-tokens.ts'

const here = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(here, '..')
const previewsDir = join(packageRoot, 'previews')
const themePacksIndex = resolve(packageRoot, '..', 'theme-packs', 'themes', 'index.json')
const themePacksDir = dirname(themePacksIndex)

function looksLikeThemeTokens(value: unknown): value is ThemeTokens {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.schemaVersion === 'string' &&
    typeof v.meta === 'object' &&
    v.meta !== null &&
    typeof v.palette === 'object' &&
    v.palette !== null &&
    typeof v.modes === 'object' &&
    v.modes !== null &&
    typeof v.typography === 'object' &&
    v.typography !== null &&
    typeof v.spacing === 'object' &&
    v.spacing !== null &&
    typeof v.radius === 'object' &&
    v.radius !== null &&
    typeof v.shadow === 'object' &&
    v.shadow !== null &&
    typeof v.motion === 'object' &&
    v.motion !== null &&
    typeof v.components === 'object' &&
    v.components !== null
  )
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/**
 * Loads themes from packages/theme-packs/themes/index.json. The index's
 * exact shape belongs to another lane, so entries are handled defensively:
 * an inline ThemeTokens object, a {file}/{path} reference, or a bare string
 * path are all accepted; anything else (or anything that fails to parse or
 * validate) is skipped with a warning rather than aborting the build.
 */
function loadPackThemes(): ThemeTokens[] {
  if (!existsSync(themePacksIndex)) {
    console.log(`[theme-preview] no theme pack index at ${themePacksIndex}; using the built-in sample theme.`)
    return []
  }

  let entries: unknown
  try {
    entries = readJson(themePacksIndex)
  } catch (error) {
    console.warn(`[theme-preview] could not parse ${themePacksIndex}: ${(error as Error).message}`)
    return []
  }
  // The theme-packs index is an object { generatedAt, count, themes: [...] };
  // a bare array is accepted too.
  if (entries && typeof entries === 'object' && !Array.isArray(entries) && Array.isArray((entries as { themes?: unknown }).themes)) {
    entries = (entries as { themes: unknown[] }).themes
  }
  if (!Array.isArray(entries)) {
    console.warn(`[theme-preview] ${themePacksIndex} is not an array; ignoring.`)
    return []
  }

  const themes: ThemeTokens[] = []
  for (const entry of entries) {
    try {
      if (looksLikeThemeTokens(entry)) {
        themes.push(entry)
        continue
      }
      const record = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : null
      const ref =
        typeof entry === 'string'
          ? entry
          : typeof record?.file === 'string'
            ? record.file
            : typeof record?.path === 'string'
              ? record.path
              : null
      if (!ref) {
        console.warn('[theme-preview] skipping an unrecognised theme index entry.')
        continue
      }
      const filePath = resolve(themePacksDir, ref)
      const loaded = readJson(filePath)
      if (looksLikeThemeTokens(loaded)) {
        themes.push(loaded)
      } else {
        console.warn(`[theme-preview] skipping ${filePath}: does not look like ThemeTokens.`)
      }
    } catch (error) {
      console.warn(`[theme-preview] skipping a theme index entry: ${(error as Error).message}`)
    }
  }
  return themes
}

function safeFileStem(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]+/g, '-')
}

function main(): void {
  const packThemes = loadPackThemes()
  const themes = packThemes.length > 0 ? packThemes : [SAMPLE_THEME]

  mkdirSync(previewsDir, { recursive: true })

  writeFileSync(join(previewsDir, 'gallery-dark.html'), renderGallery(themes, 'dark'))
  writeFileSync(join(previewsDir, 'gallery-light.html'), renderGallery(themes, 'light'))

  for (const theme of themes) {
    const stem = safeFileStem(theme.meta.id)
    writeFileSync(join(previewsDir, `${stem}.html`), renderPreview(theme, { mode: 'dark', title: theme.meta.name }))
  }

  const source = packThemes.length > 0 ? 'theme pack index' : 'built-in sample theme'
  console.log(`[theme-preview] wrote ${2 + themes.length} file(s) to ${previewsDir} for ${themes.length} theme(s) (source: ${source}).`)
}

main()
