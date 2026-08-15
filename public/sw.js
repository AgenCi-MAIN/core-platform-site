/**
 * THRIVE portal service worker.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * It never caches a response for any path under /portal, and it never caches a
 * navigation. That is not a performance compromise, it is the point. Everything
 * behind /portal is answered only after the worker re-resolves the signed
 * session cookie and the member's row, and a cached copy would answer without
 * either check — a suspended member's phone would keep serving them the book of
 * business, and a signed-out device would keep showing the last page it saw.
 * The access model is server-side by construction; a cache is a place for the
 * server's answers to outlive the question, so authenticated answers stay out
 * of it.
 *
 * WHAT IT CACHES
 *
 * Content-hashed build assets under /assets (cache-first — the hash in the
 * filename means the bytes never change), and a short list of static files at
 * the root: icons, the offline page. Nothing else. Anything the rules below do
 * not recognise is not intercepted at all: no respondWith, so the request goes
 * to the network exactly as it would with no service worker installed.
 *
 * TO REMOVE THIS WORKER from installed devices, replace this file's body with
 * `self.addEventListener("install", () => self.skipWaiting());` plus a
 * registration.unregister() and caches.delete() in activate. Browsers re-fetch
 * sw.js on their own, so a deploy is enough to retire it.
 */

const VERSION = "core-pwa-v1";
const ASSET_CACHE = `${VERSION}-assets`;
const STATIC_CACHE = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";

/** Root-level files worth having before the network is gone. */
const PRECACHE = [
  OFFLINE_URL,
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Individually, so one missing file does not abort the install and leave
      // the worker permanently stuck in a failed state.
      await Promise.all(
        PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {})),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([ASSET_CACHE, STATIC_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.map((name) => (keep.has(name) ? null : caches.delete(name))));
      await self.clients.claim();
    })(),
  );
});

/** True for the content-hashed build output, which is safe to cache forever. */
function isImmutableAsset(url) {
  return url.pathname.startsWith("/assets/");
}

/** True for the handful of unhashed root files in PRECACHE. */
function isStaticFile(url) {
  return PRECACHE.includes(url.pathname);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    // Clone before the body is consumed by the caller.
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  if (hit) {
    // Refresh in the background; serve what we have now.
    return hit;
  }
  const response = await network;
  if (response) return response;
  throw new Error("offline");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only ever GET. A POST is a write — membership changes, uploads, sign-out —
  // and a service worker has no business standing between those and the server.
  if (request.method !== "GET") return;

  // Range requests stream audio from the portal. Passing them through untouched
  // avoids the classic bug where a cached 200 is returned for a 206 request and
  // playback silently breaks.
  if (request.headers.has("range")) return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;

  // The access boundary. Nothing under here is cached, inspected, or answered
  // from anywhere but the server.
  if (url.pathname === "/portal" || url.pathname.startsWith("/portal/")) return;
  if (url.pathname.startsWith("/auth/")) return;

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isStaticFile(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Navigations are never cached — but when the network is gone, a branded
  // offline page beats the browser's dinosaur. The response is passed straight
  // through on success, so nothing about the page changes when online.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const offline = await cache.match(OFFLINE_URL);
        return (
          offline ??
          new Response("Offline.", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
  }
});
