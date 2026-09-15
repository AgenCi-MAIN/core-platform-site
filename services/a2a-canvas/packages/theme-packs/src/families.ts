/**
 * Family and variant definitions for the theme pack library. Pure data —
 * no colour math lives here (see `color.ts`), no token assembly (see
 * `generate.ts`). Every family gives `generate.ts` a hue per palette role,
 * a base saturation, a focus-ring hue distinct from its accent, and a few
 * non-colour knobs (font stack, radius style) that give its variants a
 * describable identity beyond "different hue".
 *
 * `obsidian-amethyst` is the one 'reference' family: its hues/saturation
 * are tuned so the *generated* base-variant palette lands close to the
 * owner's Freeform board, and `generate.ts` additionally pins its dark-mode
 * base variant to the reference hexes verbatim (bg/surface/accent/focus/
 * text/muted) rather than trusting the formula to reproduce them exactly.
 * Every other family is 'proposed': this swarm's own design choice.
 */
import type { PaletteRole } from '../../shared/src/theme-tokens.ts'

export type RadiusStyle = 'sharp' | 'soft' | 'round'

export interface FontStack {
  sans: string
  serif: string
  mono: string
}

export interface ColorFamily {
  /** Slug used in ids, file paths and theme names. */
  key: string
  name: string
  description: string
  /** Three or four words a person would use to describe the feeling. */
  mood: string
  provenance: 'reference' | 'proposed'
  /** Base hue (0..360) per palette role, at the family's base saturation. */
  hues: Record<PaletteRole, number>
  /** Base saturation (0..100) for primary/secondary/accent and the semantic roles. */
  saturation: number
  /** Base saturation (0..100) for the neutral role — kept low for a usable UI grey. */
  neutralSaturation: number
  /** Hue (0..360) for the focus ring, deliberately separate from `hues.accent`. */
  focusHue: number
  radiusStyle: RadiusStyle
  fontStack: FontStack
  /** WCAG contrast target for text-on-bg / text-on-surface. Defaults to 4.5 (AA). */
  minContrast?: number
}

export interface ThemeVariant {
  key: 'base' | 'soft' | 'vivid'
  name: string
  description: string
  /** Multiplies every role's base saturation (including neutral), clamped 0..100. */
  saturationMultiplier: number
  darkBgStep: 900 | 950
  darkSurfaceStep: 800 | 900 | 950
  darkAccentStep: 300 | 400 | 500
  darkSurfaceAlpha: number
  lightBgStep: 50 | 100
  lightSurfaceStep: 50 | 100 | 200
  lightSurfaceAlpha: number
  lightAccentStep: 500 | 600 | 700
}

const SYSTEM_SANS = 'ui-sans-serif, -apple-system, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif'
const SYSTEM_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

export const FAMILIES: ColorFamily[] = [
  {
    key: 'obsidian-amethyst',
    name: 'Obsidian / Amethyst',
    description: 'The owner’s Freeform reference: violet glass over near-black, cyan focus.',
    mood: 'moody, focused, after-hours',
    provenance: 'reference',
    hues: { primary: 258, secondary: 189, accent: 258, neutral: 260, success: 158, warning: 45, danger: 2, info: 199 },
    saturation: 68,
    neutralSaturation: 18,
    focusHue: 189,
    radiusStyle: 'soft',
    fontStack: { sans: SYSTEM_SANS, serif: 'ui-serif, Georgia, "Times New Roman", serif', mono: SYSTEM_MONO },
  },
  {
    key: 'daylight-slate',
    name: 'Daylight Slate',
    description: 'A cool, neutral workday palette: slate blue on paper-white, restrained accents.',
    mood: 'crisp, neutral, daylight office',
    provenance: 'proposed',
    hues: { primary: 222, secondary: 176, accent: 217, neutral: 222, success: 152, warning: 38, danger: 350, info: 205 },
    saturation: 42,
    neutralSaturation: 10,
    focusHue: 205,
    radiusStyle: 'sharp',
    fontStack: {
      sans: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"Cascadia Code", Consolas, monospace',
    },
  },
  {
    key: 'ember',
    name: 'Ember',
    description: 'Warm red-orange over charcoal: an urgent, high-energy work surface.',
    mood: 'warm, energetic, urgent',
    provenance: 'proposed',
    hues: { primary: 14, secondary: 27, accent: 9, neutral: 18, success: 150, warning: 40, danger: 355, info: 213 },
    saturation: 72,
    neutralSaturation: 14,
    focusHue: 40,
    radiusStyle: 'sharp',
    fontStack: {
      sans: '"Avenir Next", "Segoe UI", Roboto, sans-serif',
      serif: '"Iowan Old Style", Georgia, serif',
      mono: '"JetBrains Mono", Consolas, monospace',
    },
  },
  {
    key: 'sea-glass',
    name: 'Sea Glass',
    description: 'Muted teal and aqua, low-saturation and coastal, easy on long sessions.',
    mood: 'calm, coastal, muted',
    provenance: 'proposed',
    hues: { primary: 174, secondary: 165, accent: 186, neutral: 195, success: 150, warning: 44, danger: 8, info: 198 },
    saturation: 38,
    neutralSaturation: 12,
    focusHue: 300,
    radiusStyle: 'round',
    fontStack: {
      sans: '"Helvetica Neue", Arial, sans-serif',
      serif: '"Palatino Linotype", Georgia, serif',
      mono: 'Menlo, Consolas, monospace',
    },
  },
  {
    key: 'graphite-mono',
    name: 'Graphite Mono',
    description: 'Near-grayscale with a single cool-blue accent; a technical, minimal instrument panel.',
    mood: 'minimal, monochrome, technical',
    provenance: 'proposed',
    hues: { primary: 220, secondary: 220, accent: 220, neutral: 222, success: 150, warning: 46, danger: 4, info: 210 },
    saturation: 10,
    neutralSaturation: 4,
    focusHue: 210,
    radiusStyle: 'sharp',
    fontStack: {
      sans: '"IBM Plex Sans", "Segoe UI", sans-serif',
      serif: '"IBM Plex Serif", Georgia, serif',
      mono: '"IBM Plex Mono", "SF Mono", monospace',
    },
  },
  {
    key: 'thrive-sky',
    name: 'Thrive Sky',
    description: 'Blue-and-white insurance-agency trust palette: clean, legible, conservative.',
    mood: 'trustworthy, professional, clean',
    provenance: 'proposed',
    hues: { primary: 211, secondary: 96, accent: 205, neutral: 214, success: 152, warning: 40, danger: 354, info: 199 },
    saturation: 58,
    neutralSaturation: 9,
    focusHue: 231,
    radiusStyle: 'soft',
    fontStack: {
      sans: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: 'Consolas, "SF Mono", monospace',
    },
  },
  {
    key: 'sunset',
    name: 'Sunset',
    description: 'Magenta-to-orange golden-hour gradient mood, purple undertone in neutrals.',
    mood: 'vibrant, golden-hour, expressive',
    provenance: 'proposed',
    hues: { primary: 331, secondary: 21, accent: 279, neutral: 300, success: 150, warning: 34, danger: 352, info: 279 },
    saturation: 70,
    neutralSaturation: 16,
    focusHue: 52,
    radiusStyle: 'round',
    fontStack: {
      sans: '"Century Gothic", "Segoe UI", sans-serif',
      serif: 'Baskerville, Georgia, serif',
      mono: 'Menlo, Consolas, monospace',
    },
  },
  {
    key: 'forest',
    name: 'Forest',
    description: 'Deep greens and moss over warm-gray, grounded and low-glare.',
    mood: 'grounded, natural, calm-productive',
    provenance: 'proposed',
    hues: { primary: 142, secondary: 88, accent: 162, neutral: 108, success: 146, warning: 42, danger: 12, info: 178 },
    saturation: 46,
    neutralSaturation: 11,
    focusHue: 78,
    radiusStyle: 'round',
    fontStack: {
      sans: 'Optima, "Segoe UI", sans-serif',
      serif: '"Hoefler Text", Georgia, serif',
      mono: 'Menlo, Consolas, monospace',
    },
  },
  {
    key: 'high-contrast',
    name: 'High Contrast',
    description: 'True black/white with one bold amber accent, tuned for AAA (7:1) legibility.',
    mood: 'accessibility-first, maximum legibility',
    provenance: 'proposed',
    hues: { primary: 48, secondary: 0, accent: 48, neutral: 0, success: 132, warning: 48, danger: 0, info: 220 },
    saturation: 92,
    neutralSaturation: 0,
    focusHue: 190,
    radiusStyle: 'sharp',
    fontStack: { sans: 'Arial, Helvetica, sans-serif', serif: 'Georgia, serif', mono: 'Consolas, monospace' },
    minContrast: 7,
  },
]

export const VARIANTS: ThemeVariant[] = [
  {
    key: 'base',
    name: 'Base',
    description: 'The balanced default expression of the family.',
    saturationMultiplier: 1,
    darkBgStep: 950,
    darkSurfaceStep: 900,
    darkAccentStep: 400,
    darkSurfaceAlpha: 0.82,
    lightBgStep: 50,
    lightSurfaceStep: 100,
    lightSurfaceAlpha: 0.96,
    lightAccentStep: 600,
  },
  {
    key: 'soft',
    name: 'Soft',
    description: 'Desaturated, lighter glass, gentler accents — a quieter read of the family.',
    saturationMultiplier: 0.55,
    darkBgStep: 900,
    darkSurfaceStep: 800,
    darkAccentStep: 300,
    darkSurfaceAlpha: 0.7,
    lightBgStep: 100,
    lightSurfaceStep: 50,
    lightSurfaceAlpha: 0.9,
    lightAccentStep: 500,
  },
  {
    key: 'vivid',
    name: 'Vivid',
    description: 'Saturated, denser glass, punchier accents — the family turned up.',
    saturationMultiplier: 1.4,
    darkBgStep: 950,
    darkSurfaceStep: 950,
    darkAccentStep: 500,
    darkSurfaceAlpha: 0.9,
    lightBgStep: 50,
    lightSurfaceStep: 200,
    lightSurfaceAlpha: 0.99,
    lightAccentStep: 700,
  },
]
