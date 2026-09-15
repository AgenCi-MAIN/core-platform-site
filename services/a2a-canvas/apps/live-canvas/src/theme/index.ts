/**
 * Public surface of the theme module: the ThemeApi the shell/runtime/other
 * modules call, and the theme maker panel.
 */
import { THEMES } from './themes.ts'
import { withOverrides } from './merge.ts'
import { probe } from './contrast.ts'
import { toCssVars, apply } from './css-vars.ts'
import { mountThemePanel } from './panel.ts'
import type { ThemeApi, ThemeId } from '../contracts.ts'

export { THEMES, DEFAULT_THEME_ID } from './themes.ts'
export { mountThemePanel }

export function createThemeApi(): ThemeApi {
  return {
    list: () => THEMES.slice(),
    get: (id: ThemeId) => THEMES.find((t) => t.meta.id === id),
    withOverrides: (base, patch) => withOverrides(base, patch),
    apply: (tokens, opts) => apply(tokens, opts),
    probe: (tokens, mode) => probe(tokens, mode),
    toCssVars: (tokens, mode) => toCssVars(tokens, mode),
  }
}
