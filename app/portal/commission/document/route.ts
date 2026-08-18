import { requireCapability } from "../../access";
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
 * The commission schedule DOCUMENT — the full interactive comp grid (29
 * carriers, level picker 80–150, per-product ladders, promotion rules),
 * rendered inside the portal page at /portal/commission via an iframe so the
 * member never leaves the portal shell. This route serves the frame's
 * content and carries the same guard as the page: anonymous → sign-in,
 * non-member/suspended → refused. The page audits the view; this route
 * only serves the already-authorized frame, so it records no second row.
 */
export async function GET() {
  await requireCapability("dashboard.view.self", "/portal/commission/document");

  // no-store mirrors the service worker's stance on /portal: a comp grid must
  // never be served stale to a member whose access has since changed.
  return new Response(scheduleHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
