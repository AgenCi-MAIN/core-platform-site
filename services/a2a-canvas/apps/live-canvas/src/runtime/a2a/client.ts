/**
 * The A2A client side: builds a 'tasks/send' JSON-RPC request from a set of
 * message parts, sends it over an Endpoint, and unwraps the reply into a
 * Result. HONESTY LABEL: the Endpoint underneath is an in-page simulated
 * transport (see transport.ts) — real correlation and real latency, no
 * network.
 */
import type { AgentId, Clock, JsonRpcError, JsonRpcRequest, Message, Part, Result, Task, TaskId } from '../../../../../packages/shared/src/index.ts'
import { asId, err, isoAt, ok, systemClock } from '../../../../../packages/shared/src/index.ts'
import type { Endpoint } from './transport.ts'
import type { TaskSendParams } from './agents.ts'

export interface SendTaskArgs {
  transport: Endpoint
  from: AgentId
  to: AgentId
  taskId: TaskId
  parts: Part[]
  /** Correlates this request with its response in the run's event log; also
   * used as the JSON-RPC request id since both just need to be unique per
   * in-flight call. */
  correlationId: string
  timeoutMs?: number
  clock?: Clock
}

function newError(e: unknown): JsonRpcError {
  if (e && typeof e === 'object' && 'code' in e && typeof (e as { code: unknown }).code === 'number') {
    return e as JsonRpcError
  }
  return { code: -32603, message: e instanceof Error ? e.message : String(e) }
}

/** Sends one task to an agent and waits for its correlated reply. */
export async function sendTask(args: SendTaskArgs): Promise<Result<Task, JsonRpcError>> {
  const clock = args.clock ?? systemClock
  const message: Message = {
    id: asId(globalThis.crypto.randomUUID()),
    taskId: args.taskId,
    role: 'user',
    from: args.from,
    to: args.to,
    parts: args.parts,
    createdAt: isoAt(clock),
    correlationId: args.correlationId,
  }
  const request: JsonRpcRequest<'tasks/send', TaskSendParams> = {
    jsonrpc: '2.0',
    id: args.correlationId,
    method: 'tasks/send',
    params: { agentId: args.to, taskId: args.taskId, from: args.from, message },
  }
  try {
    const response = await args.transport.send(request, args.timeoutMs)
    if ('error' in response) return err(response.error)
    return ok(response.result as Task)
  } catch (e) {
    return err(newError(e))
  }
}
