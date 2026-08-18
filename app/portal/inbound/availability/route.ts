import { can, recordAudit, resolvePortalAccess } from "../../access";

export const dynamic = "force-dynamic";

const PATH = "/portal/inbound/availability";

function denied(kind: "anonymous" | "forbidden") {
  return Response.json(
    { error: kind === "anonymous" ? "Sign in required." : "Portal access required." },
    { status: kind === "anonymous" ? 401 : 403 },
  );
}

/**
 * Persist the member's inbound availability preference in the append-only
 * audit stream. This is intentionally a preference signal, not a telephony
 * control: Retreaver/Twilio are still read-only in CORE, so no call is routed
 * because of this endpoint yet. The latest event is the member's current
 * preference and gives the future routing bridge a durable source to consume.
 */
export async function POST(request: Request) {
  const access = await resolvePortalAccess(PATH);
  if (!access.ok) {
    return denied(access.denial.kind === "anonymous" ? "anonymous" : "forbidden");
  }

  const { session } = access;
  if (!can(session, "dashboard.view.self")) return denied("forbidden");

  let payload: { available?: unknown };
  try {
    payload = (await request.json()) as { available?: unknown };
  } catch {
    return Response.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  if (typeof payload.available !== "boolean") {
    return Response.json({ error: "available must be true or false." }, { status: 400 });
  }

  const reason = payload.available ? "available" : "offline";
  await recordAudit({
    action: "inbound.availability",
    decision: "allow",
    reason,
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "inbound-routing-preference",
    requestPath: PATH,
    detail: JSON.stringify({ source: "portal" }),
  });

  return Response.json({ ok: true, status: reason });
}
