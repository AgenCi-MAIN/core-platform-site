/**
 * An Agent2Agent-style protocol for theme making.
 *
 * Shape follows the public A2A pattern: agents publish a card, work is a Task
 * with a state machine, and agents exchange Messages made of Parts. Theme
 * domain payloads (proposal → critique → vote → decision) ride inside data
 * parts. Transport is deliberately out of scope here: in-page MessageChannel,
 * JSON-RPC over fetch, or a fixture player can all carry these types.
 */
import type { AgentId, MessageId, TaskId } from './ids.ts'
import type { ThemeIssue, ThemeTokens } from './theme-tokens.ts'

export interface AgentSkill {
  id: string
  name: string
  description: string
  inputModes: string[]
  outputModes: string[]
}

export interface AgentCard {
  id: AgentId
  name: string
  description: string
  version: string
  skills: AgentSkill[]
  capabilities: { streaming: boolean; pushNotifications: boolean }
}

export const TASK_STATES = ['submitted', 'working', 'input-required', 'completed', 'failed', 'canceled'] as const
export type TaskState = (typeof TASK_STATES)[number]
export const TERMINAL_TASK_STATES: readonly TaskState[] = ['completed', 'failed', 'canceled']
export function isTerminal(state: TaskState): boolean {
  return TERMINAL_TASK_STATES.includes(state)
}

export type TextPart = { kind: 'text'; text: string }
export type DataPart = { kind: 'data'; data: Record<string, unknown> }
export type FilePart = { kind: 'file'; name: string; mimeType: string; bytesBase64?: string; uri?: string }
export type Part = TextPart | DataPart | FilePart

export interface Message {
  id: MessageId
  taskId: TaskId
  role: 'user' | 'agent'
  from: AgentId
  to: AgentId
  parts: Part[]
  createdAt: string
  /** Correlates a response with the request that caused it. */
  correlationId?: string
}

export interface Artifact {
  id: string
  taskId: TaskId
  name: string
  parts: Part[]
  index: number
}

export interface Task {
  id: TaskId
  state: TaskState
  history: Message[]
  artifacts: Artifact[]
  createdAt: string
  updatedAt: string
}

/* ---- JSON-RPC 2.0 envelope ------------------------------------------------ */
export const A2A_METHODS = ['agent/card', 'tasks/send', 'tasks/get', 'tasks/cancel', 'tasks/sendSubscribe'] as const
export type A2AMethod = (typeof A2A_METHODS)[number]

export interface JsonRpcRequest<M extends string = A2AMethod, P = unknown> {
  jsonrpc: '2.0'
  id: string | number
  method: M
  params: P
}
export interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}
export type JsonRpcResponse<R = unknown> =
  | { jsonrpc: '2.0'; id: string | number; result: R }
  | { jsonrpc: '2.0'; id: string | number; error: JsonRpcError }

export const JSON_RPC_ERRORS = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  taskNotFound: -32001,
  taskNotCancelable: -32002,
  timeout: -32010,
  transportUnavailable: -32011,
} as const

/* ---- theme-domain payloads ------------------------------------------------ */
export interface ThemeProposal {
  proposalId: string
  theme: ThemeTokens
  rationale: string
  proposer: AgentId
}
export interface ThemeCritique {
  proposalId: string
  critic: AgentId
  issues: ThemeIssue[]
  /** 0..1 */
  score: number
  notes: string
}
export interface ThemeVote {
  proposalId: string
  voter: AgentId
  approve: boolean
  weight: number
}
export interface ThemeDecision {
  proposalId: string
  accepted: boolean
  tally: { approve: number; reject: number; weightApprove: number; weightReject: number }
  decidedAt: string
}

export type A2AThemeEvent =
  | { kind: 'theme.proposal'; payload: ThemeProposal }
  | { kind: 'theme.critique'; payload: ThemeCritique }
  | { kind: 'theme.vote'; payload: ThemeVote }
  | { kind: 'theme.decision'; payload: ThemeDecision }

export function themeEventPart(event: A2AThemeEvent): DataPart {
  return { kind: 'data', data: { kind: event.kind, payload: event.payload as unknown as Record<string, unknown> } }
}
