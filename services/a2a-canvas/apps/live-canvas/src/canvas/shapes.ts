/**
 * Pure SVG path geometry for node shapes. Every path is built in a local
 * coordinate space whose origin is the shape's own top-left corner — the
 * caller (src/canvas/render.ts) places it with a `translate(x,y)` on the
 * node's <g>. Nothing here touches `document`.
 */
import type { ShapeKind } from '../contracts.ts'
import type { Point } from './layout.ts'

export interface Anchors {
  left: Point
  right: Point
  top: Point
  bottom: Point
}

const KAPPA = 0.5522847498307936

function num(n: number): string {
  // Trim float noise (e.g. 12.000000000000002) without losing precision we need.
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

function rectPath(ox: number, oy: number, w: number, h: number): string {
  return `M${num(ox)},${num(oy)} H${num(ox + w)} V${num(oy + h)} H${num(ox)} Z`
}

function roundedRectPath(ox: number, oy: number, w: number, h: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))
  if (r === 0) return rectPath(ox, oy, w, h)
  const x0 = ox
  const y0 = oy
  const x1 = ox + w
  const y1 = oy + h
  return [
    `M${num(x0 + r)},${num(y0)}`,
    `H${num(x1 - r)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(x1)},${num(y0 + r)}`,
    `V${num(y1 - r)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(x1 - r)},${num(y1)}`,
    `H${num(x0 + r)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(x0)},${num(y1 - r)}`,
    `V${num(y0 + r)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(x0 + r)},${num(y0)}`,
    'Z',
  ].join(' ')
}

function ellipsePath(ox: number, oy: number, w: number, h: number): string {
  const cx = ox + w / 2
  const cy = oy + h / 2
  const rx = w / 2
  const ry = h / 2
  const kx = KAPPA * rx
  const ky = KAPPA * ry
  return [
    `M${num(cx - rx)},${num(cy)}`,
    `C${num(cx - rx)},${num(cy - ky)} ${num(cx - kx)},${num(cy - ry)} ${num(cx)},${num(cy - ry)}`,
    `C${num(cx + kx)},${num(cy - ry)} ${num(cx + rx)},${num(cy - ky)} ${num(cx + rx)},${num(cy)}`,
    `C${num(cx + rx)},${num(cy + ky)} ${num(cx + kx)},${num(cy + ry)} ${num(cx)},${num(cy + ry)}`,
    `C${num(cx - kx)},${num(cy + ry)} ${num(cx - rx)},${num(cy + ky)} ${num(cx - rx)},${num(cy)}`,
    'Z',
  ].join(' ')
}

/** Unit-circle vertices of a regular polygon, `sides` of them, first vertex
 * at `startDeg` (SVG-space angle: 0° = +x, 90° = +y/down). */
function regularPolygonUnitPoints(sides: number, startDeg: number): Point[] {
  const pts: Point[] = []
  for (let i = 0; i < sides; i += 1) {
    const a = ((startDeg + (360 / sides) * i) * Math.PI) / 180
    pts.push({ x: Math.cos(a), y: Math.sin(a) })
  }
  return pts
}

/** Scales+translates arbitrary points so their bounding box exactly fills
 * [ox, ox+w] x [oy, oy+h]. */
function fitToBox(points: Point[], ox: number, oy: number, w: number, h: number): Point[] {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const sx = maxX > minX ? w / (maxX - minX) : 1
  const sy = maxY > minY ? h / (maxY - minY) : 1
  return points.map((p) => ({ x: ox + (p.x - minX) * sx, y: oy + (p.y - minY) * sy }))
}

function polygonPath(points: Point[]): string {
  const [first, ...rest] = points
  if (!first) return ''
  const cmds = [`M${num(first.x)},${num(first.y)}`, ...rest.map((p) => `L${num(p.x)},${num(p.y)}`), 'Z']
  return cmds.join(' ')
}

/** diamond: 4-gon, point-up — vertices land exactly on the box's N/E/S/W
 * midpoints. pentagon: 5-gon, point-up — flat base at the bottom.
 * hexagon: 6-gon starting at 0° — flat top/bottom, points left/right. */
function polygonBoxPath(sides: number, startDeg: number, ox: number, oy: number, w: number, h: number): string {
  const unit = regularPolygonUnitPoints(sides, startDeg)
  return polygonPath(fitToBox(unit, ox, oy, w, h))
}

function buildPath(kind: ShapeKind, ox: number, oy: number, w: number, h: number): string {
  switch (kind) {
    case 'rect':
      return rectPath(ox, oy, w, h)
    case 'rounded':
      return roundedRectPath(ox, oy, w, h, 14)
    case 'circle':
      return ellipsePath(ox, oy, w, h)
    case 'diamond':
      return polygonBoxPath(4, -90, ox, oy, w, h)
    case 'pentagon':
      return polygonBoxPath(5, -90, ox, oy, w, h)
    case 'hexagon':
      return polygonBoxPath(6, 0, ox, oy, w, h)
    default:
      return rectPath(ox, oy, w, h)
  }
}

/** SVG path `d` for `kind`, spanning (0,0)-(w,h). */
export function shapePath(kind: ShapeKind, w: number, h: number): string {
  return buildPath(kind, 0, 0, Math.max(0, w), Math.max(0, h))
}

/** Same shape, inset 3px on every side — used for the selected-state keyline. */
export function keylinePath(kind: ShapeKind, w: number, h: number): string {
  const inset = 3
  const kw = Math.max(0, w - inset * 2)
  const kh = Math.max(0, h - inset * 2)
  return buildPath(kind, inset, inset, kw, kh)
}

/** Bounding-box cardinal points (N/E/S/W). These are the true outline for
 * rect, rounded, circle, diamond and hexagon (each is symmetric about both
 * box midlines); pentagon's flat base keeps the top/bottom anchors exact
 * too, while its left/right anchors are a deliberate, connector-editor-
 * standard approximation (a single leaning vertex is the true tangent). */
export function anchors(_kind: ShapeKind, w: number, h: number): Anchors {
  return {
    left: { x: 0, y: h / 2 },
    right: { x: w, y: h / 2 },
    top: { x: w / 2, y: 0 },
    bottom: { x: w / 2, y: h },
  }
}
