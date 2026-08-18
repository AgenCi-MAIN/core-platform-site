import { recordAudit, requireCapability } from "../access";
// The schedule document ships INSIDE the worker bundle (vite ?raw import) on
// purpose: an earlier revision proxied it from the static-asset layer via an
// ASSETS binding, and the first live deploy proved that binding is not
// exposed to the app on this platform — the guarded route 503'd while the
// document sat unreachable beside it. Baking it in means the guard and the
// document cannot be deployed apart, and there is no separate public asset
// path serving an unguarded copy on this origin. (The deliberately public
// copy lives on its own site — see commission-site/README.md.)
import scheduleHtml from "./schedule.html?raw";

/**
 * The Thrive commission schedule — the full interactive comp grid (29
 * carriers, level picker 80–150, per-product ladders, promotion rules),
 * served as its own standalone page behind the portal's membership gate.
 *
 * dashboard.view.self is the gate deliberately: the schedule is every
 * member's comp reference, not a leadership surface. Every open is guarded
 * (anonymous → sign-in, non-member/suspended → refused) and audited.
 */
export async function GET() {
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

  // no-store mirrors the service worker's stance on /portal: a comp grid must
  // never be served stale to a member whose access has since changed.
  return new Response(scheduleHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
