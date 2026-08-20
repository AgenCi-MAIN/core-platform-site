import { getDb } from "./index";
import { auditEvents } from "./schema";
import type { AuditDecision } from "./schema";

/** Same field set as `AuditInput` in `app/portal/access.ts`, minus the framework. */
export type AuditRowInput = {
  action: string;
  decision: AuditDecision;
  reason: string;
  actorEmail?: string | null;
  actorSubjectId?: string | null;
  actorRole?: string | null;
  resource?: string | null;
  requestPath?: string | null;
  detail?: string | null;
};

/**
 * Append one audit row and say whether it landed.
 *
 * `recordAudit` returns `void` and returns early when the D1 binding is absent,
 * so a caller cannot tell a written row from a dropped one. That is the right
 * trade for a rendered page — a logging failure must not deny a member the
 * portal — but it is the wrong one for a machine endpoint. An unattended caller
 * posting a transfer has no operator watching the console, and the audit trail
 * is the entire basis on which that traffic is later trusted; "the row is
 * probably there" is not a claim the portal is allowed to make about its own
 * log. Handing back the outcome lets such a caller fail closed and refuse the
 * write it cannot account for.
 *
 * Still never throws, for the same reason `recordAudit` does not: the failure
 * is reported, not raised.
 */
export async function appendAuditRow(input: AuditRowInput): Promise<boolean> {
  try {
    // `getDb()` throws when the binding is missing rather than returning null,
    // so an unbound database and a failed insert are both caught here — and
    // both are a dropped audit row as far as the caller is concerned.
    await getDb().insert(auditEvents).values({
      action: input.action,
      decision: input.decision,
      reason: input.reason,
      actorEmail: input.actorEmail ?? null,
      actorSubjectId: input.actorSubjectId ?? null,
      actorRole: input.actorRole ?? null,
      resource: input.resource ?? null,
      requestPath: input.requestPath ?? null,
      detail: input.detail ?? null,
    });

    return true;
  } catch (error) {
    console.error("[db] audit write failed", error);
    return false;
  }
}
