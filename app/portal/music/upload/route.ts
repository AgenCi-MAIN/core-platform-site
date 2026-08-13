import { can, recordAudit, resolvePortalAccess } from "../../access";
import {
  AUDIO_TYPES,
  MAX_UPLOAD_BYTES,
  getMusicBucket,
  isMusicKey,
  musicKey,
  safeKeySegment,
} from "../storage";

export const dynamic = "force-dynamic";

/**
 * Upload a track. Owner and administrator only — this writes to shared
 * storage that every member then hears.
 *
 * The uploader is responsible for holding the right to use the file. That is
 * stated on the page and recorded in the audit row: the person who uploaded,
 * when, and what.
 */
export async function POST(request: Request) {
  const access = await resolvePortalAccess();
  if (!access.ok) {
    return Response.json(
      { error: "Sign in required." },
      { status: access.denial.kind === "anonymous" ? 401 : 403 },
    );
  }

  const { session } = access;
  const path = new URL(request.url).pathname;

  if (!can(session, "members.manage")) {
    await recordAudit({
      action: "music.upload",
      decision: "deny",
      reason: "capability_not_held",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: path,
    });
    return Response.json({ error: "Only an owner or administrator can upload." }, { status: 403 });
  }

  const bucket = getMusicBucket();
  if (!bucket) return Response.json({ error: "Storage unavailable." }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was attached." }, { status: 400 });
  }

  const segment = safeKeySegment(file.name);
  if (!segment) {
    return Response.json(
      { error: `Unsupported file. Accepted: ${Object.keys(AUDIO_TYPES).join(", ")}.` },
      { status: 415 },
    );
  }

  if (file.size === 0) {
    return Response.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: `Too large. Limit is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.` },
      { status: 413 },
    );
  }

  const key = musicKey(segment);
  if (!isMusicKey(key)) {
    return Response.json({ error: "Rejected filename." }, { status: 400 });
  }

  const ext = segment.slice(segment.lastIndexOf(".") + 1);
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const artist = String(form.get("artist") ?? "").trim().slice(0, 120);

  const bytes = await file.arrayBuffer();
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: AUDIO_TYPES[ext] },
    customMetadata: {
      title: title || segment.replace(/\.[a-z0-9]+$/, ""),
      artist,
      uploadedBy: session.email,
    },
  });

  await recordAudit({
    action: "music.upload",
    decision: "allow",
    reason: "owner_or_admin_upload",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: key,
    requestPath: path,
    detail: JSON.stringify({ bytes: file.size, title, artist }),
  });

  return Response.json({ ok: true, key, title, artist, size: file.size }, { status: 201 });
}

/** Remove a track. Owner and administrator only. */
export async function DELETE(request: Request) {
  const access = await resolvePortalAccess();
  if (!access.ok) {
    return Response.json(
      { error: "Sign in required." },
      { status: access.denial.kind === "anonymous" ? 401 : 403 },
    );
  }

  const { session } = access;
  if (!can(session, "members.manage")) {
    return Response.json({ error: "Not permitted." }, { status: 403 });
  }

  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!isMusicKey(key)) {
    return Response.json({ error: "Invalid track." }, { status: 400 });
  }

  const bucket = getMusicBucket();
  if (!bucket) return Response.json({ error: "Storage unavailable." }, { status: 503 });

  await bucket.delete(key);

  await recordAudit({
    action: "music.delete",
    decision: "allow",
    reason: "owner_or_admin_delete",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: key,
    requestPath: new URL(request.url).pathname,
  });

  return Response.json({ ok: true, key });
}
