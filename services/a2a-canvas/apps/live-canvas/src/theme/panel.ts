/**
 * The theme maker panel: mounts into a container element and lets the
 * member pick a theme, nudge its accent/surface-opacity, flip light/dark,
 * and read the live contrast probe before committing with Apply.
 *
 * DOM-only file — kept separate from the pure theme/*.ts modules so those
 * stay importable under plain `node --test`.
 */
import type { ThemeMode, SemanticColors } from '../../../../packages/shared/src/theme-tokens.ts'
import type {
  MountThemePanel, ThemeApi, Store, AppState, ThemeTokens, ThemeId, ThemePatch, ContrastProbeResult,
} from '../contracts.ts'

const ALPHA_MIN = 0.6
const ALPHA_MAX = 0.95
const ALPHA_STEP = 0.01
const ALPHA_REFERENCE_MIN = 0.78
const ALPHA_REFERENCE_MAX = 0.86

function sameOverrides(a: ThemePatch | undefined, b: ThemePatch | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

export const mountThemePanel: MountThemePanel = (container, deps) => {
  const { theme, store } = deps

  let themes = theme.list()
  let baseTheme: ThemeTokens = themes[0] as ThemeTokens
  let overrides: ThemePatch | undefined
  let mode: ThemeMode =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark'

  /* ---- build DOM (once) --------------------------------------------------- */
  const section = document.createElement('section')
  section.className = 'section'

  const h2 = document.createElement('h2')
  h2.textContent = 'Theme'
  section.appendChild(h2)

  function makeField(labelText: string, id: string, control: HTMLElement): { field: HTMLDivElement; row: HTMLDivElement } {
    const field = document.createElement('div')
    field.className = 'field'
    const label = document.createElement('label')
    label.setAttribute('for', id)
    label.textContent = labelText
    const row = document.createElement('div')
    row.className = 'row'
    row.appendChild(control)
    field.append(label, row)
    return { field, row }
  }

  // Theme select + provenance badge.
  const themeSelect = document.createElement('select')
  themeSelect.id = 'theme-select'
  const provenanceBadge = document.createElement('span')
  provenanceBadge.className = 'muted mono'
  const { field: themeField, row: themeRow } = makeField('Theme', 'theme-select', themeSelect)
  themeRow.appendChild(provenanceBadge)
  section.appendChild(themeField)

  // Accent colour.
  const accentInput = document.createElement('input')
  accentInput.type = 'color'
  accentInput.id = 'theme-accent'
  const { field: accentField } = makeField('Accent colour', 'theme-accent', accentInput)
  section.appendChild(accentField)

  // Surface opacity.
  const alphaInput = document.createElement('input')
  alphaInput.type = 'range'
  alphaInput.id = 'theme-alpha'
  alphaInput.min = String(ALPHA_MIN)
  alphaInput.max = String(ALPHA_MAX)
  alphaInput.step = String(ALPHA_STEP)
  const alphaReadout = document.createElement('output')
  alphaReadout.setAttribute('for', 'theme-alpha')
  alphaReadout.className = 'mono'
  const { field: alphaField, row: alphaRow } = makeField('Surface opacity', 'theme-alpha', alphaInput)
  alphaRow.appendChild(alphaReadout)
  const alphaNote = document.createElement('div')
  alphaNote.className = 'muted'
  alphaNote.hidden = true
  alphaField.appendChild(alphaNote)
  section.appendChild(alphaField)

  // Mode toggle.
  const modeSelect = document.createElement('select')
  modeSelect.id = 'theme-mode'
  for (const m of ['dark', 'light'] as const) {
    const opt = document.createElement('option')
    opt.value = m
    opt.textContent = m === 'dark' ? 'Dark' : 'Light'
    modeSelect.appendChild(opt)
  }
  const { field: modeField } = makeField('Mode', 'theme-mode', modeSelect)
  section.appendChild(modeField)

  // Probe results.
  const probeWrap = document.createElement('div')
  probeWrap.className = 'section'
  const probeHeading = document.createElement('h2')
  probeHeading.textContent = 'Contrast probe'
  const probeList = document.createElement('ul')
  probeList.style.listStyle = 'none'
  probeList.style.margin = '0'
  probeList.style.padding = '0'
  probeWrap.append(probeHeading, probeList)
  section.appendChild(probeWrap)

  // Apply / revert.
  const btnRow = document.createElement('div')
  btnRow.className = 'row'
  const applyBtn = document.createElement('button')
  applyBtn.type = 'button'
  applyBtn.className = 'btn primary'
  applyBtn.textContent = 'Apply'
  const revertBtn = document.createElement('button')
  revertBtn.type = 'button'
  revertBtn.className = 'btn'
  revertBtn.textContent = 'Revert'
  btnRow.append(applyBtn, revertBtn)
  section.appendChild(btnRow)

  container.appendChild(section)

  /* ---- option population ---------------------------------------------------- */
  function populateThemeOptions(): void {
    themeSelect.innerHTML = ''
    for (const t of themes) {
      const opt = document.createElement('option')
      opt.value = t.meta.id
      opt.textContent = `${t.meta.name} — ${t.meta.provenance}`
      themeSelect.appendChild(opt)
    }
  }
  populateThemeOptions()

  /* ---- helpers --------------------------------------------------------------- */
  function currentTokens(): ThemeTokens {
    return theme.withOverrides(baseTheme, overrides)
  }

  /** Only the fields the controls actually changed, relative to the base theme. */
  function buildOverridesFromControls(): ThemePatch | undefined {
    const baseSem: SemanticColors = baseTheme.modes[mode]
    const accentVal = accentInput.value.toUpperCase()
    const alphaVal = Number(alphaInput.value)
    const changedAccent = accentVal !== baseSem.accent.toUpperCase()
    const changedAlpha = Math.abs(alphaVal - baseSem.surfaceAlpha) > 1e-9
    if (!changedAccent && !changedAlpha) return undefined
    const modePatch: { accent?: string; surfaceAlpha?: number } = {}
    if (changedAccent) modePatch.accent = accentVal
    if (changedAlpha) modePatch.surfaceAlpha = alphaVal
    return mode === 'light' ? { modes: { light: modePatch } } : { modes: { dark: modePatch } }
  }

  function updateAlphaReadout(): void {
    const v = Number(alphaInput.value)
    alphaReadout.textContent = `${Math.round(v * 100)}%`
    const inBand = v >= ALPHA_REFERENCE_MIN && v <= ALPHA_REFERENCE_MAX
    alphaNote.hidden = inBand
    alphaNote.textContent = inBand ? '' : `Outside the ${Math.round(ALPHA_REFERENCE_MIN * 100)}–${Math.round(ALPHA_REFERENCE_MAX * 100)}% reference glass band.`
  }

  function setAccentAlphaDisplay(sem: SemanticColors): void {
    if (document.activeElement !== accentInput) accentInput.value = sem.accent
    if (document.activeElement !== alphaInput) alphaInput.value = String(sem.surfaceAlpha)
    updateAlphaReadout()
  }

  function refreshProvenanceBadge(): void {
    provenanceBadge.textContent = baseTheme.meta.provenance
  }

  function renderProbe(result: ContrastProbeResult): void {
    probeList.innerHTML = ''
    for (const check of result.checks) {
      const li = document.createElement('li')
      li.className = 'row'
      const label = document.createElement('span')
      label.textContent = `${check.name} — ${check.ratio.toFixed(2)}:1 (needs ${check.required}:1)`
      const badge = document.createElement('span')
      badge.className = 'mono'
      badge.textContent = check.passed ? 'pass' : 'fail'
      badge.style.color = check.passed ? 'var(--c-success)' : 'var(--c-danger)'
      li.append(label, badge)
      probeList.appendChild(li)
    }
  }

  function refreshProbe(): void {
    renderProbe(theme.probe(currentTokens(), mode))
  }

  function refreshApplyDisabled(state: AppState): void {
    const doc = state.doc
    const same = baseTheme.meta.id === doc.themeId && sameOverrides(overrides, doc.themeOverrides)
    applyBtn.disabled = same
  }

  function livePreview(): void {
    theme.apply(currentTokens(), { mode })
  }

  function notifyControlChange(): void {
    overrides = buildOverridesFromControls()
    livePreview()
    store.dispatch({ type: 'theme.preview', themeId: baseTheme.meta.id, overrides })
    refreshProbe()
    refreshApplyDisabled(store.getState())
  }

  /* ---- events ------------------------------------------------------------------ */
  themeSelect.addEventListener('change', () => {
    const found = theme.get(themeSelect.value as ThemeId)
    if (found) baseTheme = found
    overrides = undefined
    setAccentAlphaDisplay(baseTheme.modes[mode])
    refreshProvenanceBadge()
    notifyControlChange()
  })

  accentInput.addEventListener('input', () => notifyControlChange())

  alphaInput.addEventListener('input', () => {
    updateAlphaReadout()
    notifyControlChange()
  })

  modeSelect.addEventListener('change', () => {
    mode = modeSelect.value === 'light' ? 'light' : 'dark'
    setAccentAlphaDisplay(theme.withOverrides(baseTheme, overrides).modes[mode])
    notifyControlChange()
  })

  applyBtn.addEventListener('click', () => {
    store.dispatch({ type: 'theme.apply', themeId: baseTheme.meta.id, overrides })
  })

  revertBtn.addEventListener('click', () => {
    const state = store.getState()
    const found = theme.get(state.doc.themeId)
    if (found) baseTheme = found
    overrides = state.doc.themeOverrides
    if (document.activeElement !== themeSelect) themeSelect.value = baseTheme.meta.id
    refreshProvenanceBadge()
    setAccentAlphaDisplay(currentTokens().modes[mode])
    livePreview()
    store.dispatch({ type: 'theme.preview', themeId: baseTheme.meta.id, overrides })
    refreshProbe()
    refreshApplyDisabled(store.getState())
  })

  /* ---- external sync ------------------------------------------------------------ */
  function syncFromState(state: AppState): void {
    // Re-list in case the store loaded custom/additional theme docs; cheap and idempotent.
    const nextThemes = theme.list()
    if (nextThemes.length !== themes.length || nextThemes.some((t, i) => t.meta.id !== themes[i]?.meta.id)) {
      themes = nextThemes
      populateThemeOptions()
    }

    const found = theme.get(state.previewThemeId)
    if (found) baseTheme = found
    overrides = state.previewOverrides

    if (document.activeElement !== themeSelect) themeSelect.value = baseTheme.meta.id
    refreshProvenanceBadge()
    setAccentAlphaDisplay(currentTokens().modes[mode])
    refreshProbe()
    refreshApplyDisabled(state)
  }

  syncFromState(store.getState())

  return {
    update(state: AppState): void {
      syncFromState(state)
    },
    destroy(): void {
      section.remove()
    },
  }
}
