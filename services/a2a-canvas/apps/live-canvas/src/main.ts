/**
 * Integrator entry point: wires the five modules (theme, canvas, runtime,
 * state, ui) through the interfaces in contracts.ts and boots the page.
 *
 * Boot order: theme api → persistence (localStorage when available, memory
 * otherwise) → seed or restore the document → store → runtime → canvas →
 * shell → apply the saved theme → first render.
 */
import { createThemeApi, mountThemePanel } from './theme/index.ts'
import { mountCanvas } from './canvas/index.ts'
import { absolutizePositions, computeLayout } from './canvas/layout.ts'
import { createRuntime } from './runtime/index.ts'
import { createStore, createLocalStoragePersistence, createMemoryPersistence, createSeedFactory } from './state/index.ts'
import { mountShell } from './ui/index.ts'
import type { AppState, CanvasDoc, Persistence } from './contracts.ts'
import { asId } from '../../../packages/shared/src/index.ts'
import type { EdgeId } from '../../../packages/shared/src/index.ts'

function pickPersistence(): Persistence {
  try {
    if (typeof localStorage !== 'undefined') return createLocalStoragePersistence(localStorage)
  } catch {
    /* private mode or blocked storage: fall through to memory */
  }
  return createMemoryPersistence()
}

function byId<T extends Element>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`live-canvas: missing #${id} in index.html`)
  return el as unknown as T
}

const nowIso = (): string => new Date().toISOString()

export function boot(): void {
  const theme = createThemeApi()
  const persistence = pickPersistence()
  const seeds = createSeedFactory()
  const themes = theme.list()
  const defaultThemeId = themes[0]?.meta.id
  if (!defaultThemeId) throw new Error('live-canvas: theme module returned no themes')

  const loaded = persistence.load()
  const restored = loaded.ok && loaded.value ? loaded.value : null
  // Seed positions are lane-relative; the canvas stores absolute positions.
  const doc: CanvasDoc = restored ?? absolutizePositions(seeds.defaultDoc(defaultThemeId))

  const store = createStore(doc)
  const runtime = createRuntime({})

  const canvas = mountCanvas(byId<SVGSVGElement>('canvas'), {
    dispatch: (action) => store.dispatch(action),
    onEditLabel: (cardId, text) =>
      store.dispatch({ type: 'workflow.event', event: { type: 'card.updated', cardId, patch: { title: text }, at: nowIso() } }),
    onCreateNode: (laneId, at) =>
      store.dispatch({ type: 'workflow.event', event: { type: 'card.added', card: seeds.blankNode(laneId, 'transform', at), at: nowIso() } }),
    onConnect: (from, to) =>
      store.dispatch({
        type: 'workflow.event',
        event: { type: 'edge.added', edge: { id: asId<'EdgeId'>(`edge_${crypto.randomUUID()}`) as EdgeId, from, to }, at: nowIso() },
      }),
  })

  const shell = mountShell({
    store,
    runtime,
    theme,
    persistence,
    canvas,
    themePanel: mountThemePanel,
    roots: {
      rail: byId<HTMLElement>('rail'),
      inspector: byId<HTMLElement>('inspector'),
      runlog: byId<HTMLElement>('runlog'),
      status: byId<HTMLElement>('status'),
      toasts: byId<HTMLElement>('toasts'),
    },
  })

  // Apply the document's theme before the first paint of the shell.
  const saved = theme.get(doc.themeId) ?? themes[0]
  if (saved) theme.apply(theme.withOverrides(saved, doc.themeOverrides))

  shell.mount()
  const render = (state: AppState): void => {
    canvas.render(state)
    shell.update(state)
  }
  store.subscribe((state) => render(state))
  // Fresh documents open fitted to the board's width; restored ones keep their saved viewport.
  if (!restored) {
    const layout = computeLayout(doc)
    const contentW = layout.workflows.reduce((m, wf) => Math.max(m, wf.x + wf.w), 0)
    const boardW = byId<SVGSVGElement>('canvas').clientWidth || contentW
    const zoom = Math.min(1, Math.max(0.5, (boardW - 32) / Math.max(contentW, 1)))
    store.dispatch({ type: 'viewport.set', viewport: { x: 0, y: 0, zoom } })
  }
  render(store.getState())

  if (!loaded.ok) shell.notify('error', `Saved canvas ignored: ${loaded.error}`)
  else if (restored) shell.notify('ok', `Restored saved canvas (${restored.savedAt ?? 'unknown time'})`)

  // Exposed for browser-level checks (Playwright) and for the console.
  ;(globalThis as unknown as { __a2a?: unknown }).__a2a = { store, runtime, theme, persistence, canvas, shell }
}

boot()
