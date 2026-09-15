/**
 * Deterministic seed content: the three product workflows shown on first
 * load, a blank 'Scratch' workflow, and the blankNode() factory the canvas
 * uses when the user double-clicks empty lane space. Pure — no DOM, no
 * Math.random (ids/clock are injected so output is reproducible in tests).
 */
import type {
  SeedFactory, CanvasDoc, CanvasWorkflow, CanvasNode, NodeKind, ThemeId, LaneId, WorkflowId, CardId, Edge, Lane, Clock,
} from '../contracts.ts'
import { NODE_KIND_META } from '../contracts.ts'
import { createIdFactory, systemClock, isoAt } from '../../../../packages/shared/src/ids.ts'
import type { IdFactory } from '../../../../packages/shared/src/ids.ts'

const NODE_W = 160
const NODE_H = 72
const COL_GAP = 104 // open space for a visible route between nodes
const ROW_GAP = 32
const COL_STEP = NODE_W + COL_GAP
const ROW_STEP = NODE_H + ROW_GAP

export function createSeedFactory(ids: IdFactory = createIdFactory(1), clock: Clock = systemClock): SeedFactory {
  function mkLane(workflowId: WorkflowId, title: string): Lane {
    return { id: ids.lane(), workflowId, title, order: 0, collapsed: false }
  }

  function mkNode(laneId: LaneId, kind: NodeKind, title: string, config: Record<string, unknown>, order: number, col: number, row = 0): CanvasNode {
    return {
      id: ids.card(),
      laneId,
      order,
      title,
      body: '',
      tags: [],
      status: 'idle',
      shape: NODE_KIND_META[kind].defaultShape,
      kind,
      config,
      w: NODE_W,
      h: NODE_H,
      position: { x: col * COL_STEP, y: row * ROW_STEP },
    }
  }

  function mkEdge(from: CardId, to: CardId): Edge {
    return { id: ids.edge(), from, to }
  }

  function themeForge(): CanvasWorkflow {
    const workflowId = ids.workflow()
    const lane = mkLane(workflowId, 'Theme Forge')
    const tokens = mkNode(lane.id, 'source', 'Tokens', { payload: { themeRef: 'charcoal-cyan' } }, 0, 0)
    const setAccent = mkNode(lane.id, 'transform', 'Set accent', { transform: 'setAccent', accent: '#08B9D5' }, 1, 1)
    const probe = mkNode(lane.id, 'probe', 'Contrast probe', {}, 2, 2)
    const apply = mkNode(lane.id, 'apply-theme', 'Apply', {}, 3, 3)
    const preview = mkNode(lane.id, 'preview', 'Preview', {}, 4, 4)
    const output = mkNode(lane.id, 'sink', 'Output', {}, 5, 5)
    const cards = [tokens, setAccent, probe, apply, preview, output]
    const edges = [
      mkEdge(tokens.id, setAccent.id),
      mkEdge(setAccent.id, probe.id),
      mkEdge(probe.id, apply.id),
      mkEdge(apply.id, preview.id),
      mkEdge(preview.id, output.id),
    ]
    return {
      id: workflowId,
      name: 'Theme Forge',
      summary: 'tokens → contrast probe → preview → apply',
      lanes: [lane],
      cards,
      edges,
      version: 1,
      updatedAt: isoAt(clock),
    }
  }

  function a2aHandoff(): CanvasWorkflow {
    const workflowId = ids.workflow()
    const lane = mkLane(workflowId, 'A2A Handoff')
    const task = mkNode(lane.id, 'source', 'Task', { payload: { task: 'propose accent', accent: '#08B9D5' } }, 0, 0)
    const paletteAgent = mkNode(lane.id, 'a2a-handoff', 'Palette agent', { to: 'palette-agent', timeoutMs: 2000 }, 1, 1)
    const contrastCritic = mkNode(lane.id, 'a2a-handoff', 'Contrast critic', { to: 'contrast-critic' }, 2, 2)
    const verifier = mkNode(lane.id, 'a2a-handoff', 'Verifier', { to: 'verifier-agent', required: ['score'] }, 3, 3)
    const output = mkNode(lane.id, 'sink', 'Output', {}, 4, 4)
    const cards = [task, paletteAgent, contrastCritic, verifier, output]
    const edges = [
      mkEdge(task.id, paletteAgent.id),
      mkEdge(paletteAgent.id, contrastCritic.id),
      mkEdge(contrastCritic.id, verifier.id),
      mkEdge(verifier.id, output.id),
    ]
    return {
      id: workflowId,
      name: 'A2A Handoff',
      summary: 'task → agent A → agent B → verified output',
      lanes: [lane],
      cards,
      edges,
      version: 1,
      updatedAt: isoAt(clock),
    }
  }

  function workflowLab(): CanvasWorkflow {
    const workflowId = ids.workflow()
    const lane = mkLane(workflowId, 'Workflow Lab')
    const input = mkNode(lane.id, 'source', 'Input', { payload: 'hello lanes' }, 0, 0)
    const branch = mkNode(lane.id, 'branch', 'Branch', {}, 1, 1)
    const uppercase = mkNode(lane.id, 'transform', 'Uppercase', { transform: 'uppercase' }, 2, 2, 0)
    const count = mkNode(lane.id, 'transform', 'Count', { transform: 'count' }, 3, 2, 1)
    const join = mkNode(lane.id, 'join', 'Join', {}, 4, 3)
    const retry = mkNode(lane.id, 'retry', 'Retry', { operation: 'flaky', succeedOnAttempt: 2, maxAttempts: 3 }, 5, 4)
    const output = mkNode(lane.id, 'sink', 'Output', {}, 6, 5)
    const cards = [input, branch, uppercase, count, join, retry, output]
    const edges = [
      mkEdge(input.id, branch.id),
      mkEdge(branch.id, uppercase.id),
      mkEdge(branch.id, count.id),
      mkEdge(uppercase.id, join.id),
      mkEdge(count.id, join.id),
      mkEdge(join.id, retry.id),
      mkEdge(retry.id, output.id),
    ]
    return {
      id: workflowId,
      name: 'Workflow Lab',
      summary: 'branch → parallel steps → join → retry',
      lanes: [lane],
      cards,
      edges,
      version: 1,
      updatedAt: isoAt(clock),
    }
  }

  function scratch(): CanvasWorkflow {
    const workflowId = ids.workflow()
    const lane = mkLane(workflowId, 'Scratch')
    return {
      id: workflowId,
      name: 'Scratch',
      summary: 'Empty lane — build something.',
      lanes: [lane],
      cards: [],
      edges: [],
      version: 1,
      updatedAt: isoAt(clock),
    }
  }

  function defaultDoc(themeId: ThemeId): CanvasDoc {
    return {
      version: 1,
      workflows: [themeForge(), a2aHandoff(), workflowLab(), scratch()],
      themeId,
      viewport: { x: 0, y: 0, zoom: 1 },
    }
  }

  function blankNode(laneId: LaneId, kind: NodeKind, at: { x: number; y: number }): CanvasNode {
    return {
      id: ids.card(),
      laneId,
      order: 0,
      title: NODE_KIND_META[kind].label,
      body: '',
      tags: [],
      status: 'idle',
      shape: NODE_KIND_META[kind].defaultShape,
      kind,
      config: {},
      w: NODE_W,
      h: NODE_H,
      position: at,
    }
  }

  return { defaultDoc, blankNode }
}
