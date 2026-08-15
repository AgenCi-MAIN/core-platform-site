/**
 * Registers the service worker that makes the portal installable.
 *
 * Kept as a plain inline script rather than a client component for the same
 * reason as PortalThemeBoot: it has no props, no state, and no reason to ship a
 * hydration boundary. It also fails silently by design — the app must work
 * identically for anyone whose browser refuses to register one, which is every
 * visitor in a private window on some browsers.
 *
 * Registration is deferred to `load` so it never competes with first paint,
 * and skipped outside a secure context, where the API is unavailable anyway.
 */
const REGISTER = `(function(){if(!("serviceWorker"in navigator))return;if(!window.isSecureContext)return;addEventListener("load",function(){navigator.serviceWorker.register("/sw.js",{scope:"/"}).then(function(r){r.update()}).catch(function(){})})})();`;

export function ServiceWorkerBoot() {
  return <script dangerouslySetInnerHTML={{ __html: REGISTER }} />;
}
