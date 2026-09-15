/**
 * Shared fixtures for state tests. Not a *.test.ts file itself, so the
 * `node --test` glob (apps/**/tests/**/*.test.ts) never runs it directly.
 */
import type { AppState, CanvasDoc, CanvasWorkflow, CanvasNode, WorkflowId, LaneId, CardId, Edge, Lane } from '../../src/contracts.ts'
import { EMPTY_SELECTION } from '../../../../packages/shared/src/workflow.ts'
import { createIdFactory, fixedClock, asId } from '../../../../packages/shared/src/ids.ts'
import type { IdFactory, Clock } from '../../../../packages/shared/src/ids.ts'

export function testIds(seed = 7): IdFactory {
  return createIdFactory(seed)
}

export function testClock(at = 1_726_400_000_000): Clock {
  return fixedClock(at)
}

export function card(ids: IdFactory, laneId: LaneId, order: number, extra: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: ids.card(),
    laneId,
    order,
    title: extra.title ?? 'Card',
    body: '',
    tags: [],
    status: 'idle',
    shape: 'rect',
    kind: 'transform',
    config: {},
    w: 160,
    h: 72,
    ...extra,
  }
}

export function lane(ids: IdFactory, workflowId: WorkflowId, order: number, title = 'Lane'): Lane {
  return { id: ids.lane(), workflowId, title, order, collapsed: false }
}

export function edge(ids: IdFactory, from: CardId, to: CardId): Edge {
  return { id: ids.edge(), from, to }
}

/** A doc with two workflows: A (two lanes, la1/la2) and B (one lane, lb1). */
export function twoWorkflowDoc(ids: IdFactory): { doc: CanvasDoc; wfA: WorkflowId; wfB: WorkflowId; la1: LaneId; la2: LaneId; lb1: LaneId; ids: { a1: CardId; a2: CardId; a3: CardId; b1: CardId } } {
  const wfA = ids.workflow()
  const wfB = ids.workflow()
  const la1 = ids.lane()
  const la2 = ids.lane()
  const lb1 = ids.lane()

  const laneA1: Lane = { id: la1, workflowId: wfA, title: 'A1', order: 0, collapsed: false }
  const laneA2: Lane = { id: la2, workflowId: wfA, title: 'A2', order: 1, collapsed: false }
  const laneB1: Lane = { id: lb1, workflowId: wfB, title: 'B1', order: 0, collapsed: false }

  const a1 = card(ids, la1, 0, { title: 'a1' })
  const a2 = card(ids, la1, 1, { title: 'a2' })
  const a3 = card(ids, la1, 2, { title: 'a3' })
  const b1 = card(ids, lb1, 0, { title: 'b1' })

  const workflowA: CanvasWorkflow = {
    id: wfA,
    name: 'A',
    lanes: [laneA1, laneA2],
    cards: [a1, a2, a3],
    edges: [edge(ids, a1.id, a2.id), edge(ids, a2.id, a3.id)],
    version: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
  const workflowB: CanvasWorkflow = {
    id: wfB,
    name: 'B',
    lanes: [laneB1],
    cards: [b1],
    edges: [],
    version: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  const doc: CanvasDoc = {
    version: 1,
    workflows: [workflowA, workflowB],
    themeId: asId('theme-1'),
    viewport: { x: 0, y: 0, zoom: 1 },
  }

  return { doc, wfA, wfB, la1, la2, lb1, ids: { a1: a1.id, a2: a2.id, a3: a3.id, b1: b1.id } }
}

export function stateFor(doc: CanvasDoc): AppState {
  return {
    doc,
    activeWorkflowId: doc.workflows[0]?.id ?? null,
    selection: EMPTY_SELECTION,
    drag: { kind: 'idle' },
    runs: {},
    saveStatus: { kind: 'idle' },
    canUndo: false,
    canRedo: false,
    previewThemeId: doc.themeId,
    previewOverrides: doc.themeOverrides,
  }
}
