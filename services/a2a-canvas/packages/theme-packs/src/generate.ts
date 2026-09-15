/**
 * Turns a (family, variant) pair into a complete, valid `ThemeTokens`.
 *
 * Palette scales come from `color.ts#generateScale`. Semantic colours are
 * derived per mode from the palette plus variant knobs (which step, which
 * alpha), then `text` is nudged toward the bg/surface's opposite extreme
 * until it clears the contrast floor against both the flat bg and the
 * *composited* surface (surface alpha applied once, per the schema
 * comment) — so a theme this module returns never fails its own contrast
 * rule. `charcoal-cyan`'s base variant is the one exception: its dark
 * mode is pinned to the reference hexes verbatim after the formula runs.
 */
import type {
  ThemeTokens,
  PaletteTokens,
  PaletteRole,
  ScaleStep,
  ColorScale,
  SemanticColors,
  ThemeMode,
  TypographyTokens,
  RadiusTokens,
  ShadowTokens,
  MotionTokens,
  ComponentTokens,
  HexColor,
} from '../../shared/src/theme-tokens.ts'
import { PALETTE_ROLES, SCALE_STEPS, THEME_SCHEMA_VERSION } from '../../shared/src/theme-tokens.ts'
import type { IdFactory, Clock } from '../../shared/src/ids.ts'
import { isoAt } from '../../shared/src/ids.ts'
import type { ColorFamily, ThemeVariant, RadiusStyle } from './families.ts'
import { FAMILIES, VARIANTS } from './families.ts'
import { clamp, generateScale, hslToRgb, formatHex, contrastRatio, compositeOverBackground, colorDistance, rgbToHsl, parseHex } from './color.ts'

const SEMANTIC_ROLES: readonly PaletteRole[] = ['success', 'warning', 'danger', 'info']
const SEMANTIC_SATURATION = 62
const DEFAULT_MIN_CONTRAST = 4.5
const CONTRAST_STEP = 2
const MAX_CONTRAST_ITERATIONS = 60

/** Distance below which two themes are considered near-duplicates (see `distance`). */
export const DEDUPE_THRESHOLD = 0.05

function step(scale: ColorScale, s: ScaleStep): HexColor {
  return scale[String(s) as `${ScaleStep}`]
}

/** Moves `delta` positions along SCALE_STEPS from `from`, clamped to the ends. */
function adjacentStep(from: ScaleStep, delta: number): ScaleStep {
  const idx = SCALE_STEPS.indexOf(from)
  const next = clamp(idx + delta, 0, SCALE_STEPS.length - 1)
  return SCALE_STEPS[next] as ScaleStep
}

function roleSaturation(family: ColorFamily, role: PaletteRole, variant: ThemeVariant): number {
  const base = role === 'neutral' ? family.neutralSaturation : SEMANTIC_ROLES.includes(role) ? SEMANTIC_SATURATION : family.saturation
  return clamp(base * variant.saturationMultiplier, 0, 100)
}

function buildPalette(family: ColorFamily, variant: ThemeVariant): PaletteTokens {
  const palette = {} as PaletteTokens
  for (const role of PALETTE_ROLES) {
    palette[role] = generateScale(family.hues[role], roleSaturation(family, role, variant))
  }
  return palette
}

/**
 * Nudges `startHex`'s lightness toward the mode's bright/dark extreme
 * (white for dark mode, black for light mode) until it clears `target`
 * contrast against both `bg` and `compositedSurface`. Always terminates:
 * pure white/black against any real bg clears 4.5 (worst case ~1:1 at the
 * exact extreme is impossible here because bg/surface are never pure
 * white/black themselves), and the loop is bounded regardless.
 */
function adjustTextForContrast(startHex: HexColor, mode: ThemeMode, bg: HexColor, compositedSurface: HexColor, target: number): HexColor {
  let hex = startHex
  let hsl = rgbToHsl(parseHex(startHex))
  let iterations = 0
  const passes = (): boolean => contrastRatio(hex, bg) >= target && contrastRatio(hex, compositedSurface) >= target
  while (!passes() && iterations < MAX_CONTRAST_ITERATIONS) {
    const nextL = clamp(hsl.l + (mode === 'dark' ? CONTRAST_STEP : -CONTRAST_STEP), 0, 100)
    if (nextL === hsl.l) break // already at the extreme; further iteration cannot help
    hsl = { ...hsl, l: nextL }
    hex = formatHex(hslToRgb(hsl))
    iterations += 1
  }
  return hex
}

function buildDarkMode(family: ColorFamily, variant: ThemeVariant, palette: PaletteTokens, target: number): SemanticColors {
  const neutral = palette.neutral
  const accent = palette.accent
  const surface = step(accent, variant.darkSurfaceStep)
  const neutralBg = step(neutral, variant.darkBgStep)
  // A whisper of the surface's accent hue keeps "soft"/"base"/"vivid" from
  // converging on the same near-black even when the family's neutral is
  // low-saturation (or the two variants land on the same neutral step).
  const bg = variant.bgAccentTint > 0 ? compositeOverBackground(surface, variant.bgAccentTint, neutralBg) : neutralBg
  const bgElevated = compositeOverBackground('#FFFFFF', 0.08, bg)
  const bgSunken = compositeOverBackground('#000000', 0.35, bg)
  const surfaceAlpha = variant.darkSurfaceAlpha
  const compositedSurface = compositeOverBackground(surface, surfaceAlpha, bg)
  const surfaceHover = compositeOverBackground('#FFFFFF', 0.12, surface)
  const border = compositeOverBackground(step(neutral, 500), 0.28, bg)
  const borderStrong = compositeOverBackground(step(neutral, 500), 0.5, bg)
  const text = adjustTextForContrast(step(neutral, 50), 'dark', bg, compositedSurface, target)
  const textMuted = step(neutral, 300)
  const textInverse = step(neutral, 950)
  const accentColor = step(accent, variant.darkAccentStep)
  const link = step(accent, adjacentStep(variant.darkAccentStep, -1))
  // Saturation (not just hue) is tied to the variant so the focus ring —
  // otherwise the one semantic colour with no variant input at all — still
  // separates "soft" from "vivid" within a family.
  const focusRing = formatHex(hslToRgb({ h: family.focusHue, s: clamp(85 * variant.saturationMultiplier, 35, 100), l: 70 }))
  return {
    bg,
    bgElevated,
    bgSunken,
    surface,
    surfaceAlpha,
    surfaceHover,
    border,
    borderStrong,
    text,
    textMuted,
    textInverse,
    link,
    focusRing,
    accent: accentColor,
    success: step(palette.success, variant.darkAccentStep),
    warning: step(palette.warning, variant.darkAccentStep),
    danger: step(palette.danger, variant.darkAccentStep),
    info: step(palette.info, variant.darkAccentStep),
  }
}

function buildLightMode(family: ColorFamily, variant: ThemeVariant, palette: PaletteTokens, target: number): SemanticColors {
  const neutral = palette.neutral
  const accent = palette.accent
  const surface = step(accent, variant.lightSurfaceStep)
  const neutralBg = step(neutral, variant.lightBgStep)
  const bg = variant.bgAccentTint > 0 ? compositeOverBackground(surface, variant.bgAccentTint, neutralBg) : neutralBg
  const bgElevated = compositeOverBackground('#FFFFFF', 0.6, bg)
  const bgSunken = compositeOverBackground('#000000', 0.08, bg)
  const surfaceAlpha = variant.lightSurfaceAlpha
  const compositedSurface = compositeOverBackground(surface, surfaceAlpha, bg)
  const surfaceHover = compositeOverBackground('#000000', 0.06, surface)
  const border = compositeOverBackground(step(neutral, 500), 0.22, bg)
  const borderStrong = compositeOverBackground(step(neutral, 500), 0.42, bg)
  const text = adjustTextForContrast(step(neutral, 950), 'light', bg, compositedSurface, target)
  const textMuted = step(neutral, 500)
  const textInverse = step(neutral, 50)
  const accentColor = step(accent, variant.lightAccentStep)
  const link = step(accent, adjacentStep(variant.lightAccentStep, 1))
  const focusRing = formatHex(hslToRgb({ h: family.focusHue, s: clamp(80 * variant.saturationMultiplier, 35, 100), l: 42 }))
  return {
    bg,
    bgElevated,
    bgSunken,
    surface,
    surfaceAlpha,
    surfaceHover,
    border,
    borderStrong,
    text,
    textMuted,
    textInverse,
    link,
    focusRing,
    accent: accentColor,
    success: step(palette.success, variant.lightAccentStep),
    warning: step(palette.warning, variant.lightAccentStep),
    danger: step(palette.danger, variant.lightAccentStep),
    info: step(palette.info, variant.lightAccentStep),
  }
}

const RADIUS_PRESETS: Record<RadiusStyle, RadiusTokens> = {
  sharp: { none: 0, sm: 2, md: 4, lg: 6, xl: 10, full: 9999 },
  soft: { none: 0, sm: 8, md: 14, lg: 18, xl: 24, full: 9999 },
  round: { none: 0, sm: 10, md: 16, lg: 22, xl: 30, full: 9999 },
}

const STANDARD_SPACING = {
  '0': 0,
  '1': 0.25,
  '2': 0.5,
  '3': 0.75,
  '4': 1,
  '5': 1.25,
  '6': 1.5,
  '8': 2,
  '10': 2.5,
  '12': 3,
  '16': 4,
  '20': 5,
  '24': 6,
}

const STANDARD_MOTION: MotionTokens = {
  durations: { fast: 120, base: 200, slow: 320 },
  easings: {
    standard: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  reducedMotionScale: 0,
}

const STANDARD_COMPONENTS: ComponentTokens = {
  button: { bg: 'accent', text: 'textInverse', border: 'accent', hoverLiftPx: 2 },
  card: { bg: 'surface', border: 'border', radius: 'lg', shadow: 'md' },
  input: { bg: 'bgElevated', border: 'border', text: 'text', focus: 'focusRing' },
  lane: { rail: 'surface', title: 'text', border: 'border' },
  workflowCard: { bg: 'surface', border: 'border', selectedRing: 'accent', keyline: 'focusRing' },
}

function buildTypography(family: ColorFamily): TypographyTokens {
  return {
    fontFamilies: family.fontStack,
    sizes: { xs: 0.75, sm: 0.8125, md: 0.9375, lg: 1.125, xl: 1.25, '2xl': 1.5, '3xl': 1.875, '4xl': 2.25, '5xl': 3 },
    lineHeights: { tight: 1.15, normal: 1.45, relaxed: 1.7 },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    letterSpacing: { tight: '-0.01em', normal: '0em', wide: '0.02em' },
  }
}

function buildShadow(family: ColorFamily): ShadowTokens {
  const focusRgb = hslToRgb({ h: family.focusHue, s: 85, l: 65 })
  return {
    sm: '0 1px 3px rgb(0 0 0 / 0.25)',
    md: '0 6px 16px rgb(0 0 0 / 0.3)',
    lg: '0 10px 30px rgb(0 0 0 / 0.35)',
    focus: `0 0 0 3px rgb(${Math.round(focusRgb.r)} ${Math.round(focusRgb.g)} ${Math.round(focusRgb.b)} / 0.35)`,
  }
}

/** Reference values from the owner's visual source of truth (charcoal-cyan, base, dark mode). */
export const CHARCOAL_CYAN_REFERENCE = {
  bg: '#1F1F1F' as HexColor,
  surface: '#1F1F1F' as HexColor,
  surfaceAlpha: 1,
  accent: '#08B9D5' as HexColor,
  focusRing: '#22CBE2' as HexColor,
  text: '#D9F7FB' as HexColor,
  textMuted: '#A7C6CB' as HexColor,
}

/** Builds one complete ThemeTokens for a (family, variant) pair. Pure given `ids`/`clock`. */
export function buildTheme(family: ColorFamily, variant: ThemeVariant, ids: IdFactory, clock: Clock): ThemeTokens {
  const target = family.minContrast ?? DEFAULT_MIN_CONTRAST
  const palette = buildPalette(family, variant)
  let dark = buildDarkMode(family, variant, palette, target)
  const light = buildLightMode(family, variant, palette, target)

  const isReferenceBase = family.key === 'charcoal-cyan' && variant.key === 'base'
  if (isReferenceBase) {
    dark = { ...dark, ...CHARCOAL_CYAN_REFERENCE }
  }

  const id = ids.theme()
  const createdAt = isoAt(clock)
  return {
    schemaVersion: THEME_SCHEMA_VERSION,
    meta: {
      id,
      name: `${family.name} — ${variant.name}`,
      family: family.key,
      version: '1.0.0',
      description: `${family.description} ${variant.description}`,
      tags: [family.provenance, family.mood, variant.key].flatMap((t) => t.split(', ')),
      author: 'theme-packs generator',
      createdAt,
      generated: true,
      provenance: family.provenance,
    },
    palette,
    modes: { light, dark },
    typography: buildTypography(family),
    spacing: STANDARD_SPACING,
    radius: RADIUS_PRESETS[family.radiusStyle],
    shadow: buildShadow(family),
    motion: STANDARD_MOTION,
    components: STANDARD_COMPONENTS,
  }
}

/** The swatches that define a theme's visual identity, for `distance`/dedupe. */
function identitySwatches(theme: ThemeTokens): HexColor[] {
  return [
    theme.palette.primary['500'],
    theme.palette.secondary['500'],
    theme.palette.accent['500'],
    theme.palette.neutral['500'],
    theme.modes.dark.bg,
    theme.modes.dark.surface,
    theme.modes.dark.accent,
    theme.modes.dark.focusRing,
    theme.modes.light.bg,
    theme.modes.light.accent,
  ]
}

/**
 * Mean normalized RGB distance (0 identical .. 1 max-different) over each
 * theme's identity swatches. Two themes with `distance < DEDUPE_THRESHOLD`
 * are near-duplicates.
 */
export function distance(a: ThemeTokens, b: ThemeTokens): number {
  const sa = identitySwatches(a)
  const sb = identitySwatches(b)
  let sum = 0
  for (let i = 0; i < sa.length; i += 1) {
    sum += colorDistance(sa[i]!, sb[i]!)
  }
  return sum / sa.length
}

/** Every pair of theme indices whose distance falls under `threshold`. */
export function findDuplicates(themes: ThemeTokens[], threshold: number = DEDUPE_THRESHOLD): Array<[number, number]> {
  const pairs: Array<[number, number]> = []
  for (let i = 0; i < themes.length; i += 1) {
    for (let j = i + 1; j < themes.length; j += 1) {
      if (distance(themes[i]!, themes[j]!) < threshold) {
        pairs.push([i, j])
      }
    }
  }
  return pairs
}

/**
 * Builds the full curated set (every family x every variant, in a fixed
 * order) and throws if any pair is a near-duplicate — the generator must
 * never emit a set with two indistinguishable themes in it.
 */
export function buildThemeSet(
  ids: IdFactory,
  clock: Clock,
  families: ColorFamily[] = FAMILIES,
  variants: ThemeVariant[] = VARIANTS,
): ThemeTokens[] {
  const themes: ThemeTokens[] = []
  for (const family of families) {
    for (const variant of variants) {
      themes.push(buildTheme(family, variant, ids, clock))
    }
  }
  const dupes = findDuplicates(themes)
  if (dupes.length > 0) {
    const detail = dupes
      .map(([i, j]) => `${themes[i]!.meta.name} ~ ${themes[j]!.meta.name} (d=${distance(themes[i]!, themes[j]!).toFixed(4)})`)
      .join('; ')
    throw new Error(`theme-packs: near-duplicate themes detected below threshold ${DEDUPE_THRESHOLD}: ${detail}`)
  }
  return themes
}
