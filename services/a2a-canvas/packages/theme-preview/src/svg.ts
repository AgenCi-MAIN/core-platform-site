/**
 * Tiny, self-contained SVG builders for the sample workflow nodes shown in a
 * theme preview: the six shape kinds the live canvas uses for workflow
 * cards, plus a curved connector with an arrowhead. Pure string builders —
 * no DOM, no import from the app.
 */

export const NODE_SHAPE_KINDS = ['rect', 'rounded', 'circle', 'diamond', 'pentagon', 'hexagon'] as const
export type NodeShapeKind = (typeof NODE_SHAPE_KINDS)[number]

function fmt(n: number): string {
  // Trims float noise (e.g. 40.00000000000001) without touching integers.
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function points(pts: Array<[number, number]>): string {
  return pts.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ')
}

/** Points of a regular polygon with `sides` corners, first corner pointing up. */
function polygonPoints(cx: number, cy: number, r: number, sides: number): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  const start = -Math.PI / 2
  for (let i = 0; i < sides; i += 1) {
    const angle = start + (i * 2 * Math.PI) / sides
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return pts
}

export function rectShape(x: number, y: number, w: number, h: number, className = 'node-shape'): string {
  return `<rect class="${className}" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" />`
}

export function roundedShape(x: number, y: number, w: number, h: number, radius = 10, className = 'node-shape'): string {
  return `<rect class="${className}" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${fmt(radius)}" ry="${fmt(radius)}" />`
}

export function circleShape(cx: number, cy: number, r: number, className = 'node-shape'): string {
  return `<circle class="${className}" cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" />`
}

export function diamondShape(cx: number, cy: number, w: number, h: number, className = 'node-shape'): string {
  const hw = w / 2
  const hh = h / 2
  const pts: Array<[number, number]> = [
    [cx, cy - hh],
    [cx + hw, cy],
    [cx, cy + hh],
    [cx - hw, cy],
  ]
  return `<polygon class="${className}" points="${points(pts)}" />`
}

export function pentagonShape(cx: number, cy: number, r: number, className = 'node-shape'): string {
  return `<polygon class="${className}" points="${points(polygonPoints(cx, cy, r, 5))}" />`
}

export function hexagonShape(cx: number, cy: number, r: number, className = 'node-shape'): string {
  return `<polygon class="${className}" points="${points(polygonPoints(cx, cy, r, 6))}" />`
}

/** Dispatches to the shape builder for a given kind, centred in a w x h box. */
export function shapeByKind(kind: NodeShapeKind, cx: number, cy: number, w: number, h: number, className = 'node-shape'): string {
  switch (kind) {
    case 'rect':
      return rectShape(cx - w / 2, cy - h / 2, w, h, className)
    case 'rounded':
      return roundedShape(cx - w / 2, cy - h / 2, w, h, Math.min(w, h) * 0.22, className)
    case 'circle':
      return circleShape(cx, cy, Math.min(w, h) / 2, className)
    case 'diamond':
      return diamondShape(cx, cy, w * 1.15, h * 1.15, className)
    case 'pentagon':
      return pentagonShape(cx, cy, Math.min(w, h) / 2, className)
    case 'hexagon':
      return hexagonShape(cx, cy, Math.min(w, h) / 2, className)
  }
}

/**
 * A curved connector from (x1,y1) to (x2,y2): a quadratic bezier plus a
 * small triangular arrowhead at the end, aimed along the curve's exit angle.
 * Returns both elements as one combined SVG fragment.
 */
export function curvedConnector(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  { className = 'connector', arrowClassName = 'connector-arrow', bow = 0.35 }: { className?: string; arrowClassName?: string; bow?: number } = {}
): string {
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  // Perpendicular offset so the curve bows instead of running straight.
  const nx = -dy
  const ny = dx
  const len = Math.hypot(nx, ny) || 1
  const cx = midX + (nx / len) * Math.hypot(dx, dy) * bow
  const cy = midY + (ny / len) * Math.hypot(dx, dy) * bow
  const path = `<path class="${className}" d="M ${fmt(x1)} ${fmt(y1)} Q ${fmt(cx)} ${fmt(cy)} ${fmt(x2)} ${fmt(y2)}" />`

  // Tangent at the curve's end point (derivative of a quadratic bezier at t=1).
  const tangentX = x2 - cx
  const tangentY = y2 - cy
  const angle = Math.atan2(tangentY, tangentX)
  const size = 7
  const spread = 0.5
  const tipX = x2
  const tipY = y2
  const leftX = tipX - size * Math.cos(angle - spread)
  const leftY = tipY - size * Math.sin(angle - spread)
  const rightX = tipX - size * Math.cos(angle + spread)
  const rightY = tipY - size * Math.sin(angle + spread)
  const arrow = `<polygon class="${arrowClassName}" points="${points([
    [tipX, tipY],
    [leftX, leftY],
    [rightX, rightY],
  ])}" />`

  return `${path}${arrow}`
}
