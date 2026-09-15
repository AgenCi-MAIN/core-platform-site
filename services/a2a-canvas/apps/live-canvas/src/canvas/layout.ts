/**
 * Pure geometry: turns a CanvasDoc into absolute (world-space) positions for
 * every workflow band, lane rail and node, plus the hit-testing helpers the
 * interaction layer needs. Nothing here touches `document` — the viewport
 * (pan/zoom) is applied separately, as a transform on a root <g>, by
 * src/canvas/render.ts; this module only ever produces canvas/world units so
 * it stays deterministic and unit-testable without a DOM.
 */
import type { CanvasDoc, CanvasNode, LaneLayout, NodeLayout, CardId, LaneId, WorkflowId } from '../contracts.ts'
import type { Viewport } from '../../../../packages/shared/src/index.ts'

export interface Point { x: number; y: number }

/** A product workflow's band on the canvas. Not part of contracts.ts (only
 * LaneLayout/NodeLayout are shared there) since nothing outside this module
 * needs to address a workflow by its own rectangle today. */
export interface WorkflowLayout {
  workflowId: WorkflowId
  title: string
  x: number
  y: number
  w: number
  h: number
}

export interface CanvasLayout {
  workflows: WorkflowLayout[]
  lanes: LaneLayout[]
  nodes: NodeLayout[]
}

/* ---- tunables (deliverable-required exports) -------------------------- */
export const PADDING = 24
export const LANE_GAP = 16
export const NODE_GAP = 24
export const LANE_MIN_H = 180

/* ---- internal-only tunables -------------------------------------------- */
const WORKFLOW_TITLE_H = 32
const LANE_TITLE_H = 28
const WORKFLOW_GAP = 48
const WORKFLOW_MIN_W = 640
const DEFAULT_NODE_W = 140
const DEFAULT_NODE_H = 88

function clamp(v: number, lo: number, hi: number): number {
  return hi < lo ? lo : Math.min(hi, Math.max(lo, v))
}

/** Nodes in a lane, in their stable display order. Falls back to array order
 * when two cards share an `order` value (stable sort by original index). */
function sortedCards(cards: CanvasNode[], laneId: LaneId): CanvasNode[] {
  return cards
    .map((c, i) => ({ c, i }))
    .filter((e) => e.c.laneId === laneId)
    .sort((a, b) => (a.c.order - b.c.order) || (a.i - b.i))
    .map((e) => e.c)
}

/**
 * Computes absolute geometry for every workflow, lane and node in `doc`.
 * `viewport` is accepted for API symmetry with the render/interact layer
 * (which applies it as a separate SVG transform) — layout itself is always
 * computed in viewport-independent world units so it stays deterministic.
 */
export function computeLayout(doc: CanvasDoc, viewport?: Viewport): CanvasLayout {
  void viewport
  const workflows: WorkflowLayout[] = []
  const lanes: LaneLayout[] = []
  const nodes: NodeLayout[] = []

  let cursorY = PADDING

  for (const wf of doc.workflows) {
    const orderedLanes = [...wf.lanes].sort((a, b) => a.order - b.order)

    // Pass 1: natural content width per lane (auto flow + explicit positions),
    // and each lane's required height.
    let workflowContentW = WORKFLOW_MIN_W
    const laneHeights: number[] = []
    const laneAutoX = new Map<LaneId, { cardId: CardId; x: number; w: number; h: number }[]>()

    for (const lane of orderedLanes) {
      const cards = sortedCards(wf.cards, lane.id)
      let cursorX = PADDING
      let maxNodeH = 0
      let rightMost = PADDING
      const placed: { cardId: CardId; x: number; w: number; h: number }[] = []

      for (const card of cards) {
        const w = card.w > 0 ? card.w : DEFAULT_NODE_W
        const h = card.h > 0 ? card.h : DEFAULT_NODE_H
        maxNodeH = Math.max(maxNodeH, h)
        if (card.position) {
          rightMost = Math.max(rightMost, card.position.x + w + PADDING)
        } else {
          rightMost = Math.max(rightMost, cursorX + w + PADDING)
          cursorX += w + NODE_GAP
        }
        placed.push({ cardId: card.id, x: 0, w, h })
      }

      laneAutoX.set(lane.id, placed)
      workflowContentW = Math.max(workflowContentW, rightMost)
      const laneH = Math.max(LANE_MIN_H, LANE_TITLE_H + PADDING * 2 + maxNodeH)
      laneHeights.push(laneH)
    }

    const wfX = PADDING
    const wfY = cursorY
    const wfW = workflowContentW
    const wfH =
      WORKFLOW_TITLE_H +
      laneHeights.reduce((s, h) => s + h, 0) +
      LANE_GAP * Math.max(0, orderedLanes.length - 1) +
      PADDING

    workflows.push({ workflowId: wf.id, title: wf.name, x: wfX, y: wfY, w: wfW, h: wfH })

    // Pass 2: lay out lanes (full workflow width) and place nodes for real.
    let laneY = wfY + WORKFLOW_TITLE_H
    orderedLanes.forEach((lane, i) => {
      const laneH = laneHeights[i] ?? LANE_MIN_H
      lanes.push({ laneId: lane.id, x: wfX, y: laneY, w: wfW, h: laneH })

      const cards = sortedCards(wf.cards, lane.id)
      const contentTop = laneY + LANE_TITLE_H + PADDING
      const contentBottom = laneY + laneH - PADDING
      let cursorX = wfX + PADDING

      for (const card of cards) {
        const w = card.w > 0 ? card.w : DEFAULT_NODE_W
        const h = card.h > 0 ? card.h : DEFAULT_NODE_H
        let x: number
        let y: number
        if (card.position) {
          // `position` is an absolute canvas-space point (the same space
          // toCanvasPoint/onCreateNode/card.moved deal in) — clamp it to
          // stay inside this lane's current world-space rectangle.
          const maxX = wfX + wfW - PADDING - w
          const maxY = contentBottom - h
          x = clamp(card.position.x, wfX + PADDING, Math.max(wfX + PADDING, maxX))
          y = clamp(card.position.y, contentTop, Math.max(contentTop, maxY))
        } else {
          x = cursorX
          const bandH = Math.max(h, contentBottom - contentTop)
          y = contentTop + (bandH - h) / 2
          cursorX += w + NODE_GAP
        }
        nodes.push({ cardId: card.id, x, y, w, h })
      }

      laneY += laneH + LANE_GAP
    })

    cursorY = wfY + wfH + WORKFLOW_GAP
  }

  return { workflows, lanes, nodes }
}

/* ---- hit-testing --------------------------------------------------------- */

export function laneAt(layout: CanvasLayout, point: Point): LaneId | null {
  for (let i = layout.lanes.length - 1; i >= 0; i -= 1) {
    const lane = layout.lanes[i]
    if (!lane) continue
    if (point.x >= lane.x && point.x <= lane.x + lane.w && point.y >= lane.y && point.y <= lane.y + lane.h) {
      return lane.laneId
    }
  }
  return null
}

/** Topmost node under `point` (last one drawn, i.e. last in the array, wins). */
export function nodeAt(layout: CanvasLayout, point: Point): CardId | null {
  for (let i = layout.nodes.length - 1; i >= 0; i -= 1) {
    const node = layout.nodes[i]
    if (!node) continue
    if (point.x >= node.x && point.x <= node.x + node.w && point.y >= node.y && point.y <= node.y + node.h) {
      return node.cardId
    }
  }
  return null
}

/**
 * Index at which a card dropped at `point` should land within `laneId`,
 * decided purely by x position against the lane's current cards (in their
 * doc order), comparing against each node's horizontal center.
 */
export function insertionIndex(layout: CanvasLayout, doc: CanvasDoc, laneId: LaneId, point: Point): number {
  const wf = doc.workflows.find((w) => w.lanes.some((l) => l.id === laneId))
  if (!wf) return 0
  const cards = sortedCards(wf.cards, laneId)
  const nodeById = new Map(layout.nodes.map((n) => [n.cardId, n]))
  let index = 0
  for (const card of cards) {
    const n = nodeById.get(card.id)
    if (!n) continue
    const centerX = n.x + n.w / 2
    if (point.x < centerX) break
    index += 1
  }
  return index
}

/** Screen-relative (already offset by the SVG's bounding rect) → canvas point. */
export function screenToCanvas(screenX: number, screenY: number, viewport: Viewport): Point {
  return { x: (screenX - viewport.x) / viewport.zoom, y: (screenY - viewport.y) / viewport.zoom }
}

/** Canvas point → screen-relative point (inverse of screenToCanvas). */
export function canvasToScreen(x: number, y: number, viewport: Viewport): Point {
  return { x: x * viewport.zoom + viewport.x, y: y * viewport.zoom + viewport.y }
}
