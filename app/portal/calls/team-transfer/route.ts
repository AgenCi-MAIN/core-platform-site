import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { appendAuditRow } from "../../../../db/audit";
import { inboundVoiceCalls, voiceCallOffers, voicePresence } from "../../../../db/schema";
import {
  authorizeCallApi,
  jsonNoStore,
  validBrowserSessionId,
  voiceRuntimeConfig,
} from "../voice-server";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/team-transfer";
type TransferAction = "prepare" | "commit" | "cancel";

export async function POST(request: Request): Promise<Response> {
  const access = await authorizeCallApi(request, PATH, {
    requireSameOrigin: true,
    requireAssignment: true,
  });
  if (!access.ok) return access.response;
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonNoStore({ error: "Expected a JSON body." }, 415);
  }
  let payload: { providerCallId?: unknown; browserSessionId?: unknown; action?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return jsonNoStore({ error: "Expected a valid JSON body." }, 400);
  }
  const action: TransferAction | null = payload.action === undefined || payload.action === "prepare"
    ? "prepare"
    : payload.action === "commit" || payload.action === "cancel"
      ? payload.action
      : null;
  if (
    !action
    || typeof payload.providerCallId !== "string"
    || !/^[A-Za-z0-9._:-]{4,200}$/.test(payload.providerCallId)
    || !validBrowserSessionId(payload.browserSessionId)
  ) {
    return jsonNoStore({ error: "Invalid active call." }, 400);
  }

  const config = voiceRuntimeConfig();
  if (!config) return jsonNoStore({ error: "Team routing is not configured." }, 503);
  const db = getDb();
  try {
    const [calls, presence] = await Promise.all([
      db
        .select({
          id: inboundVoiceCalls.id,
          status: inboundVoiceCalls.status,
          routingStage: inboundVoiceCalls.routingStage,
          acceptedMemberId: inboundVoiceCalls.acceptedMemberId,
        })
        .from(inboundVoiceCalls)
        .where(eq(inboundVoiceCalls.providerCallId, payload.providerCallId))
        .limit(1),
      db
        .select({ browserSessionId: voicePresence.browserSessionId })
        .from(voicePresence)
        .where(
          and(
            eq(voicePresence.memberId, access.session.memberId),
            inArray(voicePresence.readyState, ["available", "busy"]),
            gt(voicePresence.expiresAt, new Date().toISOString()),
          ),
        )
        .limit(1),
    ]);
    const call = calls[0];
    if (!call || presence[0]?.browserSessionId !== payload.browserSessionId) {
      return jsonNoStore({ error: "This call is not owned by the current primary phone tab." }, 409);
    }

    const offers = await db
      .select({
        id: voiceCallOffers.id,
        status: voiceCallOffers.status,
        attempt: voiceCallOffers.attempt,
      })
      .from(voiceCallOffers)
      .where(
        and(
          eq(voiceCallOffers.voiceCallId, call.id),
          eq(voiceCallOffers.stage, "team"),
          eq(voiceCallOffers.memberId, access.session.memberId),
        ),
      )
      .orderBy(desc(voiceCallOffers.attempt))
      .limit(1);
    const offer = offers[0];
    const now = new Date().toISOString();
    const ownsActiveCall = call.acceptedMemberId === access.session.memberId;
    const ownsTransfer = offer?.status === "transfer_pending" || offer?.status === "sent_to_team";
    if ((action === "prepare" && !ownsActiveCall) || (action !== "prepare" && !ownsActiveCall && !ownsTransfer)) {
      return jsonNoStore({ error: "This call is not owned by the current employee." }, 409);
    }

    if (action === "prepare") {
      if (offer?.status === "sent_to_team") {
        return jsonNoStore({ ok: true, alreadyTransferred: true });
      }
      if (call.status !== "connected" || !["answered", "transfer_pending", undefined].includes(offer?.status)) {
        return jsonNoStore({ error: "This call is not in a transferable state." }, 409);
      }
      await db
        .insert(voiceCallOffers)
        .values({
          voiceCallId: call.id,
          stage: "team",
          attempt: 1,
          memberId: access.session.memberId,
          status: "transfer_pending",
          resolvedAt: null,
        })
        .onConflictDoUpdate({
          target: [
            voiceCallOffers.voiceCallId,
            voiceCallOffers.stage,
            voiceCallOffers.attempt,
            voiceCallOffers.memberId,
          ],
          set: { status: "transfer_pending", resolvedAt: null, updatedAt: now },
        });
    } else if (action === "commit") {
      if (offer?.status === "sent_to_team") {
        return jsonNoStore({ ok: true, alreadyTransferred: true });
      }
      if (offer?.status !== "transfer_pending") {
        return jsonNoStore({ error: "No prepared team transfer exists." }, 409);
      }
      await finalizeTransfer(call.id, access.session.memberId, offer.id, now);
    } else {
      if (offer?.status === "sent_to_team") {
        return jsonNoStore({ ok: true, alreadyTransferred: true });
      }
      if (offer?.status === "transfer_pending") {
        if (call.routingStage === "team") {
          await db
            .update(voiceCallOffers)
            .set({ status: "answered", resolvedAt: now, updatedAt: now })
            .where(eq(voiceCallOffers.id, offer.id));
        } else {
          await db.delete(voiceCallOffers).where(eq(voiceCallOffers.id, offer.id));
        }
      }
    }

    const audited = await appendAuditRow({
      action: `calls.team_transfer.${action}`,
      decision: "allow",
      reason: action === "prepare"
        ? "active_call_transfer_prepared"
        : action === "commit"
          ? "provider_transfer_accepted"
          : "provider_transfer_rejected_or_cancelled",
      actorEmail: access.session.email,
      actorSubjectId: access.session.subjectId,
      actorRole: access.session.role,
      requestPath: PATH,
      resource: `inbound-call:${call.id}`,
    });
    if (!audited) return jsonNoStore({ error: "The team transfer could not be audited safely." }, 503);
  } catch {
    return jsonNoStore({ error: "The call could not be returned to the team." }, 503);
  }

  return jsonNoStore({ ok: true, destination: config.teamHuntAddress });
}

async function finalizeTransfer(callId: number, memberId: number, offerId: number, now: string) {
  const db = getDb();
  await db.batch([
    db
      .update(voiceCallOffers)
      .set({ status: "sent_to_team", resolvedAt: now, updatedAt: now })
      .where(eq(voiceCallOffers.id, offerId)),
    db
      .update(inboundVoiceCalls)
      .set({
        routingStage: "team",
        status: "offering",
        acceptedMemberId: null,
        disposition: "sent_to_team",
        updatedAt: now,
      })
      .where(eq(inboundVoiceCalls.id, callId)),
    db
      .update(voicePresence)
      .set({ readyState: "available", updatedAt: now })
      .where(eq(voicePresence.memberId, memberId)),
  ]);
}
