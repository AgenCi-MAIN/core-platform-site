/**
 * Turns ThemeTokens (+ mode) into a CSS string: the variable contract that
 * `apps/live-canvas/styles.css` documents at its head, plus a compact
 * stylesheet for the preview's own components (glass, buttons, shape nodes,
 * selected ring/keyline, status line, toast).
 *
 * Pure: string in (tokens), string out (CSS). No DOM.
 */
import type { ComponentTokens, RadiusTokens, SemanticColors, SemanticRef, ThemeMode, ThemeTokens } from '../../shared/src/theme-tokens.ts'
import { hexToRgb } from './contrast.ts'

/** The exact custom-property names apps/live-canvas/styles.css requires. */
export const REQUIRED_CSS_VARS = [
  '--c-bg',
  '--c-surface-rgb',
  '--surface-alpha',
  '--c-accent',
  '--c-focus',
  '--c-text',
  '--c-muted',
  '--c-success',
  '--c-warning',
  '--c-danger',
  '--c-border',
  '--sp-1',
  '--sp-2',
  '--sp-3',
  '--sp-4',
  '--radius',
  '--radius-sm',
  '--shadow',
  '--lift',
  '--font-sans',
  '--font-mono',
  '--fs-sm',
  '--fs-md',
  '--fs-lg',
  '--motion-fast',
  '--motion-base',
  '--ease',
] as const

function rgbTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  return `${r} ${g} ${b}`
}

export function resolveSemanticRef(colors: SemanticColors, ref: SemanticRef): string {
  return colors[ref]
}

export function resolveRadiusRef(radius: RadiusTokens, ref: keyof RadiusTokens): number {
  return radius[ref]
}

/** Builds the `:root` variable block. Every REQUIRED_CSS_VARS name appears exactly once. */
function variableBlock(tokens: ThemeTokens, mode: ThemeMode): string {
  const c = tokens.modes[mode]
  const t = tokens.typography
  const m = tokens.motion
  const button = tokens.components.button
  const lines = [
    `--c-bg: ${c.bg};`,
    `--c-surface-rgb: ${rgbTriplet(c.surface)};`,
    `--surface-alpha: ${c.surfaceAlpha};`,
    `--c-surface: rgb(var(--c-surface-rgb) / var(--surface-alpha));`,
    `--c-accent: ${c.accent};`,
    `--c-focus: ${c.focusRing};`,
    `--c-text: ${c.text};`,
    `--c-muted: ${c.textMuted};`,
    `--c-success: ${c.success};`,
    `--c-warning: ${c.warning};`,
    `--c-danger: ${c.danger};`,
    `--c-border: ${c.border};`,
    `--sp-1: ${tokens.spacing['2']}rem;`,
    `--sp-2: ${tokens.spacing['4']}rem;`,
    `--sp-3: ${tokens.spacing['6']}rem;`,
    `--sp-4: ${tokens.spacing['8']}rem;`,
    `--radius: ${tokens.radius.md}px;`,
    `--radius-sm: ${tokens.radius.sm}px;`,
    `--shadow: ${tokens.shadow.md};`,
    `--lift: -${button.hoverLiftPx}px;`,
    `--font-sans: ${t.fontFamilies.sans};`,
    `--font-mono: ${t.fontFamilies.mono};`,
    `--fs-sm: ${t.sizes.sm}rem;`,
    `--fs-md: ${t.sizes.md}rem;`,
    `--fs-lg: ${t.sizes.lg}rem;`,
    `--motion-fast: ${m.durations.fast}ms;`,
    `--motion-base: ${m.durations.base}ms;`,
    `--ease: ${m.easings.standard};`,
    `--touch: 44px;`,
    `color-scheme: ${mode};`,
  ]
  return `:root {\n  ${lines.join('\n  ')}\n}`
}

/** Fixed component rules; every colour/size reference goes through the vars above. */
const COMPONENT_CSS = `
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--c-bg);
  color: var(--c-text);
  font: var(--fs-md) / 1.45 var(--font-sans);
}
button, input, select, textarea { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--c-focus); outline-offset: 2px; }
.glass {
  background: var(--c-surface);
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.btn {
  min-height: var(--touch);
  min-width: var(--touch);
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: rgb(var(--c-surface-rgb) / 0.6);
  color: var(--c-text);
  cursor: pointer;
  transition: transform var(--motion-fast) var(--ease), background var(--motion-fast) var(--ease);
}
.btn:hover:not(:disabled), .btn[data-state="hover"] { transform: translateY(var(--lift)); background: rgb(var(--c-surface-rgb) / 0.95); }
.btn.primary { background: var(--c-accent); color: var(--c-bg); border-color: transparent; }
.btn:disabled, .btn[data-state="disabled"] { opacity: 0.72; cursor: not-allowed; color: var(--c-muted); }
.btn[data-state="focus"] { outline: 2px solid var(--c-focus); outline-offset: 2px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field > label { font-size: var(--fs-sm); color: var(--c-muted); }
.field input, .field select {
  min-height: var(--touch);
  padding: var(--sp-1);
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  background: rgb(0 0 0 / 0.25);
  color: var(--c-text);
}
.section { display: flex; flex-direction: column; gap: var(--sp-1); }
.section > h2 { margin: 0; font-size: var(--fs-sm); text-transform: uppercase; letter-spacing: 0.08em; color: var(--c-muted); }
.row { display: flex; gap: var(--sp-1); flex-wrap: wrap; align-items: center; }
.muted { color: var(--c-muted); }
.mono { font-family: var(--font-mono); }
.lane-rail { fill: rgb(var(--c-surface-rgb) / 0.35); stroke: var(--c-border); }
.lane-title { fill: var(--c-muted); font: 600 var(--fs-sm) var(--font-sans); text-transform: uppercase; letter-spacing: 0.08em; }
.node-shape { fill: var(--c-surface); stroke: var(--c-border); stroke-width: 1; }
.node.selected .node-shape { stroke: var(--c-accent); stroke-width: 2; }
.node.selected .node-keyline { stroke: var(--c-focus); stroke-width: 1; fill: none; }
.node-label { fill: var(--c-text); font: 500 var(--fs-md) var(--font-sans); }
.node-sub { fill: var(--c-muted); font: var(--fs-sm) var(--font-sans); }
.node[data-status="running"] .node-shape { stroke: var(--c-focus); }
.node[data-status="done"] .node-shape { stroke: var(--c-success); }
.node[data-status="failed"] .node-shape { stroke: var(--c-danger); }
.node[data-status="blocked"] .node-shape { stroke: var(--c-warning); }
.connector { fill: none; stroke: var(--c-muted); stroke-width: 1.5; }
.connector.active { stroke: var(--c-focus); }
.connector-arrow { fill: var(--c-muted); }
.status {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch);
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  color: var(--c-muted);
  font-size: var(--fs-sm);
}
.status[data-kind="ok"] { color: var(--c-success); }
.status[data-kind="error"] { color: var(--c-danger); }
.toast {
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
}
.badge {
  display: inline-block;
  padding: 2px var(--sp-1);
  border-radius: var(--radius-sm);
  border: 1px solid var(--c-border);
  font-size: var(--fs-sm);
  color: var(--c-muted);
}
`.trim()

export function tokensToCss(tokens: ThemeTokens, mode: ThemeMode): string {
  return `${variableBlock(tokens, mode)}\n${COMPONENT_CSS}\n`
}

export type { ComponentTokens }
