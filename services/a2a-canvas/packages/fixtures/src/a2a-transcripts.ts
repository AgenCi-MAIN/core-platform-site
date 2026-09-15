/**
 * FIXTURES — not runtime code. Three deterministic A2A protocol transcripts
 * for the live canvas's inspector / run-log UI and for runtime tests that
 * need real-looking Message + Task history without driving an actual A2A
 * transport.
 *
 * Each transcript is a `correlationId` plus the `Message`s exchanged under it
 * and a sequence of `Task` snapshots (state as it changes over the
 * conversation), both straight from packages/shared/src/a2a.ts. A `note` next
 * to each snapshot narrates what happened since the previous one for a
 * reader who isn't replaying the protocol by hand.
 *
 *   1. two-agent-handoff-success — command-pass verification, request then
 *      reply, task reaches 'completed'.
 *   2. dial-request-timeout-then-retry — attempt 1 times out (task moves to
 *      'input-required' with no reply), attempt 2 under the SAME
 *      correlationId succeeds.
 *   3. theme-proposal-declined-vote — a real ThemeCritique/ThemeVote/
 *      ThemeDecision exchange (packages/shared/src/a2a.ts's theme-domain
 *      payloads via themeEventPart) where the tally rejects the proposal;
 *      the task still completes — a "no" is a valid, finished outcome.
 *
 * Pure: ids come from a seeded createIdFactory and timestamps from a
 * steppingClock, so re-running this module produces byte-identical output.
 */
import { createIdFactory, steppingClock, isoAt, asId } from '../../shared/src/ids.ts'
import type { AgentId } from '../../shared/src/ids.ts'
import { themeEventPart } from '../../shared/src/a2a.ts'
import type { Artifact, Message, Task, TaskState } from '../../shared/src/a2a.ts'

export interface TaskSnapshot {
  /** ISO instant this snapshot was taken. */
  at: string
  task: Task
  /** Human narration of what changed since the previous snapshot. */
  note: string
}

export interface A2ATranscript {
  id: string
  title: string
  description: string
  correlationId: string
  messages: Message[]
  taskSnapshots: TaskSnapshot[]
}

/* ---- 1. two-agent-handoff-success -------------------------------------- */
function buildHandoffSuccess(): A2ATranscript {
  const ids = createIdFactory(301)
  const clock = steppingClock(Date.parse('2026-09-15T13:00:00.000Z'), 1000)
  const dispatcher: AgentId = asId('agent.dispatcher')
  const verifier: AgentId = asId('agent.verifier')
  const taskId = ids.task()
  const correlationId = ids.next('corr')

  const request: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: dispatcher,
    to: verifier,
    parts: [{ kind: 'data', data: { transferId: 'xfer_8841', ask: 'confirm command pass redemption', email: 'agent1@thrive18.example' } }],
    createdAt: isoAt(clock),
    correlationId,
  }
  const snapshotSubmitted: TaskSnapshot = {
    at: isoAt(clock),
    note: 'Dispatcher opens the task and sends the verification request.',
    task: { id: taskId, state: 'submitted', history: [request], artifacts: [], createdAt: request.createdAt, updatedAt: request.createdAt },
  }

  const workingAt = isoAt(clock)
  const snapshotWorking: TaskSnapshot = {
    at: workingAt,
    note: 'Verifier agent picks up the task.',
    task: { ...snapshotSubmitted.task, state: 'working', updatedAt: workingAt },
  }

  const reply: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: verifier,
    to: dispatcher,
    parts: [{ kind: 'data', data: { transferId: 'xfer_8841', verified: true, passId: 'pass_552', reason: 'redeemed inside expiry window' } }],
    createdAt: isoAt(clock),
    correlationId,
  }
  const artifact: Artifact = { id: ids.next('artifact'), taskId, name: 'verification-result', parts: reply.parts, index: 0 }
  const completedAt = isoAt(clock)
  const snapshotCompleted: TaskSnapshot = {
    at: completedAt,
    note: 'Verifier replies "verified"; dispatcher closes the task.',
    task: {
      id: taskId,
      state: 'completed',
      history: [request, reply],
      artifacts: [artifact],
      createdAt: request.createdAt,
      updatedAt: completedAt,
    },
  }

  return {
    id: 'two-agent-handoff-success',
    title: 'Command Pass Verification — Successful Handoff',
    description:
      'A dispatcher agent asks a verifier agent to confirm a command-pass redemption for a dialer transfer; the verifier replies "verified" and the task completes. The plain-path transcript: one request, one reply, one correlationId throughout.',
    correlationId,
    messages: [request, reply],
    taskSnapshots: [snapshotSubmitted, snapshotWorking, snapshotCompleted],
  }
}

/* ---- 2. dial-request-timeout-then-retry --------------------------------- */
function buildTimeoutThenRetry(): A2ATranscript {
  const ids = createIdFactory(302)
  const clock = steppingClock(Date.parse('2026-09-15T14:00:00.000Z'), 1000)
  const dispatcher: AgentId = asId('agent.dispatcher')
  const dialerAgent: AgentId = asId('agent.dialer')
  const taskId = ids.task()
  const correlationId = ids.next('corr')

  const attempt1: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: dispatcher,
    to: dialerAgent,
    parts: [{ kind: 'data', data: { requestId: 'dial_2201', mode: 'customer', destinationMasked: '***-***-9002', attempt: 1 } }],
    createdAt: isoAt(clock),
    correlationId,
  }
  const submittedAt = isoAt(clock)
  const snapshotSubmitted: TaskSnapshot = {
    at: submittedAt,
    note: 'Attempt 1 queued.',
    task: { id: taskId, state: 'submitted', history: [attempt1], artifacts: [], createdAt: submittedAt, updatedAt: submittedAt },
  }

  const workingAt = isoAt(clock)
  const snapshotWorking1: TaskSnapshot = {
    at: workingAt,
    note: 'Attempt 1 in flight against the dialer agent.',
    task: { ...snapshotSubmitted.task, state: 'working', updatedAt: workingAt },
  }

  const timeoutAt = isoAt(clock)
  const snapshotTimedOut: TaskSnapshot = {
    at: timeoutAt,
    note: 'Attempt 1 times out after 8000ms with no reply; dispatcher schedules a retry under the same correlationId.',
    task: { ...snapshotWorking1.task, state: 'input-required', updatedAt: timeoutAt },
  }

  const attempt2: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: dispatcher,
    to: dialerAgent,
    parts: [{ kind: 'data', data: { requestId: 'dial_2201', mode: 'customer', destinationMasked: '***-***-9002', attempt: 2 } }],
    createdAt: isoAt(clock),
    correlationId,
  }
  const workingAt2 = isoAt(clock)
  const snapshotWorking2: TaskSnapshot = {
    at: workingAt2,
    note: 'Attempt 2 in flight.',
    task: {
      id: taskId,
      state: 'working',
      history: [attempt1, attempt2],
      artifacts: [],
      createdAt: submittedAt,
      updatedAt: workingAt2,
    },
  }

  const reply: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: dialerAgent,
    to: dispatcher,
    parts: [{ kind: 'data', data: { requestId: 'dial_2201', attempt: 2, status: 'queued', externalCallId: 'CA9f1a2b3c' } }],
    createdAt: isoAt(clock),
    correlationId,
  }
  const artifact: Artifact = { id: ids.next('artifact'), taskId, name: 'dial-result', parts: reply.parts, index: 0 }
  const completedAt = isoAt(clock)
  const snapshotCompleted: TaskSnapshot = {
    at: completedAt,
    note: 'Attempt 2 succeeds; task completes.',
    task: {
      id: taskId,
      state: 'completed',
      history: [attempt1, attempt2, reply],
      artifacts: [artifact],
      createdAt: submittedAt,
      updatedAt: completedAt,
    },
  }

  return {
    id: 'dial-request-timeout-then-retry',
    title: 'Outbound Dial Request — Timeout Then Retry',
    description:
      'A dial request to an outbound-dial agent times out on its first attempt (task moves to "input-required" with no reply, not "failed") and succeeds on a second attempt sent under the same correlationId. Demonstrates the a2a.timeout → retry → success sequence the canvas runtime’s a2a-handoff node produces.',
    correlationId,
    messages: [attempt1, attempt2, reply],
    taskSnapshots: [snapshotSubmitted, snapshotWorking1, snapshotTimedOut, snapshotWorking2, snapshotCompleted],
  }
}

/* ---- 3. theme-proposal-declined-vote ------------------------------------ */
function buildDeclinedVote(): A2ATranscript {
  const ids = createIdFactory(303)
  const clock = steppingClock(Date.parse('2026-09-15T15:00:00.000Z'), 1000)
  const proposer: AgentId = asId('agent.theme-proposer')
  const chair: AgentId = asId('agent.theme-chair')
  const reviewer1: AgentId = asId('agent.reviewer-1')
  const reviewer2: AgentId = asId('agent.reviewer-2')
  const reviewer3: AgentId = asId('agent.reviewer-3')
  const taskId = ids.task()
  const correlationId = ids.next('corr')
  const proposalId = ids.next('proposal')

  const proposalMsg: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: proposer,
    to: chair,
    parts: [
      { kind: 'text', text: 'Proposing a cyan focus ring (#67E8F9) for dark mode.' },
      { kind: 'data', data: { proposalId, summary: 'swap modes.dark.focusRing to #67E8F9', rationale: 'higher hue contrast against the violet accent' } },
    ],
    createdAt: isoAt(clock),
    correlationId,
  }
  const submittedAt = isoAt(clock)
  const snapshotSubmitted: TaskSnapshot = {
    at: submittedAt,
    note: 'Proposal opened for review.',
    task: { id: taskId, state: 'submitted', history: [proposalMsg], artifacts: [], createdAt: submittedAt, updatedAt: submittedAt },
  }

  const critiqueMsg: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: reviewer1,
    to: chair,
    parts: [
      themeEventPart({
        kind: 'theme.critique',
        payload: {
          proposalId,
          critic: reviewer1,
          issues: [{ code: 'contrast.low', path: 'modes.dark.focusRing', message: 'Focus ring vs surface ratio 2.9:1, below the 3:1 minimum.', severity: 'error' }],
          score: 0.35,
          notes: 'Fails the focus-visible contrast check in dark mode.',
        },
      }),
    ],
    createdAt: isoAt(clock),
    correlationId,
  }
  const workingAt = isoAt(clock)
  const snapshotWorking: TaskSnapshot = {
    at: workingAt,
    note: 'Reviewer 1 files a critique: contrast fails in dark mode.',
    task: { ...snapshotSubmitted.task, state: 'working', history: [proposalMsg, critiqueMsg], updatedAt: workingAt },
  }

  const vote1: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: reviewer1,
    to: chair,
    parts: [themeEventPart({ kind: 'theme.vote', payload: { proposalId, voter: reviewer1, approve: false, weight: 1 } })],
    createdAt: isoAt(clock),
    correlationId,
  }
  const vote2: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: reviewer2,
    to: chair,
    parts: [themeEventPart({ kind: 'theme.vote', payload: { proposalId, voter: reviewer2, approve: true, weight: 1 } })],
    createdAt: isoAt(clock),
    correlationId,
  }
  const vote3: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: reviewer3,
    to: chair,
    parts: [themeEventPart({ kind: 'theme.vote', payload: { proposalId, voter: reviewer3, approve: false, weight: 1 } })],
    createdAt: isoAt(clock),
    correlationId,
  }
  const votingAt = isoAt(clock)
  const snapshotVoting: TaskSnapshot = {
    at: votingAt,
    note: 'Three reviewers vote: reject, approve, reject.',
    task: {
      ...snapshotWorking.task,
      history: [proposalMsg, critiqueMsg, vote1, vote2, vote3],
      updatedAt: votingAt,
    },
  }

  const decidedAt = isoAt(clock)
  const decisionMsg: Message = {
    id: ids.message(),
    taskId,
    role: 'agent',
    from: chair,
    to: proposer,
    parts: [
      themeEventPart({
        kind: 'theme.decision',
        payload: { proposalId, accepted: false, tally: { approve: 1, reject: 2, weightApprove: 1, weightReject: 2 }, decidedAt },
      }),
    ],
    createdAt: decidedAt,
    correlationId,
  }
  const decisionArtifact: Artifact = { id: ids.next('artifact'), taskId, name: 'theme-decision', parts: decisionMsg.parts, index: 0 }
  const completedAt = isoAt(clock)
  const snapshotCompleted: TaskSnapshot = {
    at: completedAt,
    note: 'Chair tallies 1 approve / 2 reject and declines the proposal; the task still completes — a "no" is a finished result, not a failure.',
    task: {
      id: taskId,
      state: 'completed',
      history: [proposalMsg, critiqueMsg, vote1, vote2, vote3, decisionMsg],
      artifacts: [decisionArtifact],
      createdAt: submittedAt,
      updatedAt: completedAt,
    },
  }

  return {
    id: 'theme-proposal-declined-vote',
    title: 'Theme Proposal — Declined Vote',
    description:
      'A cyan-focus-ring theme proposal is critiqued for low contrast, voted on by three reviewers (1 approve / 2 reject), and declined by the chair’s decision — built entirely from packages/shared/src/a2a.ts’s theme-domain payloads (ThemeCritique, ThemeVote, ThemeDecision) via themeEventPart. The task still reaches "completed": the review process finished, it just said no.',
    correlationId,
    messages: [proposalMsg, critiqueMsg, vote1, vote2, vote3, decisionMsg],
    taskSnapshots: [snapshotSubmitted, snapshotWorking, snapshotVoting, snapshotCompleted],
  }
}

/** All fixture transcripts are built once, at module load, and then frozen data. */
export const TRANSCRIPTS: readonly A2ATranscript[] = [buildHandoffSuccess(), buildTimeoutThenRetry(), buildDeclinedVote()]

export const twoAgentHandoffSuccess = TRANSCRIPTS[0] as A2ATranscript
export const dialRequestTimeoutThenRetry = TRANSCRIPTS[1] as A2ATranscript
export const themeProposalDeclinedVote = TRANSCRIPTS[2] as A2ATranscript
