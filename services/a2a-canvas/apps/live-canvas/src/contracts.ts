/**
 * Module contracts for the live canvas app.
 *
 * Five workers build five modules in parallel (theme, canvas, runtime, state,
 * ui) and the integrator wires them in main.ts. This file is the only thing
 * they share besides packages/shared, so every cross-module call goes
 * through an interface declared here. Workers implement; they do not edit
 * this file — contract change requests go to the integrator.
 */
import type {
  AgentId, CardId, Clock, EdgeId, LaneId, RunId, ThemeId, WorkflowId,
  Card, Edge, Lane, Workflow, WorkflowEvent, Selection, Viewport, DragState,
  ThemeTokens, ThemePatch, ThemeIssue, Result, TaskState, AgentCard, Message,
} from '../../../packages/shared/src/index.ts'

/* ---- shapes & node kinds -------------------------------------------------- */
export const SHAPE_KINDS = ['rect', 'rounded', 'circle', 'diamond', 'pentagon', 'hexagon'] as const
export type ShapeKind = (typeof SHAPE_KINDS)[number]

export const NODE_KINDS = ['source', 'probe', 'transform', 'a2a-handoff', 'branch', 'join', 'retry', 'apply-theme', 'preview', 'sink'] as const
export type NodeKind = (typeof NODE_KINDS)[number]

export const NODE_KIND_META: Record<NodeKind, { label: string; defaultShape: ShapeKind; description: string }> = {
  source: { label: 'Source', defaultShape: 'circle', description: 'Starts a run with a payload from its config.' },
  probe: { label: 'Probe', defaultShape: 'pentagon', description: 'Inspects its input and reports checks (e.g. contrast probe on a theme).' },
  transform: { label: 'Transform', defaultShape: 'rounded', description: 'Maps input to output with a named transform from its config.' },
  'a2a-handoff': { label: 'A2A Handoff', defaultShape: 'hexagon', description: 'Sends the input to an in-page agent over the A2A transport and waits for the correlated reply.' },
  branch: { label: 'Branch', defaultShape: 'diamond', description: 'Fans its input out to every outgoing edge.' },
  join: { label: 'Join', defaultShape: 'diamond', description: 'Waits for every incoming edge and merges their outputs.' },
  retry: { label: 'Retry', defaultShape: 'rounded', description: 'Re-runs its upstream step on failure up to config.maxAttempts.' },
  'apply-theme': { label: 'Apply theme', defaultShape: 'rect', description: 'Applies theme tokens from its input to the page (preview until Save).' },
  preview: { label: 'Preview', defaultShape: 'rect', description: 'Renders a static HTML preview of its input.' },
  sink: { label: 'Output', defaultShape: 'circle', description: 'Collects the final output for the inspector.' },
}

/* ---- canvas document ------------------------------------------------------ */
export interface CanvasNode extends Card {
  shape: ShapeKind
  kind: NodeKind
  config: Record<string, unknown>
  w: number
  h: number
}
export interface CanvasWorkflow extends Omit<Workflow, 'cards'> {
  cards: CanvasNode[]
  /** Short description shown on the lane header. */
  summary?: string
}
export interface CanvasDoc {
  version: 1
  workflows: CanvasWorkflow[]
  themeId: ThemeId
  themeOverrides?: ThemePatch
  viewport: Viewport
  savedAt?: string
}

/* ---- runs ------------------------------------------------------------------ */
export interface NodeRunSummary {
  runId: RunId
  state: TaskState
  attempts: number
  output?: unknown
  error?: string
  startedAt: string
  finishedAt?: string
}
type Stamp = { runId: RunId; workflowId: WorkflowId; at: string; seq: number }
export type RunEvent =
  | ({ type: 'run.started'; nodeCount: number } & Stamp)
  | ({ type: 'node.started'; cardId: CardId; attempt: number } & Stamp)
  | ({ type: 'node.finished'; cardId: CardId; output: unknown } & Stamp)
  | ({ type: 'node.failed'; cardId: CardId; error: string; willRetry: boolean } & Stamp)
  | ({ type: 'a2a.request'; cardId: CardId; correlationId: string; to: AgentId; message: Message } & Stamp)
  | ({ type: 'a2a.response'; cardId: CardId; correlationId: string; from: AgentId; message: Message; latencyMs: number } & Stamp)
  | ({ type: 'a2a.timeout'; cardId: CardId; correlationId: string; to: AgentId; timeoutMs: number } & Stamp)
  | ({ type: 'run.finished'; output: unknown; durationMs: number } & Stamp)
  | ({ type: 'run.failed'; error: string; cardId?: CardId } & Stamp)
  | ({ type: 'run.canceled' } & Stamp)

export interface RunRecord {
  runId: RunId
  workflowId: WorkflowId
  state: 'running' | 'completed' | 'failed' | 'canceled'
  startedAt: string
  finishedAt?: string
  events: RunEvent[]
  nodeResults: Record<string, NodeRunSummary>
  output?: unknown
  error?: string
}

/* ---- app state & store ------------------------------------------------------ */
export type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'dirty' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: string }
  | { kind: 'error'; message: string }

export interface AppState {
  doc: CanvasDoc
  activeWorkflowId: WorkflowId | null
  selection: Selection
  drag: DragState
  runs: Record<string, RunRecord>
  saveStatus: SaveStatus
  canUndo: boolean
  canRedo: boolean
  /** Theme currently applied to the page (preview may differ from doc.themeId until Apply). */
  previewThemeId: ThemeId
  previewOverrides?: ThemePatch
}

export type Action =
  | { type: 'workflow.event'; event: WorkflowEvent }
  | { type: 'workflow.activate'; workflowId: WorkflowId }
  | { type: 'node.config'; cardId: CardId; config: Record<string, unknown> }
  | { type: 'node.shape'; cardId: CardId; shape: ShapeKind }
  | { type: 'node.kind'; cardId: CardId; kind: NodeKind }
  | { type: 'node.resize'; cardId: CardId; w: number; h: number }
  | { type: 'selection.set'; selection: Selection }
  | { type: 'viewport.set'; viewport: Viewport }
  | { type: 'drag.set'; drag: DragState }
  | { type: 'theme.preview'; themeId: ThemeId; overrides?: ThemePatch }
  | { type: 'theme.apply'; themeId: ThemeId; overrides?: ThemePatch }
  | { type: 'doc.load'; doc: CanvasDoc }
  | { type: 'run.event'; event: RunEvent }
  | { type: 'save.status'; status: SaveStatus }

export type Listener = (state: AppState, action: Action | null) => void
export interface Store {
  getState(): AppState
  dispatch(action: Action): void
  subscribe(listener: Listener): () => void
  undo(): void
  redo(): void
}
export type CreateStore = (initial: CanvasDoc, opts?: { clock?: Clock; historyLimit?: number }) => Store

/* ---- persistence ------------------------------------------------------------ */
export interface Persistence {
  /** Returns null when nothing is stored. Never throws. */
  load(): Result<CanvasDoc | null, string>
  save(doc: CanvasDoc): Result<{ savedAt: string; bytes: number }, string>
  clear(): Result<void, string>
}
export const STORAGE_KEY = 'a2a-canvas.doc.v1'

/* ---- canvas (SVG) ----------------------------------------------------------- */
export interface CanvasCallbacks {
  dispatch(action: Action): void
  /** Called when the user finishes inline-editing a label. */
  onEditLabel(cardId: CardId, text: string): void
  /** Called on double-click of empty lane space: (laneId, canvas point). */
  onCreateNode(laneId: LaneId, at: { x: number; y: number }): void
  /** Called when the user drags a connector from one node onto another. */
  onConnect(from: CardId, to: CardId): void
}
export interface CanvasController {
  render(state: AppState): void
  focusNode(cardId: CardId): void
  /** Screen → canvas coordinates using the current viewport. */
  toCanvasPoint(clientX: number, clientY: number): { x: number; y: number }
  destroy(): void
}
export type MountCanvas = (svg: SVGSVGElement, callbacks: CanvasCallbacks) => CanvasController

/** Geometry helpers the canvas exposes for tests and the inspector. */
export interface LaneLayout {
  laneId: LaneId
  x: number
  y: number
  w: number
  h: number
}
export interface NodeLayout {
  cardId: CardId
  x: number
  y: number
  w: number
  h: number
}

/* ---- theme ------------------------------------------------------------------ */
export interface ContrastCheck {
  name: string
  foreground: string
  /** Composited hex actually painted (surface over bg at surfaceAlpha). */
  background: string
  ratio: number
  required: number
  passed: boolean
}
export interface ContrastProbeResult {
  themeId: ThemeId
  mode: 'light' | 'dark'
  checks: ContrastCheck[]
  passed: boolean
  issues: ThemeIssue[]
}
/** The theme maker panel (built by the theme module, hosted by the shell). */
export type MountThemePanel = (container: HTMLElement, deps: { theme: ThemeApi; store: Store }) => { update(state: AppState): void; destroy(): void }

export interface ThemeApi {
  list(): ThemeTokens[]
  get(id: ThemeId): ThemeTokens | undefined
  /** Deep-merges a patch onto a theme, returning a new object. */
  withOverrides(base: ThemeTokens, patch?: ThemePatch): ThemeTokens
  /** Writes CSS variables on :root. Must preserve scroll positions and focus. */
  apply(tokens: ThemeTokens, opts?: { mode?: 'light' | 'dark' }): void
  probe(tokens: ThemeTokens, mode?: 'light' | 'dark'): ContrastProbeResult
  /** Serialises tokens to the CSS variable map the stylesheet expects. */
  toCssVars(tokens: ThemeTokens, mode?: 'light' | 'dark'): Record<string, string>
}
/** The exact CSS custom properties styles.css consumes. */
export const CSS_VARS = [
  '--c-bg', '--c-surface-rgb', '--surface-alpha', '--c-accent', '--c-focus', '--c-text', '--c-muted',
  '--c-success', '--c-warning', '--c-danger', '--c-border',
  '--sp-1', '--sp-2', '--sp-3', '--sp-4', '--radius', '--radius-sm', '--shadow', '--lift',
  '--font-sans', '--font-mono', '--fs-sm', '--fs-md', '--fs-lg',
  '--motion-fast', '--motion-base', '--ease',
] as const
export type CssVar = (typeof CSS_VARS)[number]

/* ---- runtime ----------------------------------------------------------------- */
export interface RunOptions {
  clock?: Clock
  /** Per-node timeout for A2A handoffs, ms. */
  timeoutMs?: number
  /** Deterministic failure injection: these nodes fail on their first attempt. */
  failOnce?: CardId[]
  themeApi?: ThemeApi
  input?: unknown
}
export interface RunHandle {
  runId: RunId
  done: Promise<RunRecord>
}
export interface Runtime {
  run(workflow: CanvasWorkflow, opts?: RunOptions): RunHandle
  cancel(runId: RunId): void
  subscribe(listener: (event: RunEvent) => void): () => void
  /** Agent cards of the in-page agents available to a2a-handoff nodes. */
  agents(): AgentCard[]
}
export type CreateRuntime = (deps: { clock?: Clock; ids?: { run(): RunId } }) => Runtime

/* ---- shell (rail, inspector, run log, status) ------------------------------- */
export interface ShellDeps {
  store: Store
  runtime: Runtime
  theme: ThemeApi
  persistence: Persistence
  canvas: CanvasController
  themePanel: MountThemePanel
  roots: { rail: HTMLElement; inspector: HTMLElement; runlog: HTMLElement; status: HTMLElement; toasts: HTMLElement }
}
export interface Shell {
  mount(): void
  update(state: AppState): void
  notify(kind: 'ok' | 'error' | 'info', message: string): void
  destroy(): void
}
export type MountShell = (deps: ShellDeps) => Shell

/* ---- seeds ------------------------------------------------------------------- */
export interface SeedFactory {
  /** The three product lanes: Theme Forge, A2A Handoff, Workflow Lab. */
  defaultDoc(themeId: ThemeId): CanvasDoc
  blankNode(laneId: LaneId, kind: NodeKind, at: { x: number; y: number }): CanvasNode
}

/* ---- misc --------------------------------------------------------------------- */
export type { Card, Edge, Lane, Workflow, WorkflowEvent, Selection, Viewport, DragState, ThemeTokens, ThemePatch, ThemeIssue, CardId, EdgeId, LaneId, RunId, ThemeId, WorkflowId, AgentId, Clock, Result, TaskState, AgentCard, Message }
