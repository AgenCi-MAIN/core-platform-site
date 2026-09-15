/**
 * Public surface of the runtime module: the runtime factory plus the A2A
 * helpers other modules (or tests) may want directly.
 */
export { createRuntime } from './runner.ts'

export { predecessors, successors, topologicalOrder, validate, byId } from './graph.ts'
export type { GraphError, ValidationIssue } from './graph.ts'

export type { ExecCtx, Executor, EmitInput } from './executors.ts'
export { executors } from './executors.ts'

export { createChannelTransport, createFlakyTransport, createOfflineTransport } from './a2a/transport.ts'
export type { Endpoint, ChannelTransport } from './a2a/transport.ts'

export {
  createAgentServer, allAgentCards, defaultDelay,
  PALETTE_AGENT_ID, CONTRAST_CRITIC_ID, VERIFIER_AGENT_ID,
  PALETTE_AGENT_CARD, CONTRAST_CRITIC_CARD, VERIFIER_AGENT_CARD,
} from './a2a/agents.ts'
export type { AgentServerDeps, DelayFn, HandoffEnvelope, TaskSendParams, TaskGetParams, TaskCancelParams, AgentCardParams } from './a2a/agents.ts'

export { sendTask } from './a2a/client.ts'
export type { SendTaskArgs } from './a2a/client.ts'
