/**
 * The three built-in theme packs.
 *
 * `charcoal-cyan` is the reference: every value under its dark mode's
 * `bg`, `bgElevated`, `bgSunken`, `surface`, `surfaceAlpha`, `accent`,
 * `focusRing`, `text`, `link`, `textMuted`, `border`, `success`,
 * `warning`/`danger` and `textInverse` is taken verbatim from the owner's
 * visual source of truth, 2026-09-15 (see the comment block at the top of
 * styles.css, which this file must stay in step with): a sparse full-bleed
 * charcoal field with cyan freehand outlines, replacing the earlier
 * purple/amethyst glass treatment entirely. Everything else — palette
 * scales, the light mode, and the two proposed themes — is derived
 * programmatically from a handful of base hues using the helpers in
 * color.ts.
 */
import { mix } from './color.ts'
import { asId } from '../../../../packages/shared/src/ids.ts'
import { THEME_SCHEMA_VERSION } from '../../../../packages/shared/src/theme-tokens.ts'
import type {
  ThemeTokens, PaletteTokens, ColorScale, SemanticColors,
  TypographyTokens, SpacingTokens, RadiusTokens, ShadowTokens, MotionTokens, ComponentTokens, SemanticRef,
} from '../../../../packages/shared/src/theme-tokens.ts'
import type { ThemeId } from '../contracts.ts'

/* ---- shared building blocks -------------------------------------------- */

const WHITE = '#FFFFFF'
const BLACK = '#000000'

/** 50..950 ramp: lighter steps mix toward white, darker steps toward black. */
function buildScale(base: string): ColorScale {
  return {
    '50': mix(base, WHITE, 0.95),
    '100': mix(base, WHITE, 0.88),
    '200': mix(base, WHITE, 0.72),
    '300': mix(base, WHITE, 0.54),
    '400': mix(base, WHITE, 0.28),
    '500': base,
    '600': mix(base, BLACK, 0.12),
    '700': mix(base, BLACK, 0.28),
    '800': mix(base, BLACK, 0.45),
    '900': mix(base, BLACK, 0.64),
    '950': mix(base, BLACK, 0.78),
  }
}

interface PaletteBases {
  primary: string
  secondary: string
  accent: string
  neutral: string
  success: string
  warning: string
  danger: string
  info: string
}

function buildPalette(bases: PaletteBases): PaletteTokens {
  return {
    primary: buildScale(bases.primary),
    secondary: buildScale(bases.secondary),
    accent: buildScale(bases.accent),
    neutral: buildScale(bases.neutral),
    success: buildScale(bases.success),
    warning: buildScale(bases.warning),
    danger: buildScale(bases.danger),
    info: buildScale(bases.info),
  }
}

const FONT_SANS = 'ui-sans-serif, -apple-system, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif'
const FONT_SERIF = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
const FONT_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

function makeTypography(): TypographyTokens {
  return {
    fontFamilies: { sans: FONT_SANS, serif: FONT_SERIF, mono: FONT_MONO },
    sizes: { xs: 0.6875, sm: 0.8125, md: 0.9375, lg: 1.125, xl: 1.375, '2xl': 1.75, '3xl': 2.25, '4xl': 3, '5xl': 3.75 },
    lineHeights: { tight: 1.2, normal: 1.45, relaxed: 1.7 },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    letterSpacing: { tight: '-0.01em', normal: '0', wide: '0.08em' },
  }
}

/** Each step is 0.25rem, matching the reference 8/16/24/32px spacing at steps 2/4/6/8. */
function makeSpacing(): SpacingTokens {
  const u = 0.25
  return {
    '0': 0, '1': 1 * u, '2': 2 * u, '3': 3 * u, '4': 4 * u, '5': 5 * u, '6': 6 * u,
    '8': 8 * u, '10': 10 * u, '12': 12 * u, '16': 16 * u, '20': 20 * u, '24': 24 * u,
  }
}

function makeRadius(): RadiusTokens {
  return { none: 0, sm: 0.5, md: 0.875, lg: 1.25, xl: 1.75, full: 999 }
}

function makeShadow(focusHex: string): ShadowTokens {
  return {
    sm: '0 2px 8px rgb(0 0 0 / 0.25)',
    md: '0 10px 30px rgb(0 0 0 / 0.35)',
    lg: '0 20px 50px rgb(0 0 0 / 0.45)',
    focus: `0 0 0 3px ${focusHex}59`,
  }
}

function makeMotion(): MotionTokens {
  return {
    durations: { fast: 120, base: 200, slow: 320 },
    easings: { standard: 'cubic-bezier(.2,.7,.2,1)', enter: 'cubic-bezier(0,0,.2,1)', exit: 'cubic-bezier(.4,0,1,1)' },
    reducedMotionScale: 0,
  }
}

function makeComponents(hoverLiftPx: number, selectedRing: SemanticRef = 'accent'): ComponentTokens {
  return {
    button: { bg: 'accent', text: 'textInverse', border: 'accent', hoverLiftPx },
    card: { bg: 'surface', border: 'border', radius: 'md', shadow: 'md' },
    input: { bg: 'surface', border: 'border', text: 'text', focus: 'focusRing' },
    lane: { rail: 'surface', title: 'textMuted', border: 'border' },
    workflowCard: { bg: 'surface', border: 'border', selectedRing, keyline: 'focusRing' },
  }
}

/** Small radius + no shadow, matching the sparse charcoal-field outline treatment. */
function makeFlatRadius(): RadiusTokens {
  return { none: 0, sm: 0.25, md: 0.25, lg: 0.5, xl: 0.75, full: 999 }
}

function makeFlatShadow(): ShadowTokens {
  return { sm: 'none', md: 'none', lg: 'none', focus: 'none' }
}

/* ---- charcoal-cyan (reference) --------------------------------------- */

const CHARCOAL_ID: ThemeId = asId<'ThemeId'>('charcoal-cyan')

function charcoalCyanDark(): SemanticColors {
  const bg = '#1F1F1F'
  const accent = '#08B9D5'
  const focusRing = '#22CBE2'
  const text = '#D9F7FB'
  const textMuted = '#A7C6CB'
  const warningDanger = '#E8B86D'
  return {
    bg,
    bgElevated: '#202020',
    bgSunken: '#1A1A1A',
    // No glass: surface is the bg itself, painted at full opacity.
    surface: bg,
    surfaceAlpha: 1,
    surfaceHover: '#2A2A2A',
    // Cyan at low alpha (0.22, matching styles.css's --c-border default),
    // composited over bg into a solid hex.
    border: '#1A4147',
    borderStrong: '#165D68',
    text,
    textMuted,
    textInverse: bg,
    link: focusRing,
    focusRing,
    accent,
    success: accent,
    warning: warningDanger,
    danger: warningDanger,
    info: focusRing,
  }
}

function charcoalCyanLight(): SemanticColors {
  const bg = '#F4FBFC'
  const accent = '#05788A'
  const focusRing = '#147A88'
  const text = '#14282B'
  const textMuted = '#355257'
  const warningDanger = '#8B6E41'
  return {
    bg,
    bgElevated: '#FFFFFF',
    bgSunken: '#EDF3F4',
    surface: bg,
    surfaceAlpha: 1,
    surfaceHover: '#EAF1F2',
    border: '#BFDEE3',
    borderStrong: '#94C7CE',
    text,
    textMuted,
    textInverse: bg,
    link: focusRing,
    focusRing,
    accent,
    success: accent,
    warning: warningDanger,
    danger: warningDanger,
    info: focusRing,
  }
}

function charcoalCyan(): ThemeTokens {
  const dark = charcoalCyanDark()
  return {
    schemaVersion: THEME_SCHEMA_VERSION,
    meta: {
      id: CHARCOAL_ID,
      name: 'Charcoal / Cyan',
      family: 'charcoal',
      version: '1.0.0',
      description: "The owner's visual source of truth: a sparse charcoal field with cyan freehand outlines, no glass or shadow.",
      tags: ['dark', 'cyan', 'reference', 'outline'],
      author: 'owner-canvas-brief',
      createdAt: '2026-09-15T00:00:00.000Z',
      generated: false,
      provenance: 'reference',
    },
    palette: buildPalette({
      primary: dark.accent,
      secondary: dark.focusRing,
      accent: dark.accent,
      neutral: '#6E8A8E',
      success: dark.success,
      warning: dark.warning,
      danger: dark.danger,
      info: dark.info,
    }),
    modes: { dark, light: charcoalCyanLight() },
    typography: makeTypography(),
    spacing: makeSpacing(),
    radius: makeFlatRadius(),
    shadow: makeFlatShadow(),
    motion: makeMotion(),
    components: makeComponents(0, 'focusRing'),
  }
}

/* ---- daylight-slate (proposed light theme) ------------------------------- */

const SLATE_ID: ThemeId = asId<'ThemeId'>('daylight-slate')

function slateLight(): SemanticColors {
  const bg = '#F8FAFC'
  const surface = '#FFFFFF'
  const accent = '#2563EB'
  const text = '#0F172A'
  const textMuted = '#475569'
  return {
    bg,
    bgElevated: '#FFFFFF',
    bgSunken: '#EEF2F7',
    surface,
    surfaceAlpha: 0.82,
    surfaceHover: '#F1F5F9',
    border: '#CBD5E1',
    borderStrong: '#94A3B8',
    text,
    textMuted,
    textInverse: '#FFFFFF',
    link: '#1D4ED8',
    // Darker than the 0.0EA5E9 accent family so a 3:1 ring is legible on a near-white bg.
    focusRing: '#0369A1',
    accent,
    success: '#16A34A',
    warning: '#CA8A04',
    danger: '#DC2626',
    info: '#0284C7',
  }
}

function slateDark(): SemanticColors {
  const bg = '#0F172A'
  const surface = '#1E293B'
  const accent = '#3B82F6'
  const text = '#F1F5F9'
  const textMuted = '#94A3B8'
  return {
    bg,
    bgElevated: '#1E293B',
    bgSunken: '#0B1220',
    surface,
    surfaceAlpha: 0.82,
    surfaceHover: '#263449',
    border: '#334155',
    borderStrong: '#475569',
    text,
    textMuted,
    textInverse: '#0B1220',
    link: '#7DD3FC',
    focusRing: '#38BDF8',
    accent,
    success: '#4ADE80',
    warning: '#FACC15',
    danger: '#F87171',
    info: '#38BDF8',
  }
}

function daylightSlate(): ThemeTokens {
  const light = slateLight()
  return {
    schemaVersion: THEME_SCHEMA_VERSION,
    meta: {
      id: SLATE_ID,
      name: 'Daylight Slate',
      family: 'slate',
      version: '1.0.0',
      description: 'Proposed light companion: slate-blue neutrals, cobalt accent, tuned for daylight screens.',
      tags: ['light', 'blue', 'proposed'],
      author: 'theme-lane',
      createdAt: '2026-09-02T00:00:00.000Z',
      generated: false,
      provenance: 'proposed',
    },
    palette: buildPalette({
      primary: light.accent,
      secondary: '#0EA5E9',
      accent: light.accent,
      neutral: '#64748B',
      success: light.success,
      warning: light.warning,
      danger: light.danger,
      info: light.info,
    }),
    modes: { light, dark: slateDark() },
    typography: makeTypography(),
    spacing: makeSpacing(),
    radius: makeRadius(),
    shadow: makeShadow(light.focusRing),
    motion: makeMotion(),
    components: makeComponents(2),
  }
}

/* ---- high-contrast-mono (proposed, AAA-leaning) -------------------------- */

const MONO_ID: ThemeId = asId<'ThemeId'>('high-contrast-mono')

function monoDark(): SemanticColors {
  return {
    bg: '#000000',
    bgElevated: '#0A0A0A',
    bgSunken: '#000000',
    surface: '#121212',
    surfaceAlpha: 0.92,
    surfaceHover: '#1A1A1A',
    border: '#4D4D4D',
    borderStrong: '#808080',
    text: '#FFFFFF',
    textMuted: '#CCCCCC',
    // White accent means button text must be black for a true 21:1 pairing.
    textInverse: '#000000',
    link: '#FFFFFF',
    focusRing: '#FFFFFF',
    accent: '#FFFFFF',
    success: '#00E676',
    warning: '#FFD600',
    danger: '#FF1744',
    info: '#40C4FF',
  }
}

function monoLight(): SemanticColors {
  return {
    bg: '#FFFFFF',
    bgElevated: '#FAFAFA',
    bgSunken: '#FFFFFF',
    surface: '#EDEDED',
    surfaceAlpha: 0.92,
    surfaceHover: '#E0E0E0',
    border: '#B3B3B3',
    borderStrong: '#808080',
    text: '#000000',
    textMuted: '#333333',
    textInverse: '#FFFFFF',
    link: '#000000',
    focusRing: '#000000',
    accent: '#000000',
    success: '#00701A',
    warning: '#8A6100',
    danger: '#B00020',
    info: '#01579B',
  }
}

function highContrastMono(): ThemeTokens {
  const dark = monoDark()
  return {
    schemaVersion: THEME_SCHEMA_VERSION,
    meta: {
      id: MONO_ID,
      name: 'High Contrast Mono',
      family: 'mono',
      version: '1.0.0',
      description: 'Proposed AAA-leaning theme: pure black/white with the accent equal to the far extreme of bg, for maximum contrast by construction.',
      tags: ['dark', 'light', 'monochrome', 'a11y', 'proposed'],
      author: 'theme-lane',
      createdAt: '2026-09-02T00:00:00.000Z',
      generated: false,
      provenance: 'proposed',
    },
    palette: buildPalette({
      primary: '#808080',
      secondary: '#A6A6A6',
      accent: '#808080',
      neutral: '#808080',
      success: dark.success,
      warning: dark.warning,
      danger: dark.danger,
      info: dark.info,
    }),
    modes: { dark, light: monoLight() },
    typography: makeTypography(),
    spacing: makeSpacing(),
    radius: makeRadius(),
    shadow: makeShadow('#FFFFFF'),
    motion: makeMotion(),
    // No hover lift: high-contrast users often run with reduced motion, and a
    // flat monochrome UI reads state through colour/weight, not movement.
    components: makeComponents(0),
  }
}

/* ---- exports -------------------------------------------------------------- */

export const THEMES: ThemeTokens[] = [charcoalCyan(), daylightSlate(), highContrastMono()]
export const DEFAULT_THEME_ID: ThemeId = CHARCOAL_ID
