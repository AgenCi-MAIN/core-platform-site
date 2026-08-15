import { can, recordAudit, resolvePortalAccess } from "../../access";
import { getMusicBucket, isMusicKey } from "../storage";

export const dynamic = "force-dynamic";

/**
 * Streams one uploaded track to a signed-in member.
 *
 * The key is validated against the music prefix before it reaches R2, so this
 * route cannot be used to read a call recording — those live under a different
 * prefix and are governed by the consent gate in the calls route.
 */
export async function GET(request: Request) {
  const access = await resolvePortalAccess(new URL(request.url).pathname);
  if (!access.ok) {
    return new Response(null, { status: access.denial.kind === "anonymous" ? 401 : 403 });
  }

  const { session } = access;
  if (!can(session, "dashboard.view.self")) {
    return new Response(null, { status: 403 });
  }

  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!isMusicKey(key)) {
    await recordAudit({
      action: "music.play",
      decision: "deny",
      reason: "key_outside_music_prefix",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: new URL(request.url).pathname,
    });
    return Response.json({ error: "Invalid track." }, { status: 400 });
  }

  const bucket = getMusicBucket();
  if (!bucket) return Response.json({ error: "Storage unavailable." }, { status: 503 });

  const object = await bucket.get(key);
  if (!object) return new Response(null, { status: 404 });

  return new Response(object.body, {
    headers: {
      "cache-control": "private, max-age=3600",
      "content-length": String(object.size),
      "content-type": object.httpMetadata?.contentType ?? "audio/mpeg",
      etag: object.etag,
      "x-content-type-options": "nosniff",
    },
  });
}
