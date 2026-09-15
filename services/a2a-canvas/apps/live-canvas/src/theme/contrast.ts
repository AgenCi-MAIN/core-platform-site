/**
 * Runs the WCAG contrast probe the theme panel and ThemeApi both expose.
 *
 * Every check's `background` is the colour actually painted: for glass
 * (text/muted/accent/link over the panel surface) that means the surface
 * composited once over bg at surfaceAlpha; for a solid button (text over
 * accent) or a ring drawn straight on the canvas (focus over bg) the
 * semantic colour itself is already opaque, so it is used as-is.
 */
import { compositeOver, contrastRatio } from './color.ts'
import type { ThemeMode } from '../../../../packages/shared/src/theme-tokens.ts'
import type { ThemeTokens, ContrastCheck, ContrastProbeResult, ThemeIssue } from '../contracts.ts'

interface CheckSpec {
  name: string
  path: string
  fg: string
  bg: string
  required: number
  /** [min, max) ratio range that downgrades a failure to a warning. */
  warnRange?: [number, number]
}

function buildSpecs(tokens: ThemeTokens, mode: ThemeMode): CheckSpec[] {
  const sem = tokens.modes[mode]
  const surface = compositeOver(sem.surface, sem.surfaceAlpha, sem.bg)
  return [
    { name: 'text on bg', path: `modes.${mode}.text`, fg: sem.text, bg: sem.bg, required: 4.5 },
    { name: 'text on surface', path: `modes.${mode}.text`, fg: sem.text, bg: surface, required: 4.5 },
    { name: 'muted on surface', path: `modes.${mode}.textMuted`, fg: sem.textMuted, bg: surface, required: 4.5, warnRange: [3, 4.5] },
    { name: 'accent on surface', path: `modes.${mode}.accent`, fg: sem.accent, bg: surface, required: 3 },
    { name: 'focus ring on bg', path: `modes.${mode}.focusRing`, fg: sem.focusRing, bg: sem.bg, required: 3 },
    { name: 'button text on accent', path: `modes.${mode}.textInverse`, fg: sem.textInverse, bg: sem.accent, required: 4.5 },
    { name: 'link on surface', path: `modes.${mode}.link`, fg: sem.link, bg: surface, required: 4.5 },
  ]
}

/** Runs every check and reports pass/fail plus any issues (mode defaults to 'dark'). */
export function probe(tokens: ThemeTokens, mode: ThemeMode = 'dark'): ContrastProbeResult {
  const specs = buildSpecs(tokens, mode)
  const checks: ContrastCheck[] = []
  const issues: ThemeIssue[] = []

  for (const spec of specs) {
    const raw = contrastRatio(spec.fg, spec.bg)
    const passed = raw >= spec.required
    checks.push({
      name: spec.name,
      foreground: spec.fg,
      background: spec.bg,
      ratio: Math.round(raw * 100) / 100,
      required: spec.required,
      passed,
    })
    if (!passed) {
      const inWarnRange = spec.warnRange !== undefined && raw >= spec.warnRange[0] && raw < spec.warnRange[1]
      issues.push({
        code: 'contrast.insufficient',
        path: spec.path,
        message: `${spec.name}: ${raw.toFixed(2)}:1 is below the required ${spec.required}:1`,
        severity: inWarnRange ? 'warning' : 'error',
      })
    }
  }

  return {
    themeId: tokens.meta.id,
    mode,
    checks,
    passed: !issues.some((i) => i.severity === 'error'),
    issues,
  }
}
