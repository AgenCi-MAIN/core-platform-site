/**
 * One executor per NodeKind: a pure-ish async function that turns a node's
 * inputs into its output. Executors never touch the event log directly
 * except through ctx.emit (used only for the a2a.* events — node.started/
 * finished/failed are the runner's job, since it owns attempt counting and
 * failOnce injection).
 *
 * HONESTY LABEL: the a2a-handoff executor talks to in-page simulated agents
 * (see a2a/agents.ts) over an in-page simulated transport (see
 * a2a/transport.ts) — no network, no model call, no credential.
 */
import type { CanvasNode, NodeKind, RunEvent, RunOptions, ThemeApi } from '../contracts.ts'
import type { AgentId, DataPart, Message, Part, Task, TaskId, ThemeTokens } from '../../../../packages/shared/src/index.ts'
import { asId, isoAt, systemClock } from '../../../../packages/shared/src/index.ts'
import type { Endpoint } from './a2a/transport.ts'
import { sendTask } from './a2a/client.ts'
import { JSON_RPC_ERRORS } from '../../../../packages/shared/src/index.ts'

/** Omit that distributes over a union instead of collapsing it — plain
 * Omit<RunEvent, ...> would flatten the RunEvent union down to only the
 * fields common to every variant, dropping cardId (present on most, not
 * run.started/run.canceled) entirely. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never

/** ctx.emit() only ever needs to add the a2a.* / node.* payload — the
 * runner stamps runId/workflowId/at/seq before it reaches the event log. */
export type EmitInput = DistributiveOmit<RunEvent, 'runId' | 'workflowId' | 'at' | 'seq'>

export interface ExecCtx {
  node: CanvasNode
  /** This node's predecessor outputs, in edge order. */
  inputs: unknown[]
  opts: RunOptions
  emit(event: EmitInput): void
  signal: AbortSignal
  a2a: { transport: Endpoint; from: AgentId }
  /** Which attempt this call is (1-based). Not in the minimal ExecCtx this
   * module's spec sketched, but added here since executors.ts and runner.ts
   * are both mine: the 'retry' executor needs to know which attempt it's on
   * to decide whether 'flaky' should still throw, and the runner is what
   * counts attempts (see runner.ts's per-node attempt loop). */
  attempt: number
}

export type Executor = (ctx: ExecCtx) => Promise<unknown>

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}
function isThemeLike(x: unknown): x is ThemeTokens {
  return isPlainObject(x) && 'modes' in x && 'palette' in x
}
function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/* ---- source ---------------------------------------------------------------- */
// opts.input, when set, overrides config.payload — a convenience for tests
// and ad hoc runs that want to seed a source without editing the node.
async function sourceExecutor(ctx: ExecCtx): Promise<unknown> {
  if (ctx.opts.input !== undefined) return ctx.opts.input
  const payload = ctx.node.config.payload
  // A payload of { themeRef: '<theme id>' } resolves to the referenced theme's
  // tokens when a theme api is available (the Theme Forge lane starts this way).
  if (payload && typeof payload === 'object' && typeof (payload as { themeRef?: unknown }).themeRef === 'string' && ctx.opts.themeApi) {
    const ref = (payload as { themeRef: string }).themeRef
    const tokens = ctx.opts.themeApi.get(ref as Parameters<typeof ctx.opts.themeApi.get>[0])
    if (tokens) return tokens
  }
  return payload
}

/* ---- probe ------------------------------------------------------------------ */
function structuralProbe(input: unknown): { type: string; keys: string[]; size: number } {
  const type = input === null ? 'null' : Array.isArray(input) ? 'array' : typeof input
  const keys = isPlainObject(input) ? Object.keys(input) : []
  const size = Array.isArray(input) ? input.length : keys.length
  return { type, keys, size }
}
async function probeExecutor(ctx: ExecCtx): Promise<unknown> {
  const input = ctx.inputs[0]
  if (isThemeLike(input) && ctx.opts.themeApi) {
    // Carry the tokens through so a downstream apply-theme/preview step still
    // has them; the probe result is a report about the tokens, not a replacement.
    return { ...ctx.opts.themeApi.probe(input), tokens: input }
  }
  return structuralProbe(input)
}

/** Accepts theme tokens directly or an object carrying them under `tokens` (e.g. a probe result). */
function themeFrom(input: unknown): ThemeTokens | undefined {
  if (isThemeLike(input)) return input
  if (input && typeof input === 'object' && isThemeLike((input as { tokens?: unknown }).tokens)) return (input as { tokens: ThemeTokens }).tokens
  return undefined
}

/* ---- transform --------------------------------------------------------------- */
type TransformFn = (input: unknown, config: Record<string, unknown>, themeApi: ThemeApi | undefined) => unknown
const TRANSFORMS: Record<string, TransformFn> = {
  identity: (input) => input,
  uppercase: (input) => (typeof input === 'string' ? input.toUpperCase() : JSON.stringify(input).toUpperCase()),
  pick: (input, config) => {
    const keys = Array.isArray(config.keys) ? config.keys.filter((k): k is string => typeof k === 'string') : []
    if (!isPlainObject(input)) return {}
    const out: Record<string, unknown> = {}
    for (const k of keys) if (k in input) out[k] = input[k]
    return out
  },
  merge: (input, config) => {
    const extra = isPlainObject(config.with) ? config.with : {}
    if (isPlainObject(input)) return { ...input, ...extra }
    return { ...extra }
  },
  setAccent: (input, config, themeApi) => {
    const accent = typeof config.accent === 'string' ? config.accent : '#A78BFA'
    if (isThemeLike(input) && themeApi) {
      return themeApi.withOverrides(input, { modes: { light: { accent }, dark: { accent } } })
    }
    if (isPlainObject(input)) return { ...input, accent }
    return { accent }
  },
  count: (input) => {
    if (Array.isArray(input)) return input.length
    if (isPlainObject(input)) return Object.keys(input).length
    if (typeof input === 'string') return input.length
    return 0
  },
}
async function transformExecutor(ctx: ExecCtx): Promise<unknown> {
  const kind = typeof ctx.node.config.transform === 'string' ? ctx.node.config.transform : 'identity'
  const fn = TRANSFORMS[kind]
  if (!fn) throw new Error(`unknown transform "${kind}"`)
  return fn(ctx.inputs[0], ctx.node.config, ctx.opts.themeApi)
}

/* ---- branch / join ------------------------------------------------------------- */
async function branchExecutor(ctx: ExecCtx): Promise<unknown> {
  return ctx.inputs[0]
}
async function joinExecutor(ctx: ExecCtx): Promise<unknown> {
  const inputs = ctx.inputs
  const allPlainObjects = inputs.length > 0 && inputs.every(isPlainObject)
  if (allPlainObjects) {
    return inputs.reduce<Record<string, unknown>>((acc, cur) => ({ ...acc, ...(cur as Record<string, unknown>) }), {})
  }
  return inputs
}

/* ---- retry --------------------------------------------------------------------- */
// The runner owns the attempt loop (it emits node.started/node.failed with
// the attempt number and willRetry). This executor's only job is to decide,
// for the CURRENT attempt, whether config.operation would still fail.
async function retryExecutor(ctx: ExecCtx): Promise<unknown> {
  const config = ctx.node.config
  const operation = config.operation === 'flaky' ? 'flaky' : 'echo'
  const succeedOnAttempt = typeof config.succeedOnAttempt === 'number' ? config.succeedOnAttempt : 1
  if (operation === 'flaky' && ctx.attempt < succeedOnAttempt) {
    throw new Error(`flaky operation failed on attempt ${ctx.attempt} (succeeds on attempt ${succeedOnAttempt})`)
  }
  return ctx.inputs[0]
}

/* ---- apply-theme ----------------------------------------------------------------- */
async function applyThemeExecutor(ctx: ExecCtx): Promise<unknown> {
  const tokens = themeFrom(ctx.inputs[0])
  if (ctx.opts.themeApi && tokens) {
    ctx.opts.themeApi.apply(tokens)
  }
  const probe = ctx.inputs[0] && typeof ctx.inputs[0] === 'object' && 'passed' in (ctx.inputs[0] as object) ? { probePassed: (ctx.inputs[0] as { passed: boolean }).passed } : {}
  return { applied: tokens ? tokens.meta.id : null, ...probe }
}

/* ---- preview ----------------------------------------------------------------------- */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
async function previewExecutor(ctx: ExecCtx): Promise<unknown> {
  const input = ctx.inputs[0]
  const text = typeof input === 'string' ? input : JSON.stringify(input, null, 2)
  return `<pre class="node-preview">${escapeHtml(text ?? String(input))}</pre>`
}

/* ---- sink ---------------------------------------------------------------------------- */
async function sinkExecutor(ctx: ExecCtx): Promise<unknown> {
  return ctx.inputs[0]
}

/* ---- a2a-handoff ----------------------------------------------------------------------- */
function extractResultPayload(task: Task): unknown {
  const last = task.history[task.history.length - 1]
  if (!last) return null
  const dataPart = last.parts.find((p): p is DataPart => p.kind === 'data')
  return dataPart ? dataPart.data : null
}
async function a2aHandoffExecutor(ctx: ExecCtx): Promise<unknown> {
  const to = ctx.node.config.to
  if (typeof to !== 'string' || to.length === 0) {
    throw new Error(`a2a-handoff card "${ctx.node.id}" has no config.to`)
  }
  const clock = ctx.opts.clock ?? systemClock
  const correlationId = globalThis.crypto.randomUUID()
  const taskId: TaskId = asId(globalThis.crypto.randomUUID())
  const toAgent = to as AgentId
  const input = ctx.inputs[0]
  const parts: Part[] = [{ kind: 'data', data: { payload: input, config: ctx.node.config } }]
  const requestMessage: Message = {
    id: asId(globalThis.crypto.randomUUID()),
    taskId,
    role: 'user',
    from: ctx.a2a.from,
    to: toAgent,
    parts,
    createdAt: isoAt(clock),
    correlationId,
  }
  ctx.emit({ type: 'a2a.request', cardId: ctx.node.id, correlationId, to: toAgent, message: requestMessage })

  const timeoutMs = ctx.opts.timeoutMs
  const startedAt = clock.now()
  const result = await sendTask({ transport: ctx.a2a.transport, from: ctx.a2a.from, to: toAgent, taskId, parts, correlationId, timeoutMs, clock })
  const latencyMs = clock.now() - startedAt

  if (!result.ok) {
    if (result.error.code === JSON_RPC_ERRORS.timeout) {
      ctx.emit({ type: 'a2a.timeout', cardId: ctx.node.id, correlationId, to: toAgent, timeoutMs: timeoutMs ?? 0 })
      throw new Error(`A2A timeout after ${timeoutMs ?? 0}ms`)
    }
    throw new Error(result.error.message)
  }

  const responseMessage = result.value.history[result.value.history.length - 1] ?? requestMessage
  ctx.emit({ type: 'a2a.response', cardId: ctx.node.id, correlationId, from: toAgent, message: responseMessage, latencyMs })
  return extractResultPayload(result.value)
}

export const executors: Record<NodeKind, Executor> = {
  source: sourceExecutor,
  probe: probeExecutor,
  transform: transformExecutor,
  'a2a-handoff': a2aHandoffExecutor,
  branch: branchExecutor,
  join: joinExecutor,
  retry: retryExecutor,
  'apply-theme': applyThemeExecutor,
  preview: previewExecutor,
  sink: sinkExecutor,
}

export { errorMessage }
