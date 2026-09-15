/**
 * Structural + accessibility validation for a `ThemeTokens` candidate.
 * `validateTheme` accepts `unknown` (JSON parsed off disk or fetched over
 * the network has no compile-time guarantee) and returns every issue it
 * finds rather than throwing on the first one, so a caller — the build
 * script, the theme maker's importer — can show a complete report.
 */
import type { ThemeIssue, ThemeTokens, SemanticColors, ThemeMode } from '../../shared/src/theme-tokens.ts'
import { PALETTE_ROLES, SCALE_STEPS, THEME_MODES, THEME_SCHEMA_VERSION } from '../../shared/src/theme-tokens.ts'
import type { Result } from '../../shared/src/result.ts'
import { ok, err } from '../../shared/src/result.ts'
import { isHexColor, contrastRatio, compositeOverBackground } from './color.ts'

const MIN_CONTRAST = 4.5

const SEMANTIC_KEYS: readonly (keyof SemanticColors)[] = [
  'bg',
  'bgElevated',
  'bgSunken',
  'surface',
  'surfaceAlpha',
  'surfaceHover',
  'border',
  'borderStrong',
  'text',
  'textMuted',
  'textInverse',
  'link',
  'focusRing',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
]
const SEMANTIC_HEX_KEYS: readonly (keyof SemanticColors)[] = SEMANTIC_KEYS.filter((k) => k !== 'surfaceAlpha')

const SPACING_KEYS = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24'] as const
const RADIUS_KEYS = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
const SHADOW_KEYS = ['sm', 'md', 'lg', 'focus'] as const
const TYPOGRAPHY_SIZE_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const
const LINE_HEIGHT_KEYS = ['tight', 'normal', 'relaxed'] as const
const WEIGHT_KEYS = ['regular', 'medium', 'semibold', 'bold'] as const
const LETTER_SPACING_KEYS = ['tight', 'normal', 'wide'] as const
const FONT_FAMILY_KEYS = ['sans', 'serif', 'mono'] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pushError(issues: ThemeIssue[], code: string, path: string, message: string): void {
  issues.push({ code, path, message, severity: 'error' })
}

function checkHex(value: unknown, path: string, issues: ThemeIssue[]): void {
  if (!isHexColor(value)) {
    pushError(issues, 'invalid_hex', path, `expected a 6-digit hex color (e.g. "#A78BFA"), got ${JSON.stringify(value)}`)
  }
}

function checkKeys(obj: Record<string, unknown>, keys: readonly string[], path: string, issues: ThemeIssue[]): void {
  for (const key of keys) {
    if (!(key in obj)) {
      pushError(issues, 'missing_key', `${path}.${key}`, `missing required key "${key}"`)
    }
  }
}

function checkScale(value: unknown, path: string, issues: ThemeIssue[]): void {
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_scale', path, 'expected an object with keys 50..950')
    return
  }
  for (const s of SCALE_STEPS) {
    const key = String(s)
    if (!(key in value)) {
      pushError(issues, 'missing_scale_step', `${path}.${key}`, `missing scale step "${key}"`)
      continue
    }
    checkHex(value[key], `${path}.${key}`, issues)
  }
}

function checkPalette(value: unknown, issues: ThemeIssue[]): void {
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_palette', 'palette', 'expected an object with the 8 palette roles')
    return
  }
  for (const role of PALETTE_ROLES) {
    if (!(role in value)) {
      pushError(issues, 'missing_role', `palette.${role}`, `missing palette role "${role}"`)
      continue
    }
    checkScale(value[role], `palette.${role}`, issues)
  }
}

function checkSemanticColors(value: unknown, mode: ThemeMode, issues: ThemeIssue[]): SemanticColors | null {
  const path = `modes.${mode}`
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_mode', path, `expected an object of semantic colours for "${mode}"`)
    return null
  }
  checkKeys(value, SEMANTIC_KEYS, path, issues)
  for (const key of SEMANTIC_HEX_KEYS) {
    if (key in value) checkHex(value[key], `${path}.${key}`, issues)
  }
  if ('surfaceAlpha' in value) {
    const alpha = value.surfaceAlpha
    if (typeof alpha !== 'number' || Number.isNaN(alpha) || alpha < 0 || alpha > 1) {
      pushError(issues, 'invalid_alpha', `${path}.surfaceAlpha`, `surfaceAlpha must be a number in 0..1, got ${JSON.stringify(alpha)}`)
    }
  }
  const complete = SEMANTIC_KEYS.every((k) => k in value)
  return complete ? (value as unknown as SemanticColors) : null
}

function checkModes(value: unknown, issues: ThemeIssue[]): void {
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_modes', 'modes', 'expected an object with "light" and "dark" keys')
    return
  }
  for (const mode of THEME_MODES) {
    if (!(mode in value)) {
      pushError(issues, 'missing_mode', `modes.${mode}`, `missing mode "${mode}"`)
      continue
    }
    const semantic = checkSemanticColors(value[mode], mode, issues)
    if (semantic) checkContrast(semantic, mode, issues)
  }
}

/** text-on-bg and text-on-composited-surface must both clear MIN_CONTRAST. */
function checkContrast(semantic: SemanticColors, mode: ThemeMode, issues: ThemeIssue[]): void {
  const path = `modes.${mode}`
  let compositedSurface: string
  try {
    compositedSurface = compositeOverBackground(semantic.surface, semantic.surfaceAlpha, semantic.bg)
  } catch {
    return // already reported as invalid hex/alpha above
  }
  try {
    const onBg = contrastRatio(semantic.text, semantic.bg)
    if (onBg < MIN_CONTRAST) {
      pushError(issues, 'low_contrast_bg', `${path}.text`, `text-on-bg contrast is ${onBg.toFixed(2)}, below ${MIN_CONTRAST}`)
    }
    const onSurface = contrastRatio(semantic.text, compositedSurface)
    if (onSurface < MIN_CONTRAST) {
      pushError(issues, 'low_contrast_surface', `${path}.text`, `text-on-composited-surface contrast is ${onSurface.toFixed(2)}, below ${MIN_CONTRAST}`)
    }
  } catch {
    // malformed hex already reported by checkSemanticColors
  }
}

function checkTypography(value: unknown, issues: ThemeIssue[]): void {
  const path = 'typography'
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_typography', path, 'expected typography tokens')
    return
  }
  if (!isPlainObject(value.fontFamilies)) {
    pushError(issues, 'invalid_typography', `${path}.fontFamilies`, 'expected fontFamilies object')
  } else {
    for (const key of FONT_FAMILY_KEYS) {
      if (typeof value.fontFamilies[key] !== 'string' || value.fontFamilies[key] === '') {
        pushError(issues, 'invalid_font_family', `${path}.fontFamilies.${key}`, `expected a non-empty font-family string`)
      }
    }
  }
  if (!isPlainObject(value.sizes)) {
    pushError(issues, 'invalid_typography', `${path}.sizes`, 'expected sizes object')
  } else {
    for (const key of TYPOGRAPHY_SIZE_KEYS) {
      if (typeof value.sizes[key] !== 'number') pushError(issues, 'invalid_size', `${path}.sizes.${key}`, 'expected a numeric rem size')
    }
  }
  if (!isPlainObject(value.lineHeights)) {
    pushError(issues, 'invalid_typography', `${path}.lineHeights`, 'expected lineHeights object')
  } else {
    for (const key of LINE_HEIGHT_KEYS) {
      if (typeof value.lineHeights[key] !== 'number') pushError(issues, 'invalid_line_height', `${path}.lineHeights.${key}`, 'expected a number')
    }
  }
  if (!isPlainObject(value.weights)) {
    pushError(issues, 'invalid_typography', `${path}.weights`, 'expected weights object')
  } else {
    for (const key of WEIGHT_KEYS) {
      if (typeof value.weights[key] !== 'number') pushError(issues, 'invalid_weight', `${path}.weights.${key}`, 'expected a number')
    }
  }
  if (!isPlainObject(value.letterSpacing)) {
    pushError(issues, 'invalid_typography', `${path}.letterSpacing`, 'expected letterSpacing object')
  } else {
    for (const key of LETTER_SPACING_KEYS) {
      if (typeof value.letterSpacing[key] !== 'string') pushError(issues, 'invalid_letter_spacing', `${path}.letterSpacing.${key}`, 'expected a CSS length string')
    }
  }
}

function checkSpacing(value: unknown, issues: ThemeIssue[]): void {
  const path = 'spacing'
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_spacing', path, 'expected a spacing object')
    return
  }
  for (const key of SPACING_KEYS) {
    if (typeof value[key] !== 'number') pushError(issues, 'invalid_spacing_step', `${path}.${key}`, `expected a numeric rem value for step "${key}"`)
  }
}

function checkRadius(value: unknown, issues: ThemeIssue[]): void {
  const path = 'radius'
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_radius', path, 'expected a radius object')
    return
  }
  for (const key of RADIUS_KEYS) {
    if (typeof value[key] !== 'number') pushError(issues, 'invalid_radius_step', `${path}.${key}`, `expected a numeric px value for "${key}"`)
  }
}

function checkShadow(value: unknown, issues: ThemeIssue[]): void {
  const path = 'shadow'
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_shadow', path, 'expected a shadow object')
    return
  }
  for (const key of SHADOW_KEYS) {
    if (typeof value[key] !== 'string' || value[key] === '') pushError(issues, 'invalid_shadow_value', `${path}.${key}`, `expected a non-empty CSS shadow string for "${key}"`)
  }
}

function checkMotion(value: unknown, issues: ThemeIssue[]): void {
  const path = 'motion'
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_motion', path, 'expected a motion object')
    return
  }
  if (!isPlainObject(value.durations)) {
    pushError(issues, 'invalid_motion', `${path}.durations`, 'expected durations object')
  } else {
    for (const key of ['fast', 'base', 'slow'] as const) {
      if (typeof value.durations[key] !== 'number') pushError(issues, 'invalid_duration', `${path}.durations.${key}`, 'expected a numeric ms duration')
    }
  }
  if (!isPlainObject(value.easings)) {
    pushError(issues, 'invalid_motion', `${path}.easings`, 'expected easings object')
  } else {
    for (const key of ['standard', 'enter', 'exit'] as const) {
      if (typeof value.easings[key] !== 'string') pushError(issues, 'invalid_easing', `${path}.easings.${key}`, 'expected a CSS easing string')
    }
  }
  if (typeof value.reducedMotionScale !== 'number') {
    pushError(issues, 'invalid_reduced_motion_scale', `${path}.reducedMotionScale`, 'expected a number')
  }
}

const SEMANTIC_REF_KEYS = new Set<string>(SEMANTIC_KEYS as readonly string[])

function checkSemanticRef(value: unknown, path: string, issues: ThemeIssue[]): void {
  if (typeof value !== 'string' || !SEMANTIC_REF_KEYS.has(value)) {
    pushError(issues, 'invalid_semantic_ref', path, `expected a key of SemanticColors, got ${JSON.stringify(value)}`)
  }
}

function checkComponents(value: unknown, issues: ThemeIssue[]): void {
  const path = 'components'
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_components', path, 'expected a components object')
    return
  }
  if (isPlainObject(value.button)) {
    checkSemanticRef(value.button.bg, `${path}.button.bg`, issues)
    checkSemanticRef(value.button.text, `${path}.button.text`, issues)
    checkSemanticRef(value.button.border, `${path}.button.border`, issues)
    if (typeof value.button.hoverLiftPx !== 'number') pushError(issues, 'invalid_hover_lift', `${path}.button.hoverLiftPx`, 'expected a number')
  } else {
    pushError(issues, 'invalid_components', `${path}.button`, 'expected a button component object')
  }
  if (isPlainObject(value.card)) {
    checkSemanticRef(value.card.bg, `${path}.card.bg`, issues)
    checkSemanticRef(value.card.border, `${path}.card.border`, issues)
    if (typeof value.card.radius !== 'string' || !(RADIUS_KEYS as readonly string[]).includes(value.card.radius)) {
      pushError(issues, 'invalid_radius_ref', `${path}.card.radius`, 'expected a key of RadiusTokens')
    }
    if (typeof value.card.shadow !== 'string' || !(SHADOW_KEYS as readonly string[]).includes(value.card.shadow)) {
      pushError(issues, 'invalid_shadow_ref', `${path}.card.shadow`, 'expected a key of ShadowTokens')
    }
  } else {
    pushError(issues, 'invalid_components', `${path}.card`, 'expected a card component object')
  }
  if (isPlainObject(value.input)) {
    checkSemanticRef(value.input.bg, `${path}.input.bg`, issues)
    checkSemanticRef(value.input.border, `${path}.input.border`, issues)
    checkSemanticRef(value.input.text, `${path}.input.text`, issues)
    checkSemanticRef(value.input.focus, `${path}.input.focus`, issues)
  } else {
    pushError(issues, 'invalid_components', `${path}.input`, 'expected an input component object')
  }
  if (isPlainObject(value.lane)) {
    checkSemanticRef(value.lane.rail, `${path}.lane.rail`, issues)
    checkSemanticRef(value.lane.title, `${path}.lane.title`, issues)
    checkSemanticRef(value.lane.border, `${path}.lane.border`, issues)
  } else {
    pushError(issues, 'invalid_components', `${path}.lane`, 'expected a lane component object')
  }
  if (isPlainObject(value.workflowCard)) {
    checkSemanticRef(value.workflowCard.bg, `${path}.workflowCard.bg`, issues)
    checkSemanticRef(value.workflowCard.border, `${path}.workflowCard.border`, issues)
    checkSemanticRef(value.workflowCard.selectedRing, `${path}.workflowCard.selectedRing`, issues)
    checkSemanticRef(value.workflowCard.keyline, `${path}.workflowCard.keyline`, issues)
  } else {
    pushError(issues, 'invalid_components', `${path}.workflowCard`, 'expected a workflowCard component object')
  }
}

function checkMeta(value: unknown, issues: ThemeIssue[]): void {
  const path = 'meta'
  if (!isPlainObject(value)) {
    pushError(issues, 'invalid_meta', path, 'expected a meta object')
    return
  }
  const stringKeys = ['id', 'name', 'family', 'version', 'description', 'author', 'createdAt'] as const
  for (const key of stringKeys) {
    if (typeof value[key] !== 'string' || value[key] === '') {
      pushError(issues, 'invalid_meta_field', `${path}.${key}`, `expected a non-empty string for "${key}"`)
    }
  }
  if (!Array.isArray(value.tags) || !value.tags.every((t) => typeof t === 'string')) {
    pushError(issues, 'invalid_meta_field', `${path}.tags`, 'expected an array of strings')
  }
  if (typeof value.generated !== 'boolean') {
    pushError(issues, 'invalid_meta_field', `${path}.generated`, 'expected a boolean')
  }
  if (value.provenance !== 'reference' && value.provenance !== 'proposed' && value.provenance !== 'generated') {
    pushError(issues, 'invalid_provenance', `${path}.provenance`, `expected "reference" | "proposed" | "generated", got ${JSON.stringify(value.provenance)}`)
  }
}

/** Validates an unknown value as a complete, accessible ThemeTokens. */
export function validateTheme(input: unknown): Result<ThemeTokens, ThemeIssue[]> {
  const issues: ThemeIssue[] = []
  if (!isPlainObject(input)) {
    return err([{ code: 'invalid_theme', path: '', message: 'expected a theme object', severity: 'error' }])
  }
  if (input.schemaVersion !== THEME_SCHEMA_VERSION) {
    pushError(issues, 'invalid_schema_version', 'schemaVersion', `expected "${THEME_SCHEMA_VERSION}", got ${JSON.stringify(input.schemaVersion)}`)
  }
  checkMeta(input.meta, issues)
  checkPalette(input.palette, issues)
  checkModes(input.modes, issues)
  checkTypography(input.typography, issues)
  checkSpacing(input.spacing, issues)
  checkRadius(input.radius, issues)
  checkShadow(input.shadow, issues)
  checkMotion(input.motion, issues)
  checkComponents(input.components, issues)

  if (issues.length > 0) return err(issues)
  return ok(input as unknown as ThemeTokens)
}
