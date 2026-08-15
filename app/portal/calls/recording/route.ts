import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { dialerTransfers } from "../../../../db/schema";
import { can, recordAudit, resolvePortalAccess } from "../../access";
import { getCallRecordingsBucket } from "../storage";

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

  const id = Number.parseInt(new URL(request.url).searchParams.get("id") ?? "", 10);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid call recording id." }, { status: 400 });
  }

  const [call] = await getDb()
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
    .limit(1);

  if (!call) return new Response(null, { status: 404 });
  if (call.consentStatus !== "verified") {
    return Response.json({ error: "Recording access is unavailable until consent is verified." }, { status: 409 });
  }
  if (call.status !== "ready" || !call.recordingObjectKey) {
    return Response.json({ error: "Recording is not ready yet." }, { status: 409 });
  }

  const bucket = getCallRecordingsBucket();
  if (!bucket) return Response.json({ error: "Recording storage is unavailable." }, { status: 503 });

  const object = await bucket.get(call.recordingObjectKey);
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
      "content-type": call.recordingMimeType ?? object.httpMetadata?.contentType ?? "audio/mpeg",
      etag: object.etag,
      "x-content-type-options": "nosniff",
    },
  });
}
