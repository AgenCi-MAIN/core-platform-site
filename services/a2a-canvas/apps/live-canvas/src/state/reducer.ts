/**
 * Pure reducer: reduce(state, action, clock) -> new AppState.
 *
 * No DOM, no randomness, no Date.now() — every timestamp comes from the
 * injected clock so this file is trivially testable under node:test.
 */
import type {
  AppState, Action, CanvasDoc, CanvasWorkflow, CanvasNode, NodeKind,
  Card, Clock, CardId, LaneId, WorkflowId, WorkflowEvent, RunEvent, RunRecord,
} from '../contracts.ts'
import { NODE_KIND_META } from '../contracts.ts'
import { EMPTY_SELECTION } from '../../../../packages/shared/src/workflow.ts'
import { isoAt } from '../../../../packages/shared/src/ids.ts'

/* ---- small generic helpers -------------------------------------------------- */

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function findWorkflowByLane(doc: CanvasDoc, laneId: LaneId): CanvasWorkflow | undefined {
  return doc.workflows.find((w) => w.lanes.some((l) => l.id === laneId))
}

function findWorkflowByCard(doc: CanvasDoc, cardId: CardId): CanvasWorkflow | undefined {
  return doc.workflows.find((w) => w.cards.some((c) => c.id === cardId))
}

function updateWorkflow(doc: CanvasDoc, workflowId: WorkflowId, fn: (wf: CanvasWorkflow) => CanvasWorkflow): CanvasDoc {
  return { ...doc, workflows: doc.workflows.map((w) => (w.id === workflowId ? fn(w) : w)) }
}

/** Bumps version/updatedAt — called on every structural or node-level edit. */
function touch(wf: CanvasWorkflow, clock: Clock): CanvasWorkflow {
  return { ...wf, version: wf.version + 1, updatedAt: isoAt(clock) }
}

/** A `Card` coming off a WorkflowEvent may already be a full CanvasNode
 * (callers construct it that way) but is only typed as `Card`; fill sane
 * defaults for the canvas-only fields so the reducer never trusts an
 * unchecked cast. */
function normalizeCard(card: Card): CanvasNode {
  const raw = card as Partial<CanvasNode> & Card
  const kind: NodeKind = raw.kind && raw.kind in NODE_KIND_META ? raw.kind : 'transform'
  return {
    ...card,
    kind,
    shape: raw.shape ?? NODE_KIND_META[kind].defaultShape,
    config: raw.config ?? {},
    w: raw.w ?? 160,
    h: raw.h ?? 72,
  }
}

function laneCardsSorted(cards: CanvasNode[], laneId: LaneId): CanvasNode[] {
  return cards.filter((c) => c.laneId === laneId).sort((a, b) => a.order - b.order)
}

/** Reassigns sequential `order` (0..n-1) to every card in `laneId`, following
 * the given id order; cards outside that lane are untouched. */
function applyOrder(cards: CanvasNode[], laneId: LaneId, orderedIds: CardId[]): CanvasNode[] {
  const index = new Map<CardId, number>(orderedIds.map((id, i): [CardId, number] => [id, i]))
  return cards.map((c) => (c.laneId === laneId && index.has(c.id) ? { ...c, order: index.get(c.id) as number } : c))
}

/** Compacts a lane's order after a card has left it (or arrived), preserving
 * relative order. */
function renumberLane(cards: CanvasNode[], laneId: LaneId): CanvasNode[] {
  return applyOrder(cards, laneId, laneCardsSorted(cards, laneId).map((c) => c.id))
}

/** Places `cardId` (already present in `cards`, with its final laneId set)
 * at `toIndex` among its lane siblings and renumbers that lane. */
function placeInLane(cards: CanvasNode[], laneId: LaneId, cardId: CardId, toIndex: number): CanvasNode[] {
  const card = cards.find((c) => c.id === cardId)
  if (!card) return cards
  const others = laneCardsSorted(cards, laneId).filter((c) => c.id !== cardId)
  const idx = clamp(toIndex, 0, others.length)
  const ordered = [...others.slice(0, idx), card, ...others.slice(idx)]
  return applyOrder(cards, laneId, ordered.map((c) => c.id))
}

/* ---- workflow.event ----------------------------------------------------------- */

function applyEventToDoc(doc: CanvasDoc, event: WorkflowEvent, clock: Clock): CanvasDoc {
  switch (event.type) {
    case 'card.added': {
      const node = normalizeCard(event.card)
      const wf = findWorkflowByLane(doc, node.laneId)
      if (!wf) return doc
      if (wf.cards.some((c) => c.id === node.id)) return doc
      const withNew = [...wf.cards, node]
      const cards = applyOrder(withNew, node.laneId, laneCardsSorted(withNew, node.laneId).map((c) => c.id))
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, cards }, clock))
    }
    case 'card.removed': {
      const wf = findWorkflowByCard(doc, event.cardId)
      if (!wf) return doc
      const removed = wf.cards.find((c) => c.id === event.cardId)
      if (!removed) return doc
      const cardsRemaining = wf.cards.filter((c) => c.id !== event.cardId)
      const cards = renumberLane(cardsRemaining, removed.laneId)
      const edges = wf.edges.filter((e) => e.from !== event.cardId && e.to !== event.cardId)
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, cards, edges }, clock))
    }
    case 'card.moved': {
      const { cardId, fromLane, toLane, toIndex, position } = event
      const fromWf = findWorkflowByLane(doc, fromLane)
      const toWf = findWorkflowByLane(doc, toLane)
      if (!fromWf || !toWf) return doc
      const card = fromWf.cards.find((c) => c.id === cardId)
      if (!card) return doc
      const moved: CanvasNode = { ...card, laneId: toLane, position: position ?? card.position }

      if (fromWf.id === toWf.id) {
        let cards = fromWf.cards.map((c) => (c.id === cardId ? moved : c))
        cards = placeInLane(cards, toLane, cardId, toIndex)
        if (fromLane !== toLane) cards = renumberLane(cards, fromLane)
        return updateWorkflow(doc, fromWf.id, (w) => touch({ ...w, cards }, clock))
      }

      // Cross-workflow move: relocate the node and drop any edges that would
      // now cross workflows (they lived in the source workflow's edge list).
      const sourceCards = renumberLane(fromWf.cards.filter((c) => c.id !== cardId), fromLane)
      const sourceEdges = fromWf.edges.filter((e) => e.from !== cardId && e.to !== cardId)
      const targetCards = placeInLane([...toWf.cards, moved], toLane, cardId, toIndex)

      let next = updateWorkflow(doc, fromWf.id, (w) => touch({ ...w, cards: sourceCards, edges: sourceEdges }, clock))
      next = updateWorkflow(next, toWf.id, (w) => touch({ ...w, cards: targetCards }, clock))
      return next
    }
    case 'card.reordered': {
      const wf = findWorkflowByLane(doc, event.laneId)
      if (!wf) return doc
      if (!wf.cards.some((c) => c.id === event.cardId && c.laneId === event.laneId)) return doc
      const cards = placeInLane(wf.cards, event.laneId, event.cardId, event.toIndex)
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, cards }, clock))
    }
    case 'card.updated': {
      const wf = findWorkflowByCard(doc, event.cardId)
      if (!wf) return doc
      const cards = wf.cards.map((c) => (c.id === event.cardId ? { ...c, ...event.patch } : c))
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, cards }, clock))
    }
    case 'lane.added': {
      const wf = doc.workflows.find((w) => w.id === event.lane.workflowId)
      if (!wf) return doc
      if (wf.lanes.some((l) => l.id === event.lane.id)) return doc
      const lanes = [...wf.lanes, event.lane]
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, lanes }, clock))
    }
    case 'lane.removed': {
      const wf = doc.workflows.find((w) => w.lanes.some((l) => l.id === event.laneId))
      if (!wf) return doc
      const removedCardIds = new Set(wf.cards.filter((c) => c.laneId === event.laneId).map((c) => c.id))
      const lanes = wf.lanes.filter((l) => l.id !== event.laneId)
      const cards = wf.cards.filter((c) => c.laneId !== event.laneId)
      const edges = wf.edges.filter((e) => !removedCardIds.has(e.from) && !removedCardIds.has(e.to))
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, lanes, cards, edges }, clock))
    }
    case 'lane.renamed': {
      const wf = doc.workflows.find((w) => w.lanes.some((l) => l.id === event.laneId))
      if (!wf) return doc
      const lanes = wf.lanes.map((l) => (l.id === event.laneId ? { ...l, title: event.title } : l))
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, lanes }, clock))
    }
    case 'lane.reordered': {
      const wf = doc.workflows.find((w) => w.lanes.some((l) => l.id === event.laneId))
      if (!wf) return doc
      const sorted = [...wf.lanes].sort((a, b) => a.order - b.order)
      const idx0 = sorted.findIndex((l) => l.id === event.laneId)
      if (idx0 === -1) return doc
      const [lane] = sorted.splice(idx0, 1)
      if (!lane) return doc
      const idx = clamp(event.toIndex, 0, sorted.length)
      sorted.splice(idx, 0, lane)
      const order = new Map<LaneId, number>(sorted.map((l, i): [LaneId, number] => [l.id, i]))
      const lanes = wf.lanes.map((l) => ({ ...l, order: order.get(l.id) ?? l.order }))
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, lanes }, clock))
    }
    case 'edge.added': {
      const { edge } = event
      if (edge.from === edge.to) return doc
      const wf = findWorkflowByCard(doc, edge.from)
      if (!wf) return doc
      if (!wf.cards.some((c) => c.id === edge.to)) return doc
      if (wf.edges.some((e) => e.id === edge.id)) return doc
      if (wf.edges.some((e) => e.from === edge.from && e.to === edge.to)) return doc
      const edges = [...wf.edges, edge]
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, edges }, clock))
    }
    case 'edge.removed': {
      const wf = doc.workflows.find((w) => w.edges.some((e) => e.id === event.edgeId))
      if (!wf) return doc
      const edges = wf.edges.filter((e) => e.id !== event.edgeId)
      return updateWorkflow(doc, wf.id, (w) => touch({ ...w, edges }, clock))
    }
    default:
      return doc
  }
}

function applyWorkflowEvent(state: AppState, event: WorkflowEvent, clock: Clock): AppState {
  const doc = applyEventToDoc(state.doc, event, clock)
  if (doc === state.doc) return state
  return { ...state, doc, saveStatus: { kind: 'dirty' } }
}

/* ---- node.* --------------------------------------------------------------------- */

function updateNode(state: AppState, cardId: CardId, clock: Clock, fn: (n: CanvasNode) => CanvasNode): AppState {
  const wf = findWorkflowByCard(state.doc, cardId)
  if (!wf) return state
  const cards = wf.cards.map((c) => (c.id === cardId ? fn(c) : c))
  const doc = updateWorkflow(state.doc, wf.id, (w) => touch({ ...w, cards }, clock))
  return { ...state, doc, saveStatus: { kind: 'dirty' } }
}

/* ---- run.event ------------------------------------------------------------------ */

function setNodeStatus(doc: CanvasDoc, cardId: CardId, status: CanvasNode['status']): CanvasDoc {
  const wf = findWorkflowByCard(doc, cardId)
  if (!wf) return doc
  return updateWorkflow(doc, wf.id, (w) => ({ ...w, cards: w.cards.map((c) => (c.id === cardId ? { ...c, status } : c)) }))
}

function applyRunEvent(state: AppState, event: RunEvent): AppState {
  const prev = state.runs[event.runId]
  const base: RunRecord = prev ?? {
    runId: event.runId,
    workflowId: event.workflowId,
    state: 'running',
    startedAt: event.at,
    events: [],
    nodeResults: {},
  }
  let record: RunRecord = { ...base, events: [...base.events, event] }
  let doc = state.doc

  switch (event.type) {
    case 'run.started': {
      record = { ...record, state: 'running', startedAt: event.at }
      break
    }
    case 'node.started': {
      const prevResult = record.nodeResults[event.cardId]
      record = {
        ...record,
        nodeResults: {
          ...record.nodeResults,
          [event.cardId]: {
            runId: event.runId,
            state: 'working',
            attempts: event.attempt,
            output: prevResult?.output,
            startedAt: prevResult?.startedAt ?? event.at,
          },
        },
      }
      doc = setNodeStatus(doc, event.cardId, 'running')
      break
    }
    case 'node.finished': {
      const prevResult = record.nodeResults[event.cardId]
      record = {
        ...record,
        nodeResults: {
          ...record.nodeResults,
          [event.cardId]: {
            runId: event.runId,
            state: 'completed',
            attempts: prevResult?.attempts ?? 1,
            output: event.output,
            startedAt: prevResult?.startedAt ?? event.at,
            finishedAt: event.at,
          },
        },
      }
      doc = setNodeStatus(doc, event.cardId, 'done')
      break
    }
    case 'node.failed': {
      const prevResult = record.nodeResults[event.cardId]
      record = {
        ...record,
        nodeResults: {
          ...record.nodeResults,
          [event.cardId]: {
            runId: event.runId,
            state: event.willRetry ? 'working' : 'failed',
            attempts: prevResult?.attempts ?? 1,
            output: prevResult?.output,
            startedAt: prevResult?.startedAt ?? event.at,
            error: event.error,
            finishedAt: event.willRetry ? undefined : event.at,
          },
        },
      }
      doc = setNodeStatus(doc, event.cardId, event.willRetry ? 'running' : 'failed')
      break
    }
    case 'run.finished': {
      record = { ...record, state: 'completed', output: event.output, finishedAt: event.at }
      break
    }
    case 'run.failed': {
      record = { ...record, state: 'failed', error: event.error, finishedAt: event.at }
      if (event.cardId) doc = setNodeStatus(doc, event.cardId, 'failed')
      break
    }
    case 'run.canceled': {
      record = { ...record, state: 'canceled', finishedAt: event.at }
      break
    }
    default:
      break // a2a.request / a2a.response / a2a.timeout: already appended above
  }

  return { ...state, doc, runs: { ...state.runs, [event.runId]: record } }
}

/* ---- top-level reduce ------------------------------------------------------------ */

export function reduce(state: AppState, action: Action, clock: Clock): AppState {
  switch (action.type) {
    case 'workflow.event':
      return applyWorkflowEvent(state, action.event, clock)
    case 'workflow.activate':
      return { ...state, activeWorkflowId: action.workflowId }
    case 'node.config':
      return updateNode(state, action.cardId, clock, (n) => ({ ...n, config: action.config }))
    case 'node.shape':
      return updateNode(state, action.cardId, clock, (n) => ({ ...n, shape: action.shape }))
    case 'node.kind':
      return updateNode(state, action.cardId, clock, (n) => ({ ...n, kind: action.kind, shape: NODE_KIND_META[action.kind].defaultShape }))
    case 'node.resize':
      return updateNode(state, action.cardId, clock, (n) => ({ ...n, w: action.w, h: action.h }))
    case 'selection.set':
      return { ...state, selection: action.selection }
    case 'viewport.set': {
      const v = action.viewport
      return { ...state, doc: { ...state.doc, viewport: { ...v, zoom: clamp(v.zoom, 0.25, 3) } } }
    }
    case 'drag.set':
      return { ...state, drag: action.drag }
    case 'theme.preview':
      return { ...state, previewThemeId: action.themeId, previewOverrides: action.overrides }
    case 'theme.apply':
      return {
        ...state,
        doc: { ...state.doc, themeId: action.themeId, themeOverrides: action.overrides },
        previewThemeId: action.themeId,
        previewOverrides: action.overrides,
        saveStatus: { kind: 'dirty' },
      }
    case 'doc.load':
      return {
        ...state,
        doc: action.doc,
        activeWorkflowId: action.doc.workflows[0]?.id ?? null,
        selection: EMPTY_SELECTION,
        drag: { kind: 'idle' },
        runs: {},
        saveStatus: { kind: 'idle' },
        previewThemeId: action.doc.themeId,
        previewOverrides: action.doc.themeOverrides,
      }
    case 'run.event':
      return applyRunEvent(state, action.event)
    case 'save.status':
      return { ...state, saveStatus: action.status }
    default:
      return state
  }
}
