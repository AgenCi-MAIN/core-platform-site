import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { appendAuditRow } from "../../../../../../db/audit";
import { voiceCallbackTasks, voicePresence } from "../../../../../../db/schema";
import { authorizeCallApi, jsonNoStore } from "../../../voice-server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id: rawId } = await context.params;
  const id = Number.parseInt(rawId, 10);
  const path = `/portal/calls/callback-tasks/${Number.isFinite(id) ? id : "invalid"}/claim`;
  const access = await authorizeCallApi(request, path, {
    requireSameOrigin: true,
    requireAssignment: true,
  });
  if (!access.ok) return access.response;
  if (!Number.isSafeInteger(id) || id <= 0) return jsonNoStore({ error: "Invalid callback task." }, 400);

  try {
    const available = await getDb()
      .select({ memberId: voicePresence.memberId })
      .from(voicePresence)
      .where(
        and(
          eq(voicePresence.memberId, access.session.memberId),
          eq(voicePresence.readyState, "available"),
          gt(voicePresence.expiresAt, new Date().toISOString()),
        ),
      )
      .limit(1);
    if (!available[0]) {
      return jsonNoStore({ error: "Become Available before claiming a shared callback." }, 409);
    }

    // Write the authorization decision before mutating the task. If the audit
    // table is unavailable, fail closed while the callback is still unclaimed;
    // otherwise a successful update followed by a failed audit would leave an
    // employee holding work the operational record cannot explain.
    const audited = await appendAuditRow({
      action: "calls.callback.claim",
      decision: "allow",
      reason: "claim_attempt_authorized",
      actorEmail: access.session.email,
      actorSubjectId: access.session.subjectId,
      actorRole: access.session.role,
      requestPath: path,
      resource: `callback:${id}`,
    });
    if (!audited) {
      return jsonNoStore({ error: "The callback task could not be audited." }, 503);
    }

    const claimed = await getDb()
      .update(voiceCallbackTasks)
      .set({
        claimedByMemberId: access.session.memberId,
        status: "claimed",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(voiceCallbackTasks.id, id),
          eq(voiceCallbackTasks.status, "open"),
          isNull(voiceCallbackTasks.assignedMemberId),
          isNull(voiceCallbackTasks.claimedByMemberId),
        ),
      )
      .returning({ id: voiceCallbackTasks.id });
    if (!claimed[0]) return jsonNoStore({ error: "That callback is no longer available." }, 409);
  } catch {
    return jsonNoStore({ error: "The callback task could not be claimed." }, 503);
  }
  return jsonNoStore({ ok: true, id, status: "claimed" });
}
