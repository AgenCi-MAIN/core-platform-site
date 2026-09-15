/**
 * The control rail: header badge, one card per workflow (Run/Cancel/Focus),
 * the hosted theme panel, and document actions (save/reload/reset/undo/
 * redo/export).
 */
import type { AppState, CanvasWorkflow, CardId, RunRecord, WorkflowId } from '../contracts.ts'
import type { UiDeps, UiPanel } from './types.ts'
import { performSave, performUndo, performRedo } from './actions.ts'
import { safeJson, shortId } from './format.ts'
import { clear, h } from './dom.ts'

interface LaneRefs {
  card: HTMLElement
  name: HTMLElement
  summary: HTMLElement
  count: HTMLElement
  runInfo: HTMLElement
  runBtn: HTMLButtonElement
  cancelBtn: HTMLButtonElement
  focusBtn: HTMLButtonElement
}

function latestRun(state: AppState, workflowId: WorkflowId): RunRecord | undefined {
  let best: RunRecord | undefined
  for (const run of Object.values(state.runs)) {
    if (run.workflowId !== workflowId) continue
    if (!best || run.startedAt > best.startedAt) best = run
  }
  return best
}

function runningRunFor(state: AppState, workflowId: WorkflowId): RunRecord | undefined {
  for (const run of Object.values(state.runs)) {
    if (run.workflowId === workflowId && run.state === 'running') return run
  }
  return undefined
}

function firstCardId(wf: CanvasWorkflow): CardId | undefined {
  let first: CanvasWorkflow['cards'][number] | undefined
  for (const c of wf.cards) {
    if (!first || c.order < first.order) first = c
  }
  return first?.id
}

export function mountRail(root: HTMLElement, deps: UiDeps): UiPanel {
  clear(root)

  const header = h('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2)' }, [
    h('h1', { style: 'margin:0;font-size:var(--fs-lg)' }, ['A2A Canvas']),
    h('span', { class: 'mono muted' }, ['shawn-runtime']),
  ])

  const lanesList = h('div', { class: 'section' })
  const lanesSection = h('div', { class: 'section' }, [h('h2', {}, ['Lanes']), lanesList])

  const themeContainer = h('div', { class: 'section' })
  const themeSection = h('div', { class: 'section' }, [h('h2', {}, ['Theme']), themeContainer])

  const exportArea = h('textarea', { class: 'mono', readonly: true, rows: 10, hidden: true, style: 'width:100%' })
  const saveBtn = h('button', { class: 'btn', type: 'button' }, ['Save'])
  const reloadBtn = h('button', { class: 'btn', type: 'button' }, ['Reload'])
  const resetBtn = h('button', { class: 'btn', type: 'button' }, ['Reset'])
  const undoBtn = h('button', { class: 'btn', type: 'button' }, ['Undo'])
  const redoBtn = h('button', { class: 'btn', type: 'button' }, ['Redo'])
  const exportBtn = h('button', { class: 'btn', type: 'button' }, ['Export'])

  const docSection = h('div', { class: 'section' }, [
    h('h2', {}, ['Document']),
    h('div', { class: 'row' }, [saveBtn, reloadBtn, resetBtn, undoBtn, redoBtn, exportBtn]),
    exportArea,
  ])

  root.append(header, lanesSection, themeSection, docSection)

  const themePanel = deps.themePanel(themeContainer, { theme: deps.theme, store: deps.store })

  const laneRefs = new Map<string, LaneRefs>()

  function buildLaneCard(wf: CanvasWorkflow): LaneRefs {
    const name = h('div', {}, [wf.name])
    const summary = h('div', { class: 'muted' })
    const count = h('div', { class: 'muted' })
    const runInfo = h('div', { class: 'mono muted' })

    const runBtn = h('button', { class: 'btn primary', type: 'button' }, ['Run'])
    const cancelBtn = h('button', { class: 'btn', type: 'button', hidden: true }, ['Cancel'])
    const focusBtn = h('button', { class: 'btn', type: 'button' }, ['Focus'])

    runBtn.addEventListener('click', () => {
      const state = deps.store.getState()
      const current = state.doc.workflows.find(w => w.id === wf.id)
      if (!current) return
      if (runningRunFor(state, current.id)) return
      void deps.runtime.run(current, { themeApi: deps.theme, timeoutMs: 2000 }).done.catch(() => {})
    })
    cancelBtn.addEventListener('click', () => {
      const running = runningRunFor(deps.store.getState(), wf.id)
      if (running) deps.runtime.cancel(running.runId)
    })
    focusBtn.addEventListener('click', () => {
      deps.store.dispatch({ type: 'workflow.activate', workflowId: wf.id })
      const current = deps.store.getState().doc.workflows.find(w => w.id === wf.id)
      const cardId = current ? firstCardId(current) : undefined
      if (cardId) deps.canvas.focusNode(cardId)
    })

    const card = h('div', {
      class: 'section',
      style: 'border:1px solid var(--c-border);border-radius:var(--radius-sm);padding:var(--sp-1)',
    }, [
      name, summary, count, runInfo,
      h('div', { class: 'row' }, [runBtn, cancelBtn, focusBtn]),
    ])

    return { card, name, summary, count, runInfo, runBtn, cancelBtn, focusBtn }
  }

  function updateLanes(state: AppState): void {
    const seen = new Set<string>()
    for (const wf of state.doc.workflows) {
      seen.add(wf.id)
      let refs = laneRefs.get(wf.id)
      if (!refs) {
        refs = buildLaneCard(wf)
        laneRefs.set(wf.id, refs)
        lanesList.append(refs.card)
      }
      refs.name.textContent = wf.name
      refs.summary.textContent = wf.summary ?? ''
      refs.summary.hidden = !wf.summary
      refs.count.textContent = `${wf.cards.length} node${wf.cards.length === 1 ? '' : 's'}`

      const run = latestRun(state, wf.id)
      refs.runInfo.textContent = run ? `${run.state} · ${shortId(run.runId)}` : 'No runs yet'

      const running = runningRunFor(state, wf.id)
      refs.runBtn.disabled = Boolean(running)
      refs.cancelBtn.hidden = !running
    }
    for (const [id, refs] of laneRefs) {
      if (!seen.has(id)) {
        refs.card.remove()
        laneRefs.delete(id)
      }
    }
  }

  saveBtn.addEventListener('click', () => performSave(deps))

  reloadBtn.addEventListener('click', () => {
    const result = deps.persistence.load()
    if (!result.ok) {
      deps.notify('error', `Reload failed: ${result.error}`)
      return
    }
    if (result.value) {
      deps.store.dispatch({ type: 'doc.load', doc: result.value })
      deps.notify('ok', 'Reloaded')
    } else {
      deps.notify('info', 'Nothing saved yet')
    }
  })

  resetBtn.addEventListener('click', () => {
    if (!globalThis.confirm('Reset the saved document? This clears what is saved locally.')) return
    deps.store.dispatch({ type: 'save.status', status: { kind: 'idle' } })
    const result = deps.persistence.clear()
    if (!result.ok) {
      deps.notify('error', `Reset failed: ${result.error}`)
      return
    }
    deps.notify('info', 'Reload the page to reseed')
  })

  undoBtn.addEventListener('click', () => performUndo(deps))
  redoBtn.addEventListener('click', () => performRedo(deps))

  exportBtn.addEventListener('click', () => {
    exportArea.hidden = !exportArea.hidden
    if (!exportArea.hidden) exportArea.value = safeJson(deps.store.getState().doc, 200000)
  })

  const unsubscribeRuntime = deps.runtime.subscribe(event => {
    deps.store.dispatch({ type: 'run.event', event })
  })

  function update(state: AppState): void {
    updateLanes(state)
    undoBtn.disabled = !state.canUndo
    redoBtn.disabled = !state.canRedo
    themePanel.update(state)
    if (!exportArea.hidden) exportArea.value = safeJson(state.doc, 200000)
  }

  function destroy(): void {
    unsubscribeRuntime()
    themePanel.destroy()
    clear(root)
    laneRefs.clear()
  }

  return { update, destroy }
}
