import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { dialerTransfers } from "../../../../db/schema";
import { can, recordAudit, resolvePortalAccess } from "../../access";
import { readRows } from "../../read-guard";
import { getCallRecordingsBucket, type RecordingObject } from "../storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await resolvePortalAccess(new URL(request.url).pathname);

  if (!access.ok) {
    return new Response(null, { status: access.denial.kind === "anonymous" ? 401 : 403 });
  }

  const { session } = access;
  if (!can(session, "calls.review")) {
    await recordAudit({
      action: "calls.recording.open",
      decision: "deny",
      reason: "capability_not_held",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: new URL(request.url).pathname,
    });
    return new Response(null, { status: 403 });
  }

  const rawId = new URL(request.url).searchParams.get("id") ?? "";
  const id = /^\d+$/.test(rawId) ? Number(rawId) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid call recording id." }, { status: 400 });
  }

  // dialer_transfers can genuinely be absent (record § 9: two migration
  // paths, one applied) — read it through the same guard the pages use, so
  // an unmigrated database yields honest copy instead of a 500 stack trace.
  const { rows, fault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        id: dialerTransfers.id,
        transferId: dialerTransfers.transferId,
        status: dialerTransfers.status,
        consentStatus: dialerTransfers.consentStatus,
        recordingObjectKey: dialerTransfers.recordingObjectKey,
        recordingMimeType: dialerTransfers.recordingMimeType,
      })
      .from(dialerTransfers)
      .where(eq(dialerTransfers.id, id))
      .limit(1),
  );
  if (fault) {
    return Response.json({ error: "The recording index could not be read." }, { status: 503 });
  }
  const [call] = rows;

  if (!call) return new Response(null, { status: 404 });
  if (call.consentStatus !== "verified") {
    // An entitled reviewer was refused on consent grounds — in an all-party
    // consent regime this is the deny the audit log most needs to hold.
    await recordAudit({
      action: "calls.recording.open",
      decision: "deny",
      reason: "consent_not_verified",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `dialer_transfer:${call.id}`,
      requestPath: new URL(request.url).pathname,
      detail: JSON.stringify({ consentStatus: call.consentStatus }),
    });
    return Response.json({ error: "Recording access is unavailable until consent is verified." }, { status: 409 });
  }
  if (call.status !== "ready" || !call.recordingObjectKey) {
    return Response.json({ error: "Recording is not ready yet." }, { status: 409 });
  }

  if (!isCallRecordingKey(call.recordingObjectKey)) {
    await recordAudit({
      action: "calls.recording.open",
      decision: "deny",
      reason: "recording_key_invalid",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `dialer_transfer:${call.id}`,
      requestPath: new URL(request.url).pathname,
    });
    return Response.json({ error: "Recording metadata is invalid." }, { status: 409 });
  }

  const bucket = getCallRecordingsBucket();
  if (!bucket) return Response.json({ error: "Recording storage is unavailable." }, { status: 503 });

  let object: RecordingObject | null;
  try {
    object = await bucket.get(call.recordingObjectKey);
  } catch (error) {
    console.error("[portal] call recording storage read failed:", error);
    return Response.json({ error: "Recording storage is unavailable." }, { status: 503 });
  }
  if (!object) return new Response(null, { status: 404 });

  await recordAudit({
    action: "calls.recording.open",
    decision: "allow",
    reason: "recording_ready_and_consent_verified",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: `dialer_transfer:${call.id}`,
    requestPath: new URL(request.url).pathname,
    detail: JSON.stringify({ transferId: call.transferId }),
  });

  return new Response(object.body, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `inline; filename="core-call-${call.id}"`,
      "content-length": String(object.size),
      "content-type": safeAudioContentType(
        call.recordingMimeType ?? object.httpMetadata?.contentType,
      ),
      etag: object.etag,
      "x-content-type-options": "nosniff",
    },
  });
}

/**
 * The bucket is shared with other private portal media. A transfer row is
 * trusted metadata only after its object key is constrained to the call prefix;
 * an entitled reviewer must never be able to turn this endpoint into a reader
 * for another media namespace.
 */
function isCallRecordingKey(key: string): boolean {
  return key.startsWith("calls/") && key.length > "calls/".length && !key.includes("..") && !key.includes("\\");
}

function safeAudioContentType(value: string | undefined): string {
  return value?.toLowerCase().startsWith("audio/") ? value : "application/octet-stream";
}
