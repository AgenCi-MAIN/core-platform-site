/**
 * DOM interaction layer: Pointer Events (drag-to-move, drag-to-connect, pan,
 * pinch/ctrl-wheel zoom), click/shift-click selection, double-click to edit
 * a label or create a node, and keyboard access on focused nodes. Binds once
 * per mountCanvas() call; `update()` refreshes the state/layout snapshot the
 * handlers close over on every render so hit-testing always uses current
 * geometry. `at` timestamps come from an injected clock (default the shared
 * systemClock) — this file is the one place in src/canvas that is allowed to
 * touch `document`/timing directly; layout/shapes/connectors stay pure.
 */
import type { AppState, CanvasCallbacks, CardId, LaneId } from '../contracts.ts'
import type { Clock, DragState, Viewport } from '../../../../packages/shared/src/index.ts'
import { systemClock, isoAt } from '../../../../packages/shared/src/index.ts'
import type { CanvasLayout, Point } from './layout.ts'
import { screenToCanvas, laneAt, nodeAt, insertionIndex } from './layout.ts'

export interface InteractOptions {
  clock?: Clock
}

export interface InteractController {
  update(state: AppState, layout: CanvasLayout): void
  destroy(): void
}

const DRAG_THRESHOLD = 4
const IDLE_DRAG: DragState = { kind: 'idle' }

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

type Pending =
  | { kind: 'node'; cardId: CardId; pointerId: number; startClient: Point; offset: Point; moved: boolean; shiftKey: boolean }
  | { kind: 'connect'; cardId: CardId; pointerId: number }
  | { kind: 'pan'; pointerId: number; startClient: Point; startViewport: Viewport; moved: boolean }

export function bindInteractions(svg: SVGSVGElement, callbacks: CanvasCallbacks, opts: InteractOptions = {}): InteractController {
  const clock = opts.clock ?? systemClock
  let state: AppState | null = null
  let layout: CanvasLayout = { workflows: [], lanes: [], nodes: [] }
  let pending: Pending | null = null
  let editor: { cardId: CardId; foreignObject: SVGForeignObjectElement; committed: boolean } | null = null

  function viewport(): Viewport {
    return state?.doc.viewport ?? { x: 0, y: 0, zoom: 1 }
  }

  function clientToCanvas(clientX: number, clientY: number): Point {
    const rect = svg.getBoundingClientRect()
    return screenToCanvas(clientX - rect.left, clientY - rect.top, viewport())
  }

  function findCard(cardId: CardId): { laneId: LaneId; title: string } | null {
    if (!state) return null
    for (const wf of state.doc.workflows) {
      const card = wf.cards.find((c) => c.id === cardId)
      if (card) return card
    }
    return null
  }

  function closestCardId(target: EventTarget | null): CardId | null {
    const el = target instanceof Element ? target.closest('[data-card-id]') : null
    const attr = el?.getAttribute('data-card-id')
    return attr ? (attr as CardId) : null
  }

  function closestHandleCardId(target: EventTarget | null): CardId | null {
    const el = target instanceof Element ? target.closest('[data-connector-handle]') : null
    const attr = el?.getAttribute('data-connector-handle')
    return attr ? (attr as CardId) : null
  }

  function removeEditor(): void {
    editor?.foreignObject.remove()
    editor = null
  }

  function openEditor(cardId: CardId): void {
    if (!state) return
    const card = findCard(cardId)
    const node = layout.nodes.find((n) => n.cardId === cardId)
    if (!card || !node) return
    removeEditor()
    const doc = svg.ownerDocument
    const NS = 'http://www.w3.org/2000/svg'
    const fo = doc.createElementNS(NS, 'foreignObject') as SVGForeignObjectElement
    fo.setAttribute('x', String(node.x))
    fo.setAttribute('y', String(node.y + node.h / 2 - 14))
    fo.setAttribute('width', String(Math.max(40, node.w)))
    fo.setAttribute('height', '28')
    fo.setAttribute('class', 'node-label-editor')
    const input = doc.createElementNS('http://www.w3.org/1999/xhtml', 'input') as HTMLInputElement
    input.type = 'text'
    input.value = card.title
    input.style.width = '100%'
    input.style.height = '100%'
    input.style.boxSizing = 'border-box'
    fo.appendChild(input)
    svg.appendChild(fo)
    editor = { cardId, foreignObject: fo, committed: false }

    const commit = () => {
      if (!editor || editor.committed) return
      editor.committed = true
      callbacks.onEditLabel(cardId, input.value)
      removeEditor()
    }
    const cancel = () => {
      if (!editor || editor.committed) return
      editor.committed = true
      removeEditor()
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    })
    input.addEventListener('blur', commit)
    input.focus()
    input.select()
  }

  let lastTap: { cardId: CardId; at: number } | null = null

  function onPointerDown(e: PointerEvent): void {
    if (!state || e.button !== 0) return
    if (editor) return // let the inline editor's own input handle its events
    const handleCardId = closestHandleCardId(e.target)
    const nodeCardId = handleCardId ?? closestCardId(e.target)
    const canvasPoint = clientToCanvas(e.clientX, e.clientY)
    svg.setPointerCapture(e.pointerId)

    if (handleCardId) {
      pending = { kind: 'connect', cardId: handleCardId, pointerId: e.pointerId }
      callbacks.dispatch({ type: 'drag.set', drag: { kind: 'connecting', fromCard: handleCardId, pointer: canvasPoint } })
      e.preventDefault()
      return
    }
    // Synthetic double-click: render.ts rebuilds the SVG on every render, so the
    // browser's native dblclick (which requires the same target twice) never
    // fires on a node once the first click has selected it. Two pointerdowns on
    // the same card within 400ms open the inline editor instead.
    const tapAt = performance.now()
    if (nodeCardId && lastTap && lastTap.cardId === nodeCardId && tapAt - lastTap.at < 400) {
      lastTap = null
      try {
        svg.releasePointerCapture(e.pointerId)
      } catch {
        /* not captured */
      }
      openEditor(nodeCardId)
      e.preventDefault()
      return
    }
    lastTap = nodeCardId ? { cardId: nodeCardId, at: tapAt } : null

    if (nodeCardId) {
      const node = layout.nodes.find((n) => n.cardId === nodeCardId)
      const offset = node ? { x: canvasPoint.x - node.x, y: canvasPoint.y - node.y } : { x: 0, y: 0 }
      pending = {
        kind: 'node',
        cardId: nodeCardId,
        pointerId: e.pointerId,
        startClient: { x: e.clientX, y: e.clientY },
        offset,
        moved: false,
        shiftKey: e.shiftKey,
      }
      e.preventDefault()
      return
    }
    pending = {
      kind: 'pan',
      pointerId: e.pointerId,
      startClient: { x: e.clientX, y: e.clientY },
      startViewport: viewport(),
      moved: false,
    }
  }

  function onPointerMove(e: PointerEvent): void {
    if (!pending || pending.pointerId !== e.pointerId || !state) return
    const canvasPoint = clientToCanvas(e.clientX, e.clientY)

    if (pending.kind === 'connect') {
      callbacks.dispatch({ type: 'drag.set', drag: { kind: 'connecting', fromCard: pending.cardId, pointer: canvasPoint } })
      return
    }

    const dist = Math.hypot(e.clientX - pending.startClient.x, e.clientY - pending.startClient.y)
    if (!pending.moved) {
      if (dist < DRAG_THRESHOLD) return
      pending.moved = true
    }

    if (pending.kind === 'node') {
      const overLane = laneAt(layout, canvasPoint) ?? undefined
      const overIndex = overLane ? insertionIndex(layout, state.doc, overLane, canvasPoint) : undefined
      callbacks.dispatch({
        type: 'drag.set',
        drag: { kind: 'dragging-card', cardId: pending.cardId, overLane, overIndex, pointer: canvasPoint, offset: pending.offset },
      })
      return
    }

    // pan
    const dx = e.clientX - pending.startClient.x
    const dy = e.clientY - pending.startClient.y
    callbacks.dispatch({
      type: 'viewport.set',
      viewport: { x: pending.startViewport.x + dx, y: pending.startViewport.y + dy, zoom: pending.startViewport.zoom },
    })
  }

  function onPointerUp(e: PointerEvent): void {
    if (!pending || pending.pointerId !== e.pointerId) return
    const p = pending
    pending = null
    try {
      svg.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    if (!state) return
    const canvasPoint = clientToCanvas(e.clientX, e.clientY)

    if (p.kind === 'connect') {
      const targetCardId = nodeAt(layout, canvasPoint)
      if (targetCardId && targetCardId !== p.cardId) callbacks.onConnect(p.cardId, targetCardId)
      callbacks.dispatch({ type: 'drag.set', drag: IDLE_DRAG })
      return
    }

    if (p.kind === 'node') {
      if (!p.moved) {
        const already = state.selection.cardIds.includes(p.cardId)
        const cardIds = p.shiftKey
          ? already
            ? state.selection.cardIds.filter((id) => id !== p.cardId)
            : [...state.selection.cardIds, p.cardId]
          : [p.cardId]
        callbacks.dispatch({ type: 'selection.set', selection: { cardIds, laneIds: [] } })
        callbacks.dispatch({ type: 'drag.set', drag: IDLE_DRAG })
        return
      }
      const card = findCard(p.cardId)
      const overLane = laneAt(layout, canvasPoint)
      const toLane = overLane ?? card?.laneId
      if (!card || !toLane) {
        callbacks.dispatch({ type: 'drag.set', drag: IDLE_DRAG })
        return
      }
      const toIndex = insertionIndex(layout, state.doc, toLane, canvasPoint)
      const worldX = canvasPoint.x - p.offset.x
      const worldY = canvasPoint.y - p.offset.y
      callbacks.dispatch({
        type: 'workflow.event',
        event: {
          type: 'card.moved',
          cardId: p.cardId,
          fromLane: card.laneId,
          toLane,
          toIndex,
          position: { x: worldX, y: worldY },
          at: isoAt(clock),
        },
      })
      callbacks.dispatch({ type: 'drag.set', drag: IDLE_DRAG })
      return
    }

    // pan
    if (!p.moved) {
      callbacks.dispatch({ type: 'selection.set', selection: { cardIds: [], laneIds: [] } })
    }
    callbacks.dispatch({ type: 'drag.set', drag: IDLE_DRAG })
  }

  function onWheel(e: WheelEvent): void {
    if (!state) return
    e.preventDefault()
    const vp = viewport()
    if (e.ctrlKey || e.metaKey) {
      const rect = svg.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const before = screenToCanvas(sx, sy, vp)
      const newZoom = clamp(vp.zoom * Math.exp(-e.deltaY * 0.001), 0.25, 3)
      callbacks.dispatch({
        type: 'viewport.set',
        viewport: { x: sx - before.x * newZoom, y: sy - before.y * newZoom, zoom: newZoom },
      })
      return
    }
    callbacks.dispatch({ type: 'viewport.set', viewport: { x: vp.x - e.deltaX, y: vp.y - e.deltaY, zoom: vp.zoom } })
  }

  function onDblClick(e: MouseEvent): void {
    if (!state) return
    if (editor) return // the synthetic double-tap in onPointerDown already opened it
    const rect = svg.getBoundingClientRect()
    const canvasPoint = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, viewport())
    // The SVG is rebuilt between the two clicks, so e.target may be the root
    // rather than the node; fall back to geometric hit-testing.
    const cardId = closestCardId(e.target) ?? nodeAt(layout, canvasPoint)
    if (cardId) {
      openEditor(cardId)
      return
    }
    const laneId = laneAt(layout, canvasPoint)
    if (laneId) callbacks.onCreateNode(laneId, canvasPoint)
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!state || editor) return
    const target = e.target instanceof Element ? e.target : null
    const cardId = closestCardId(target)
    if (!cardId) return
    const card = findCard(cardId)
    const node = layout.nodes.find((n) => n.cardId === cardId)
    if (!card || !node) return

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const step = e.shiftKey ? 32 : 8
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
      const position = { x: node.x + dx, y: node.y + dy }
      const laneCards = state.doc.workflows.flatMap((w) => w.cards).filter((c) => c.laneId === card.laneId)
      const sorted = [...laneCards].sort((a, b) => a.order - b.order)
      const toIndex = Math.max(0, sorted.findIndex((c) => c.id === cardId))
      callbacks.dispatch({
        type: 'workflow.event',
        event: { type: 'card.moved', cardId, fromLane: card.laneId, toLane: card.laneId, toIndex, position, at: isoAt(clock) },
      })
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      openEditor(cardId)
      return
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      callbacks.dispatch({ type: 'workflow.event', event: { type: 'card.removed', cardId, at: isoAt(clock) } })
      return
    }
    if (e.key === 'Escape') {
      callbacks.dispatch({ type: 'selection.set', selection: { cardIds: [], laneIds: [] } })
    }
  }

  svg.addEventListener('pointerdown', onPointerDown)
  svg.addEventListener('pointermove', onPointerMove)
  svg.addEventListener('pointerup', onPointerUp)
  svg.addEventListener('pointercancel', onPointerUp)
  svg.addEventListener('wheel', onWheel, { passive: false })
  svg.addEventListener('dblclick', onDblClick)
  svg.addEventListener('keydown', onKeyDown)

  return {
    update(nextState, nextLayout) {
      state = nextState
      layout = nextLayout
    },
    destroy() {
      svg.removeEventListener('pointerdown', onPointerDown)
      svg.removeEventListener('pointermove', onPointerMove)
      svg.removeEventListener('pointerup', onPointerUp)
      svg.removeEventListener('pointercancel', onPointerUp)
      svg.removeEventListener('wheel', onWheel)
      svg.removeEventListener('dblclick', onDblClick)
      svg.removeEventListener('keydown', onKeyDown)
      removeEditor()
    },
  }
}
