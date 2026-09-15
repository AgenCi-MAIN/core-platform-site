/**
 * Pure deep-merge for theme tokens. `withOverrides` never mutates its
 * arguments and always returns a fully-cloned object, so a theme pulled
 * from THEMES (or a previously-merged result) can never be corrupted by
 * downstream code holding a reference to it.
 *
 * Arrays are replaced wholesale by the patch, never merged element-wise.
 */
import type { ThemeTokens, ThemePatch } from '../contracts.ts'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.slice() as unknown as T
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value)) out[key] = cloneValue(value[key])
    return out as unknown as T
  }
  return value
}

function mergeValue(baseVal: unknown, patchVal: unknown): unknown {
  if (patchVal === undefined) return cloneValue(baseVal)
  if (Array.isArray(patchVal)) return patchVal.slice()
  if (isPlainObject(patchVal)) {
    if (isPlainObject(baseVal)) {
      const out: Record<string, unknown> = {}
      const keys = new Set([...Object.keys(baseVal), ...Object.keys(patchVal)])
      for (const key of keys) out[key] = mergeValue(baseVal[key], patchVal[key])
      return out
    }
    return cloneValue(patchVal)
  }
  return patchVal
}

/** Deep-merges `patch` onto `base`, returning a brand-new object tree. */
export function withOverrides(base: ThemeTokens, patch?: ThemePatch): ThemeTokens {
  return mergeValue(base, patch ?? {}) as ThemeTokens
}
