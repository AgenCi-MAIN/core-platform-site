import { can, recordAudit, resolvePortalAccess } from "../../access";
import { isMusicStorageReady, listMusic } from "../storage";

export const dynamic = "force-dynamic";

/** The track list, for any signed-in member. Returns metadata only. */
export async function GET(request: Request) {
  const access = await resolvePortalAccess(new URL(request.url).pathname);
  if (!access.ok) {
    return Response.json(
      { error: "Sign in required.", tracks: [] },
      { status: access.denial.kind === "anonymous" ? 401 : 403 },
    );
  }

  const { session } = access;
  if (!can(session, "dashboard.view.self")) {
    await recordAudit({
      action: "music.list",
      decision: "deny",
      reason: "capability_not_held",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: new URL(request.url).pathname,
    });
    return Response.json({ error: "Not permitted.", tracks: [] }, { status: 403 });
  }

  if (!isMusicStorageReady()) {
    return Response.json({ tracks: [], storage: "unavailable" });
  }

  const tracks = await listMusic();
  return Response.json(
    { tracks, storage: "ready" },
    { headers: { "cache-control": "private, no-store" } },
  );
}
