import { env } from "cloudflare:workers";
import { recordAudit, requireCapability } from "../access";

/**
 * The Thrive commission schedule — the full interactive comp grid (29
 * carriers, level picker 80–150, per-product ladders, promotion rules),
 * served as its own standalone page behind the portal's membership gate.
 *
 * The document itself lives in public/commission-schedule.html and is proxied
 * through this guarded handler rather than linked directly: the guard runs
 * requireCapability on every open (anonymous → sign-in, non-member → refused,
 * suspended → refused), and the view is audited like every other surface.
 * The asset's direct path also sits behind the Cloudflare Access edge gate,
 * so there is no anonymous route to it either way.
 *
 * dashboard.view.self is the gate deliberately: the schedule is every
 * member's comp reference, not a leadership surface.
 */
export async function GET(request: Request) {
  const session = await requireCapability("dashboard.view.self", "/portal/commission");

  await recordAudit({
    action: "dashboard.view.self",
    decision: "allow",
    reason: "commission_schedule_view",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "commission",
    requestPath: "/portal/commission",
  });

  const assets = env.ASSETS;
  if (!assets) {
    // Fail closed and honest — a deployment without the asset binding serves
    // nothing rather than something invented.
    return new Response("Commission schedule unavailable on this deployment.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const asset = await assets.fetch(
    new Request(new URL("/commission-schedule.html", request.url)),
  );
  if (!asset.ok) {
    return new Response("Commission schedule unavailable on this deployment.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // no-store mirrors the service worker's stance on /portal: a comp grid must
  // never be served stale to a member whose access has since changed.
  return new Response(asset.body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
