/**
 * The drag-and-drop canvas model: lanes hold ordered cards, edges connect
 * cards, and every structural change is a WorkflowEvent so the canvas, the
 * store, the runtime and the persistence layer all speak one language.
 */
import type { AgentId, CardId, EdgeId, LaneId, WorkflowId } from './ids.ts'

export const CARD_STATUSES = ['idle', 'running', 'blocked', 'done', 'failed'] as const
export type CardStatus = (typeof CARD_STATUSES)[number]

export interface Lane {
  id: LaneId
  workflowId: WorkflowId
  title: string
  order: number
  wipLimit?: number
  color?: string
  collapsed: boolean
}

export interface Card {
  id: CardId
  laneId: LaneId
  order: number
  title: string
  body: string
  tags: string[]
  assignee?: AgentId
  status: CardStatus
  estimate?: number
  /** Free position inside the lane, canvas units; omitted = auto-layout. */
  position?: { x: number; y: number }
}

export interface Edge {
  id: EdgeId
  from: CardId
  to: CardId
  label?: string
}

export interface Workflow {
  id: WorkflowId
  name: string
  lanes: Lane[]
  cards: Card[]
  edges: Edge[]
  version: number
  updatedAt: string
}

type Stamp = { at: string; by?: AgentId }

export type WorkflowEvent =
  | ({ type: 'card.added'; card: Card } & Stamp)
  | ({ type: 'card.removed'; cardId: CardId } & Stamp)
  | ({ type: 'card.moved'; cardId: CardId; fromLane: LaneId; toLane: LaneId; toIndex: number; position?: { x: number; y: number } } & Stamp)
  | ({ type: 'card.reordered'; cardId: CardId; laneId: LaneId; toIndex: number } & Stamp)
  | ({ type: 'card.updated'; cardId: CardId; patch: Partial<Omit<Card, 'id'>> } & Stamp)
  | ({ type: 'lane.added'; lane: Lane } & Stamp)
  | ({ type: 'lane.removed'; laneId: LaneId } & Stamp)
  | ({ type: 'lane.renamed'; laneId: LaneId; title: string } & Stamp)
  | ({ type: 'lane.reordered'; laneId: LaneId; toIndex: number } & Stamp)
  | ({ type: 'edge.added'; edge: Edge } & Stamp)
  | ({ type: 'edge.removed'; edgeId: EdgeId } & Stamp)

export type WorkflowEventType = WorkflowEvent['type']

export interface Selection {
  cardIds: CardId[]
  laneIds: LaneId[]
}
export const EMPTY_SELECTION: Selection = { cardIds: [], laneIds: [] }

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export type DragState =
  | { kind: 'idle' }
  | { kind: 'dragging-card'; cardId: CardId; overLane?: LaneId; overIndex?: number; pointer: { x: number; y: number }; offset: { x: number; y: number } }
  | { kind: 'panning'; origin: { x: number; y: number }; start: Viewport }
  | { kind: 'connecting'; fromCard: CardId; pointer: { x: number; y: number } }
