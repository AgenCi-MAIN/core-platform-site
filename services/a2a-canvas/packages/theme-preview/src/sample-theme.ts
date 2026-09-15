/**
 * Built-in fixture theme: the owner's "Obsidian/Amethyst" reference values
 * (canvas #11121A, surface rgba(36,25,58,.82), accent #A78BFA, focus
 * #67E8F9 — see apps/live-canvas/styles.css) filled out to a full
 * ThemeTokens object. Used by the gallery builder when
 * packages/theme-packs/themes/index.json isn't present yet, and by the
 * tests as a known-good fixture.
 *
 * The 11-step palette scales are generated procedurally from a handful of
 * base colours — this is a sample fixture, not the authoritative palette
 * (that is the theme-packs lane's job).
 */
import { asId } from '../../shared/src/ids.ts'
import { SCALE_STEPS, THEME_SCHEMA_VERSION } from '../../shared/src/theme-tokens.ts'
import type { ColorScale, ThemeTokens } from '../../shared/src/theme-tokens.ts'
import { hexToRgb, rgbToHex } from './contrast.ts'

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hueToRgb = (t0: number): number => {
    let t = t0
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const hn = h / 360
  return {
    r: Math.round(hueToRgb(hn + 1 / 3) * 255),
    g: Math.round(hueToRgb(hn) * 255),
    b: Math.round(hueToRgb(hn - 1 / 3) * 255),
  }
}

/** Lightness stop per SCALE_STEPS index, lightest (50) to darkest (950). */
const LIGHTNESS_RAMP = [0.97, 0.93, 0.86, 0.76, 0.64, 0.52, 0.44, 0.36, 0.28, 0.2, 0.12]

/** Deterministic 11-step tint/shade scale from one base hex colour. */
function scaleFrom(baseHex: string): ColorScale {
  const { r, g, b } = hexToRgb(baseHex)
  const { h, s } = rgbToHsl(r, g, b)
  const scale = {} as ColorScale
  SCALE_STEPS.forEach((step, i) => {
    const l = LIGHTNESS_RAMP[i] ?? 0.5
    const rgb = hslToRgb(h, s, l)
    scale[`${step}`] = rgbToHex(rgb)
  })
  return scale
}

export const SAMPLE_THEME: ThemeTokens = {
  schemaVersion: THEME_SCHEMA_VERSION,
  meta: {
    id: asId('theme_sample_obsidian_amethyst'),
    name: 'Obsidian Amethyst (Reference)',
    family: 'obsidian-amethyst',
    version: '1.0.0',
    description: "Built-in fixture theme derived from the owner's Freeform reference values; used when no theme pack is available.",
    tags: ['reference', 'built-in', 'dark-first'],
    author: 'theme-preview (built-in fixture)',
    createdAt: '2026-09-15T00:00:00.000Z',
    generated: false,
    provenance: 'reference',
  },
  palette: {
    primary: scaleFrom('#A78BFA'),
    secondary: scaleFrom('#67E8F9'),
    accent: scaleFrom('#A78BFA'),
    neutral: scaleFrom('#8B8398'),
    success: scaleFrom('#6EE7B7'),
    warning: scaleFrom('#FCD34D'),
    danger: scaleFrom('#FCA5A5'),
    info: scaleFrom('#67E8F9'),
  },
  modes: {
    dark: {
      bg: '#11121A',
      bgElevated: '#181A26',
      bgSunken: '#0B0C12',
      surface: '#24193A',
      surfaceAlpha: 0.82,
      surfaceHover: '#2E2148',
      border: '#4B3F6B',
      borderStrong: '#6B5A94',
      text: '#F5F3FF',
      textMuted: '#C4B5FD',
      textInverse: '#14101F',
      link: '#67E8F9',
      focusRing: '#67E8F9',
      accent: '#A78BFA',
      success: '#6EE7B7',
      warning: '#FCD34D',
      danger: '#FCA5A5',
      info: '#67E8F9',
    },
    light: {
      bg: '#F5F3FF',
      bgElevated: '#FFFFFF',
      bgSunken: '#E9E4FB',
      surface: '#FFFFFF',
      surfaceAlpha: 0.86,
      surfaceHover: '#F0ECFC',
      border: '#D8D0F5',
      borderStrong: '#B7A9EE',
      text: '#1C1730',
      textMuted: '#5B5178',
      textInverse: '#FFFFFF',
      link: '#6D28D9',
      focusRing: '#0E7C90',
      accent: '#7C3AED',
      success: '#047857',
      warning: '#92400E',
      danger: '#B91C1C',
      info: '#0E7C90',
    },
  },
  typography: {
    fontFamilies: {
      sans: 'ui-sans-serif, -apple-system, "SF Pro Text", "Segoe UI", Inter, system-ui, sans-serif',
      serif: 'Georgia, "Iowan Old Style", serif',
      mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    },
    sizes: { xs: 0.75, sm: 0.8125, md: 0.9375, lg: 1.125, xl: 1.25, '2xl': 1.5, '3xl': 1.875, '4xl': 2.25, '5xl': 3 },
    lineHeights: { tight: 1.2, normal: 1.45, relaxed: 1.7 },
    weights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
    letterSpacing: { tight: '-0.01em', normal: '0', wide: '0.08em' },
  },
  spacing: {
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
  },
  radius: { none: 0, sm: 8, md: 14, lg: 20, xl: 28, full: 9999 },
  shadow: {
    sm: '0 2px 8px rgb(0 0 0 / 0.25)',
    md: '0 10px 30px rgb(0 0 0 / 0.35)',
    lg: '0 20px 50px rgb(0 0 0 / 0.45)',
    focus: '0 0 0 3px rgb(103 232 249 / 0.45)',
  },
  motion: {
    durations: { fast: 120, base: 200, slow: 320 },
    easings: { standard: 'cubic-bezier(.2,.7,.2,1)', enter: 'cubic-bezier(0,0,.2,1)', exit: 'cubic-bezier(.4,0,1,1)' },
    reducedMotionScale: 0,
  },
  components: {
    button: { bg: 'accent', text: 'textInverse', border: 'border', hoverLiftPx: 2 },
    card: { bg: 'surface', border: 'border', radius: 'md', shadow: 'md' },
    input: { bg: 'bgSunken', border: 'border', text: 'text', focus: 'focusRing' },
    lane: { rail: 'surface', title: 'textMuted', border: 'border' },
    workflowCard: { bg: 'surface', border: 'border', selectedRing: 'accent', keyline: 'focusRing' },
  },
}
