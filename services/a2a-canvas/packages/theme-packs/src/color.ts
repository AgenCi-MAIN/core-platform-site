/**
 * Minimal colour math for the theme-packs generator: hex <-> RGB <-> HSL,
 * 11-step scale generation, WCAG relative luminance / contrast, alpha
 * compositing, and a plain RGB distance used by the dedupe check.
 *
 * Pure and dependency-free on purpose — this module has no knowledge of
 * `ThemeTokens`; `generate.ts` is where colour math meets the token shape.
 */
import type { HexColor, ColorScale, ScaleStep } from '../../shared/src/theme-tokens.ts'
import { SCALE_STEPS } from '../../shared/src/theme-tokens.ts'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeHue(h: number): number {
  const x = h % 360
  return x < 0 ? x + 360 : x
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Type guard: is this a well-formed 6-digit hex colour string? */
export function isHexColor(value: unknown): value is HexColor {
  return typeof value === 'string' && HEX_RE.test(value)
}

/** Parses "#RRGGBB" into 0..255 integer channels. Throws on malformed input. */
export function parseHex(hex: HexColor): RGB {
  const trimmed = typeof hex === 'string' ? hex.trim() : ''
  if (!HEX_RE.test(trimmed)) {
    throw new Error(`theme-packs/color: invalid hex color ${JSON.stringify(hex)}`)
  }
  const int = parseInt(trimmed.slice(1), 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

/** Formats 0..255 channels (rounded, clamped) as an uppercase "#RRGGBB". */
export function formatHex(rgb: RGB): HexColor {
  const c = (n: number): string => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`.toUpperCase()
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) {
    return { h: 0, s: 0, l: l * 100 }
  }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0)
  } else if (max === g) {
    h = (b - r) / d + 2
  } else {
    h = (r - g) / d + 4
  }
  return { h: h * 60, s: s * 100, l: l * 100 }
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t
  if (tt < 0) tt += 1
  if (tt > 1) tt -= 1
  if (tt < 1 / 6) return p + (q - p) * 6 * tt
  if (tt < 1 / 2) return q
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
  return p
}

export function hslToRgb(hsl: HSL): RGB {
  const h = normalizeHue(hsl.h)
  const s = clamp(hsl.s, 0, 100) / 100
  const l = clamp(hsl.l, 0, 100) / 100
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hk = h / 360
  return {
    r: Math.round(hueToRgb(p, q, hk + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hk) * 255),
    b: Math.round(hueToRgb(p, q, hk - 1 / 3) * 255),
  }
}

/** Linear interpolation between two RGB colours; t=0 -> a, t=1 -> b. */
export function mix(a: RGB, b: RGB, t: number): RGB {
  const tt = clamp(t, 0, 1)
  return {
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt,
  }
}

function srgbChannelToLinear(channel255: number): number {
  const cs = clamp(channel255, 0, 255) / 255
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance, 0 (black) .. 1 (white). */
export function relativeLuminance(rgb: RGB): number {
  const r = srgbChannelToLinear(rgb.r)
  const g = srgbChannelToLinear(rgb.g)
  const b = srgbChannelToLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 (identical) .. 21 (black vs white). */
export function contrastRatio(hexA: HexColor, hexB: HexColor): number {
  const la = relativeLuminance(parseHex(hexA))
  const lb = relativeLuminance(parseHex(hexB))
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Composites `fgHex` at `alpha` (0..1) OVER `bgHex` and returns the
 * resulting *solid* hex colour. Used both for "glass" surfaces (composite
 * once, per the schema comment on `surfaceAlpha`) and to turn a
 * conceptual low-alpha tint (a border, a hover state) into a concrete hex
 * the `HexColor` type can hold.
 */
export function compositeOverBackground(fgHex: HexColor, alpha: number, bgHex: HexColor): HexColor {
  const fg = parseHex(fgHex)
  const bg = parseHex(bgHex)
  return formatHex(mix(bg, fg, alpha))
}

const WHITE: RGB = { r: 255, g: 255, b: 255 }
const BLACK: RGB = { r: 0, g: 0, b: 0 }

/** Blends `hex` toward white by `t` (0..1). Shorthand over compositeOverBackground. */
export function blendToWhite(hex: HexColor, t: number): HexColor {
  return formatHex(mix(parseHex(hex), WHITE, t))
}

/** Blends `hex` toward black by `t` (0..1). Shorthand over compositeOverBackground. */
export function blendToBlack(hex: HexColor, t: number): HexColor {
  return formatHex(mix(parseHex(hex), BLACK, t))
}

/**
 * How far each scale step sits from the 500 anchor, expressed as a mix
 * fraction toward white (steps below 500) or toward black (steps at/above
 * 600). This is what makes `generateScale` monotonic in luminance by
 * construction: each step is a straight-line blend of the anchor toward a
 * fixed white or black endpoint, and gamma-corrected luminance is monotonic
 * along that line.
 */
const LIGHT_MIX: Partial<Record<ScaleStep, number>> = { 50: 0.94, 100: 0.86, 200: 0.68, 300: 0.48, 400: 0.24 }
const DARK_MIX: Partial<Record<ScaleStep, number>> = { 600: 0.16, 700: 0.34, 800: 0.52, 900: 0.7, 950: 0.84 }

/**
 * Builds an 11-step (50..950) colour scale from a single hue/saturation
 * anchor at L=50%. Step 500 is the anchor itself; lighter steps blend
 * toward white, darker steps blend toward black, so luminance strictly
 * decreases from 50 to 950 for any hue/saturation.
 */
export function generateScale(hue: number, saturation: number): ColorScale {
  const s = clamp(saturation, 0, 100)
  const anchor = hslToRgb({ h: normalizeHue(hue), s, l: 50 })
  const scale: Record<string, HexColor> = {}
  for (const step of SCALE_STEPS) {
    if (step === 500) {
      scale['500'] = formatHex(anchor)
    } else if (step in LIGHT_MIX) {
      scale[String(step)] = formatHex(mix(anchor, WHITE, LIGHT_MIX[step]!))
    } else {
      scale[String(step)] = formatHex(mix(anchor, BLACK, DARK_MIX[step]!))
    }
  }
  return scale as ColorScale
}

/** Plain Euclidean RGB distance normalized to 0 (identical) .. 1 (black vs white). */
export function colorDistance(hexA: HexColor, hexB: HexColor): number {
  const a = parseHex(hexA)
  const b = parseHex(hexB)
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(dr * dr + dg * dg + db * db) / (255 * Math.sqrt(3))
}
