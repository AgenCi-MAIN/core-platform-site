/**
 * Serialises theme tokens to the CSS custom properties styles.css consumes,
 * and (DOM-side) writes them to :root.
 *
 * `toCssVars` is pure and safe to import under plain `node --test`. `apply`
 * touches `document` but guards on it being undefined first, so importing
 * this module under Node never throws — it only matters if `apply` is
 * actually called there, in which case it is a no-op.
 */
import { hexToRgbTriplet } from './color.ts'
import type { ThemeMode } from '../../../../packages/shared/src/theme-tokens.ts'
import type { ThemeTokens, CssVar } from '../contracts.ts'

/** Maps tokens (for one mode) onto exactly the names in CSS_VARS — no more, no fewer. */
export function toCssVars(tokens: ThemeTokens, mode: ThemeMode = 'dark'): Record<CssVar, string> {
  const sem = tokens.modes[mode]
  return {
    '--c-bg': sem.bg,
    '--c-surface-rgb': hexToRgbTriplet(sem.surface),
    '--surface-alpha': String(sem.surfaceAlpha),
    '--c-accent': sem.accent,
    '--c-focus': sem.focusRing,
    '--c-text': sem.text,
    '--c-muted': sem.textMuted,
    '--c-success': sem.success,
    '--c-warning': sem.warning,
    '--c-danger': sem.danger,
    '--c-border': sem.border,
    // Reference 8/16/24/32px live at spacing steps 2/4/6/8 (0.25rem per step).
    '--sp-1': `${tokens.spacing['2']}rem`,
    '--sp-2': `${tokens.spacing['4']}rem`,
    '--sp-3': `${tokens.spacing['6']}rem`,
    '--sp-4': `${tokens.spacing['8']}rem`,
    '--radius': `${tokens.radius.md}rem`,
    '--radius-sm': `${tokens.radius.sm}rem`,
    '--shadow': tokens.shadow.md,
    '--lift': `-${tokens.components.button.hoverLiftPx}px`,
    '--font-sans': tokens.typography.fontFamilies.sans,
    '--font-mono': tokens.typography.fontFamilies.mono,
    '--fs-sm': `${tokens.typography.sizes.sm}rem`,
    '--fs-md': `${tokens.typography.sizes.md}rem`,
    '--fs-lg': `${tokens.typography.sizes.lg}rem`,
    '--motion-fast': `${tokens.motion.durations.fast}ms`,
    '--motion-base': `${tokens.motion.durations.base}ms`,
    '--ease': tokens.motion.easings.standard,
  }
}

interface ScrollMemo {
  el: Element
  top: number
  left: number
}

/**
 * Writes the CSS vars on :root and stamps data-theme-id on #app, preserving
 * scroll positions (.rail, .panel, the document) and focus across the
 * update. No-op when `document` is undefined (e.g. under a node:test run).
 */
export function apply(tokens: ThemeTokens, opts?: { mode?: ThemeMode }): void {
  if (typeof document === 'undefined') return

  const mode = opts?.mode ?? 'dark'
  const vars = toCssVars(tokens, mode)
  const root = document.documentElement

  const scrollables: ScrollMemo[] = Array.from(document.querySelectorAll('.rail, .panel')).map((el) => ({
    el,
    top: el.scrollTop,
    left: el.scrollLeft,
  }))
  const docScroll = { x: window.scrollX, y: window.scrollY }
  const activeEl = document.activeElement

  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }
  const appEl = document.getElementById('app')
  if (appEl) appEl.setAttribute('data-theme-id', tokens.meta.id)

  const restore = () => {
    for (const { el, top, left } of scrollables) {
      el.scrollTop = top
      el.scrollLeft = left
    }
    window.scrollTo(docScroll.x, docScroll.y)
    if (activeEl instanceof HTMLElement && document.contains(activeEl)) {
      activeEl.focus({ preventScroll: true })
    }
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restore)
  else restore()
}
