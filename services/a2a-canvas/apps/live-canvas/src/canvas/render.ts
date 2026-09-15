/**
 * Builds/patches the canvas SVG from an AppState + CanvasLayout. This is the
 * one canvas module allowed to touch `document` for real DOM work (the other
 * DOM file is interact.ts); layout/shapes/connectors stay pure so they can be
 * unit-tested without a DOM.
 *
 * Rebuilds the SVG body fresh on every call rather than diff-patching: the
 * app re-renders on every store change (never on a raw animation frame), the
 * canvas is small (a handful of workflows/lanes/nodes), and a full rebuild
 * makes "never draw a stale node" trivially true. Focus is preserved across
 * the rebuild explicitly (see below), which is the one thing a naive
 * innerHTML wipe would otherwise lose.
 */
import type { AppState, CanvasNode, CardId, LaneId, ShapeKind } from '../contracts.ts'
import { NODE_KIND_META } from '../contracts.ts'
import type { CanvasLayout } from './layout.ts'
import { shapePath, keylinePath, haloPath } from './shapes.ts'
import { connectorPath, midpoint, type ConnectorRoute } from './connectors.ts'

const SVG_NS = 'http://www.w3.org/2000/svg'

export interface RenderOptions {
  /** Card id to restore focus to after the rebuild. Defaults to whatever
   * currently has DOM focus inside `svg` (so a caller that does nothing
   * special still keeps keyboard focus stable across re-renders). */
  focusCardId?: CardId | null
}

function el<K extends keyof SVGElementTagNameMap>(doc: Document, tag: K): SVGElementTagNameMap[K] {
  return doc.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K]
}

function ringMarker(doc: Document): SVGMarkerElement {
  const marker = el(doc, 'marker')
  marker.setAttribute('id', 'canvas-ring')
  marker.setAttribute('viewBox', '0 0 16 16')
  marker.setAttribute('refX', '8')
  marker.setAttribute('refY', '8')
  marker.setAttribute('markerWidth', '16')
  marker.setAttribute('markerHeight', '16')
  marker.setAttribute('orient', 'auto-start-reverse')
  // Size the ring in canvas units; the default (strokeWidth units) would scale
  // the 16px marker by the 7px connector stroke into a ~110px circle.
  marker.setAttribute('markerUnits', 'userSpaceOnUse')
  const circle = el(doc, 'circle')
  circle.setAttribute('cx', '8')
  circle.setAttribute('cy', '8')
  circle.setAttribute('r', '6')
  circle.setAttribute('class', 'connector-ring')
  marker.appendChild(circle)
  return marker
}

function truncate(textEl: SVGTextElement, full: string, maxWidth: number): void {
  textEl.textContent = full
  if (!full || maxWidth <= 0) return
  let length = 0
  try {
    length = textEl.getComputedTextLength()
  } catch {
    return // not attached to a live layout (e.g. some test doubles) — leave full text
  }
  if (length <= maxWidth) return
  const ellipsis = '…'
  let lo = 0
  let hi = full.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    textEl.textContent = full.slice(0, mid) + ellipsis
    if (textEl.getComputedTextLength() <= maxWidth) lo = mid
    else hi = mid - 1
  }
  textEl.textContent = lo > 0 ? full.slice(0, lo) + ellipsis : ellipsis
}

function cardStatus(card: CanvasNode | undefined): string {
  return card?.status ?? 'idle'
}

export function render(svg: SVGSVGElement, state: AppState, layout: CanvasLayout, opts: RenderOptions = {}): void {
  const doc = svg.ownerDocument
  const active = doc.activeElement
  const activeCardId =
    active instanceof Element && svg.contains(active) ? active.closest('[data-card-id]')?.getAttribute('data-card-id') ?? null : null
  const focusCardId = opts.focusCardId !== undefined ? opts.focusCardId : activeCardId

  svg.replaceChildren() // robust to a blur handler removing the inline editor mid-loop

  const defs = el(doc, 'defs')
  defs.appendChild(ringMarker(doc))
  svg.appendChild(defs)

  const root = el(doc, 'g')
  root.setAttribute('class', 'viewport-root')
  const vp = state.doc.viewport
  root.setAttribute('transform', `translate(${vp.x},${vp.y}) scale(${vp.zoom})`)
  svg.appendChild(root)

  const cardById = new Map<CardId, CanvasNode>()
  const laneByCard = new Map<CardId, LaneId>()
  for (const wf of state.doc.workflows) {
    for (const card of wf.cards) {
      cardById.set(card.id, card)
      laneByCard.set(card.id, card.laneId)
    }
  }
  const nodeLayoutById = new Map(layout.nodes.map((n) => [n.cardId, n]))
  const selected = new Set(state.selection.cardIds)
  const drag = state.drag
  const draggingCardId = drag.kind === 'dragging-card' ? drag.cardId : null

  const workflowsG = el(doc, 'g')
  workflowsG.setAttribute('class', 'workflows')
  state.doc.workflows.forEach((wf, i) => {
    const wfLayout = layout.workflows[i]
    if (!wfLayout) return
    const wfG = el(doc, 'g')
    wfG.setAttribute('class', 'workflow')
    const title = el(doc, 'text')
    title.setAttribute('class', 'workflow-title')
    title.setAttribute('x', String(wfLayout.x + 4))
    title.setAttribute('y', String(wfLayout.y + 20))
    title.textContent = wfLayout.title
    wfG.appendChild(title)

    const laneIds = new Set(wf.lanes.map((l) => l.id))
    for (const lane of layout.lanes.filter((l) => laneIds.has(l.laneId))) {
      const laneData = wf.lanes.find((l) => l.id === lane.laneId)
      const laneG = el(doc, 'g')
      laneG.setAttribute('class', 'lane')
      const rect = el(doc, 'rect')
      rect.setAttribute('class', 'lane-rail')
      rect.setAttribute('x', String(lane.x))
      rect.setAttribute('y', String(lane.y))
      rect.setAttribute('width', String(lane.w))
      rect.setAttribute('height', String(lane.h))
      rect.setAttribute('rx', '8')
      rect.setAttribute('data-lane-id', lane.laneId)
      const laneTitle = el(doc, 'text')
      laneTitle.setAttribute('class', 'lane-title')
      laneTitle.setAttribute('x', String(lane.x + 12))
      laneTitle.setAttribute('y', String(lane.y + 18))
      // A lane that carries the same name as its workflow shows one title, not two.
      laneTitle.textContent = laneData && laneData.title !== wf.name ? laneData.title : ''
      laneG.append(rect, laneTitle)
      wfG.appendChild(laneG)
    }
    workflowsG.appendChild(wfG)
  })
  root.appendChild(workflowsG)

  const edgesG = el(doc, 'g')
  edgesG.setAttribute('class', 'edges')
  for (const wf of state.doc.workflows) {
    for (const edge of wf.edges) {
      const from = nodeLayoutById.get(edge.from)
      const to = nodeLayoutById.get(edge.to)
      if (!from || !to) continue
      const fromCard = cardById.get(edge.from)
      const toCard = cardById.get(edge.to)
      const route: ConnectorRoute = laneByCard.get(edge.from) === laneByCard.get(edge.to) ? 'angled' : 'curved'
      const { d } = connectorPath(from, to, route)
      const path = el(doc, 'path')
      const active2 = fromCard?.status === 'running' || toCard?.status === 'running'
      path.setAttribute('class', active2 ? 'connector active' : 'connector')
      path.setAttribute('d', d)
      path.setAttribute('marker-end', 'url(#canvas-ring)')
      path.setAttribute('data-edge-id', edge.id)
      edgesG.appendChild(path)
      if (edge.label) {
        const p = midpoint(from, to, route)
        const label = el(doc, 'text')
        label.setAttribute('class', 'connector-label')
        label.setAttribute('x', String(p.x))
        label.setAttribute('y', String(p.y - 6))
        label.setAttribute('text-anchor', 'middle')
        label.textContent = edge.label
        edgesG.appendChild(label)
      }
    }
  }
  root.appendChild(edgesG)

  const nodesG = el(doc, 'g')
  nodesG.setAttribute('class', 'nodes')
  const pendingLabels: { textEl: SVGTextElement; text: string; maxWidth: number }[] = []
  for (const node of layout.nodes) {
    const card = cardById.get(node.cardId)
    if (!card) continue
    const isDragging = card.id === draggingCardId
    let x = node.x
    let y = node.y
    if (isDragging && drag.kind === 'dragging-card') {
      x = drag.pointer.x - drag.offset.x
      y = drag.pointer.y - drag.offset.y
    }

    const g = el(doc, 'g')
    const classes = ['node']
    if (selected.has(card.id)) classes.push('selected')
    if (isDragging) classes.push('dragging')
    g.setAttribute('class', classes.join(' '))
    g.setAttribute('transform', `translate(${x},${y})`)
    g.setAttribute('data-card-id', card.id)
    g.setAttribute('data-status', cardStatus(card))
    g.setAttribute('tabindex', '0')
    g.setAttribute('role', 'button')
    const meta = NODE_KIND_META[card.kind]
    g.setAttribute('aria-label', `${meta.label} node: ${card.title || 'untitled'}`)

    const halo = el(doc, 'path')
    halo.setAttribute('class', 'node-halo')
    halo.setAttribute('d', haloPath(card.shape as ShapeKind, node.w, node.h, card.id))
    g.appendChild(halo)

    const shape = el(doc, 'path')
    shape.setAttribute('class', 'node-shape')
    shape.setAttribute('d', shapePath(card.shape as ShapeKind, node.w, node.h, card.id))
    g.appendChild(shape)

    const keyline = el(doc, 'path')
    keyline.setAttribute('class', 'node-keyline')
    keyline.setAttribute('d', keylinePath(card.shape as ShapeKind, node.w, node.h, card.id))
    g.appendChild(keyline)

    const label = el(doc, 'text')
    label.setAttribute('class', 'node-label')
    // A right-pointing triangle is widest on the left, so its label sits left of centre.
    label.setAttribute('x', String(card.shape === 'triangle' ? node.w * 0.4 : node.w / 2))
    label.setAttribute('y', String(node.h / 2 - 4))
    label.setAttribute('text-anchor', 'middle')
    g.appendChild(label)
    pendingLabels.push({ textEl: label, text: card.title, maxWidth: Math.max(0, node.w - 16) })

    const sub = el(doc, 'text')
    sub.setAttribute('class', 'node-sub')
    sub.setAttribute('x', String(node.w / 2))
    sub.setAttribute('y', String(node.h / 2 + 14))
    sub.setAttribute('text-anchor', 'middle')
    g.appendChild(sub)
    pendingLabels.push({ textEl: sub, text: meta.label, maxWidth: Math.max(0, node.w - 16) })

    const handleHit = el(doc, 'circle')
    handleHit.setAttribute('class', 'connector-handle-hit')
    handleHit.setAttribute('r', '22')
    handleHit.setAttribute('cx', String(node.w))
    handleHit.setAttribute('cy', String(node.h / 2))
    handleHit.setAttribute('fill', 'transparent')
    handleHit.setAttribute('data-connector-handle', card.id)
    g.appendChild(handleHit)

    const handle = el(doc, 'circle')
    handle.setAttribute('class', 'connector-handle')
    handle.setAttribute('r', '6')
    handle.setAttribute('cx', String(node.w))
    handle.setAttribute('cy', String(node.h / 2))
    handle.setAttribute('pointer-events', 'none')
    g.appendChild(handle)

    nodesG.appendChild(g)
  }
  root.appendChild(nodesG)

  // Text needs to be attached (inside `svg`, which is itself attached to
  // `document` in real use) before getComputedTextLength() is meaningful.
  for (const p of pendingLabels) truncate(p.textEl, p.text, p.maxWidth)

  if (drag.kind === 'dragging-card') {
    const overLane = drag.overLane ? layout.lanes.find((l) => l.laneId === drag.overLane) : undefined
    if (overLane) {
      const highlight = el(doc, 'rect')
      highlight.setAttribute('class', 'drop-target')
      highlight.setAttribute('x', String(overLane.x))
      highlight.setAttribute('y', String(overLane.y))
      highlight.setAttribute('width', String(overLane.w))
      highlight.setAttribute('height', String(overLane.h))
      highlight.setAttribute('rx', '8')
      root.appendChild(highlight)

      if (typeof drag.overIndex === 'number') {
        const insertX = drag.pointer.x
        const indicator = el(doc, 'rect')
        indicator.setAttribute('class', 'drop-target')
        indicator.setAttribute('x', String(insertX - 1.5))
        indicator.setAttribute('y', String(overLane.y + 8))
        indicator.setAttribute('width', '3')
        indicator.setAttribute('height', String(overLane.h - 16))
        root.appendChild(indicator)
      }
    }
  }

  if (focusCardId) {
    const target = svg.querySelector(`[data-card-id="${focusCardId}"]`)
    if (target instanceof SVGElement && typeof target.focus === 'function') target.focus()
  }
}
