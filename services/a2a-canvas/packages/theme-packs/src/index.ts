/**
 * Public surface of `@core/theme-packs`, plus reader-injected loaders so
 * the same code can load themes under Node (`fs.readFile`) or in the
 * browser (`fetch(...).then(r => r.text())`) — this module never touches
 * `fs` or `fetch` itself.
 */
import type { ThemeTokens } from '../../shared/src/theme-tokens.ts'
import type { Result } from '../../shared/src/result.ts'
import { ok, err } from '../../shared/src/result.ts'
import { validateTheme } from './validate.ts'

export * from './color.ts'
export * from './families.ts'
export * from './generate.ts'
export * from './validate.ts'

export interface ThemeIndexEntry {
  id: string
  name: string
  family: string
  variant: string
  provenance: 'reference' | 'proposed' | 'generated'
  /** Path relative to the directory holding index.json, e.g. "ember/base.json". */
  path: string
}

export interface ThemeIndex {
  generatedAt: string
  count: number
  themes: ThemeIndexEntry[]
}

/** Reads and parses a file, given some injected byte source (fs, fetch, a test double). */
export type FileReader = (path: string) => Promise<string>

function isThemeIndexEntry(v: unknown): v is ThemeIndexEntry {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.family === 'string' &&
    typeof r.variant === 'string' &&
    (r.provenance === 'reference' || r.provenance === 'proposed' || r.provenance === 'generated') &&
    typeof r.path === 'string'
  )
}

function isThemeIndex(v: unknown): v is ThemeIndex {
  if (typeof v !== 'object' || v === null) return false
  const r = v as Record<string, unknown>
  return typeof r.generatedAt === 'string' && typeof r.count === 'number' && Array.isArray(r.themes) && r.themes.every(isThemeIndexEntry)
}

/** Loads and parses `themes/index.json` via the injected reader. */
export async function loadIndex(readFile: FileReader, path = 'index.json'): Promise<Result<ThemeIndex, string>> {
  let raw: string
  try {
    raw = await readFile(path)
  } catch (cause) {
    return err(`theme-packs: could not read index at "${path}": ${String(cause)}`)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (cause) {
    return err(`theme-packs: index at "${path}" is not valid JSON: ${String(cause)}`)
  }
  if (!isThemeIndex(parsed)) {
    return err(`theme-packs: index at "${path}" is not a well-formed ThemeIndex`)
  }
  return ok(parsed)
}

/** Loads, parses and validates one theme JSON file via the injected reader. */
export async function loadTheme(readFile: FileReader, path: string): Promise<Result<ThemeTokens, string[]>> {
  let raw: string
  try {
    raw = await readFile(path)
  } catch (cause) {
    return err([`theme-packs: could not read theme at "${path}": ${String(cause)}`])
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (cause) {
    return err([`theme-packs: theme at "${path}" is not valid JSON: ${String(cause)}`])
  }
  const result = validateTheme(parsed)
  if (!result.ok) {
    return err(result.error.map((issue) => `${issue.path}: ${issue.message}`))
  }
  return ok(result.value)
}
