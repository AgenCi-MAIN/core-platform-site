import { getDb } from "../../../db";
import { weeklyCommitments } from "../../../db/schema";
import {
  assertCapability,
  recordAudit,
  requireCapability,
  resolvePortalAccess,
} from "../access";
import { isSameOrigin } from "../calls/voice-server";
import { writeRow } from "../read-guard";
import { isoWeekKey } from "../week";

export const dynamic = "force-dynamic";

/**
 * The weekly check-in — the ONLY writer of `weekly_commitments`.
 *
 * A plain HTML form on the dashboard posts here; there is no client JS in the
 * loop. The row's identity is decided entirely on the server: member_id is the
 * session's own resolved membership (subject-bound in portal_members) and
 * week_key is computed from the current UTC instant. Any `member_id`,
 * `week_key`, or other extra field in the body is ignored outright — no
 * parameter exists through which another member's week can even be named, and
 * for the same reason nothing can be back-dated.
 *
 * This is a self-scoped write behind a capability every member already holds;
 * it grants nothing new and widens no role. Bounds here are mirrored by CHECK
 * constraints in db/sql/0013, so a bypassed validator still cannot store an
 * absurd plan.
 *
 * Every response carries Cache-Control: no-store, and every deny after the
 * access resolution writes its own audit row (the resolution audits its own
 * denials before returning).
 */

const PORTAL_ROOT = "/portal";

/** Dollars with optional cents, e.g. "600" or "600.50". Cap enforced after parse. */
const LEAD_BUDGET_SHAPE = /^\d{1,5}(\.\d{1,2})?$/;
/** Whole calls only. Cap enforced after parse. */
const CALL_TARGET_SHAPE = /^\d{1,4}$/;

const LEAD_BUDGET_MAX_CENTS = 2_000_000;
const CALL_TARGET_MAX = 2_000;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

/** Browser-form friendly outcome: land back on the dashboard, never re-POST. */
function seeOther(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: { location, "cache-control": "no-store" },
  });
}

function parseCommitment(
  form: FormData,
): { leadBudgetCents: number; callTarget: number } | null {
  const budgetRaw = form.get("lead_budget");
  const targetRaw = form.get("call_target");
  if (typeof budgetRaw !== "string" || typeof targetRaw !== "string") return null;

  const budget = budgetRaw.trim();
  const target = targetRaw.trim();
  if (!LEAD_BUDGET_SHAPE.test(budget) || !CALL_TARGET_SHAPE.test(target)) return null;

  // Money is integer cents from here on; the shape above admits at most two
  // decimals, so rounding only clears float noise, never a real fraction.
  const leadBudgetCents = Math.round(Number.parseFloat(budget) * 100);
  const callTarget = Number.parseInt(target, 10);

  if (!Number.isInteger(leadBudgetCents)) return null;
  if (leadBudgetCents < 0 || leadBudgetCents > LEAD_BUDGET_MAX_CENTS) return null;
  if (callTarget < 0 || callTarget > CALL_TARGET_MAX) return null;

  return { leadBudgetCents, callTarget };
}

/**
 * A GET here has nothing to show — the commitment panel lives on the
 * dashboard. The handler exists so the endpoint sits inside the suite's
 * anonymous-refusal net like every other protected path: an anonymous GET is
 * sent through sign-in with an empty body, and a signed-in one is sent home.
 */
export async function GET(): Promise<Response> {
  await requireCapability("dashboard.view.self", "/portal/checkin");
  return seeOther(PORTAL_ROOT);
}

export async function POST(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname; // "/portal/checkin"
  const access = await resolvePortalAccess(path);
  if (!access.ok) {
    return json(
      { error: "Sign in required." },
      access.denial.kind === "anonymous" ? 401 : 403,
    );
  }
  const { session } = access;

  try {
    await assertCapability(session, "dashboard.view.self", "weekly_commitment", path);
  } catch {
    return json({ error: "Your role cannot record a weekly commitment." }, 403);
  }

  if (!isSameOrigin(request)) {
    await recordAudit({
      action: "dashboard.checkin",
      decision: "deny",
      reason: "origin_mismatch",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return json({ error: "Request origin rejected." }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    // Not a form post at all. Same outcome as bad fields: refused, audited,
    // nothing written.
    form = new FormData();
  }

  const commitment = parseCommitment(form);
  if (!commitment) {
    await recordAudit({
      action: "dashboard.checkin",
      decision: "deny",
      reason: "invalid_commitment",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return seeOther(`${PORTAL_ROOT}?checkin=invalid`);
  }

  const { leadBudgetCents, callTarget } = commitment;
  const weekKey = isoWeekKey();

  // One row per member per week: the unique index is the upsert key, so a
  // second save this week updates the plan instead of appending a rival one.
  const outcome = await writeRow("weekly_commitments", () =>
    getDb()
      .insert(weeklyCommitments)
      .values({ memberId: session.memberId, weekKey, leadBudgetCents, callTarget })
      .onConflictDoUpdate({
        target: [weeklyCommitments.memberId, weeklyCommitments.weekKey],
        set: { leadBudgetCents, callTarget, updatedAt: new Date().toISOString() },
      }),
  );
  if (!outcome.ok) {
    await recordAudit({
      action: "dashboard.checkin",
      decision: "deny",
      reason: `write_${outcome.fault}`,
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `week:${weekKey}`,
      requestPath: path,
    });
    return seeOther(`${PORTAL_ROOT}?checkin=unavailable`);
  }

  await recordAudit({
    action: "dashboard.checkin",
    decision: "allow",
    reason: "commitment_recorded",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: `week:${weekKey}`,
    requestPath: path,
    // Plan numbers only — no secrets, no other member's data.
    detail: JSON.stringify({ leadBudgetCents, callTarget }),
  });
  return seeOther(PORTAL_ROOT);
}
