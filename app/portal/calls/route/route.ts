import { and, desc, eq, gt, inArray, or } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { appendAuditRow } from "../../../../db/audit";
import {
  inboundVoiceCalls,
  portalMembers,
  voiceCallOffers,
  voiceNumberAssignments,
  voicePresence,
} from "../../../../db/schema";
import { normalizeE164 } from "../../dialer/outbound";
import {
  authenticateSignalwireRequest,
  credentialedMachineUrl as sharedCredentialedMachineUrl,
} from "../../signalwire/ingest-auth";
import { maskPhone, voiceRuntimeConfig } from "../voice-server";
import { buildInboundRoutePlan, type HuntTarget } from "./route-plan";

export const dynamic = "force-dynamic";
const PATH = "/portal/calls/route";
const INGEST_PATH = "/portal/calls/ingest";
const VOICEMAIL_PATH = "/portal/calls/voicemail";

type RouteInput = {
  callId: string;
  parentCallId: string | null;
  from: string | null;
  to: string | null;
};

export async function POST(request: Request): Promise<Response> {
  const auth = await authenticateSignalwireRequest(request.clone(), {
    path: PATH,
    auditAction: "signalwire.route.auth",
  });
  if (!auth.ok) {
    return new Response(null, { status: auth.denial.kind === "not_recorded" ? 503 : 401 });
  }

  let payload: unknown;
  try {
    payload = await readPayload(request);
  } catch {
    return new Response(null, { status: 400 });
  }
  const input = normalizeRouteInput(payload);
  const config = voiceRuntimeConfig();
  if (!input || !config) return new Response(null, { status: 503 });

  const db = getDb();
  const teamTransfer = input.to === config.teamHuntAddress;
  let assignment: {
    memberId: number;
    e164Number: string;
    lineType: "personal" | "shared";
  } | null = null;
  let existingCall: {
    id: number;
    providerCallId: string;
    lineType: "personal" | "shared";
    assignedMemberId: number | null;
    acceptedMemberId: number | null;
    calledNumberMasked: string;
  } | null = null;
  let teamAttempt = 1;

  if (teamTransfer) {
    const candidates = [input.callId, input.parentCallId].filter((value): value is string => Boolean(value));
    if (candidates.length > 0) {
      const rows = await db
        .select({
          id: inboundVoiceCalls.id,
          providerCallId: inboundVoiceCalls.providerCallId,
          lineType: inboundVoiceCalls.lineType,
          assignedMemberId: inboundVoiceCalls.assignedMemberId,
          acceptedMemberId: inboundVoiceCalls.acceptedMemberId,
          calledNumberMasked: inboundVoiceCalls.calledNumberMasked,
        })
        .from(inboundVoiceCalls)
        .where(
          or(
            inArray(inboundVoiceCalls.providerCallId, candidates),
            inArray(inboundVoiceCalls.activeProviderCallId, candidates),
            inArray(inboundVoiceCalls.parentProviderCallId, candidates),
          ),
        )
        .limit(1);
      existingCall = rows[0] ?? null;
    }
    if (!existingCall) return new Response(null, { status: 409 });
    const transferRows = await db
      .select({
        id: voiceCallOffers.id,
        memberId: voiceCallOffers.memberId,
        status: voiceCallOffers.status,
        attempt: voiceCallOffers.attempt,
      })
      .from(voiceCallOffers)
      .where(
        and(
          eq(voiceCallOffers.voiceCallId, existingCall.id),
          inArray(voiceCallOffers.status, ["transfer_pending", "sent_to_team"]),
        ),
      )
      .orderBy(desc(voiceCallOffers.attempt))
      .limit(1);
    if (!transferRows[0]) return new Response(null, { status: 409 });
    teamAttempt = transferRows[0].attempt + 1;
    const routedAt = new Date().toISOString();
    await db.batch([
      db
        .update(voiceCallOffers)
        .set({ status: "sent_to_team", resolvedAt: routedAt, updatedAt: routedAt })
        .where(eq(voiceCallOffers.id, transferRows[0].id)),
      db
        .update(inboundVoiceCalls)
        .set({
          activeProviderCallId: input.callId,
          routingStage: "team",
          status: "offering",
          acceptedMemberId: null,
          disposition: "sent_to_team",
          updatedAt: routedAt,
        })
        .where(eq(inboundVoiceCalls.id, existingCall.id)),
      db
        .update(voicePresence)
        .set({ readyState: "available", updatedAt: routedAt })
        .where(eq(voicePresence.memberId, transferRows[0].memberId)),
    ]);
  } else {
    const called = normalizeE164(input.to);
    if (!called) return new Response(null, { status: 400 });
    if (called === config.mainNumber) {
      assignment = { memberId: 0, e164Number: called, lineType: "shared" };
    } else {
      const rows = await db
        .select({
          memberId: voiceNumberAssignments.memberId,
          e164Number: voiceNumberAssignments.e164Number,
          lineType: voiceNumberAssignments.lineType,
        })
        .from(voiceNumberAssignments)
        .innerJoin(portalMembers, eq(voiceNumberAssignments.memberId, portalMembers.id))
        .where(
          and(
            eq(voiceNumberAssignments.e164Number, called),
            eq(voiceNumberAssignments.status, "active"),
            eq(voiceNumberAssignments.lineType, "personal"),
            eq(portalMembers.status, "active"),
          ),
        )
        .limit(1);
      assignment = rows[0] ?? null;
    }
    if (!assignment) return new Response(null, { status: 404 });
  }

  const caller = normalizeE164(input.from);
  const encrypted = caller ? await encryptCaller(caller) : null;
  if (caller && !encrypted) return new Response(null, { status: 503 });
  const calledMasked = existingCall?.calledNumberMasked ?? maskPhone(assignment!.e164Number);
  const lineType = existingCall?.lineType ?? assignment!.lineType;
  const assignedMemberId = existingCall
    ? existingCall.assignedMemberId
    : (assignment!.memberId || null);
  let routeCallerId = assignment?.e164Number ?? config.mainNumber;
  if (existingCall?.lineType === "personal" && existingCall.assignedMemberId) {
    const personalLines = await db
      .select({ e164Number: voiceNumberAssignments.e164Number })
      .from(voiceNumberAssignments)
      .where(
        and(
          eq(voiceNumberAssignments.memberId, existingCall.assignedMemberId),
          eq(voiceNumberAssignments.lineType, "personal"),
          eq(voiceNumberAssignments.status, "active"),
        ),
      )
      .limit(1);
    routeCallerId = personalLines[0]?.e164Number ?? config.mainNumber;
  }

  let callRecord = existingCall;
  if (!callRecord) {
    await db
      .insert(inboundVoiceCalls)
      .values({
        providerCallId: input.callId,
        parentProviderCallId: input.parentCallId,
        lineType,
        calledNumberMasked: calledMasked,
        callerNumberMasked: maskPhone(caller),
        callerCiphertext: encrypted?.ciphertext ?? null,
        callerCipherIv: encrypted?.iv ?? null,
        callerCipherVersion: encrypted ? 1 : null,
        assignedMemberId,
        routingStage: assignedMemberId ? "personal" : "team",
        status: "offering",
      })
      .onConflictDoNothing({ target: inboundVoiceCalls.providerCallId });
    const rows = await db
      .select({
        id: inboundVoiceCalls.id,
        providerCallId: inboundVoiceCalls.providerCallId,
        lineType: inboundVoiceCalls.lineType,
        assignedMemberId: inboundVoiceCalls.assignedMemberId,
        acceptedMemberId: inboundVoiceCalls.acceptedMemberId,
        calledNumberMasked: inboundVoiceCalls.calledNumberMasked,
      })
      .from(inboundVoiceCalls)
      .where(eq(inboundVoiceCalls.providerCallId, input.callId))
      .limit(1);
    callRecord = rows[0] ?? null;
  }
  if (!callRecord) return new Response(null, { status: 503 });

  const now = new Date().toISOString();
  const eligible = await db
    .select({ memberId: voiceNumberAssignments.memberId, address: voiceNumberAssignments.subscriberAddress })
    .from(voiceNumberAssignments)
    .innerJoin(portalMembers, eq(voiceNumberAssignments.memberId, portalMembers.id))
    .innerJoin(voicePresence, eq(voiceNumberAssignments.memberId, voicePresence.memberId))
    .where(
      and(
        eq(voiceNumberAssignments.status, "active"),
        eq(voiceNumberAssignments.lineType, "personal"),
        eq(portalMembers.status, "active"),
        eq(voicePresence.readyState, "available"),
        gt(voicePresence.expiresAt, now),
      ),
    );

  const excluded = teamTransfer
    ? await db
        .select({ memberId: voiceCallOffers.memberId })
        .from(voiceCallOffers)
        .where(
          and(
            eq(voiceCallOffers.voiceCallId, callRecord.id),
            inArray(voiceCallOffers.status, ["transfer_pending", "sent_to_team"]),
          ),
        )
    : [];
  const excludedIds = new Set(excluded.map((row) => row.memberId));
  const asTarget = (row: { memberId: number; address: string }): HuntTarget => ({
    memberId: row.memberId,
    address: row.address,
  });

  const personalTarget = !teamTransfer && assignedMemberId
    ? eligible.find((row) => row.memberId === assignedMemberId) ?? null
    : null;
  const teamTargets = eligible
    .filter((row) => {
      if (excludedIds.has(row.memberId)) return false;
      if (!teamTransfer && assignedMemberId && row.memberId === assignedMemberId) return false;
      return true;
    })
    .map(asTarget);

  const queuedOffers = [
    ...(personalTarget
      ? [{ memberId: personalTarget.memberId, stage: "personal" as const, attempt: 1 }]
      : []),
    ...teamTargets.map((target) => ({
      memberId: target.memberId,
      stage: "team" as const,
      attempt: teamAttempt,
    })),
  ];
  try {
    for (const offer of queuedOffers) {
      await db
        .insert(voiceCallOffers)
        .values({
          voiceCallId: callRecord.id,
          stage: offer.stage,
          attempt: offer.attempt,
          memberId: offer.memberId,
          status: "queued",
        })
        .onConflictDoNothing({
          target: [
            voiceCallOffers.voiceCallId,
            voiceCallOffers.stage,
            voiceCallOffers.attempt,
            voiceCallOffers.memberId,
          ],
        });
    }
  } catch {
    return new Response(null, { status: 503 });
  }

  const lifecycleUrl = credentialedMachineUrl(INGEST_PATH);
  const voicemailStatusUrl = credentialedMachineUrl(VOICEMAIL_PATH);
  if (!lifecycleUrl || !voicemailStatusUrl) return new Response(null, { status: 503 });

  const audited = await appendAuditRow({
    action: "calls.route",
    decision: "allow",
    reason: teamTransfer ? "team_hunt_built" : lineType === "personal" ? "personal_hunt_built" : "shared_hunt_built",
    requestPath: PATH,
    resource: `inbound-call:${callRecord.id}`,
    detail: JSON.stringify({
      personal_target: Boolean(personalTarget),
      team_target_count: teamTargets.length,
      mobile_fallback: true,
      voicemail: true,
      live_recording: false,
    }),
  });
  if (!audited) return new Response(null, { status: 503 });

  return Response.json(
    buildInboundRoutePlan({
      callId: callRecord.providerCallId,
      callerId: routeCallerId,
      callerMasked: maskPhone(caller),
      calledLineMasked: calledMasked,
      personalTarget: personalTarget ? asTarget(personalTarget) : null,
      personalAttempt: 1,
      teamTargets,
      teamAttempt,
      fallbackNumber: config.privateMobile,
      lifecycleUrl,
      voicemailStatusUrl,
    }),
    { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } },
  );
}

function normalizeRouteInput(value: unknown): RouteInput | null {
  const object = asObject(value);
  const call = asObject(object?.call);
  const parentCall = asObject(call?.parent);
  const vars = asObject(object?.vars);
  // SignalWire's External SWML fetch nests the provider ID at
  // `call.call_id`. Keep `call.id` as a compatibility fallback for older
  // fixtures and explicitly constructed internal requests.
  const callId = firstString(call?.call_id, call?.id, object?.call_id, vars?.core_call_id);
  if (!callId || !/^[A-Za-z0-9._:-]{4,200}$/.test(callId)) return null;
  return {
    callId,
    parentCallId: firstString(parentCall?.call_id, call?.parent_id, object?.parent_call_id),
    from: firstString(call?.from_number, call?.from, object?.from, object?.From),
    to: firstString(call?.to_number, call?.to, object?.to, object?.To),
  };
}

async function readPayload(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (type.includes("application/json")) return request.json();
  if (type.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }
  throw new Error("Unsupported content type");
}

// Delegates to the guard's builder rather than repeating the construction.
// Building it twice is what caused §19z: this file embedded a credentialed
// callback URL while the guard verified signatures against the bare one.
function credentialedMachineUrl(path: string): string | null {
  const secret = env.SIGNALWIRE_INGEST_SECRET;
  if (!secret) return null;
  return sharedCredentialedMachineUrl(path, secret);
}

async function encryptCaller(value: string): Promise<{ ciphertext: string; iv: string } | null> {
  const encoded = env.SIGNALWIRE_CALLER_ENCRYPTION_KEY?.trim();
  if (!encoded) return null;
  try {
    const decoded = decodeBase64(encoded);
    const keyBytes = new Uint8Array(decoded.byteLength);
    keyBytes.set(decoded);
    if (keyBytes.byteLength !== 32) return null;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey("raw", keyBytes.buffer, "AES-GCM", false, ["encrypt"]);
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(value),
    );
    return { ciphertext: encodeBase64(new Uint8Array(cipher)), iv: encodeBase64(iv) };
  } catch {
    return null;
  }
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 200);
  }
  return null;
}
