/**
 * The inspector: card fields (title/kind/shape/config + last run), lane
 * rename, or hidden when nothing is selected.
 */
import type { AppState, CanvasNode, CanvasWorkflow, CardId, LaneId, NodeKind, RunRecord, ShapeKind } from '../contracts.ts'
import { NODE_KIND_META, NODE_KINDS, SHAPE_KINDS } from '../contracts.ts'
import type { UiDeps, UiPanel } from './types.ts'
import { parseConfig, safeJson } from './format.ts'
import { clear, h } from './dom.ts'

function findCard(state: AppState, cardId: CardId): { workflow: CanvasWorkflow; card: CanvasNode } | undefined {
  for (const wf of state.doc.workflows) {
    const card = wf.cards.find(c => c.id === cardId)
    if (card) return { workflow: wf, card }
  }
  return undefined
}

function findLaneTitle(state: AppState, laneId: LaneId): string | undefined {
  for (const wf of state.doc.workflows) {
    const lane = wf.lanes.find(l => l.id === laneId)
    if (lane) return lane.title
  }
  return undefined
}

function latestRunFor(state: AppState, workflowId: CanvasWorkflow['id']): RunRecord | undefined {
  let best: RunRecord | undefined
  for (const run of Object.values(state.runs)) {
    if (run.workflowId !== workflowId) continue
    if (!best || run.startedAt > best.startedAt) best = run
  }
  return best
}

function stamp(): string {
  return new Date().toISOString()
}

export function mountInspector(root: HTMLElement, deps: UiDeps): UiPanel {
  let mode: 'none' | 'card' | 'lane' = 'none'
  let currentId = ''

  let titleInput: HTMLInputElement | null = null
  let kindSelect: HTMLSelectElement | null = null
  let shapeSelect: HTMLSelectElement | null = null
  let configArea: HTMLTextAreaElement | null = null
  let configError: HTMLElement | null = null
  let lastRunBlock: HTMLElement | null = null

  function renderCard(cardId: CardId): void {
    clear(root)
    mode = 'card'
    currentId = cardId

    titleInput = h('input', { type: 'text' })
    kindSelect = h('select', {}, NODE_KINDS.map(k => h('option', { value: k }, [NODE_KIND_META[k].label])))
    shapeSelect = h('select', {}, SHAPE_KINDS.map(s => h('option', { value: s }, [s])))
    configArea = h('textarea', { class: 'mono', rows: 8, style: 'width:100%' })
    configError = h('div', { class: 'muted', style: 'color:var(--c-danger)', hidden: true })
    lastRunBlock = h('div', { class: 'section mono' })
    const removeBtn = h('button', { class: 'btn', type: 'button' }, ['Remove'])

    titleInput.addEventListener('change', () => {
      deps.store.dispatch({
        type: 'workflow.event',
        event: { type: 'card.updated', cardId, patch: { title: titleInput?.value ?? '' }, at: stamp() },
      })
    })
    kindSelect.addEventListener('change', () => {
      deps.store.dispatch({ type: 'node.kind', cardId, kind: (kindSelect?.value ?? '') as NodeKind })
    })
    shapeSelect.addEventListener('change', () => {
      deps.store.dispatch({ type: 'node.shape', cardId, shape: (shapeSelect?.value ?? '') as ShapeKind })
    })
    configArea.addEventListener('blur', () => {
      const result = parseConfig(configArea?.value ?? '')
      if (!configError) return
      if (result.ok) {
        configError.hidden = true
        deps.store.dispatch({ type: 'node.config', cardId, config: result.value })
      } else {
        configError.hidden = false
        configError.textContent = result.error
      }
    })
    removeBtn.addEventListener('click', () => {
      deps.store.dispatch({ type: 'workflow.event', event: { type: 'card.removed', cardId, at: stamp() } })
    })

    root.append(
      h('div', { class: 'section' }, [
        h('div', { class: 'field' }, [h('label', {}, ['Title']), titleInput]),
        h('div', { class: 'field' }, [h('label', {}, ['Kind']), kindSelect]),
        h('div', { class: 'field' }, [h('label', {}, ['Shape']), shapeSelect]),
        h('div', { class: 'field' }, [h('label', {}, ['Config']), configArea, configError]),
      ]),
      h('div', { class: 'section' }, [h('h2', {}, ['Last run']), lastRunBlock]),
      h('div', { class: 'row' }, [removeBtn]),
    )
  }

  function patchCard(state: AppState, cardId: CardId): void {
    const found = findCard(state, cardId)
    if (!found || !titleInput || !kindSelect || !shapeSelect || !configArea || !lastRunBlock) return
    const { workflow, card } = found

    if (document.activeElement !== titleInput) titleInput.value = card.title
    if (document.activeElement !== kindSelect) kindSelect.value = card.kind
    if (document.activeElement !== shapeSelect) shapeSelect.value = card.shape
    if (document.activeElement !== configArea) configArea.value = safeJson(card.config, 4000)

    clear(lastRunBlock)
    const run = latestRunFor(state, workflow.id)
    const summary = run?.nodeResults[cardId]
    if (!summary) {
      lastRunBlock.append(h('div', { class: 'muted' }, ['No run yet']))
      return
    }
    lastRunBlock.append(
      h('div', {}, [`state: ${summary.state}`]),
      h('div', {}, [`attempts: ${summary.attempts}`]),
      h('div', {}, [`started: ${summary.startedAt}`]),
      h('div', {}, [`finished: ${summary.finishedAt ?? '—'}`]),
    )
    if (summary.error) {
      lastRunBlock.append(h('div', { style: 'color:var(--c-danger)' }, [`error: ${summary.error}`]))
    } else if (summary.output !== undefined) {
      lastRunBlock.append(h('pre', { class: 'mono', style: 'white-space:pre-wrap;margin:0' }, [safeJson(summary.output, 2000)]))
    }
  }

  function renderLane(laneId: LaneId): void {
    clear(root)
    mode = 'lane'
    currentId = laneId

    titleInput = h('input', { type: 'text' })
    titleInput.addEventListener('change', () => {
      deps.store.dispatch({
        type: 'workflow.event',
        event: { type: 'lane.renamed', laneId, title: titleInput?.value ?? '', at: stamp() },
      })
    })
    root.append(h('div', { class: 'section' }, [
      h('div', { class: 'field' }, [h('label', {}, ['Lane title']), titleInput]),
    ]))
  }

  function patchLane(state: AppState, laneId: LaneId): void {
    if (!titleInput) return
    const title = findLaneTitle(state, laneId)
    if (title === undefined) return
    if (document.activeElement !== titleInput) titleInput.value = title
  }

  function renderNone(): void {
    clear(root)
    mode = 'none'
    currentId = ''
    titleInput = null
    kindSelect = null
    shapeSelect = null
    configArea = null
    configError = null
    lastRunBlock = null
  }

  function update(state: AppState): void {
    const { cardIds, laneIds } = state.selection
    if (cardIds.length === 1) {
      const cardId = cardIds[0]
      if (cardId === undefined) return
      root.hidden = false
      if (mode !== 'card' || currentId !== cardId) renderCard(cardId)
      patchCard(state, cardId)
      return
    }
    if (cardIds.length === 0 && laneIds.length === 1) {
      const laneId = laneIds[0]
      if (laneId === undefined) return
      root.hidden = false
      if (mode !== 'lane' || currentId !== laneId) renderLane(laneId)
      patchLane(state, laneId)
      return
    }
    root.hidden = true
    if (mode !== 'none') renderNone()
  }

  function destroy(): void {
    clear(root)
  }

  root.hidden = true
  return { update, destroy }
}
