import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appendAuditRow } from "../../../../db/audit";
import { voicePresence } from "../../../../db/schema";
import {
  authorizeCallApi,
  getActiveVoiceAssignment,
  jsonNoStore,
  PRESENCE_TTL_MS,
  validBrowserSessionId,
} from "../voice-server";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/presence";
type PresenceAction = "available" | "heartbeat" | "offline";

export async function POST(request: Request): Promise<Response> {
  const access = await authorizeCallApi(request, PATH, { requireSameOrigin: true });
  if (!access.ok) return access.response;
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonNoStore({ error: "Expected a JSON body." }, 415);
  }

  let payload: { action?: unknown; browserSessionId?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return jsonNoStore({ error: "Expected a valid JSON body." }, 400);
  }
  const action = presenceAction(payload.action);
  if (!action || !validBrowserSessionId(payload.browserSessionId)) {
    return jsonNoStore({ error: "Invalid presence update." }, 400);
  }

  let assignment;
  try {
    assignment = await getActiveVoiceAssignment(access.session.memberId);
  } catch {
    return jsonNoStore({ error: "Phone assignments are not available." }, 503);
  }
  if (!assignment) return jsonNoStore({ error: "No active phone assignment." }, 403);

  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PRESENCE_TTL_MS).toISOString();
  try {
    const existing = await db
      .select({
        browserSessionId: voicePresence.browserSessionId,
        readyState: voicePresence.readyState,
        expiresAt: voicePresence.expiresAt,
      })
      .from(voicePresence)
      .where(eq(voicePresence.memberId, access.session.memberId))
      .limit(1);
    if (!existing[0] || existing[0].browserSessionId !== payload.browserSessionId) {
      return jsonNoStore({ error: "This tab is not the primary phone session." }, 409);
    }
    if (action === "available" && new Date(existing[0].expiresAt).getTime() <= now.getTime()) {
      return jsonNoStore(
        { error: "The phone registration expired. Register the browser again." },
        409,
      );
    }
    if (action === "heartbeat" && existing[0].readyState === "offline") {
      return jsonNoStore({ error: "The phone is offline." }, 409);
    }

    if (action === "available") {
      // Availability is the state that makes a browser billably ringable. Log
      // the authorization decision first so an unavailable audit table cannot
      // leave the member eligible for calls after the endpoint reports 503.
      const audited = await appendAuditRow({
        action: "calls.presence",
        decision: "allow",
        reason: "availability_attempt_authorized",
        actorEmail: access.session.email,
        actorSubjectId: access.session.subjectId,
        actorRole: access.session.role,
        requestPath: PATH,
        resource: `member:${access.session.memberId}`,
      });
      if (!audited) {
        return jsonNoStore({ error: "Presence could not be audited safely." }, 503);
      }
    }

    const readyState = action === "offline"
      ? "offline"
      : action === "available"
        ? "available"
        : existing[0].readyState;
    await db
      .update(voicePresence)
      .set({
        readyState,
        lastHeartbeatAt: now.toISOString(),
        expiresAt: action === "offline" ? now.toISOString() : expiresAt,
        updatedAt: now.toISOString(),
      })
      .where(
        and(
          eq(voicePresence.memberId, access.session.memberId),
          eq(voicePresence.browserSessionId, payload.browserSessionId),
        ),
      );
  } catch {
    return jsonNoStore({ error: "Presence could not be updated." }, 503);
  }

  if (action === "offline") {
    // Going Offline is the fail-safe operation. Never keep a browser eligible
    // merely because the audit sink is unavailable; heartbeat expiry remains
    // the independent backstop if even the D1 state update could not land.
    await appendAuditRow({
      action: "calls.presence",
      decision: "allow",
      reason: "member_offline",
      actorEmail: access.session.email,
      actorSubjectId: access.session.subjectId,
      actorRole: access.session.role,
      requestPath: PATH,
      resource: `member:${access.session.memberId}`,
    });
  }

  return jsonNoStore({
    ok: true,
    state: action === "offline" ? "offline" : action === "available" ? "available" : "unchanged",
    expiresAt: action === "offline" ? now.toISOString() : expiresAt,
  });
}

function presenceAction(value: unknown): PresenceAction | null {
  return value === "available" || value === "heartbeat" || value === "offline" ? value : null;
}

export function GET(): Response {
  return new Response(null, {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}
