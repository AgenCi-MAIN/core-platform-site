import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appendAuditRow } from "../../../../db/audit";
import { inboundVoiceCalls, voiceCallOffers, voicePresence } from "../../../../db/schema";
import {
  authorizeCallApi,
  getActiveVoiceAssignment,
  jsonNoStore,
  validBrowserSessionId,
} from "../voice-server";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/offer-event";
type OfferAction = "ringing" | "answered" | "missed" | "ended";

export async function POST(request: Request): Promise<Response> {
  const access = await authorizeCallApi(request, PATH, { requireSameOrigin: true });
  if (!access.ok) return access.response;
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonNoStore({ error: "Expected a JSON body." }, 415);
  }
  let payload: {
    action?: unknown;
    providerCallId?: unknown;
    stage?: unknown;
    attempt?: unknown;
    browserSessionId?: unknown;
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return jsonNoStore({ error: "Expected a valid JSON body." }, 400);
  }
  const action = normalizeAction(payload.action);
  const stage = payload.stage === "personal" || payload.stage === "team" ? payload.stage : null;
  const attempt = typeof payload.attempt === "number"
    && Number.isSafeInteger(payload.attempt)
    && payload.attempt > 0
    && payload.attempt <= 10_000
    ? payload.attempt
    : null;
  if (
    !action
    || !stage
    || !attempt
    || !validBrowserSessionId(payload.browserSessionId)
    || typeof payload.providerCallId !== "string"
    || !/^[A-Za-z0-9._:-]{4,200}$/.test(payload.providerCallId)
  ) {
    return jsonNoStore({ error: "Invalid call event." }, 400);
  }

  let assignment;
  try {
    assignment = await getActiveVoiceAssignment(access.session.memberId);
  } catch {
    return jsonNoStore({ error: "Phone assignments are not available." }, 503);
  }
  if (!assignment) return jsonNoStore({ error: "No active phone assignment." }, 403);

  const db = getDb();
  try {
    const calls = await db
      .select({
        id: inboundVoiceCalls.id,
        acceptedMemberId: inboundVoiceCalls.acceptedMemberId,
        status: inboundVoiceCalls.status,
      })
      .from(inboundVoiceCalls)
      .where(eq(inboundVoiceCalls.providerCallId, payload.providerCallId))
      .limit(1);
    const call = calls[0];
    if (!call) return jsonNoStore({ error: "The call is no longer active." }, 404);
    const now = new Date().toISOString();
    const [offers, presenceRows] = await Promise.all([
      db
        .select({ id: voiceCallOffers.id, status: voiceCallOffers.status })
        .from(voiceCallOffers)
        .where(
          and(
            eq(voiceCallOffers.voiceCallId, call.id),
            eq(voiceCallOffers.stage, stage),
            eq(voiceCallOffers.attempt, attempt),
            eq(voiceCallOffers.memberId, access.session.memberId),
          ),
        )
        .limit(1),
      db
        .select({ state: voicePresence.readyState })
        .from(voicePresence)
        .where(
          and(
            eq(voicePresence.memberId, access.session.memberId),
            eq(voicePresence.browserSessionId, payload.browserSessionId),
            inArray(voicePresence.readyState, ["available", "busy"]),
            gt(voicePresence.expiresAt, now),
          ),
        )
        .limit(1),
    ]);
    const offer = offers[0];
    const presence = presenceRows[0];
    if (!offer || !presence) {
      return jsonNoStore({ error: "This browser was not offered the active call." }, 409);
    }
    if (["ringing", "answered"].includes(action) && presence.state !== "available") {
      return jsonNoStore({ error: "This browser is not available to claim the call." }, 409);
    }

    if (action === "answered") {
      if (offer.status === "answered" && call.acceptedMemberId === access.session.memberId) {
        return jsonNoStore({ ok: true });
      }
      if (offer.status !== "ringing") {
        return jsonNoStore(
          { ok: false, answeredElsewhere: offer.status === "answered_elsewhere" },
          409,
        );
      }
      const won = await db
        .update(inboundVoiceCalls)
        .set({
          acceptedMemberId: access.session.memberId,
          routingStage: stage,
          status: "connected",
          answeredAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(inboundVoiceCalls.id, call.id),
            isNull(inboundVoiceCalls.acceptedMemberId),
            eq(inboundVoiceCalls.status, "offering"),
          ),
        )
        .returning({ id: inboundVoiceCalls.id });
      if (!won[0] && call.acceptedMemberId !== access.session.memberId) {
        await db
          .update(voiceCallOffers)
          .set({ status: "answered_elsewhere", resolvedAt: now, updatedAt: now })
          .where(eq(voiceCallOffers.id, offer.id));
        return jsonNoStore({ ok: false, answeredElsewhere: true }, 409);
      }

      await db.batch([
        db
          .update(voiceCallOffers)
          .set({ status: "answered_elsewhere", resolvedAt: now, updatedAt: now })
          .where(
            and(
              eq(voiceCallOffers.voiceCallId, call.id),
              eq(voiceCallOffers.stage, stage),
              eq(voiceCallOffers.attempt, attempt),
              eq(voiceCallOffers.status, "ringing"),
            ),
          ),
        db
          .update(voiceCallOffers)
          .set({ status: "answered", resolvedAt: now, updatedAt: now })
          .where(eq(voiceCallOffers.id, offer.id)),
        db
          .update(voicePresence)
          .set({ readyState: "busy", updatedAt: now })
          .where(eq(voicePresence.memberId, access.session.memberId)),
      ]);
    } else if (action === "ended") {
      if (call.acceptedMemberId !== access.session.memberId || offer.status !== "answered") {
        return jsonNoStore({ error: "This browser does not own the connected call." }, 409);
      }
      await db.batch([
        db
          .update(inboundVoiceCalls)
          .set({ status: "completed", routingStage: "complete", endedAt: now, updatedAt: now })
          .where(
            and(
              eq(inboundVoiceCalls.id, call.id),
              eq(inboundVoiceCalls.acceptedMemberId, access.session.memberId),
            ),
          ),
        db
          .update(voicePresence)
          .set({ readyState: "available", updatedAt: now })
          .where(eq(voicePresence.memberId, access.session.memberId)),
      ]);
    } else if (action === "ringing") {
      if (!inAllowedState(offer.status, ["queued", "ringing"])) {
        return jsonNoStore(
          { ok: false, answeredElsewhere: offer.status === "answered_elsewhere" },
          409,
        );
      }
      await db
        .update(voiceCallOffers)
        .set({ status: "ringing", resolvedAt: null, updatedAt: now })
        .where(eq(voiceCallOffers.id, offer.id));
    } else if (inAllowedState(offer.status, ["queued", "ringing"])) {
      await db
        .update(voiceCallOffers)
        .set({ status: "missed", resolvedAt: now, updatedAt: now })
        .where(eq(voiceCallOffers.id, offer.id));
    }

    if (action !== "ringing") {
      await appendAuditRow({
        action: `calls.offer.${action}`,
        decision: "allow",
        reason: "authenticated_browser_event",
        actorEmail: access.session.email,
        actorSubjectId: access.session.subjectId,
        actorRole: access.session.role,
        requestPath: PATH,
        resource: `inbound-call:${call.id}`,
      });
    }
  } catch {
    return jsonNoStore({ error: "The call state could not be stored." }, 503);
  }
  return jsonNoStore({ ok: true });
}

function normalizeAction(value: unknown): OfferAction | null {
  return value === "ringing" || value === "answered" || value === "missed" || value === "ended"
    ? value
    : null;
}

function inAllowedState<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}
