/**
 * The design-token contract shared by the theme engine, the theme maker UI,
 * the theme packs, the preview renderer and the live canvas.
 *
 * A theme is data: palette scales, per-mode semantic colours, typography,
 * spacing, radius, shadow, motion and component references. Nothing here
 * depends on the DOM, so the same object validates in node tests and renders
 * in the browser.
 */
import type { ThemeId } from './ids.ts'

export const THEME_SCHEMA_VERSION = '1.0.0'

export const THEME_MODES = ['light', 'dark'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

/** Hex colour like "#A78BFA" (6 digits) — alpha is expressed separately. */
export type HexColor = string

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ScaleStep = (typeof SCALE_STEPS)[number]
export type ColorScale = Record<`${ScaleStep}`, HexColor>

export const PALETTE_ROLES = ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'danger', 'info'] as const
export type PaletteRole = (typeof PALETTE_ROLES)[number]
export type PaletteTokens = Record<PaletteRole, ColorScale>

export interface SemanticColors {
  bg: HexColor
  bgElevated: HexColor
  bgSunken: HexColor
  /** Surface colour before opacity is applied; see `surfaceAlpha`. */
  surface: HexColor
  /** 0..1 — glass opacity applied ONCE when compositing surface over bg. */
  surfaceAlpha: number
  surfaceHover: HexColor
  border: HexColor
  borderStrong: HexColor
  text: HexColor
  textMuted: HexColor
  textInverse: HexColor
  link: HexColor
  focusRing: HexColor
  accent: HexColor
  success: HexColor
  warning: HexColor
  danger: HexColor
  info: HexColor
}

export interface TypographyTokens {
  fontFamilies: { sans: string; serif: string; mono: string }
  /** rem values */
  sizes: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number; '3xl': number; '4xl': number; '5xl': number }
  lineHeights: { tight: number; normal: number; relaxed: number }
  weights: { regular: number; medium: number; semibold: number; bold: number }
  letterSpacing: { tight: string; normal: string; wide: string }
}

/** rem values for a 0..24 spacing scale (index = step). */
export type SpacingTokens = Record<'0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24', number>

export interface RadiusTokens {
  none: number
  sm: number
  md: number
  lg: number
  xl: number
  full: number
}

export interface ShadowTokens {
  sm: string
  md: string
  lg: string
  focus: string
}

export interface MotionTokens {
  durations: { fast: number; base: number; slow: number }
  easings: { standard: string; enter: string; exit: string }
  /** Multiplier applied when the user prefers reduced motion (usually 0). */
  reducedMotionScale: number
}

/** A component token is a record of semantic references, not raw colours. */
export type SemanticRef = keyof SemanticColors
export interface ComponentTokens {
  button: { bg: SemanticRef; text: SemanticRef; border: SemanticRef; hoverLiftPx: number }
  card: { bg: SemanticRef; border: SemanticRef; radius: keyof RadiusTokens; shadow: keyof ShadowTokens }
  input: { bg: SemanticRef; border: SemanticRef; text: SemanticRef; focus: SemanticRef }
  lane: { rail: SemanticRef; title: SemanticRef; border: SemanticRef }
  workflowCard: { bg: SemanticRef; border: SemanticRef; selectedRing: SemanticRef; keyline: SemanticRef }
}

export interface ThemeMeta {
  id: ThemeId
  name: string
  family: string
  version: string
  description: string
  tags: string[]
  author: string
  createdAt: string
  /** true when produced by a generator rather than authored by hand. */
  generated: boolean
  /** 'reference' = taken from the owner's Freeform board; 'proposed' = our choice. */
  provenance: 'reference' | 'proposed' | 'generated'
}

export interface ThemeTokens {
  schemaVersion: typeof THEME_SCHEMA_VERSION
  meta: ThemeMeta
  palette: PaletteTokens
  modes: Record<ThemeMode, SemanticColors>
  typography: TypographyTokens
  spacing: SpacingTokens
  radius: RadiusTokens
  shadow: ShadowTokens
  motion: MotionTokens
  components: ComponentTokens
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
export type ThemePatch = DeepPartial<Omit<ThemeTokens, 'schemaVersion'>>

export interface ThemeIssue {
  code: string
  /** JSON-pointer-ish path, e.g. "modes.dark.text" */
  path: string
  message: string
  severity: 'error' | 'warning'
}
