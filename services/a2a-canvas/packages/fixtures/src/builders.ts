/**
 * A small, pure builder DSL for CanvasDoc fixtures.
 *
 *   doc(themeId, { seed })
 *     .workflow(name, summary)
 *     .lane(title)
 *     .node(kind, title, config, shape)
 *     .edge(fromTitle, toTitle, label)
 *     .build()
 *
 * "Pure" here means: no `Date.now()`, no `Math.random()`, no I/O. Ids come
 * from a seeded `createIdFactory` and timestamps from a `fixedClock`, both
 * threaded through from `doc()`, so calling the exact same builder chain
 * twice — with the same seed — produces byte-identical output. Nodes are
 * auto-positioned along their lane, `NODE_GAP` px apart, in the order
 * `.node(...)` was called.
 *
 * `.edge()` resolves node titles against every node added since the last
 * `.workflow()` call (titles may repeat across different workflows in the
 * same doc, but must be unique within one workflow), so edges may freely
 * cross lanes within a workflow — see the cross-lane-drag-scenario fixture.
 */
import { createIdFactory, fixedClock, isoAt } from '../../shared/src/ids.ts'
import type { AgentId, CardId, Clock, IdFactory, ThemeId } from '../../shared/src/ids.ts'
import type { CardStatus, Edge, Lane, Viewport } from '../../shared/src/workflow.ts'
import type { ThemePatch } from '../../shared/src/theme-tokens.ts'
import { NODE_KIND_META } from '../../../apps/live-canvas/src/contracts.ts'
import type { CanvasDoc, CanvasNode, CanvasWorkflow, NodeKind, ShapeKind } from '../../../apps/live-canvas/src/contracts.ts'

/** Fixed instant every fixture's clock starts from, unless overridden. */
export const DEFAULT_BUILD_AT = Date.parse('2026-09-02T15:00:00.000Z')

/** Node footprint used for auto-layout; matches the canvas's default card size. */
export const NODE_W = 160
export const NODE_H = 64
/** Gap between successive auto-positioned nodes along a lane, in px. */
export const NODE_GAP = 24

export interface DocBuilderOptions {
  /** Seed for the deterministic id factory. Defaults to 1. */
  seed?: number
  /** Fixed clock instant (ms epoch) every timestamp in this doc uses. */
  startAt?: number
}

export interface LaneOptions {
  wipLimit?: number
  color?: string
}

export interface NodeOptions {
  status?: CardStatus
  body?: string
  tags?: string[]
  assignee?: AgentId
  estimate?: number
}

export interface CanvasDocBuilder {
  /** Starts a new workflow (and a new node-title namespace) in this doc. */
  workflow(name: string, summary?: string): CanvasDocBuilder
  /** Starts a new lane in the current workflow; subsequent .node() calls land here. */
  lane(title: string, opts?: LaneOptions): CanvasDocBuilder
  /** Appends a node to the current lane, auto-positioned after the previous one. */
  node(kind: NodeKind, title: string, config?: Record<string, unknown>, shape?: ShapeKind, opts?: NodeOptions): CanvasDocBuilder
  /** Connects two nodes (by the titles passed to .node()) in the current workflow. */
  edge(fromTitle: string, toTitle: string, label?: string): CanvasDocBuilder
  /** Sets doc-level theme overrides (optional; omit for none). */
  themeOverrides(patch: ThemePatch): CanvasDocBuilder
  /** Sets the doc's saved viewport (defaults to {x:0,y:0,zoom:1}). */
  viewport(v: Viewport): CanvasDocBuilder
  build(): CanvasDoc
}

/** Creates a deterministic CanvasDoc builder rooted at `themeId`. */
export function doc(themeId: ThemeId, opts: DocBuilderOptions = {}): CanvasDocBuilder {
  const ids: IdFactory = createIdFactory(opts.seed ?? 1)
  const clock: Clock = fixedClock(opts.startAt ?? DEFAULT_BUILD_AT)

  const workflows: CanvasWorkflow[] = []
  let curWorkflow: CanvasWorkflow | null = null
  let curLane: Lane | null = null
  let titleIndex = new Map<string, CardId>()
  const laneCursorX = new Map<string, number>()
  let overrides: ThemePatch | undefined
  let vp: Viewport = { x: 0, y: 0, zoom: 1 }

  function requireWorkflow(caller: string): CanvasWorkflow {
    if (!curWorkflow) throw new Error(`doc(): .${caller}() called before .workflow(...)`)
    return curWorkflow
  }
  function requireLane(caller: string): Lane {
    if (!curLane) throw new Error(`doc(): .${caller}() called before .lane(...)`)
    return curLane
  }

  const api: CanvasDocBuilder = {
    workflow(name, summary) {
      const wf: CanvasWorkflow = {
        id: ids.workflow(),
        name,
        summary,
        lanes: [],
        cards: [],
        edges: [],
        version: 1,
        updatedAt: isoAt(clock),
      }
      workflows.push(wf)
      curWorkflow = wf
      curLane = null
      titleIndex = new Map()
      return api
    },

    lane(title, laneOpts) {
      const wf = requireWorkflow('lane')
      const lane: Lane = {
        id: ids.lane(),
        workflowId: wf.id,
        title,
        order: wf.lanes.length,
        collapsed: false,
        wipLimit: laneOpts?.wipLimit,
        color: laneOpts?.color,
      }
      wf.lanes.push(lane)
      curLane = lane
      laneCursorX.set(lane.id, 0)
      return api
    },

    node(kind, title, config = {}, shape, nodeOpts) {
      const wf = requireWorkflow('node')
      const lane = requireLane('node')
      const meta = NODE_KIND_META[kind]
      if (!meta) throw new Error(`doc(): unknown node kind "${kind}"`)
      if (titleIndex.has(title)) {
        throw new Error(`doc(): duplicate node title "${title}" in workflow "${wf.name}"`)
      }
      const x = laneCursorX.get(lane.id) ?? 0
      const orderInLane = wf.cards.filter((c) => c.laneId === lane.id).length
      const node: CanvasNode = {
        id: ids.card(),
        laneId: lane.id,
        order: orderInLane,
        title,
        body: nodeOpts?.body ?? '',
        tags: nodeOpts?.tags ?? [],
        assignee: nodeOpts?.assignee,
        status: nodeOpts?.status ?? 'idle',
        estimate: nodeOpts?.estimate,
        shape: shape ?? meta.defaultShape,
        kind,
        config,
        w: NODE_W,
        h: NODE_H,
        position: { x, y: 0 },
      }
      wf.cards.push(node)
      laneCursorX.set(lane.id, x + NODE_W + NODE_GAP)
      titleIndex.set(title, node.id)
      return api
    },

    edge(fromTitle, toTitle, label) {
      const wf = requireWorkflow('edge')
      const from = titleIndex.get(fromTitle)
      const to = titleIndex.get(toTitle)
      if (!from) throw new Error(`doc(): edge references unknown node "${fromTitle}" in workflow "${wf.name}"`)
      if (!to) throw new Error(`doc(): edge references unknown node "${toTitle}" in workflow "${wf.name}"`)
      const edge: Edge = { id: ids.edge(), from, to, label }
      wf.edges.push(edge)
      return api
    },

    themeOverrides(patch) {
      overrides = patch
      return api
    },

    viewport(v) {
      vp = v
      return api
    },

    build() {
      return {
        version: 1,
        workflows,
        themeId,
        themeOverrides: overrides,
        viewport: vp,
        savedAt: isoAt(clock),
      }
    },
  }

  return api
}
