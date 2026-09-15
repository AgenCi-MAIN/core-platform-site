/**
 * Minimal WCAG contrast helpers used by the theme gallery.
 *
 * Pure functions only: hex in, numbers/hex out, no DOM, no I/O. Kept small on
 * purpose — this is judgement support for the preview, not a full colour
 * library.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** Parses a "#RGB" or "#RRGGBB" hex colour (leading "#" optional). */
export function hexToRgb(hex: string): Rgb {
  const cleaned = hex.trim().replace(/^#/, '')
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : cleaned.padEnd(6, '0').slice(0, 6)
  const n = Number.parseInt(full, 16)
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)))
  const hex = (v: number): string => clamp(v).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase()
}

/** WCAG relative luminance of an sRGB colour (0..1). */
export function relativeLuminance(rgb: Rgb): number {
  const channel = (c: number): number => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  const r = channel(rgb.r)
  const g = channel(rgb.g)
  const b = channel(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two colours, always >= 1. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA))
  const lB = relativeLuminance(hexToRgb(hexB))
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Flattens a translucent `fg` (0..1 alpha) over an opaque `bg`, both hex, to
 * the opaque hex colour a viewer actually sees. Used to judge glass surfaces,
 * which apply `surfaceAlpha` once when composited over the page background.
 */
export function compositeOver(fg: string, alpha: number, bg: string): string {
  const a = Math.max(0, Math.min(1, alpha))
  const f = hexToRgb(fg)
  const b = hexToRgb(bg)
  return rgbToHex({
    r: f.r * a + b.r * (1 - a),
    g: f.g * a + b.g * (1 - a),
    b: f.b * a + b.b * (1 - a),
  })
}

export type ContrastKind = 'text' | 'non-text'

/** WCAG 2.x minimums: 4.5:1 for normal text, 3:1 for large text / UI graphics. */
export const CONTRAST_MIN: Record<ContrastKind, number> = {
  text: 4.5,
  'non-text': 3,
}

export function passesContrast(ratio: number, kind: ContrastKind = 'text'): boolean {
  return ratio >= CONTRAST_MIN[kind]
}
