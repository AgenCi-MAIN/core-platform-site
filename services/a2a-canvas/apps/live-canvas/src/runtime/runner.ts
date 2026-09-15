/**
 * The runtime: validates a workflow, computes a topological execution order,
 * and walks it layer by layer — nodes with no dependency on each other run
 * concurrently (Promise.all), each node's inputs are its predecessors'
 * outputs in edge order. One default in-page A2A transport + agent server
 * (see a2a/transport.ts, a2a/agents.ts) is created per runtime and shared
 * across every run() it executes.
 */
import type {
  AgentCard, CanvasWorkflow, CreateRuntime, NodeRunSummary,
  RunEvent, RunHandle, RunOptions, RunRecord, Runtime,
} from '../contracts.ts'
import type { CardId, Clock, RunId, TaskState } from '../../../../packages/shared/src/index.ts'
import { asId, createIdFactory, isoAt, systemClock } from '../../../../packages/shared/src/index.ts'
import { predecessors, topologicalOrder, validate } from './graph.ts'
import type { ExecCtx } from './executors.ts'
import { errorMessage, executors } from './executors.ts'
import { createChannelTransport } from './a2a/transport.ts'
import { allAgentCards, createAgentServer } from './a2a/agents.ts'

/** The AgentId the runtime itself presents as when it originates an
 * a2a-handoff request — there is no "canvas" AgentCard; this is just the
 * `from` on outgoing messages. */
const RUNTIME_AGENT_ID = asId<'AgentId'>('canvas-runtime')

function readMaxAttempts(config: Record<string, unknown>): number {
  const n = config.maxAttempts
  return typeof n === 'number' && Number.isFinite(n) && n >= 1 ? Math.floor(n) : 3
}

export const createRuntime: CreateRuntime = (deps = {}) => {
  const baseClock = deps.clock ?? systemClock
  const runIds = deps.ids ?? createIdFactory()

  const { client, server } = createChannelTransport()
  // The default agent server has no themeApi of its own — RunOptions.themeApi
  // is per-run and, because ThemeApi carries methods, it can never cross the
  // postMessage wire to be baked into a request. Direct tests of agents.ts
  // exercise the themeApi-aware path by constructing their own server with
  // deps.themeApi set; the shared runtime server always takes the structural
  // fallback for contrast-critic. See the worker report for this tradeoff.
  createAgentServer(server, { clock: baseClock })

  const listeners = new Set<(event: RunEvent) => void>()
  const controllers = new Map<RunId, AbortController>()
  const seqByRun = new Map<RunId, number>()

  function emitEvent(event: RunEvent): void {
    for (const listener of listeners) listener(event)
  }
  function nextSeq(runId: RunId): number {
    const n = (seqByRun.get(runId) ?? 0) + 1
    seqByRun.set(runId, n)
    return n
  }

  function computeFinalOutput(workflow: CanvasWorkflow, outputs: Map<CardId, unknown>): unknown {
    const sinkCards = workflow.cards.filter((c) => c.kind === 'sink')
    if (sinkCards.length === 1) {
      const only = sinkCards[0]
      return only ? outputs.get(only.id) : undefined
    }
    if (sinkCards.length > 1) {
      const out: Record<string, unknown> = {}
      for (const c of sinkCards) out[c.id] = outputs.get(c.id)
      return out
    }
    const last = workflow.cards[workflow.cards.length - 1]
    return last ? outputs.get(last.id) : undefined
  }

  function run(workflow: CanvasWorkflow, opts: RunOptions = {}): RunHandle {
    const runId = runIds.run()
    const controller = new AbortController()
    controllers.set(runId, controller)
    const runClock: Clock = opts.clock ?? baseClock

    const record: RunRecord = {
      runId,
      workflowId: workflow.id,
      state: 'running',
      startedAt: isoAt(runClock),
      events: [],
      nodeResults: {},
    }
    const summaries = new Map<CardId, NodeRunSummary>()

    function stamp() {
      return { runId, workflowId: workflow.id, at: isoAt(runClock), seq: nextSeq(runId) }
    }
    function push(event: RunEvent): void {
      record.events.push(event)
      emitEvent(event)
    }
    function touchSummary(cardId: CardId, patch: { state: TaskState; attempts?: number; output?: unknown; error?: string; finishedAt?: string }): void {
      const prev = summaries.get(cardId)
      const next: NodeRunSummary = {
        runId,
        state: patch.state,
        attempts: patch.attempts ?? prev?.attempts ?? 0,
        startedAt: prev?.startedAt ?? record.startedAt,
        output: patch.output !== undefined ? patch.output : prev?.output,
        error: patch.error !== undefined ? patch.error : prev?.error,
        finishedAt: patch.finishedAt ?? prev?.finishedAt,
      }
      summaries.set(cardId, next)
    }

    const done = (async (): Promise<RunRecord> => {
      const validation = validate(workflow)
      if (!validation.ok) {
        const message = validation.error.map((i) => i.message).join('; ')
        push({ type: 'run.failed', error: message, ...stamp() })
        record.state = 'failed'
        record.error = message
        record.finishedAt = isoAt(runClock)
        return record
      }
      const topo = topologicalOrder(workflow)
      if (!topo.ok) {
        push({ type: 'run.failed', error: topo.error.message, ...stamp() })
        record.state = 'failed'
        record.error = topo.error.message
        record.finishedAt = isoAt(runClock)
        return record
      }

      const startedAtMs = runClock.now()
      push({ type: 'run.started', nodeCount: workflow.cards.length, ...stamp() })

      const preds = predecessors(workflow)
      const cardsById = new Map(workflow.cards.map((c) => [c.id, c] as const))
      const outputs = new Map<CardId, unknown>()
      let failure: { cardId: CardId; error: string } | null = null

      for (const layer of topo.value) {
        if (controller.signal.aborted) break
        await Promise.all(
          layer.map(async (cardId) => {
            if (controller.signal.aborted || failure) return
            const node = cardsById.get(cardId)
            if (!node) return
            const inputs = (preds.get(cardId) ?? []).map((id) => outputs.get(id))
            const attemptsAllowed = node.kind === 'retry' ? readMaxAttempts(node.config) : (opts.failOnce?.includes(cardId) ? 2 : 1)

            for (let attempt = 1; attempt <= attemptsAllowed; attempt += 1) {
              if (controller.signal.aborted) return
              push({ type: 'node.started', cardId, attempt, ...stamp() })
              touchSummary(cardId, { state: 'working', attempts: attempt })
              try {
                if (attempt === 1 && opts.failOnce?.includes(cardId)) {
                  throw new Error(`injected failure for card "${cardId}" (RunOptions.failOnce)`)
                }
                const execCtx: ExecCtx = {
                  node,
                  inputs,
                  opts,
                  attempt,
                  signal: controller.signal,
                  a2a: { transport: client, from: RUNTIME_AGENT_ID },
                  emit: (partial) => push({ ...partial, ...stamp() } as RunEvent),
                }
                const runFn = executors[node.kind]
                const output = await runFn(execCtx)
                if (controller.signal.aborted) return
                outputs.set(cardId, output)
                push({ type: 'node.finished', cardId, output, ...stamp() })
                touchSummary(cardId, { state: 'completed', output, finishedAt: isoAt(runClock) })
                return
              } catch (e) {
                if (controller.signal.aborted) return
                const willRetry = attempt < attemptsAllowed
                const message = errorMessage(e)
                push({ type: 'node.failed', cardId, error: message, willRetry, ...stamp() })
                if (!willRetry) {
                  touchSummary(cardId, { state: 'failed', error: message, finishedAt: isoAt(runClock) })
                  failure = { cardId, error: message }
                  return
                }
              }
            }
          }),
        )
        if (failure) break
      }

      if (controller.signal.aborted) {
        for (const [cardId, summary] of summaries) {
          if (summary.state === 'working') summaries.set(cardId, { ...summary, state: 'canceled', finishedAt: isoAt(runClock) })
        }
        push({ type: 'run.canceled', ...stamp() })
        record.state = 'canceled'
      } else if (failure) {
        push({ type: 'run.failed', error: failure.error, cardId: failure.cardId, ...stamp() })
        record.state = 'failed'
        record.error = failure.error
      } else {
        const output = computeFinalOutput(workflow, outputs)
        const durationMs = runClock.now() - startedAtMs
        push({ type: 'run.finished', output, durationMs, ...stamp() })
        record.state = 'completed'
        record.output = output
      }
      record.finishedAt = isoAt(runClock)
      record.nodeResults = Object.fromEntries(summaries)
      return record
    })()

    return { runId, done }
  }

  function cancel(runId: RunId): void {
    controllers.get(runId)?.abort()
  }

  function subscribe(listener: (event: RunEvent) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function agents(): AgentCard[] {
    return allAgentCards()
  }

  const runtime: Runtime = { run, cancel, subscribe, agents }
  return runtime
}
