import { eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { appendAuditRow } from "../../../db/audit";
import { inboundVoiceCalls } from "../../../db/schema";

/**
 * Consume only callbacks that can be tied to an existing inbound-voice row.
 * Returning false is important: the shared ingest route also receives the
 * older dialer-transfer events, which must continue through their own parser.
 */
export async function handleInboundVoiceLifecyclePayload(payload: unknown): Promise<boolean> {
  const root = object(payload);
  const params = object(root?.params);
  const eventType = string(root?.event_type);
  const callId = string(params?.call_id);
  if (!eventType || !callId || !eventType.startsWith("calling.call.")) return false;

  const peer = object(params?.peer);
  const peerCallId = string(peer?.call_id);
  const rows = await getDb()
    .select({
      id: inboundVoiceCalls.id,
      status: inboundVoiceCalls.status,
      acceptedMemberId: inboundVoiceCalls.acceptedMemberId,
    })
    .from(inboundVoiceCalls)
    .where(
      peerCallId
        ? or(
            eq(inboundVoiceCalls.providerCallId, callId),
            eq(inboundVoiceCalls.providerCallId, peerCallId),
            eq(inboundVoiceCalls.activeProviderCallId, callId),
            eq(inboundVoiceCalls.activeProviderCallId, peerCallId),
            eq(inboundVoiceCalls.parentProviderCallId, callId),
          )
        : or(
            eq(inboundVoiceCalls.providerCallId, callId),
            eq(inboundVoiceCalls.activeProviderCallId, callId),
            eq(inboundVoiceCalls.parentProviderCallId, callId),
          ),
    )
    .limit(1);
  const call = rows[0];
  if (!call) return false;

  const now = new Date().toISOString();
  if (eventType === "calling.call.connect") {
    const state = string(params?.connect_state);
    const device = object(peer?.device);
    const isPhoneFallback = state === "connected" && string(device?.type) === "phone";
    if (isPhoneFallback) {
      await getDb()
        .update(inboundVoiceCalls)
        .set({
          routingStage: "mobile",
          status: "connected",
          answeredAt: now,
          disposition: "mobile_fallback",
          updatedAt: now,
        })
        .where(eq(inboundVoiceCalls.id, call.id));
    } else if (state === "disconnected" && call.status === "connected") {
      await getDb()
        .update(inboundVoiceCalls)
        .set({ status: "completed", routingStage: "complete", endedAt: now, updatedAt: now })
        .where(eq(inboundVoiceCalls.id, call.id));
    }
  }

  await appendAuditRow({
    action: "calls.ingest.lifecycle",
    decision: "allow",
    reason: "authenticated_provider_callback",
    requestPath: "/portal/calls/ingest",
    resource: `inbound-call:${call.id}`,
    detail: JSON.stringify({ event_type: eventType.slice(0, 80) }),
  });
  return true;
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : null;
}
