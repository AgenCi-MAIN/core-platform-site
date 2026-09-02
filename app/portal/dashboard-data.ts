import { and, asc, eq, isNull, or, sql } from "drizzle-orm";
import { getDb } from "../../db";
import {
  inboundVoiceCalls,
  dialerTransfers,
  voiceCallbackTasks,
  weeklyCommitments,
} from "../../db/schema";
import { can, isFounder, type PortalSession } from "./access";
import { readRows, type ReadFault } from "./read-guard";
import { isoPrevWeekStart, isoWeekKey, isoWeekStart } from "./week";

/**
 * Server-side data assembly for the dashboard's three blocks — one function
 * per block, imported only by the dashboard page. No function here ever
 * throws, and no value is ever invented: every table read goes through the
 * classified read wrapper, a fault is returned as a fault (never as a zero),
 * and a metric with no source system says so instead of showing a number.
 *
 * Server-only like the rest of this directory: never import from a file
 * carrying the "use client" directive.
 */

/**
 * One metric tile's source verdict.
 *
 * - "live": every contributing read succeeded, so all four windows are real
 *   counts (a true zero included) and the week-over-week delta may render.
 * - "fault": a contributing table could not be read. No numbers at all — a
 *   half-sum is a wrong number, and this platform never states something it
 *   could not read.
 * - "pending": no source system exists yet. Not a zero, not an error — the
 *   honest "nothing feeds this tile" state.
 */
export type MetricSource =
  | { kind: "live"; day: number; week: number; month: number; prevWeek: number; faultless: true }
  | { kind: "fault"; fault: ReadFault }
  | { kind: "pending" };

export type ProductionMetrics = {
  policiesSold: MetricSource;
  activeClients: MetricSource;
  costPerPolicy: MetricSource;
  callsAnswered: MetricSource;
};

type WindowCounts = { day: number; week: number; month: number; prevWeek: number };

const ZERO_WINDOWS: WindowCounts = { day: 0, week: 0, month: 0, prevWeek: 0 };

/**
 * Block 1 — the production tiles.
 *
 * Policies sold, active clients, and cost per policy have NO source system:
 * no table, no column, no ingest anywhere. They render "pending" until an
 * approved source connects — cost per policy stays pending while EITHER
 * input is unsourced, and it must never read `weekly_commitments`: the
 * commitment's budget is a plan, and a plan substituted for actual spend
 * would be a fabricated actual.
 *
 * Calls answered is live: the sum of the two real call stores, each counted
 * with one aggregate query across all four windows. Timestamps are TEXT in
 * two shapes ("YYYY-MM-DD HH:MM:SS" and "…T…Z"), so the windows compare a
 * lexical date prefix, which orders correctly against both.
 */
export async function loadProduction(session: PortalSession): Promise<ProductionMetrics> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekStartStr = isoWeekStart();
  const monthStartStr = `${todayStr.slice(0, 8)}01`;
  const prevWeekStartStr = isoPrevWeekStart();

  const c = inboundVoiceCalls;
  // Rides the (accepted_member_id, started_at) index; answered_at is the
  // proof the call was actually answered, not merely offered.
  const inboundRead = await readRows("inbound_voice_calls", () =>
    getDb()
      .select({
        day: sql<number>`count(case when ${c.startedAt} >= ${todayStr} then 1 end)`,
        week: sql<number>`count(case when ${c.startedAt} >= ${weekStartStr} then 1 end)`,
        month: sql<number>`count(case when ${c.startedAt} >= ${monthStartStr} then 1 end)`,
        prevWeek: sql<number>`count(case when ${c.startedAt} >= ${prevWeekStartStr} and ${c.startedAt} < ${weekStartStr} then 1 end)`,
      })
      .from(c)
      .where(
        and(
          eq(c.acceptedMemberId, session.memberId),
          sql`${c.answeredAt} IS NOT NULL`,
        ),
      ),
  );

  const t = dialerTransfers;
  // received_at is indexed; started_at is nullable and unindexed here, so it
  // is never filtered on. agent_email carries the external dialer's casing —
  // always compare lowered on both sides.
  const dialerRead = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        day: sql<number>`count(case when ${t.receivedAt} >= ${todayStr} then 1 end)`,
        week: sql<number>`count(case when ${t.receivedAt} >= ${weekStartStr} then 1 end)`,
        month: sql<number>`count(case when ${t.receivedAt} >= ${monthStartStr} then 1 end)`,
        prevWeek: sql<number>`count(case when ${t.receivedAt} >= ${prevWeekStartStr} and ${t.receivedAt} < ${weekStartStr} then 1 end)`,
      })
      .from(t)
      .where(sql`lower(${t.agentEmail}) = ${session.email.toLowerCase()}`),
  );

  let callsAnswered: MetricSource;
  const fault = inboundRead.fault ?? dialerRead.fault;
  if (fault) {
    // Either store unreadable poisons the whole metric: presenting the
    // readable half as the total would be a confident wrong number.
    callsAnswered = { kind: "fault", fault };
  } else {
    const a: WindowCounts = inboundRead.rows[0] ?? ZERO_WINDOWS;
    const b: WindowCounts = dialerRead.rows[0] ?? ZERO_WINDOWS;
    callsAnswered = {
      kind: "live",
      day: a.day + b.day,
      week: a.week + b.week,
      month: a.month + b.month,
      prevWeek: a.prevWeek + b.prevWeek,
      faultless: true,
    };
  }

  return {
    policiesSold: { kind: "pending" },
    activeClients: { kind: "pending" },
    costPerPolicy: { kind: "pending" },
    callsAnswered,
  };
}

export type CommitmentRow = { leadBudgetCents: number; callTarget: number };

export type CommitmentState =
  /** The table could not be read — say so, offer no form whose POST must fail. */
  | { state: "fault"; fault: ReadFault }
  /** Read succeeded, no row for this member+week: the check-in prompts itself. */
  | { state: "unset" }
  /** The member's stated plan, plus Block 1's live week count (null when Block 1 faulted). */
  | { state: "set"; row: CommitmentRow; callsAnsweredWeek: number | null };

/**
 * Block 2 — this week's commitment.
 *
 * The predicate is the session's own member id and the server-computed
 * current week key: no other member's plan is reachable from here, mirroring
 * the self-scope every "own numbers" page uses. Until db/sql/0013 is applied
 * the read classifies as not_provisioned and the panel renders the honest
 * copy instead of bars — empty, not broken, not fake.
 *
 * `callsAnsweredWeek` is Block 1's live week count, passed in rather than
 * re-queried; pass null when Block 1 faulted so the calls bar degrades to
 * its pending presentation instead of asserting a number nobody read.
 */
export async function loadCommitment(
  session: PortalSession,
  callsAnsweredWeek: number | null,
): Promise<CommitmentState> {
  const weekKey = isoWeekKey();
  const { rows, fault } = await readRows("weekly_commitments", () =>
    getDb()
      .select({
        leadBudgetCents: weeklyCommitments.leadBudgetCents,
        callTarget: weeklyCommitments.callTarget,
      })
      .from(weeklyCommitments)
      .where(
        and(
          eq(weeklyCommitments.memberId, session.memberId),
          eq(weeklyCommitments.weekKey, weekKey),
        ),
      )
      .limit(1),
  );

  if (fault) return { state: "fault", fault };
  const row = rows[0];
  if (!row) return { state: "unset" };
  return { state: "set", row, callsAnsweredWeek };
}

export type CallbackPreview = {
  id: number;
  /**
   * The masked caller number IS the identity the platform holds — no
   * caller-name field exists anywhere, and full numbers are ciphertext only.
   */
  callerNumberMasked: string;
  dueAt: string;
  /** Past due at read time. Urgency, never failure, in the presentation. */
  overdue: boolean;
};

export type CallbacksData =
  /** The role does not hold the calls capability: the block is not rendered. */
  | { kind: "hidden" }
  | { kind: "fault"; fault: ReadFault }
  | { kind: "ok"; count: number; top: CallbackPreview[] };

/**
 * `due_at` is written in both stored timestamp shapes over the table's
 * history; both are UTC, so normalize the SQLite shape to ISO before
 * comparing instants.
 */
function isPastDue(dueAt: string, nowIso: string): boolean {
  const iso = dueAt.includes("T") ? dueAt : `${dueAt.replace(" ", "T")}Z`;
  return iso < nowIso;
}

/**
 * Block 3 — the Book of Business tile: open voicemail callbacks.
 *
 * Scope is the bootstrap route's, exactly: the founder sees every open task;
 * a member sees open tasks assigned to them, claimed by them, or unassigned
 * (the shared queue) — never another member's personal queue. The capability
 * check is the honest gate even though every role holds it today.
 */
export async function loadCallbacks(
  session: PortalSession,
  { limit = 3 }: { limit?: number } = {},
): Promise<CallbacksData> {
  if (!can(session, "calls.answer")) return { kind: "hidden" };
  // The list is a preview on the dashboard and the whole self-scoped queue on
  // the Book and Inbound panels; the scope predicate is identical either way.
  const rowLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);

  const scope = isFounder(session)
    ? eq(voiceCallbackTasks.status, "open")
    : and(
        eq(voiceCallbackTasks.status, "open"),
        or(
          eq(voiceCallbackTasks.assignedMemberId, session.memberId),
          eq(voiceCallbackTasks.claimedByMemberId, session.memberId),
          isNull(voiceCallbackTasks.assignedMemberId),
        ),
      );

  const listRead = await readRows("voice_callback_tasks", () =>
    getDb()
      .select({
        id: voiceCallbackTasks.id,
        callerNumberMasked: inboundVoiceCalls.callerNumberMasked,
        dueAt: voiceCallbackTasks.dueAt,
      })
      .from(voiceCallbackTasks)
      .innerJoin(inboundVoiceCalls, eq(voiceCallbackTasks.voiceCallId, inboundVoiceCalls.id))
      .where(scope)
      .orderBy(asc(voiceCallbackTasks.dueAt))
      .limit(rowLimit),
  );
  if (listRead.fault) return { kind: "fault", fault: listRead.fault };

  const countRead = await readRows("voice_callback_tasks", () =>
    getDb()
      .select({ n: sql<number>`count(*)` })
      .from(voiceCallbackTasks)
      .where(scope),
  );
  if (countRead.fault) return { kind: "fault", fault: countRead.fault };

  const nowIso = new Date().toISOString();
  return {
    kind: "ok",
    count: countRead.rows[0]?.n ?? 0,
    top: listRead.rows.map((row) => ({
      ...row,
      overdue: isPastDue(row.dueAt, nowIso),
    })),
  };
}
