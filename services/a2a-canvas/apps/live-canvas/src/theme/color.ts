/**
 * Pure colour math for the theme engine: hex/rgb conversion, alpha
 * compositing, WCAG relative luminance and contrast ratio, and small
 * lighten/darken/mix helpers used to derive palette scales.
 *
 * No DOM, no globals — safe to import under plain `node --test`.
 */

export interface RGB {
  r: number
  g: number
  b: number
}

const HEX_RE = /^#?([0-9a-fA-F]{6})$/

function clampChannel(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)))
}

/** Parses "#RRGGBB" or "RRGGBB" (case-insensitive) into 0-255 channels. */
export function parseHex(hex: string): RGB {
  const m = HEX_RE.exec(hex.trim())
  if (!m || !m[1]) throw new Error(`Invalid hex color: ${hex}`)
  const h = m[1]
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** Renders 0-255 channels (rounded, clamped) as "#RRGGBB" (uppercase). */
export function toHex(rgb: RGB): string {
  const c = (n: number) => clampChannel(n).toString(16).padStart(2, '0').toUpperCase()
  return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`
}

/** Alias of parseHex, for symmetry with rgbToHex. */
export function hexToRgb(hex: string): RGB {
  return parseHex(hex)
}

/** Alias of toHex taking loose channel args instead of an RGB object. */
export function rgbToHex(r: number, g: number, b: number): string {
  return toHex({ r, g, b })
}

/** "36 25 58" — space-separated decimal channels, for CSS `rgb(var(--x) / a)`. */
export function hexToRgbTriplet(hex: string): string {
  const { r, g, b } = parseHex(hex)
  return `${r} ${g} ${b}`
}

/**
 * Composites fgHex over bgHex at `alpha` (0..1), applied exactly once, and
 * returns the resulting opaque hex — "the colour actually painted" when a
 * glass surface sits over a solid background.
 */
export function compositeOver(fgHex: string, alpha: number, bgHex: string): string {
  const fg = parseHex(fgHex)
  const bg = parseHex(bgHex)
  const a = Math.min(1, Math.max(0, alpha))
  return toHex({
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  })
}

function srgbChannelToLinear(c255: number): number {
  const cs = c255 / 255
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance (0..1) of a hex colour. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex)
  return 0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b)
}

/** WCAG 2.x contrast ratio between two colours; always >= 1. */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA)
  const lb = relativeLuminance(hexB)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Linear interpolation from hexA (t=0) to hexB (t=1), clamped to [0,1]. */
export function mix(hexA: string, hexB: string, t: number): string {
  const a = parseHex(hexA)
  const b = parseHex(hexB)
  const tt = Math.min(1, Math.max(0, t))
  return toHex({
    r: a.r + (b.r - a.r) * tt,
    g: a.g + (b.g - a.g) * tt,
    b: a.b + (b.b - a.b) * tt,
  })
}

/** Mixes toward white by `amount` (0..1). */
export function lighten(hex: string, amount: number): string {
  return mix(hex, '#FFFFFF', amount)
}

/** Mixes toward black by `amount` (0..1). */
export function darken(hex: string, amount: number): string {
  return mix(hex, '#000000', amount)
}
