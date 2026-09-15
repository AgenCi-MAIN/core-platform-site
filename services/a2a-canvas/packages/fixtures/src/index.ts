/**
 * Public surface of @core/a2a-canvas fixtures. Other packages/apps import
 * from here (or from an individual module) with an explicit .ts extension.
 */
export * from './builders.ts'
export * from './samples.ts'
export * from './a2a-transcripts.ts'
export * from './validate.ts'

import { err, ok } from '../../shared/src/result.ts'
import type { Result } from '../../shared/src/result.ts'
import { validateDoc } from './validate.ts'
import type { CanvasDoc } from '../../../apps/live-canvas/src/contracts.ts'

/**
 * A file reader injected by the caller — `node:fs/promises`'s `readFile`
 * bound to utf8, a browser `fetch`-backed reader, or a test double. Kept
 * injectable (rather than importing `node:fs` here) so this module stays
 * usable from the live canvas app, which may run in a browser.
 */
export type ReadFile = (path: string) => Promise<string> | string

/**
 * Loads and validates one sample by id, reading `samples/<id>.json` through
 * the injected `readFile`. Never throws: a missing file, invalid JSON, or a
 * doc that fails `validateDoc` all come back as `Err`.
 */
export async function loadSample(readFile: ReadFile, id: string): Promise<Result<CanvasDoc, string[]>> {
  const relPath = `samples/${id}.json`
  let text: string
  try {
    text = await readFile(relPath)
  } catch (e) {
    return err([`loadSample("${id}"): could not read ${relPath}: ${e instanceof Error ? e.message : String(e)}`])
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return err([`loadSample("${id}"): invalid JSON in ${relPath}: ${e instanceof Error ? e.message : String(e)}`])
  }

  const result = validateDoc(parsed)
  if (!result.ok) {
    return err(result.error.map((msg) => `loadSample("${id}"): ${msg}`))
  }
  return ok(result.value)
}
