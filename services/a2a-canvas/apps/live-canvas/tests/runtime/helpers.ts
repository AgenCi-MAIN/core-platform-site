/**
 * Small fixture builders shared by the runtime tests — just enough of a
 * CanvasWorkflow to exercise graph.ts and runner.ts without every test
 * re-typing the same Lane/Card/Edge boilerplate.
 */
import type { CanvasNode, CanvasWorkflow, NodeKind, ShapeKind } from '../../src/contracts.ts'
import type { CardId, Edge, EdgeId, Lane, LaneId, WorkflowId } from '../../../../packages/shared/src/index.ts'
import { asId } from '../../../../packages/shared/src/index.ts'

export const laneId = (s: string): LaneId => asId(s)
export const cardId = (s: string): CardId => asId(s)
export const edgeId = (s: string): EdgeId => asId(s)
export const workflowId = (s: string): WorkflowId => asId(s)

export function mkLane(id: string, wfId: WorkflowId, order = 0): Lane {
  return { id: laneId(id), workflowId: wfId, title: id, order, collapsed: false }
}

export function mkNode(id: string, lane: LaneId, kind: NodeKind, config: Record<string, unknown> = {}): CanvasNode {
  return {
    id: cardId(id),
    laneId: lane,
    order: 0,
    title: id,
    body: '',
    tags: [],
    status: 'idle',
    shape: 'rect' as ShapeKind,
    kind,
    config,
    w: 120,
    h: 80,
  }
}

export function mkEdge(id: string, from: CardId, to: CardId): Edge {
  return { id: edgeId(id), from, to }
}

export function mkWorkflow(id: string, cards: CanvasNode[], edges: Edge[], lanes: Lane[] = []): CanvasWorkflow {
  const wfId = workflowId(id)
  return {
    id: wfId,
    name: id,
    lanes: lanes.length > 0 ? lanes : [mkLane('lane-1', wfId)],
    cards,
    edges,
    version: 1,
    updatedAt: '2026-09-15T00:00:00.000Z',
  }
}
