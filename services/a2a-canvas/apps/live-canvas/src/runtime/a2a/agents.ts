/**
 * Three in-page simulated agents — palette-agent, contrast-critic and
 * verifier-agent — served over one A2A JSON-RPC Endpoint.
 *
 * HONESTY LABEL: these are in-page simulated agents. Their AgentCards,
 * Tasks and Messages follow the public A2A shapes and they answer over a
 * real MessageChannel-backed transport with real async delay, but there is
 * no network hop, no model call and no credential involved — everything
 * runs in this same JS process.
 */
import type {
  AgentCard, AgentId, Clock, DataPart, IdFactory, JsonRpcError, JsonRpcRequest, JsonRpcResponse,
  Message, Part, Task, TaskId, ThemeIssue,
} from '../../../../../packages/shared/src/index.ts'
import { JSON_RPC_ERRORS, asId, createIdFactory, isoAt, systemClock } from '../../../../../packages/shared/src/index.ts'
import type { Endpoint } from './transport.ts'
import type { ThemeApi } from '../../contracts.ts'

export const PALETTE_AGENT_ID: AgentId = asId('palette-agent')
export const CONTRAST_CRITIC_ID: AgentId = asId('contrast-critic')
export const VERIFIER_AGENT_ID: AgentId = asId('verifier-agent')

export const PALETTE_AGENT_CARD: AgentCard = {
  id: PALETTE_AGENT_ID,
  name: 'Palette Agent',
  description: 'In-page simulated agent. Proposes three accent-colour variants (base, lighter, darker) from a base hex or a theme-ish input.',
  version: '1.0.0',
  skills: [
    {
      id: 'propose-palette',
      name: 'Propose accent palette',
      description: 'Takes a base accent hex (or a theme-ish object carrying one) and returns three variants with a rationale.',
      inputModes: ['text', 'data'],
      outputModes: ['data'],
    },
  ],
  capabilities: { streaming: false, pushNotifications: false },
}

export const CONTRAST_CRITIC_CARD: AgentCard = {
  id: CONTRAST_CRITIC_ID,
  name: 'Contrast Critic',
  description: 'In-page simulated agent. Scores a theme proposal for contrast: a real ThemeApi.probe() when one is wired in, otherwise a structural check that says so in its notes.',
  version: '1.0.0',
  skills: [
    {
      id: 'critique-proposal',
      name: 'Critique a theme proposal',
      description: 'Takes a ThemeProposal-like payload and returns a ThemeCritique-like score, issues and notes.',
      inputModes: ['data'],
      outputModes: ['data'],
    },
  ],
  capabilities: { streaming: false, pushNotifications: false },
}

export const VERIFIER_AGENT_CARD: AgentCard = {
  id: VERIFIER_AGENT_ID,
  name: 'Verifier Agent',
  description: 'In-page simulated agent. Checks a payload against a caller-supplied list of required field names and reports what is missing.',
  version: '1.0.0',
  skills: [
    {
      id: 'verify-fields',
      name: 'Verify required fields',
      description: 'Takes a payload plus a config.required field list and returns { verified, missing }.',
      inputModes: ['data'],
      outputModes: ['data'],
    },
  ],
  capabilities: { streaming: false, pushNotifications: false },
}

export function allAgentCards(): AgentCard[] {
  return [PALETTE_AGENT_CARD, CONTRAST_CRITIC_CARD, VERIFIER_AGENT_CARD]
}

/* ---- request/response envelope used by client.ts and this server -------- */
export interface TaskSendParams {
  agentId: AgentId
  taskId: TaskId
  from: AgentId
  message: Message
}
export interface TaskGetParams {
  agentId: AgentId
  taskId: TaskId
}
export interface TaskCancelParams {
  agentId: AgentId
  taskId: TaskId
}
export interface AgentCardParams {
  agentId: AgentId
}

/** The envelope every a2a-handoff message carries in its data part: the raw
 * node input plus the handoff node's own config, so agents that need a
 * config value (verifier-agent's `required` list) can read it without a
 * second channel. */
export interface HandoffEnvelope {
  payload: unknown
  config: Record<string, unknown>
}

export type DelayFn = (minMs: number, maxMs: number) => Promise<void>

/** A real setTimeout in [minMs, maxMs] so latency is measurable, never 0. */
export const defaultDelay: DelayFn = (minMs, maxMs) =>
  new Promise((resolve) => {
    const span = Math.max(0, maxMs - minMs)
    const ms = minMs + Math.floor(Math.random() * (span + 1))
    setTimeout(resolve, ms)
  })

export interface AgentServerDeps {
  clock?: Clock
  ids?: IdFactory
  delay?: DelayFn
  /** Returns the ThemeApi active for the current interaction, if any. Kept
   * as a getter (not a plain field) because ThemeApi carries methods and so
   * can never itself cross the postMessage wire — only this in-process
   * server may hold a live reference to it. */
  themeApi?: () => ThemeApi | undefined
}

function dataPayload(parts: Part[]): HandoffEnvelope {
  const part = parts.find((p): p is DataPart => p.kind === 'data')
  const data = part?.data ?? {}
  return {
    payload: 'payload' in data ? data.payload : data,
    config: (data.config && typeof data.config === 'object' ? data.config as Record<string, unknown> : {}),
  }
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}

/* ---- palette-agent --------------------------------------------------------- */
const HEX_RE = /^#?[0-9a-fA-F]{6}$/
function normalizeHex(hex: string): string {
  return hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`
}
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0').toUpperCase()).join('')}`
}
function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const [tr, tg, tb] = target
  return rgbToHex(r + (tr - r) * amount, g + (tg - g) * amount, b + (tb - b) * amount)
}
function extractBaseAccent(payload: unknown): string {
  if (typeof payload === 'string' && HEX_RE.test(payload)) return normalizeHex(payload)
  if (isPlainObject(payload)) {
    if (typeof payload.accent === 'string' && HEX_RE.test(payload.accent)) return normalizeHex(payload.accent)
    const modes = payload.modes
    if (isPlainObject(modes) && isPlainObject(modes.light) && typeof modes.light.accent === 'string' && HEX_RE.test(modes.light.accent)) {
      return normalizeHex(modes.light.accent)
    }
  }
  return '#08B9D5' // the primary cyan from the owner's visual source of truth, used as a sane default
}
function proposePalette(payload: unknown, ids: IdFactory): Record<string, unknown> {
  const base = extractBaseAccent(payload)
  const variants = [
    { name: 'base', hex: base },
    { name: 'lighter', hex: mix(base, [255, 255, 255], 0.35) },
    { name: 'darker', hex: mix(base, [0, 0, 0], 0.35) },
  ]
  return {
    proposalId: ids.next('proposal'),
    baseAccent: base,
    variants,
    rationale: `Kept ${base} as the base accent; lighter and darker variants are a 35% mix toward white/black for hover and pressed states.`,
  }
}

/* ---- contrast-critic -------------------------------------------------------- */
function structuralCritique(payload: unknown): { score: number; issues: ThemeIssue[]; notes: string } {
  const issues: ThemeIssue[] = []
  const obj = isPlainObject(payload) ? payload : {}
  const variants = Array.isArray(obj.variants) ? obj.variants : []
  if (variants.length !== 3) {
    issues.push({ code: 'variant-count', path: 'variants', message: `expected 3 accent variants, found ${variants.length}`, severity: 'error' })
  }
  for (const v of variants) {
    const hex = isPlainObject(v) && typeof v.hex === 'string' ? v.hex : ''
    if (!HEX_RE.test(hex)) {
      issues.push({ code: 'invalid-hex', path: 'variants[].hex', message: `"${hex}" is not a 6-digit hex colour`, severity: 'error' })
    }
  }
  if (typeof obj.rationale !== 'string' || obj.rationale.trim().length === 0) {
    issues.push({ code: 'missing-rationale', path: 'rationale', message: 'proposal has no rationale', severity: 'warning' })
  }
  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warnCount = issues.filter((i) => i.severity === 'warning').length
  const score = Math.max(0, 1 - errorCount * 0.4 - warnCount * 0.1)
  return { score, issues, notes: 'structural check only: ThemeApi was not available for this run, so contrast was not actually measured' }
}
function probeCritique(payload: unknown, themeApi: ThemeApi): { score: number; issues: ThemeIssue[]; notes: string } {
  const tokens = payload as Parameters<ThemeApi['probe']>[0]
  const result = themeApi.probe(tokens)
  const passCount = result.checks.filter((c) => c.passed).length
  const score = result.checks.length === 0 ? (result.passed ? 1 : 0) : passCount / result.checks.length
  return { score, issues: result.issues, notes: `ThemeApi.probe() ran in ${result.mode} mode: ${passCount}/${result.checks.length} checks passed` }
}
function critiqueProposal(payload: unknown, critic: AgentId, themeApi: ThemeApi | undefined, ids: IdFactory): Record<string, unknown> {
  const usesThemeApi = !!themeApi && isPlainObject(payload) && 'modes' in payload
  const { score, issues, notes } = usesThemeApi && themeApi ? probeCritique(payload, themeApi) : structuralCritique(payload)
  const proposalId = isPlainObject(payload) && typeof payload.proposalId === 'string' ? payload.proposalId : ids.next('proposal')
  return { proposalId, critic, issues, score, notes }
}

/* ---- verifier-agent ---------------------------------------------------------- */
function verifyFields(payload: unknown, config: Record<string, unknown>): Record<string, unknown> {
  const required = Array.isArray(config.required) ? config.required.filter((x): x is string => typeof x === 'string') : []
  const obj = isPlainObject(payload) ? payload : {}
  const missing = required.filter((key) => !(key in obj) || obj[key] === undefined)
  return { verified: missing.length === 0, missing }
}

/* ---- server ------------------------------------------------------------------ */
interface AgentDefinition {
  card: AgentCard
  compute(payload: unknown, config: Record<string, unknown>, ctx: { themeApi: ThemeApi | undefined; ids: IdFactory }): Record<string, unknown>
}

function buildDefinitions(): Map<AgentId, AgentDefinition> {
  const defs = new Map<AgentId, AgentDefinition>()
  defs.set(PALETTE_AGENT_ID, {
    card: PALETTE_AGENT_CARD,
    compute: (payload, _config, ctx) => proposePalette(payload, ctx.ids),
  })
  defs.set(CONTRAST_CRITIC_ID, {
    card: CONTRAST_CRITIC_CARD,
    compute: (payload, _config, ctx) => critiqueProposal(payload, CONTRAST_CRITIC_ID, ctx.themeApi, ctx.ids),
  })
  defs.set(VERIFIER_AGENT_ID, {
    card: VERIFIER_AGENT_CARD,
    compute: (payload, config) => verifyFields(payload, config),
  })
  return defs
}

function rpcError(id: string | number, error: JsonRpcError): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error }
}
function rpcResult<R>(id: string | number, result: R): JsonRpcResponse<R> {
  return { jsonrpc: '2.0', id, result }
}

/**
 * Registers the three agents on a server Endpoint: 'agent/card', 'tasks/send',
 * 'tasks/get' and 'tasks/cancel', each routed by params.agentId (this one
 * Endpoint hosts all three agents rather than one each).
 */
export function createAgentServer(server: Endpoint, deps: AgentServerDeps = {}): void {
  const clock = deps.clock ?? systemClock
  const ids = deps.ids ?? createIdFactory()
  const delay = deps.delay ?? defaultDelay
  const defs = buildDefinitions()
  const tasks = new Map<TaskId, Task>()

  server.onRequest(async (request: JsonRpcRequest): Promise<JsonRpcResponse> => {
    if (request.method === 'agent/card') {
      const params = request.params as AgentCardParams
      const def = defs.get(params?.agentId)
      if (!def) return rpcError(request.id, { code: JSON_RPC_ERRORS.invalidParams, message: `unknown agent "${String(params?.agentId)}"` })
      return rpcResult(request.id, def.card)
    }

    if (request.method === 'tasks/send') {
      const params = request.params as TaskSendParams
      const def = defs.get(params?.agentId)
      if (!def) return rpcError(request.id, { code: JSON_RPC_ERRORS.invalidParams, message: `unknown agent "${String(params?.agentId)}"` })
      const now = isoAt(clock)
      const task: Task = {
        id: params.taskId,
        state: 'working',
        history: [params.message],
        artifacts: [],
        createdAt: now,
        updatedAt: now,
      }
      tasks.set(task.id, task)
      await delay(5, 30)
      try {
        const { payload, config } = dataPayload(params.message.parts)
        const resultData = def.compute(payload, config, { themeApi: deps.themeApi?.(), ids })
        const responseParts: Part[] = [{ kind: 'data', data: resultData }]
        const responseMessage: Message = {
          id: ids.message(),
          taskId: task.id,
          role: 'agent',
          from: params.agentId,
          to: params.from,
          parts: responseParts,
          createdAt: isoAt(clock),
          correlationId: params.message.correlationId,
        }
        task.history.push(responseMessage)
        task.artifacts.push({ id: ids.next('artifact'), taskId: task.id, name: `${def.card.id}-result`, parts: responseParts, index: 0 })
        task.state = 'completed'
        task.updatedAt = isoAt(clock)
        return rpcResult(request.id, task)
      } catch (e) {
        task.state = 'failed'
        task.updatedAt = isoAt(clock)
        const message = e instanceof Error ? e.message : String(e)
        return rpcError(request.id, { code: JSON_RPC_ERRORS.internal, message })
      }
    }

    if (request.method === 'tasks/get') {
      const params = request.params as TaskGetParams
      const task = tasks.get(params?.taskId)
      if (!task) return rpcError(request.id, { code: JSON_RPC_ERRORS.taskNotFound, message: `no task "${String(params?.taskId)}"` })
      return rpcResult(request.id, task)
    }

    if (request.method === 'tasks/cancel') {
      const params = request.params as TaskCancelParams
      const task = tasks.get(params?.taskId)
      if (!task) return rpcError(request.id, { code: JSON_RPC_ERRORS.taskNotFound, message: `no task "${String(params?.taskId)}"` })
      if (task.state === 'completed' || task.state === 'failed' || task.state === 'canceled') {
        return rpcError(request.id, { code: JSON_RPC_ERRORS.taskNotCancelable, message: `task "${task.id}" is already ${task.state}` })
      }
      task.state = 'canceled'
      task.updatedAt = isoAt(clock)
      return rpcResult(request.id, task)
    }

    return rpcError(request.id, { code: JSON_RPC_ERRORS.methodNotFound, message: `unknown method "${request.method}"` })
  })
}
