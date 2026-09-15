/**
 * Ten importable CanvasDoc fixtures, built with the `doc()` DSL from
 * ./builders.ts. Every fixture is domain-shaped from this repository's own
 * portal concepts (see CORE_PLATFORM_RECORD.md / PLATFORM-MAP.md) and each
 * is a meaningfully different graph shape so the canvas and its layout code
 * get real variety to render and run:
 *
 *   1. dialer-transfer-handoff   — linear chain
 *   2. member-request-review     — branch/join, then retry
 *   3. weekly-commitments-rollup — long single-lane chain
 *   4. book-of-business-entry    — diamond (branch → 2 → join)
 *   5. voice-presence-monitor    — star (one hub, four independent leaves)
 *   6. callback-task-retry       — retry-centred chain
 *   7. theme-forge-variants      — multi-lane A2A handoff (3 lanes)
 *   8. cross-lane-drag-scenario  — 2 lanes, one node wired across the seam
 *   9. command-pass-escalation   — fan-in (three sources, one join)
 *  10. layout-stress-4-lane      — ~44 nodes across 4 lanes, layout stress
 *
 * Each fixture builds its own doc with its own seed, so every fixture's ids
 * are independent of the others but stable across repeated builds of that
 * fixture (see tests/builders.test.ts).
 */
import { doc } from './builders.ts'
import { asId } from '../../shared/src/ids.ts'
import type { ThemeId } from '../../shared/src/ids.ts'
import type { CanvasDoc, NodeKind } from '../../../apps/live-canvas/src/contracts.ts'

export interface WorkflowFixture {
  id: string
  title: string
  description: string
  doc: CanvasDoc
}

const OBSIDIAN_AMETHYST = asId<ThemeId>('theme.obsidian-amethyst')
const FORGE_BASE = asId<ThemeId>('theme.forge-base')

/* ---- 1. dialer-transfer-handoff -------------------------------------- */
const dialerTransferHandoff: WorkflowFixture = {
  id: 'dialer-transfer-handoff',
  title: 'Dialer Transfer Handoff',
  description:
    'Linear chain: an inbound carrier transfer is checked against a redeemed command pass, handed to an A2A verifier agent, and turned into an outbound dial confirmation. Demonstrates the plainest shape — one lane, one path, no branching.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 101 })
    .workflow('Dialer Transfer Handoff', 'One inbound transfer, start to finish, with an agent verification step in the middle.')
    .lane('Dialer Pipeline')
    .node('source', 'Inbound Call', {
      transferId: 'xfer_8841',
      sourceSystem: 'signalwire',
      direction: 'inbound',
      callerNumberMasked: '***-***-4471',
      queueName: 'main-hunt',
    })
    .node('transform', 'Command Pass Check', { checks: ['pass.redeemed', 'pass.not_expired'] })
    .node('a2a-handoff', 'Verify With Agent', { to: 'agent.verifier', timeoutMs: 8000, skill: 'transfer.verify' })
    .node('transform', 'Outbound Dial Request', { requestId: 'dial_2201', mode: 'customer', destinationMasked: '***-***-9002' })
    .node('sink', 'Transfer Complete', { status: 'completed' })
    .edge('Inbound Call', 'Command Pass Check')
    .edge('Command Pass Check', 'Verify With Agent')
    .edge('Verify With Agent', 'Outbound Dial Request')
    .edge('Outbound Dial Request', 'Transfer Complete')
    .build(),
}

/* ---- 2. member-request-review ----------------------------------------- */
const memberRequestReview: WorkflowFixture = {
  id: 'member-request-review',
  title: 'Member Request Review',
  description:
    'Branch/join with a retry: a role-change request fans out to two independent checks (tenure, standing), joins, then retries the approval hand-off up to 3 times before recording a decision. Demonstrates parallel fan-out reconverging, plus a retry step.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 102 })
    .workflow('Member Request Review', 'A pending member_requests row moving through two parallel checks and a retried approval hand-off.')
    .lane('Review')
    .node('source', 'New Request', { requestedRole: 'manager', kind: 'role_change', summary: 'Promote to manager', quantity: 1 })
    .node('branch', 'Fan Out Checks', {})
    .node('probe', 'Tenure Check', { rule: 'tenure_months >= 6' })
    .node('probe', 'Standing Check', { rule: 'no_open_audit_flags' })
    .node('join', 'Merge Checks', {})
    .node('retry', 'Approval Handoff', { maxAttempts: 3, onFailure: 'requeue' })
    .node('sink', 'Decision Recorded', { status: 'approved' })
    .edge('New Request', 'Fan Out Checks')
    .edge('Fan Out Checks', 'Tenure Check')
    .edge('Fan Out Checks', 'Standing Check')
    .edge('Tenure Check', 'Merge Checks')
    .edge('Standing Check', 'Merge Checks')
    .edge('Merge Checks', 'Approval Handoff')
    .edge('Approval Handoff', 'Decision Recorded')
    .build(),
}

/* ---- 3. weekly-commitments-rollup -------------------------------------- */
const weeklyCommitmentsRollup: WorkflowFixture = {
  id: 'weekly-commitments-rollup',
  title: 'Weekly Commitment Rollup',
  description:
    'Long single-lane chain: one member’s weekly check-in (lead budget + call target) is range-checked, turned into a pace figure, compared against actual dialer activity, and rendered onto the dashboard’s dashed PLAN panel. Demonstrates a longer sequential pipeline than the linear example, with no branching.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 103 })
    .workflow('Weekly Commitment Rollup', 'weekly_commitments row → pace line, entirely sequential.')
    .lane('Weekly Plan')
    .node('source', 'Checkin Submitted', { weekKey: '2026-W36', leadBudgetCents: 150000, callTarget: 120 })
    .node('transform', 'Normalize Cents', { round: 'nearest_dollar' })
    .node('probe', 'Budget In Range', { rule: '0 <= leadBudgetCents <= 2000000' })
    .node('probe', 'Call Target In Range', { rule: '0 <= callTarget <= 2000' })
    .node('transform', 'Compute Pace', { basis: 'business_days_elapsed' })
    .node('transform', 'Compute Delta Vs Actual', { source: 'dialer_transfers' })
    .node('preview', 'Render Pace Line', { style: 'dashed' })
    .node('sink', 'Commitment Panel', { status: 'rendered' })
    .edge('Checkin Submitted', 'Normalize Cents')
    .edge('Normalize Cents', 'Budget In Range')
    .edge('Budget In Range', 'Call Target In Range')
    .edge('Call Target In Range', 'Compute Pace')
    .edge('Compute Pace', 'Compute Delta Vs Actual')
    .edge('Compute Delta Vs Actual', 'Render Pace Line')
    .edge('Render Pace Line', 'Commitment Panel')
    .build(),
}

/* ---- 4. book-of-business-entry ----------------------------------------- */
const bookOfBusinessEntry: WorkflowFixture = {
  id: 'book-of-business-entry',
  title: 'Book Of Business Entry',
  description:
    'Diamond: a member’s new customer + policy entry splits into two independent validations (customer fields, policy fields) that reconverge before the row is written self-scoped to the member. Demonstrates a minimal branch-then-join diamond distinct from the larger branch/join/retry example.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 104 })
    .workflow('Book Of Business Entry', 'book_customers + book_policies self-scoped write, validated on two independent paths.')
    .lane('Book Entry')
    .node('source', 'New Customer + Policy', {
      displayName: 'J. Alvarez',
      phoneLast4: '4471',
      carrier: 'Acme Mutual',
      product: 'Term Life',
    })
    .node('branch', 'Split Validation', {})
    .node('probe', 'Validate Customer', { rule: 'displayName.length in [1,80]' })
    .node('probe', 'Validate Policy', { rule: 'premiumCents in [0,100000000]' })
    .node('join', 'Merge Validated', {})
    .node('sink', 'Row Written', { status: 'in_force' })
    .edge('New Customer + Policy', 'Split Validation')
    .edge('Split Validation', 'Validate Customer')
    .edge('Split Validation', 'Validate Policy')
    .edge('Validate Customer', 'Merge Validated')
    .edge('Validate Policy', 'Merge Validated')
    .edge('Merge Validated', 'Row Written')
    .build(),
}

/* ---- 5. voice-presence-monitor ------------------------------------------ */
const voicePresenceMonitor: WorkflowFixture = {
  id: 'voice-presence-monitor',
  title: 'Voice Presence Monitor',
  description:
    'Star: one presence heartbeat radiates out to four independent, terminal probes (available / busy / offline / expiry) with nothing downstream of them. Demonstrates a hub-and-spoke shape distinct from every chain-shaped fixture here.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 105 })
    .workflow('Voice Presence Monitor', 'One voice_presence row, checked four independent ways.')
    .lane('Presence')
    .node('source', 'Presence Heartbeat', { memberId: 4821, readyState: 'available', browserSessionId: 'sess_9e1f' })
    .node('probe', 'Available Check', { rule: "readyState == 'available'" }, 'pentagon')
    .node('probe', 'Busy Check', { rule: "readyState == 'busy'" }, 'pentagon')
    .node('probe', 'Offline Check', { rule: "readyState == 'offline'" }, 'pentagon')
    .node('probe', 'Expiry Check', { rule: 'expiresAt > now' }, 'pentagon')
    .edge('Presence Heartbeat', 'Available Check')
    .edge('Presence Heartbeat', 'Busy Check')
    .edge('Presence Heartbeat', 'Offline Check')
    .edge('Presence Heartbeat', 'Expiry Check')
    .build(),
}

/* ---- 6. callback-task-retry ---------------------------------------------- */
const callbackTaskRetry: WorkflowFixture = {
  id: 'callback-task-retry',
  title: 'Callback Task Retry',
  description:
    'Retry-centred chain: a due voice_callback_tasks row is dialed by an A2A agent, retried on no-answer up to 4 times with backoff, then confirmed reached and closed. The retry is a single node carrying maxAttempts/backoffMs — the canvas renders looping-on-failure without a literal graph cycle.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 106 })
    .workflow('Callback Task Retry', 'A missed-call callback, retried until reached.')
    .lane('Callback')
    .node('source', 'Callback Task Due', { voiceCallId: 5521, dueAt: '2026-09-16T18:00:00.000Z', status: 'open' })
    .node('a2a-handoff', 'Attempt Dial', { to: 'agent.dialer', timeoutMs: 15000, skill: 'callback.dial' })
    .node('retry', 'Retry On No-Answer', { maxAttempts: 4, backoffMs: 30000 })
    .node('probe', 'Confirm Reached', { rule: "disposition == 'reached'" })
    .node('sink', 'Callback Closed', { status: 'completed' })
    .edge('Callback Task Due', 'Attempt Dial')
    .edge('Attempt Dial', 'Retry On No-Answer')
    .edge('Retry On No-Answer', 'Confirm Reached')
    .edge('Confirm Reached', 'Callback Closed')
    .build(),
}

/* ---- 7. theme-forge-variants ---------------------------------------------- */
const themeForgeVariants: WorkflowFixture = {
  id: 'theme-forge-variants',
  title: 'Theme Forge Variants',
  description:
    'Multi-lane A2A handoff: a base-proposal lane probes contrast and hands off (one A2A message, two recipients) to two sibling lanes that each preview their own variant. Demonstrates edges crossing from one lane into two different lanes, not just within one.',
  doc: doc(FORGE_BASE, { seed: 107 })
    .workflow('Theme Forge Variants', 'One proposal, two variant lanes previewing it in parallel.')
    .lane('Base Proposal')
    .node('source', 'Draft Tokens', { paletteRole: 'accent', hex: '#A78BFA' })
    .node('probe', 'Contrast Probe', { mode: 'dark', required: 4.5 })
    .node('a2a-handoff', 'Hand To Variant Lanes', { to: 'agent.theme-critic', skill: 'theme.critique' })
    .lane('Cyan Variant')
    .node('transform', 'Swap Focus Ring', { focusRing: '#67E8F9' })
    .node('apply-theme', 'Preview Cyan', { mode: 'dark' })
    .node('sink', 'Cyan Candidate', { status: 'ready' })
    .lane('Violet Variant')
    .node('transform', 'Swap Accent Scale', { accent: '#A78BFA' })
    .node('apply-theme', 'Preview Violet', { mode: 'dark' })
    .node('sink', 'Violet Candidate', { status: 'ready' })
    .edge('Draft Tokens', 'Contrast Probe')
    .edge('Contrast Probe', 'Hand To Variant Lanes')
    .edge('Hand To Variant Lanes', 'Swap Focus Ring')
    .edge('Hand To Variant Lanes', 'Swap Accent Scale')
    .edge('Swap Focus Ring', 'Preview Cyan')
    .edge('Preview Cyan', 'Cyan Candidate')
    .edge('Swap Accent Scale', 'Preview Violet')
    .edge('Preview Violet', 'Violet Candidate')
    .build(),
}

/* ---- 8. cross-lane-drag-scenario -------------------------------------------- */
const crossLaneDragScenario: WorkflowFixture = {
  id: 'cross-lane-drag-scenario',
  title: 'Cross-Lane Drag Scenario',
  description:
    '"Escalate To Command" is drawn in the Frontline lane but both its edges point into Command Center — it is meant to be dragged across the lane boundary (config.suggestedLaneTitle names the target). Exercises the canvas’s card.moved event and cross-lane edge rendering before the drag happens.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 108 })
    .workflow('Cross-Lane Drag Scenario', 'Two lanes; one node currently misplaced relative to its own edges.')
    .lane('Frontline')
    .node('source', 'Inbound Escalation', { queueName: 'escalations', priority: 'high' })
    .node('probe', 'Needs Command Review', { rule: "priority == 'high'" })
    .node('transform', 'Escalate To Command', {
      note: 'Drag this card from Frontline into Command Center — both its edges already point there.',
      suggestedLaneTitle: 'Command Center',
    })
    .lane('Command Center')
    .node('a2a-handoff', 'Command Review', { to: 'agent.command-reviewer', skill: 'escalation.review' })
    .node('sink', 'Escalation Resolved', { status: 'resolved' })
    .edge('Inbound Escalation', 'Needs Command Review')
    .edge('Needs Command Review', 'Escalate To Command')
    .edge('Escalate To Command', 'Command Review')
    .edge('Command Review', 'Escalation Resolved')
    .build(),
}

/* ---- 9. command-pass-escalation ---------------------------------------------- */
const commandPassEscalation: WorkflowFixture = {
  id: 'command-pass-escalation',
  title: 'Command Pass Escalation',
  description:
    'Fan-in: three independent command_passes signals (near expiry, too many failed attempts, revoked early) join into one founder review before a single reconciliation sink. The mirror image of the star fixture — many sources, one path out.',
  doc: doc(OBSIDIAN_AMETHYST, { seed: 109 })
    .workflow('Command Pass Escalation', 'Three command-pass signals, one review.')
    .lane('Escalation')
    .node('source', 'Pass Near Expiry', { email: 'agent1@thrive18.example', expiresAt: '2026-09-16T00:00:00.000Z' })
    .node('source', 'Pass Failed Attempts', { email: 'agent2@thrive18.example', failedAttempts: 4 })
    .node('source', 'Pass Revoked Early', { email: 'agent3@thrive18.example', revokedAt: '2026-09-15T12:00:00.000Z' })
    .node('join', 'Merge Signals', {})
    .node('a2a-handoff', 'Founder Review', { to: 'agent.founder-proxy', skill: 'command_pass.review' })
    .node('sink', 'Passes Reconciled', { status: 'reconciled' })
    .edge('Pass Near Expiry', 'Merge Signals')
    .edge('Pass Failed Attempts', 'Merge Signals')
    .edge('Pass Revoked Early', 'Merge Signals')
    .edge('Merge Signals', 'Founder Review')
    .edge('Founder Review', 'Passes Reconciled')
    .build(),
}

/* ---- 10. layout-stress-4-lane ---------------------------------------------- */
const STRESS_LANES = ['Inbound', 'Verification', 'Dispatch', 'Book'] as const
const STRESS_KIND_CYCLE: NodeKind[] = [
  'source', 'probe', 'transform', 'a2a-handoff', 'branch',
  'join', 'retry', 'apply-theme', 'preview', 'sink', 'transform',
]
const STRESS_NODES_PER_LANE = 11 // 4 lanes * 11 = 44 >= the required 40

function buildLayoutStress(): CanvasDoc {
  const b = doc(OBSIDIAN_AMETHYST, { seed: 110 }).workflow(
    'Layout Stress',
    'Roughly forty nodes across four lanes — not a meaningful pipeline, purely for canvas layout, scroll and zoom performance testing.',
  )
  for (const laneName of STRESS_LANES) {
    b.lane(laneName)
    for (let i = 0; i < STRESS_NODES_PER_LANE; i += 1) {
      const kind = STRESS_KIND_CYCLE[i % STRESS_KIND_CYCLE.length] as NodeKind
      const title = `${laneName} Node ${i + 1}`
      b.node(kind, title, { seq: i, lane: laneName })
      if (i > 0) b.edge(`${laneName} Node ${i}`, title)
    }
  }
  for (let i = 0; i < STRESS_LANES.length - 1; i += 1) {
    b.edge(`${STRESS_LANES[i]} Node ${STRESS_NODES_PER_LANE}`, `${STRESS_LANES[i + 1]} Node 1`)
  }
  return b.build()
}

const layoutStress4Lane: WorkflowFixture = {
  id: 'layout-stress-4-lane',
  title: 'Layout Stress (4 Lanes)',
  description:
    `${STRESS_LANES.length * STRESS_NODES_PER_LANE} nodes across ${STRESS_LANES.length} lanes (a per-lane chain, plus one bridging edge lane-to-lane), for exercising the canvas’s auto-layout, drag performance and viewport panning at scale rather than demonstrating a real pipeline.`,
  doc: buildLayoutStress(),
}

/* ---- aggregate --------------------------------------------------------------- */
export const SAMPLES: readonly WorkflowFixture[] = [
  dialerTransferHandoff,
  memberRequestReview,
  weeklyCommitmentsRollup,
  bookOfBusinessEntry,
  voicePresenceMonitor,
  callbackTaskRetry,
  themeForgeVariants,
  crossLaneDragScenario,
  commandPassEscalation,
  layoutStress4Lane,
]

export {
  dialerTransferHandoff,
  memberRequestReview,
  weeklyCommitmentsRollup,
  bookOfBusinessEntry,
  voicePresenceMonitor,
  callbackTaskRetry,
  themeForgeVariants,
  crossLaneDragScenario,
  commandPassEscalation,
  layoutStress4Lane,
}
