/**
 * Pure connector geometry between two already-laid-out nodes. `from`'s right
 * anchor to `to`'s left anchor — the same bounding-box cardinal points
 * src/canvas/shapes.ts hands out (NodeLayout carries no shape kind, and that
 * formula is kind-independent, so it is inlined here rather than imported).
 * Nothing here touches `document`.
 *
 * The drawn route stops short of both anchors: it starts ~4px past the
 * source anchor and ends ~9px short of the target anchor, leaving room for
 * the outlined ring marker (r≈6, stroke 2) render.ts draws there. The
 * curve's control points (curved route) or interior waypoints (angled
 * route) get a small deterministic "hand-drawn" wobble seeded by the pair's
 * card ids, so the same edge always draws the same wavy line.
 */
import type { NodeLayout } from '../contracts.ts'
import type { Point } from './layout.ts'

export type ConnectorRoute = 'curved' | 'angled'

export interface ArrowAt {
  x: number
  y: number
  /** Degrees; 0 = pointing in +x (the convention every route here arrives with). */
  angle: number
}

export interface ConnectorPathResult {
  d: string
  arrowAt: ArrowAt
  /** The true target anchor (unshortened) — where the end-of-route ring is centred. */
  ringAt: Point
}

/** How far short of the target anchor the drawn route ends. */
const END_GAP = 9
/** How far past the source anchor the drawn route starts. */
const START_GAP = 4
/** Max magnitude (px) of the deterministic waviness on control/waypoints. */
const WAVE_AMP = 3

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic pseudo-random value in [-amp, amp] for (seedKey, index). */
function wobble(seedKey: string, index: number, amp: number = WAVE_AMP): number {
  const h = hash(`${seedKey}#${index}`)
  const frac = (h % 100000) / 100000 // [0, 1)
  return (frac * 2 - 1) * amp
}

function wobblePoint(p: Point, seedKey: string, index: number, amp: number = WAVE_AMP): Point {
  return { x: p.x + wobble(seedKey, index * 2, amp), y: p.y + wobble(seedKey, index * 2 + 1, amp) }
}

/** Moves `dist` px from `p` toward `target`; `p` is returned unchanged if
 * the two points coincide (keeps every route finite, never divides by 0). */
function moveToward(p: Point, target: Point, dist: number): Point {
  const dx = target.x - p.x
  const dy = target.y - p.y
  const len = Math.hypot(dx, dy)
  if (len === 0) return { x: p.x, y: p.y }
  const t = dist / len
  return { x: p.x + dx * t, y: p.y + dy * t }
}

function rightAnchor(n: NodeLayout): Point {
  return { x: n.x + n.w, y: n.y + n.h / 2 }
}
function leftAnchor(n: NodeLayout): Point {
  return { x: n.x, y: n.y + n.h / 2 }
}

interface CubicControl {
  fx: number
  fy: number
  h1x: number
  h1y: number
  h2x: number
  h2y: number
  tx: number
  ty: number
}

/** Control points for the curved route, anchored on the true (unshortened)
 * node anchors. Forward edges get plain horizontal handles (a classic
 * S-curve); backward edges (to left of from) push both handles outward past
 * each other so the curve loops around the nodes instead of doubling back
 * through them. */
function curvedControls(from: NodeLayout, to: NodeLayout): CubicControl {
  const f = rightAnchor(from)
  const t = leftAnchor(to)
  const dx = t.x - f.x
  const dy = t.y - f.y
  if (dx >= 0) {
    const handle = Math.max(48, Math.abs(dx) * 0.5)
    return { fx: f.x, fy: f.y, h1x: f.x + handle, h1y: f.y, h2x: t.x - handle, h2y: t.y, tx: t.x, ty: t.y }
  }
  const loop = Math.max(64, Math.abs(dx) * 0.5, Math.abs(dy) * 0.5 + 48)
  const bulge = dy === 0 ? loop * 0.6 : 0
  return {
    fx: f.x,
    fy: f.y,
    h1x: f.x + loop,
    h1y: f.y - bulge,
    h2x: t.x - loop,
    h2y: t.y - bulge,
    tx: t.x,
    ty: t.y,
  }
}

function cubicAt(c: CubicControl, t: number): Point {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const cc = 3 * mt * t * t
  const d = t * t * t
  return {
    x: a * c.fx + b * c.h1x + cc * c.h2x + d * c.tx,
    y: a * c.fy + b * c.h1y + cc * c.h2y + d * c.ty,
  }
}

interface AngledSegments {
  points: Point[]
}

/** Waypoints for the angled (orthogonal) route, anchored on the true
 * (unshortened) node anchors. Forward edges get the plain three-segment "H,
 * V, H" shape with a vertical mid-segment; backward edges get a
 * five-segment loop that steps out from the source, over, and back into the
 * target from the left, so it never crosses through node bodies. */
function angledWaypoints(from: NodeLayout, to: NodeLayout): AngledSegments {
  const f = rightAnchor(from)
  const t = leftAnchor(to)
  const dx = t.x - f.x
  if (dx >= 0) {
    const midX = f.x + dx / 2
    return { points: [f, { x: midX, y: f.y }, { x: midX, y: t.y }, t] }
  }
  const outMargin = 32
  const x1 = f.x + outMargin
  const x2 = t.x - outMargin
  const midY = (f.y + t.y) / 2
  return {
    points: [f, { x: x1, y: f.y }, { x: x1, y: midY }, { x: x2, y: midY }, { x: x2, y: t.y }, t],
  }
}

function pathFromPoints(points: Point[]): string {
  const [first, ...rest] = points
  if (!first) return ''
  const cmds = [`M${num(first.x)},${num(first.y)}`]
  for (const p of rest) cmds.push(`L${num(p.x)},${num(p.y)}`)
  return cmds.join(' ')
}

export function connectorPath(from: NodeLayout, to: NodeLayout, route: ConnectorRoute): ConnectorPathResult {
  const seedKey = `${from.cardId}${to.cardId}`

  if (route === 'curved') {
    const c = curvedControls(from, to)
    const h1 = wobblePoint({ x: c.h1x, y: c.h1y }, seedKey, 0)
    const h2 = wobblePoint({ x: c.h2x, y: c.h2y }, seedKey, 1)
    const startPt = moveToward({ x: c.fx, y: c.fy }, h1, START_GAP)
    const endPt = moveToward({ x: c.tx, y: c.ty }, h2, END_GAP)
    const d = `M${num(startPt.x)},${num(startPt.y)} C${num(h1.x)},${num(h1.y)} ${num(h2.x)},${num(h2.y)} ${num(endPt.x)},${num(endPt.y)}`
    const angle = (Math.atan2(endPt.y - h2.y, endPt.x - h2.x) * 180) / Math.PI
    return { d, arrowAt: { x: endPt.x, y: endPt.y, angle }, ringAt: { x: c.tx, y: c.ty } }
  }

  const { points } = angledWaypoints(from, to)
  const n = points.length
  const first = points[0] as Point
  const last = points[n - 1] as Point
  // Interior waypoints get the wobble; the two true anchors stay exact so
  // the shortened start/end points below are always exactly START_GAP /
  // END_GAP away from them.
  const wavy: Point[] = points.map((p, i) => (i === 0 || i === n - 1 ? p : wobblePoint(p, seedKey, i)))
  const second = wavy[1] as Point
  const beforeLast = wavy[n - 2] as Point
  const startPt = moveToward(first, second, START_GAP)
  const endPt = moveToward(last, beforeLast, END_GAP)
  const finalPoints = [startPt, ...wavy.slice(1, n - 1), endPt]
  const d = pathFromPoints(finalPoints)
  return { d, arrowAt: { x: endPt.x, y: endPt.y, angle: 0 }, ringAt: { x: last.x, y: last.y } }
}

/** Visual midpoint of the connector, independent of the `d` string — used to
 * place an edge label. Computed on the true (unshortened, un-wobbled) route
 * so a label never jitters relative to the nodes it sits between. */
export function midpoint(from: NodeLayout, to: NodeLayout, route: ConnectorRoute): Point {
  if (route === 'curved') {
    return cubicAt(curvedControls(from, to), 0.5)
  }
  const { points } = angledWaypoints(from, to)
  const mid = points[Math.floor(points.length / 2)] as Point
  const prev = points[Math.floor(points.length / 2) - 1] as Point | undefined
  if (!prev) return mid
  return { x: (mid.x + prev.x) / 2, y: (mid.y + prev.y) / 2 }
}
