import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
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
type OfferAction = "resolve" | "ringing" | "answered" | "missed" | "ended";

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
  const browserSessionId = validBrowserSessionId(payload.browserSessionId)
    ? payload.browserSessionId
    : null;
  if (!action || !browserSessionId) {
    return jsonNoStore({ error: "Invalid call event." }, 400);
  }
  const stage = payload.stage === "personal" || payload.stage === "team" ? payload.stage : null;
  const attempt = typeof payload.attempt === "number"
    && Number.isSafeInteger(payload.attempt)
    && payload.attempt > 0
    && payload.attempt <= 10_000
    ? payload.attempt
    : null;
  const providerCallId = typeof payload.providerCallId === "string"
    && /^[A-Za-z0-9._:-]{4,200}$/.test(payload.providerCallId)
    ? payload.providerCallId
    : null;
  if (
    action !== "resolve"
    && (!stage || !attempt || !providerCallId)
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
    if (action === "resolve") {
      const now = new Date().toISOString();
      const presenceRows = await db
        .select({ state: voicePresence.readyState })
        .from(voicePresence)
        .where(
          and(
            eq(voicePresence.memberId, access.session.memberId),
            eq(voicePresence.browserSessionId, browserSessionId),
            eq(voicePresence.readyState, "available"),
            gt(voicePresence.expiresAt, now),
          ),
        )
        .limit(1);
      if (!presenceRows[0]) {
        return jsonNoStore({ error: "This browser is not available for the incoming call." }, 409);
      }

      const candidates = await db
        .select({
          offerId: voiceCallOffers.id,
          offerStatus: voiceCallOffers.status,
          providerCallId: inboundVoiceCalls.providerCallId,
          stage: voiceCallOffers.stage,
          attempt: voiceCallOffers.attempt,
          calledLine: inboundVoiceCalls.calledNumberMasked,
          callerMasked: inboundVoiceCalls.callerNumberMasked,
        })
        .from(voiceCallOffers)
        .innerJoin(inboundVoiceCalls, eq(voiceCallOffers.voiceCallId, inboundVoiceCalls.id))
        .where(
          and(
            eq(voiceCallOffers.memberId, access.session.memberId),
            inArray(voiceCallOffers.status, ["queued", "ringing"]),
            eq(inboundVoiceCalls.status, "offering"),
            // Both SQLite CURRENT_TIMESTAMP and application ISO timestamps are
            // accepted by julianday; this avoids comparing their two text shapes.
            sql`julianday(${inboundVoiceCalls.startedAt}) >= julianday('now', '-2 minutes')`,
          ),
        )
        .orderBy(desc(voiceCallOffers.id))
        .limit(1);
      const candidate = candidates[0];
      if (!candidate || (candidate.stage !== "personal" && candidate.stage !== "team")) {
        return jsonNoStore({ error: "This browser was not offered an active call." }, 409);
      }
      if (candidate.offerStatus === "queued") {
        await db
          .update(voiceCallOffers)
          .set({ status: "ringing", resolvedAt: null, updatedAt: now })
          .where(
            and(
              eq(voiceCallOffers.id, candidate.offerId),
              eq(voiceCallOffers.status, "queued"),
            ),
          );
      }
      return jsonNoStore({
        ok: true,
        offer: {
          providerCallId: candidate.providerCallId,
          stage: candidate.stage,
          attempt: candidate.attempt,
          calledLine: candidate.calledLine,
          callerMasked: candidate.callerMasked,
        },
      });
    }

    // The validation above makes these values mandatory for every state-change
    // action. Keep the invariant explicit here so both TypeScript and future
    // maintenance cannot accidentally pass nullable routing keys to D1.
    if (!providerCallId || !stage || !attempt) {
      return jsonNoStore({ error: "Invalid call event." }, 400);
    }

    const calls = await db
      .select({
        id: inboundVoiceCalls.id,
        acceptedMemberId: inboundVoiceCalls.acceptedMemberId,
        status: inboundVoiceCalls.status,
      })
      .from(inboundVoiceCalls)
      .where(eq(inboundVoiceCalls.providerCallId, providerCallId))
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
            eq(voicePresence.browserSessionId, browserSessionId),
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
  return value === "resolve" || value === "ringing" || value === "answered" || value === "missed" || value === "ended"
    ? value
    : null;
}

function inAllowedState<T extends string>(value: string, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}
