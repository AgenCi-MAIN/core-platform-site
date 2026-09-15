/**
 * Pure SVG path geometry for node shapes. Every path is built in a local
 * coordinate space whose origin is the shape's own top-left corner — the
 * caller (src/canvas/render.ts) places it with a `translate(x,y)` on the
 * node's <g>. Nothing here touches `document`.
 *
 * Every shape gets a small, deterministic hand-drawn wobble when a `seed`
 * (the node's card id) is supplied: the same seed always produces the exact
 * same path, different seeds produce different paths, and no seed at all
 * means no jitter — the plain, exact geometry.
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

/** Corner radius for the 'rect' shape's loose rounding. */
const RECT_RADIUS = 8
/** Corner radius for the 'rounded' shape — visibly rounder than 'rect'. */
const ROUNDED_RADIUS = 22
/** Max magnitude (px) of the deterministic hand-drawn jitter. */
const JITTER_MAX = 2

function num(n: number): string {
  // Trim float noise (e.g. 12.000000000000002) without losing precision we need.
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

/** Deterministic 32-bit FNV-1a hash of a string, as an unsigned integer.
 * Exported so other modules (and tests) can derive their own seeded values
 * the same way this file does. */
export function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** A deterministic pseudo-random value in [-amp, amp] for (seed, index) —
 * the same seed+index always yields the same jitter, different seeds and
 * indices spread across the range, and no seed (undefined/empty) always
 * yields exactly 0 — the "no jitter" case. */
export function jitter(seed: string | undefined, index: number, amp: number = JITTER_MAX): number {
  if (!seed) return 0
  const h = hashSeed(`${seed}#${index}`)
  const frac = (h % 100000) / 100000 // [0, 1)
  return (frac * 2 - 1) * amp
}

function jitterPoint(p: Point, seed: string | undefined, index: number, amp: number = JITTER_MAX): Point {
  return { x: p.x + jitter(seed, index * 2, amp), y: p.y + jitter(seed, index * 2 + 1, amp) }
}

/** Jitters each point by its own index — point i's offset depends only on
 * (seed, i), so inserting/removing points elsewhere never changes an
 * existing point's jitter. */
function loosePoints(points: Point[], seed: string | undefined, amp: number = JITTER_MAX): Point[] {
  return points.map((p, i) => jitterPoint(p, seed, i, amp))
}

function polygonPath(points: Point[]): string {
  const [first, ...rest] = points
  if (!first) return ''
  const cmds = [`M${num(first.x)},${num(first.y)}`, ...rest.map((p) => `L${num(p.x)},${num(p.y)}`), 'Z']
  return cmds.join(' ')
}

/**
 * Rounded-rectangle loop built from 8 perimeter points (jittered when `seed`
 * is given) joined by straight edges and quarter-circle arcs — the shared
 * geometry behind 'rect', 'rounded' and 'capsule' (a capsule is simply this
 * with the radius clamped to half the shorter side, i.e. a stadium).
 */
function roundedLoopPath(ox: number, oy: number, w: number, h: number, radius: number, seed?: string): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2))
  if (r === 0) {
    const pts = loosePoints(
      [
        { x: ox, y: oy },
        { x: ox + w, y: oy },
        { x: ox + w, y: oy + h },
        { x: ox, y: oy + h },
      ],
      seed,
    )
    return polygonPath(pts)
  }
  const corners = [
    { x: ox + r, y: oy }, // A — top edge, just after the TL corner
    { x: ox + w - r, y: oy }, // B — top edge, just before the TR corner
    { x: ox + w, y: oy + r }, // C — right edge, just after the TR corner
    { x: ox + w, y: oy + h - r }, // D — right edge, just before the BR corner
    { x: ox + w - r, y: oy + h }, // E — bottom edge, just after the BR corner
    { x: ox + r, y: oy + h }, // F — bottom edge, just before the BL corner
    { x: ox, y: oy + h - r }, // G — left edge, just after the BL corner
    { x: ox, y: oy + r }, // H — left edge, just before the TL corner
  ]
  const [A, B, C, D, E, F, G, H] = loosePoints(corners, seed) as [Point, Point, Point, Point, Point, Point, Point, Point]
  return [
    `M${num(A.x)},${num(A.y)}`,
    `L${num(B.x)},${num(B.y)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(C.x)},${num(C.y)}`,
    `L${num(D.x)},${num(D.y)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(E.x)},${num(E.y)}`,
    `L${num(F.x)},${num(F.y)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(G.x)},${num(G.y)}`,
    `L${num(H.x)},${num(H.y)}`,
    `A${num(r)},${num(r)} 0 0 1 ${num(A.x)},${num(A.y)}`,
    'Z',
  ].join(' ')
}

/**
 * Loose loop for 'circle': the same four-cubic construction as a plain
 * ellipse, but its four cardinal anchors and eight Bezier handles are each
 * independently jittered when `seed` is given.
 */
function loopEllipsePath(ox: number, oy: number, w: number, h: number, seed?: string): string {
  const cx = ox + w / 2
  const cy = oy + h / 2
  const rx = w / 2
  const ry = h / 2
  const kx = KAPPA * rx
  const ky = KAPPA * ry
  const [west, north, east, south] = loosePoints(
    [
      { x: cx - rx, y: cy },
      { x: cx, y: cy - ry },
      { x: cx + rx, y: cy },
      { x: cx, y: cy + ry },
    ],
    seed,
  ) as [Point, Point, Point, Point]
  const c1 = jitterPoint({ x: cx - rx, y: cy - ky }, seed, 4)
  const c2 = jitterPoint({ x: cx - kx, y: cy - ry }, seed, 5)
  const c3 = jitterPoint({ x: cx + kx, y: cy - ry }, seed, 6)
  const c4 = jitterPoint({ x: cx + rx, y: cy - ky }, seed, 7)
  const c5 = jitterPoint({ x: cx + rx, y: cy + ky }, seed, 8)
  const c6 = jitterPoint({ x: cx + kx, y: cy + ry }, seed, 9)
  const c7 = jitterPoint({ x: cx - kx, y: cy + ry }, seed, 10)
  const c8 = jitterPoint({ x: cx - rx, y: cy + ky }, seed, 11)
  return [
    `M${num(west.x)},${num(west.y)}`,
    `C${num(c1.x)},${num(c1.y)} ${num(c2.x)},${num(c2.y)} ${num(north.x)},${num(north.y)}`,
    `C${num(c3.x)},${num(c3.y)} ${num(c4.x)},${num(c4.y)} ${num(east.x)},${num(east.y)}`,
    `C${num(c5.x)},${num(c5.y)} ${num(c6.x)},${num(c6.y)} ${num(south.x)},${num(south.y)}`,
    `C${num(c7.x)},${num(c7.y)} ${num(c8.x)},${num(c8.y)} ${num(west.x)},${num(west.y)}`,
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

/**
 * diamond: 4-gon, point-up — vertices land exactly on the box's N/E/S/W
 * midpoints. pentagon: 5-gon, point-up — flat base at the bottom.
 * hexagon: 6-gon starting at 0° — flat top/bottom, points left/right.
 * triangle: 3-gon starting at 0° — a single vertex points right (a simple
 * fork/branch glyph), flat-ish edge on the left.
 * Vertices are jittered (when `seed` is given) but the straight edges
 * between them are kept — "polygons keep their vertices."
 */
function polygonBoxPath(sides: number, startDeg: number, ox: number, oy: number, w: number, h: number, seed?: string): string {
  const unit = regularPolygonUnitPoints(sides, startDeg)
  const fitted = fitToBox(unit, ox, oy, w, h)
  return polygonPath(loosePoints(fitted, seed))
}

function buildPath(kind: ShapeKind, ox: number, oy: number, w: number, h: number, seed?: string): string {
  switch (kind) {
    case 'rect':
      return roundedLoopPath(ox, oy, w, h, RECT_RADIUS, seed)
    case 'rounded':
      return roundedLoopPath(ox, oy, w, h, ROUNDED_RADIUS, seed)
    case 'capsule':
      // Radius bigger than either half-dimension clamps to a true stadium.
      return roundedLoopPath(ox, oy, w, h, Math.max(w, h), seed)
    case 'circle':
      return loopEllipsePath(ox, oy, w, h, seed)
    case 'diamond':
      return polygonBoxPath(4, -90, ox, oy, w, h, seed)
    case 'pentagon':
      return polygonBoxPath(5, -90, ox, oy, w, h, seed)
    case 'hexagon':
      return polygonBoxPath(6, 0, ox, oy, w, h, seed)
    case 'triangle':
      return polygonBoxPath(3, 0, ox, oy, w, h, seed)
    default:
      return roundedLoopPath(ox, oy, w, h, RECT_RADIUS, seed)
  }
}

/** SVG path `d` for `kind`, spanning (0,0)-(w,h). `seed` (typically the
 * node's card id) drives the deterministic hand-drawn jitter; omit it for
 * the exact, unjittered geometry. */
export function shapePath(kind: ShapeKind, w: number, h: number, seed?: string): string {
  return buildPath(kind, 0, 0, Math.max(0, w), Math.max(0, h), seed)
}

/** Same shape, inset ~10px on every side — used for the selected-state
 * keyline, which sits inside the (7–9px wide) main outline stroke. */
export function keylinePath(kind: ShapeKind, w: number, h: number, seed?: string): string {
  const inset = 10
  const kw = Math.max(0, w - inset * 2)
  const kh = Math.max(0, h - inset * 2)
  return buildPath(kind, inset, inset, kw, kh, seed)
}

/** Same geometry as shapePath — drawn behind the node with a much wider,
 * near-invisible stroke by CSS (.node-halo) to form a soft selection glow. */
export function haloPath(kind: ShapeKind, w: number, h: number, seed?: string): string {
  return shapePath(kind, w, h, seed)
}

/** Bounding-box cardinal points (N/E/S/W). These are the true outline for
 * rect, rounded, circle, diamond and hexagon (each is symmetric about both
 * box midlines); pentagon's flat base keeps the top/bottom anchors exact
 * too, while its left/right anchors are a deliberate, connector-editor-
 * standard approximation (a single leaning vertex is the true tangent).
 * capsule and triangle are likewise approximated by the bounding box.
 * Always exact regardless of any jitter applied to the drawn path — a
 * connector must attach to a stable point, not a wobbly one. */
export function anchors(_kind: ShapeKind, w: number, h: number): Anchors {
  return {
    left: { x: 0, y: h / 2 },
    right: { x: w, y: h / 2 },
    top: { x: w / 2, y: 0 },
    bottom: { x: w / 2, y: h },
  }
}
