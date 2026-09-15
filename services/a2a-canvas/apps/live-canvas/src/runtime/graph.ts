/**
 * Pure graph algorithms over a CanvasWorkflow: predecessor/successor maps,
 * a Kahn's-algorithm topological order grouped into concurrency-safe layers,
 * and structural validation. No I/O, no clock, no randomness — every
 * function here is a plain data transform so the runner and the tests can
 * both reason about it deterministically.
 */
import type { CanvasNode, CanvasWorkflow } from '../contracts.ts'
import type { CardId, EdgeId, Result } from '../../../../packages/shared/src/index.ts'
import { ok, err } from '../../../../packages/shared/src/index.ts'

/** Maps a card id to the ids of the cards whose edges point at it, in the
 * order those edges appear in `workflow.edges`. */
export function predecessors(workflow: CanvasWorkflow): Map<CardId, CardId[]> {
  const map = new Map<CardId, CardId[]>()
  for (const card of workflow.cards) map.set(card.id, [])
  for (const edge of workflow.edges) {
    const list = map.get(edge.to)
    if (list) list.push(edge.from)
    else map.set(edge.to, [edge.from])
  }
  return map
}

/** Maps a card id to the ids of the cards its outgoing edges point at, in
 * the order those edges appear in `workflow.edges`. */
export function successors(workflow: CanvasWorkflow): Map<CardId, CardId[]> {
  const map = new Map<CardId, CardId[]>()
  for (const card of workflow.cards) map.set(card.id, [])
  for (const edge of workflow.edges) {
    const list = map.get(edge.from)
    if (list) list.push(edge.to)
    else map.set(edge.from, [edge.to])
  }
  return map
}

export interface GraphError {
  code: 'cycle'
  message: string
  /** Every card id that never reached zero remaining in-degree — the cycle
   * plus anything only reachable through it. */
  cardIds: CardId[]
}

/**
 * Kahn's algorithm, batched into layers: each returned array holds every
 * card whose predecessors already finished (in an earlier layer, or none at
 * all), so a runner can safely execute a whole layer concurrently
 * (Promise.all) before moving to the next. Cards that never reach zero
 * in-degree are reported as a cycle, naming every card involved.
 */
export function topologicalOrder(workflow: CanvasWorkflow): Result<CardId[][], GraphError> {
  const succ = successors(workflow)
  const cardIds = new Set(workflow.cards.map((c) => c.id))
  const indegree = new Map<CardId, number>()
  for (const card of workflow.cards) indegree.set(card.id, 0)
  for (const edge of workflow.edges) {
    if (!cardIds.has(edge.from) || !cardIds.has(edge.to)) continue // dangling edge — validate() reports this
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1)
  }

  const remaining = new Map(indegree)
  let frontier: CardId[] = workflow.cards.filter((c) => (indegree.get(c.id) ?? 0) === 0).map((c) => c.id)
  const layers: CardId[][] = []
  const visited = new Set<CardId>()

  while (frontier.length > 0) {
    layers.push(frontier)
    const next: CardId[] = []
    for (const id of frontier) {
      visited.add(id)
      for (const succId of succ.get(id) ?? []) {
        const deg = (remaining.get(succId) ?? 0) - 1
        remaining.set(succId, deg)
        if (deg === 0) next.push(succId)
      }
    }
    frontier = next
  }

  if (visited.size < workflow.cards.length) {
    const cycleCards = workflow.cards.map((c) => c.id).filter((id) => !visited.has(id))
    return err({
      code: 'cycle',
      message: `cycle detected among cards: ${cycleCards.join(', ')}`,
      cardIds: cycleCards,
    })
  }
  return ok(layers)
}

export interface ValidationIssue {
  code: 'dangling-edge' | 'duplicate-card' | 'join-needs-input'
  message: string
  cardId?: CardId
  edgeId?: EdgeId
}

/**
 * Structural checks that don't require walking the whole graph: every edge
 * references cards that exist, card ids are unique, and every join has at
 * least one incoming edge. Cycle detection lives in topologicalOrder, since
 * it falls out of Kahn's algorithm for free.
 */
export function validate(workflow: CanvasWorkflow): Result<true, ValidationIssue[]> {
  const issues: ValidationIssue[] = []
  const cardIds = new Set(workflow.cards.map((c) => c.id))
  const seen = new Set<CardId>()

  for (const card of workflow.cards) {
    if (seen.has(card.id)) {
      issues.push({ code: 'duplicate-card', message: `duplicate card id "${card.id}"`, cardId: card.id })
    }
    seen.add(card.id)
  }

  for (const edge of workflow.edges) {
    if (!cardIds.has(edge.from)) {
      issues.push({ code: 'dangling-edge', message: `edge "${edge.id}" references missing card "${edge.from}"`, edgeId: edge.id })
    }
    if (!cardIds.has(edge.to)) {
      issues.push({ code: 'dangling-edge', message: `edge "${edge.id}" references missing card "${edge.to}"`, edgeId: edge.id })
    }
  }

  const preds = predecessors(workflow)
  for (const card of workflow.cards) {
    if (card.kind === 'join') {
      const ins = preds.get(card.id) ?? []
      if (ins.length < 1) {
        issues.push({ code: 'join-needs-input', message: `join card "${card.id}" has no incoming edges`, cardId: card.id })
      }
    }
  }

  return issues.length === 0 ? ok(true) : err(issues)
}

/** Re-exported for callers that only have the node list and want a quick
 * lookup without re-deriving it from the workflow each time. */
export function byId(cards: CanvasNode[]): Map<CardId, CanvasNode> {
  return new Map(cards.map((c) => [c.id, c]))
}
