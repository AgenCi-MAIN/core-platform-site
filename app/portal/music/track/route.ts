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
      /**
       * `no-store`, not `max-age`. This is member content, and a stored copy
       * answers the next request without it reaching the worker at all — so
       * nothing re-resolves the session or re-reads the member's row. An hour
       * of `max-age=3600` is an hour in which a suspended member's browser
       * keeps handing back audio their membership no longer entitles them to.
       *
       * That is exactly the failure public/sw.js excludes /portal to prevent,
       * arriving one layer up through the HTTP cache instead. The sibling
       * route in calls/recording already gets this right.
       *
       * The cost is real: the radio re-fetches on replay rather than serving
       * from the browser cache, which is more data on a phone. Taken
       * deliberately — the bytes are cheap and the boundary is not.
       */
      "cache-control": "private, no-store",
      "content-length": String(object.size),
      "content-type": object.httpMetadata?.contentType ?? "audio/mpeg",
      etag: object.etag,
      "x-content-type-options": "nosniff",
    },
  });
}
