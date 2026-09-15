/**
 * Renders a self-contained HTML preview of a theme, and a gallery page that
 * lists many themes side by side with computed contrast ratios.
 *
 * Both functions are pure: given the same tokens/options they produce the
 * same string every time (no Date.now, no Math.random, no DOM). Every
 * dynamic string (theme name, description, title, ids) is HTML-escaped
 * before it reaches the output, since a theme pack's `meta.name` or a
 * caller-supplied `title` is untrusted text as far as this renderer is
 * concerned.
 */
import type { ContrastKind } from './contrast.ts'
import { CONTRAST_MIN, compositeOver, contrastRatio, passesContrast } from './contrast.ts'
import { resolveSemanticRef, tokensToCss } from './css.ts'
import { NODE_SHAPE_KINDS, curvedConnector, shapeByKind } from './svg.ts'
import type { NodeShapeKind } from './svg.ts'
import type { SemanticColors, ThemeMode, ThemeTokens } from '../../shared/src/theme-tokens.ts'

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface RenderPreviewOptions {
  mode?: ThemeMode
  title?: string
  width?: number
}

const NODE_STATUS_CYCLE = ['', 'running', 'done', 'blocked', 'failed', ''] as const
const NODE_LABELS: Record<NodeShapeKind, string> = {
  rect: 'Rect',
  rounded: 'Rounded',
  circle: 'Circle',
  diamond: 'Diamond',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
}

function renderLane(width: number): string {
  const laneHeight = 220
  const nodeW = 96
  const nodeH = 64
  const margin = 64
  const usable = Math.max(width - margin * 2, nodeW)
  const count = NODE_SHAPE_KINDS.length
  const gap = count > 1 ? usable / (count - 1) : 0
  const centerY = laneHeight / 2 + 14
  const centers = NODE_SHAPE_KINDS.map((_, i) => margin + gap * i)
  const selectedIndex = 1 // the "rounded" node demonstrates the selected ring + keyline

  const connectors = centers
    .slice(0, -1)
    .map((cx, i) => {
      const nextCx = centers[i + 1]
      if (nextCx === undefined) return ''
      const active = i === selectedIndex
      return curvedConnector(cx + nodeW / 2, centerY, nextCx - nodeW / 2, centerY, {
        className: active ? 'connector active' : 'connector',
      })
    })
    .join('\n    ')

  const nodes = NODE_SHAPE_KINDS.map((kind, i) => {
    const cx = centers[i] ?? 0
    const selected = i === selectedIndex
    const status = NODE_STATUS_CYCLE[i % NODE_STATUS_CYCLE.length] || ''
    const shape = shapeByKind(kind, cx, centerY, nodeW, nodeH)
    const keyline = selected ? shapeByKind(kind, cx, centerY, nodeW * 1.16, nodeH * 1.16, 'node-keyline') : ''
    const classes = selected ? 'node selected' : 'node'
    const statusAttr = status ? ` data-status="${status}"` : ''
    return `<g class="${classes}" data-shape="${kind}"${statusAttr}>
      ${shape}
      ${keyline}
      <text class="node-label" x="${cx}" y="${centerY + nodeH / 2 + 18}" text-anchor="middle">${escapeHtml(NODE_LABELS[kind])}</text>
      <text class="node-sub" x="${cx}" y="${centerY + nodeH / 2 + 34}" text-anchor="middle">${status ? escapeHtml(status) : 'idle'}</text>
    </g>`
  }).join('\n    ')

  return `<section class="section">
    <h2>Workflow Lab</h2>
    <svg viewBox="0 0 ${width} ${laneHeight}" width="100%" height="${laneHeight}" role="img" aria-label="Sample workflow lane with every node shape">
      <rect class="lane-rail" x="1" y="1" width="${width - 2}" height="${laneHeight - 2}" rx="14" />
      <text class="lane-title" x="24" y="28">shawn-runtime</text>
      ${connectors}
      ${nodes}
    </svg>
  </section>`
}

function renderRail(): string {
  return `<aside class="glass" style="flex:1 1 240px;padding:var(--sp-2);display:flex;flex-direction:column;gap:var(--sp-2);">
    <div class="section">
      <h2>Actions</h2>
      <div class="row">
        <button class="btn" type="button">Default</button>
        <button class="btn" type="button" data-state="hover">Hover</button>
        <button class="btn primary" type="button">Primary</button>
        <button class="btn" type="button" data-state="focus">Focus</button>
        <button class="btn" type="button" disabled>Disabled</button>
      </div>
    </div>
  </aside>`
}

function renderInspector(): string {
  return `<section class="glass" style="flex:1 1 280px;padding:var(--sp-2);display:flex;flex-direction:column;gap:var(--sp-2);">
    <div class="section">
      <h2>Inspector</h2>
      <div class="field">
        <label for="preview-node-name">Name</label>
        <input id="preview-node-name" type="text" value="lane-3 / step-2" readonly />
      </div>
      <div class="field">
        <label for="preview-node-status">Status</label>
        <select id="preview-node-status">
          <option>queued</option>
          <option selected>running</option>
          <option>done</option>
        </select>
      </div>
    </div>
  </section>`
}

function renderStatusAndToast(mode: ThemeMode): string {
  return `<div class="row">
    <span class="status" data-kind="ok">Saved</span>
    <span class="status">Autosaving…</span>
    <span class="status" data-kind="error">Sync failed</span>
  </div>
  <div class="toast">Theme applied — <span class="mono">${escapeHtml(mode)}</span> mode</div>`
}

/** Given ThemeTokens (+ mode), produces a self-contained HTML preview document. */
export function renderPreview(tokens: ThemeTokens, options: RenderPreviewOptions = {}): string {
  const mode: ThemeMode = options.mode ?? 'dark'
  const title = options.title ?? tokens.meta.name
  const width = options.width ?? 960
  const safeTitle = escapeHtml(title)
  const css = tokensToCss(tokens, mode)

  return `<!doctype html>
<html lang="en" data-preview-mode="${mode}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle} — preview</title>
<style>${css}</style>
</head>
<body>
<div class="preview" style="max-width:${width}px;margin:0 auto;padding:var(--sp-3);display:flex;flex-direction:column;gap:var(--sp-3);">
  <header class="row" style="justify-content:space-between;">
    <h1 style="margin:0;font-size:var(--fs-lg);">${safeTitle}</h1>
    <span class="badge">${escapeHtml(tokens.meta.provenance)} · ${escapeHtml(mode)}</span>
  </header>
  ${renderLane(width)}
  <div class="row" style="align-items:flex-start;">
    ${renderInspector()}
    ${renderRail()}
  </div>
  ${renderStatusAndToast(mode)}
</div>
</body>
</html>
`
}

interface ContrastRow {
  label: string
  fg: string
  bg: string
  kind: ContrastKind
  ratio: number
  pass: boolean
}

function buildContrastRows(tokens: ThemeTokens, mode: ThemeMode): ContrastRow[] {
  const colors: SemanticColors = tokens.modes[mode]
  const compositedSurface = compositeOver(colors.surface, colors.surfaceAlpha, colors.bg)
  const buttonBg = resolveSemanticRef(colors, tokens.components.button.bg)
  const buttonText = resolveSemanticRef(colors, tokens.components.button.text)

  const specs: Array<{ label: string; fg: string; bg: string; kind: ContrastKind }> = [
    { label: 'Text on background', fg: colors.text, bg: colors.bg, kind: 'text' },
    { label: 'Text on surface (composited)', fg: colors.text, bg: compositedSurface, kind: 'text' },
    { label: 'Muted text on background', fg: colors.textMuted, bg: colors.bg, kind: 'text' },
    { label: 'Link on background', fg: colors.link, bg: colors.bg, kind: 'text' },
    { label: 'Button text on button', fg: buttonText, bg: buttonBg, kind: 'non-text' },
    { label: 'Focus ring on background', fg: colors.focusRing, bg: colors.bg, kind: 'non-text' },
  ]

  return specs.map((spec) => {
    const ratio = contrastRatio(spec.fg, spec.bg)
    return { ...spec, ratio, pass: passesContrast(ratio, spec.kind) }
  })
}

function renderContrastTable(rows: ContrastRow[]): string {
  const body = rows
    .map((row) => {
      const cls = row.pass ? 'pass' : 'fail'
      const mark = row.pass ? 'PASS' : 'FAIL'
      return `<tr><td>${escapeHtml(row.label)}</td><td class="mono">${row.ratio.toFixed(2)}:1</td><td class="mono">${CONTRAST_MIN[row.kind]}:1</td><td class="${cls}">${mark}</td></tr>`
    })
    .join('')
  return `<table class="contrast"><thead><tr><th>Pair</th><th>Ratio</th><th>Min</th><th>Result</th></tr></thead><tbody>${body}</tbody></table>`
}

function renderGalleryCard(tokens: ThemeTokens, mode: ThemeMode): string {
  const rows = buildContrastRows(tokens, mode)
  const miniPreview = renderPreview(tokens, { mode, title: tokens.meta.name, width: 480 })
  const safeName = escapeHtml(tokens.meta.name)
  const safeFamily = escapeHtml(tokens.meta.family)
  const safeId = escapeHtml(tokens.meta.id)
  const safeProvenance = escapeHtml(tokens.meta.provenance)
  return `<article class="theme-card glass" data-theme-id="${safeId}">
    <header class="row" style="justify-content:space-between;align-items:baseline;">
      <div>
        <h3 style="margin:0;">${safeName}</h3>
        <div class="muted mono" style="font-size:var(--fs-sm);">${safeFamily} · ${safeId}</div>
      </div>
      <span class="badge">${safeProvenance}</span>
    </header>
    <iframe class="mini-preview" title="${safeName} preview" srcdoc="${escapeHtml(miniPreview)}"></iframe>
    ${renderContrastTable(rows)}
  </article>`
}

const FALLBACK_CHROME_CSS = `
:root { --c-bg:#11121A; --c-text:#F5F3FF; --c-muted:#C4B5FD; --c-border:rgb(196 181 253 / .22); --c-surface-rgb:36 25 58; --surface-alpha:.82; --c-surface: rgb(var(--c-surface-rgb) / var(--surface-alpha)); --radius:14px; --radius-sm:8px; --sp-1:.5rem; --sp-2:1rem; --sp-3:1.5rem; --font-sans:ui-sans-serif,system-ui,sans-serif; --font-mono:ui-monospace,monospace; --fs-sm:.8125rem; --fs-md:.9375rem; --fs-lg:1.125rem; }
body { margin:0; background:var(--c-bg); color:var(--c-text); font:var(--fs-md)/1.45 var(--font-sans); }
`.trim()

const GALLERY_GRID_CSS = `
.gallery-page { max-width: 1400px; margin: 0 auto; padding: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-3); }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: var(--sp-3); }
.theme-card { padding: var(--sp-2); display: flex; flex-direction: column; gap: var(--sp-2); }
.mini-preview { width: 100%; height: 260px; border: 1px solid var(--c-border); border-radius: var(--radius-sm); background: var(--c-bg); }
table.contrast { width: 100%; border-collapse: collapse; font-size: var(--fs-sm); }
table.contrast td, table.contrast th { padding: 4px 8px; border-bottom: 1px solid var(--c-border); text-align: left; }
.pass { color: var(--c-success, #6EE7B7); }
.fail { color: var(--c-danger, #FCA5A5); }
`.trim()

/** One HTML page listing every theme's preview and contrast ratios for a single mode. */
export function renderGallery(themes: ThemeTokens[], mode: ThemeMode): string {
  const chromeTokens = themes[0]
  const chromeCss = chromeTokens ? tokensToCss(chromeTokens, mode) : FALLBACK_CHROME_CSS
  const cards = themes.map((t) => renderGalleryCard(t, mode)).join('\n')
  const count = themes.length
  return `<!doctype html>
<html lang="en" data-preview-mode="${mode}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Theme gallery — ${escapeHtml(mode)}</title>
<style>${chromeCss}\n${GALLERY_GRID_CSS}</style>
</head>
<body>
<div class="gallery-page">
  <header>
    <h1 style="margin:0;">Theme gallery — ${escapeHtml(mode)} mode</h1>
    <p class="muted">${count} theme${count === 1 ? '' : 's'}</p>
  </header>
  <div class="gallery-grid">
    ${cards}
  </div>
</div>
</body>
</html>
`
}
