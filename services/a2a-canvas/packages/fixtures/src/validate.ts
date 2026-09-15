/**
 * Structural validation for a CanvasDoc coming from an untrusted source (a
 * pasted JSON file, an imported sample, browser storage). Pure: no I/O, no
 * mutation of the input, no throwing — every failure is collected and
 * returned as a list of human-readable messages.
 *
 * Checks: version === 1; every array field is actually an array; every id an
 * edge references exists as a node in the same workflow; every node's `kind`
 * is one of NODE_KIND_META's keys; every node's `shape` is one of
 * SHAPE_KINDS; every lane's `workflowId` matches its parent workflow; no
 * cycle among a workflow's edges (DFS); no duplicate id anywhere in the doc.
 */
import { err, ok } from '../../shared/src/result.ts'
import type { Result } from '../../shared/src/result.ts'
import { NODE_KIND_META, SHAPE_KINDS } from '../../../apps/live-canvas/src/contracts.ts'
import type { CanvasDoc } from '../../../apps/live-canvas/src/contracts.ts'

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0
}

/** 3-colour DFS cycle check over a workflow's card ids and edges. */
function hasCycle(cardIds: readonly string[], edges: readonly { from: string; to: string }[]): boolean {
  const adjacency = new Map<string, string[]>()
  for (const id of cardIds) adjacency.set(id, [])
  for (const e of edges) {
    const out = adjacency.get(e.from)
    if (out && adjacency.has(e.to)) out.push(e.to)
  }
  const WHITE = 0
  const GRAY = 1
  const BLACK = 2
  const color = new Map<string, number>()
  for (const id of cardIds) color.set(id, WHITE)

  let cyclic = false
  const stack: string[] = []
  function visit(start: string): void {
    stack.push(start)
    while (stack.length > 0 && !cyclic) {
      const u = stack[stack.length - 1]
      if (u === undefined) break
      if (color.get(u) === WHITE) {
        color.set(u, GRAY)
      }
      let advanced = false
      for (const v of adjacency.get(u) ?? []) {
        const c = color.get(v)
        if (c === GRAY) {
          cyclic = true
          break
        }
        if (c === WHITE) {
          stack.push(v)
          advanced = true
          break
        }
      }
      if (cyclic) break
      if (!advanced) {
        color.set(u, BLACK)
        stack.pop()
      }
    }
  }
  for (const id of cardIds) {
    if (cyclic) break
    if (color.get(id) === WHITE) visit(id)
  }
  return cyclic
}

export function validateDoc(input: unknown): Result<CanvasDoc, string[]> {
  const errors: string[] = []

  if (!isObj(input)) return err(['doc: expected an object'])

  if (input.version !== 1) errors.push(`doc.version: expected 1, got ${JSON.stringify(input.version)}`)

  if (!Array.isArray(input.workflows)) {
    errors.push('doc.workflows: expected an array')
    return err(errors)
  }

  if (!isNonEmptyString(input.themeId)) errors.push('doc.themeId: expected a non-empty string')

  const viewport = input.viewport
  if (
    !isObj(viewport) ||
    typeof viewport.x !== 'number' ||
    typeof viewport.y !== 'number' ||
    typeof viewport.zoom !== 'number'
  ) {
    errors.push('doc.viewport: expected { x: number, y: number, zoom: number }')
  }

  const seenIds = new Set<string>()
  function claimId(id: unknown, where: string): void {
    if (!isNonEmptyString(id)) {
      errors.push(`${where}: expected a non-empty string id`)
      return
    }
    if (seenIds.has(id)) errors.push(`${where}: duplicate id "${id}"`)
    seenIds.add(id)
  }

  for (let wi = 0; wi < input.workflows.length; wi += 1) {
    const wfPrefix = `doc.workflows[${wi}]`
    const wfRaw: unknown = input.workflows[wi]
    if (!isObj(wfRaw)) {
      errors.push(`${wfPrefix}: expected an object`)
      continue
    }

    claimId(wfRaw.id, `${wfPrefix}.id`)
    if (!isNonEmptyString(wfRaw.name)) errors.push(`${wfPrefix}.name: expected a non-empty string`)

    const lanesOk = Array.isArray(wfRaw.lanes)
    const cardsOk = Array.isArray(wfRaw.cards)
    const edgesOk = Array.isArray(wfRaw.edges)
    if (!lanesOk) errors.push(`${wfPrefix}.lanes: expected an array`)
    if (!cardsOk) errors.push(`${wfPrefix}.cards: expected an array`)
    if (!edgesOk) errors.push(`${wfPrefix}.edges: expected an array`)
    if (!lanesOk || !cardsOk || !edgesOk) continue

    const lanes = wfRaw.lanes as unknown[]
    const cards = wfRaw.cards as unknown[]
    const edges = wfRaw.edges as unknown[]

    const laneIds = new Set<string>()
    for (let li = 0; li < lanes.length; li += 1) {
      const lanePrefix = `${wfPrefix}.lanes[${li}]`
      const lane: unknown = lanes[li]
      if (!isObj(lane)) {
        errors.push(`${lanePrefix}: expected an object`)
        continue
      }
      claimId(lane.id, `${lanePrefix}.id`)
      if (isNonEmptyString(lane.id)) laneIds.add(lane.id)
      if (lane.workflowId !== wfRaw.id) {
        errors.push(`${lanePrefix}.workflowId: "${String(lane.workflowId)}" does not match parent workflow id "${String(wfRaw.id)}"`)
      }
      if (!isNonEmptyString(lane.title)) errors.push(`${lanePrefix}.title: expected a non-empty string`)
    }

    const cardIds = new Set<string>()
    for (let ci = 0; ci < cards.length; ci += 1) {
      const cardPrefix = `${wfPrefix}.cards[${ci}]`
      const card: unknown = cards[ci]
      if (!isObj(card)) {
        errors.push(`${cardPrefix}: expected an object`)
        continue
      }
      claimId(card.id, `${cardPrefix}.id`)
      if (isNonEmptyString(card.id)) cardIds.add(card.id)
      if (!isNonEmptyString(card.laneId) || !laneIds.has(card.laneId)) {
        errors.push(`${cardPrefix}.laneId: "${String(card.laneId)}" is not a lane in this workflow`)
      }
      if (typeof card.kind !== 'string' || !(card.kind in NODE_KIND_META)) {
        errors.push(`${cardPrefix}.kind: unknown node kind "${String(card.kind)}"`)
      }
      if (typeof card.shape !== 'string' || !(SHAPE_KINDS as readonly string[]).includes(card.shape)) {
        errors.push(`${cardPrefix}.shape: unknown shape "${String(card.shape)}"`)
      }
      if (typeof card.title !== 'string') errors.push(`${cardPrefix}.title: expected a string`)
    }

    for (let ei = 0; ei < edges.length; ei += 1) {
      const edgePrefix = `${wfPrefix}.edges[${ei}]`
      const edge: unknown = edges[ei]
      if (!isObj(edge)) {
        errors.push(`${edgePrefix}: expected an object`)
        continue
      }
      claimId(edge.id, `${edgePrefix}.id`)
      if (typeof edge.from !== 'string' || !cardIds.has(edge.from)) {
        errors.push(`${edgePrefix}.from: node "${String(edge.from)}" not found in this workflow`)
      }
      if (typeof edge.to !== 'string' || !cardIds.has(edge.to)) {
        errors.push(`${edgePrefix}.to: node "${String(edge.to)}" not found in this workflow`)
      }
    }

    const validEdges = edges
      .filter((e): e is Obj => isObj(e) && typeof e.from === 'string' && typeof e.to === 'string')
      .map((e) => ({ from: e.from as string, to: e.to as string }))
    if (hasCycle([...cardIds], validEdges)) {
      errors.push(`${wfPrefix}: contains a cycle`)
    }
  }

  if (errors.length > 0) return err(errors)
  return ok(input as unknown as CanvasDoc)
}
