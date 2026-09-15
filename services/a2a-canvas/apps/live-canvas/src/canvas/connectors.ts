/**
 * Pure connector geometry between two already-laid-out nodes. `from`'s right
 * anchor to `to`'s left anchor — the same bounding-box cardinal points
 * src/canvas/shapes.ts hands out (NodeLayout carries no shape kind, and that
 * formula is kind-independent, so it is inlined here rather than imported).
 * Nothing here touches `document`.
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

/** Control points for the curved route. Forward edges get plain horizontal
 * handles (a classic S-curve); backward edges (to left of from) push both
 * handles outward past each other so the curve loops around the nodes
 * instead of doubling back through them. */
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

/** Waypoints for the angled (orthogonal) route. Forward edges get the plain
 * three-segment "H, V, H" shape with a vertical mid-segment; backward edges
 * get a five-segment loop that steps out from the source, over, and back
 * into the target from the left, so it never crosses through node bodies. */
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
  const cmds = [`M${first.x},${first.y}`]
  for (const p of rest) cmds.push(`L${p.x},${p.y}`)
  return cmds.join(' ')
}

export function connectorPath(from: NodeLayout, to: NodeLayout, route: ConnectorRoute): ConnectorPathResult {
  if (route === 'curved') {
    const c = curvedControls(from, to)
    const d = `M${c.fx},${c.fy} C${c.h1x},${c.h1y} ${c.h2x},${c.h2y} ${c.tx},${c.ty}`
    const angle = (Math.atan2(c.ty - c.h2y, c.tx - c.h2x) * 180) / Math.PI
    return { d, arrowAt: { x: c.tx, y: c.ty, angle } }
  }
  const { points } = angledWaypoints(from, to)
  const last = points[points.length - 1] as Point
  return { d: pathFromPoints(points), arrowAt: { x: last.x, y: last.y, angle: 0 } }
}

/** Visual midpoint of the connector, independent of the `d` string — used to
 * place an edge label. */
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
