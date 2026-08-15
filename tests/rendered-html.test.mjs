import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";

/**
 * The worker bundle targets the Cloudflare runtime, so it statically imports
 * `cloudflare:workers` — reached from db/index.ts via the portal's server-side
 * authorization module. Node's ESM loader rejects that scheme outright, which
 * kills the import before any assertion can run.
 *
 * Resolve it to a data: URL exporting an empty binding set. That is honest for
 * these tests: no D1 binding exists here, so the portal takes its fail-closed
 * path — which is precisely what the portal tests below assert.
 *
 * Only `cloudflare:workers` is stubbed. A newly-introduced `cloudflare:*`
 * import will fail loudly rather than silently resolve to an empty module.
 */
const CF_WORKERS_STUB = `data:text/javascript,${encodeURIComponent(
  "export const env = {};",
)}`;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") {
      return { url: CF_WORKERS_STUB, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

async function fetchPath(pathname, headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html", ...headers },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function render() {
  return fetchPath("/");
}

test("server-renders the Core operating model", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /From rented demand/);
  assert.match(html, /Five ranks/);
  assert.match(html, /Volume is noise/);
  assert.match(html, /Ember/);
  assert.match(html, /Vector/);
  assert.match(html, /Apex/);
  assert.match(html, /Dominion/);
  assert.match(html, /Zenith/);
  assert.match(html, /110%/);
  assert.match(html, /Fund a verified signal/);
  assert.match(html, /Every carrier answer/);
  assert.match(html, /Every signal becomes/);
  assert.match(html, /Find the five minutes that matter/);
  assert.match(html, /Portfolio memory gets smarter/);
  assert.match(html, /Scripts should learn/);
  assert.match(html, /N-001/);
  assert.match(html, /GOAL ENGINE/);
  assert.match(html, /J\.A\.R\.V\.I\.S\. \/ COMMAND/);
  assert.doesNotMatch(html, /Mr\. C/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
  assert.match(html, /href="\/portal"/);
});

/**
 * Portal authorization, exercised end-to-end through the built worker.
 *
 * These run with no D1 binding and no identity headers — the state a fresh
 * deployment is in before provisioning. That is the case that must not leak.
 */
/**
 * Every route that calls requireCapability. Derived by hand from the
 * requireCapability call sites and asserted to be complete below, so adding a
 * guarded page without covering it here fails the suite rather than shipping
 * unproven.
 *
 * /portal/no-access is deliberately absent: refused visitors are sent there,
 * so guarding it would redirect-loop the people it exists to explain things to.
 */
const PROTECTED_ROUTES = [
  "/portal",
  "/portal/announcements",
  "/portal/audit",
  "/portal/book",
  "/portal/calls",
  "/portal/leadership",
  "/portal/library",
  "/portal/members",
  "/portal/pay-rates",
  "/portal/music",
  "/portal/scripts",
  "/portal/shop",
  "/portal/team",
].map((pathname) => [pathname, encodeURIComponent(pathname)]);

test("protected portal routes refuse anonymous visitors and render nothing", async () => {
  for (const [pathname, encodedReturn] of PROTECTED_ROUTES) {
    const response = await fetchPath(pathname);

    assert.equal(response.status, 307, `${pathname} must redirect, not render`);

    const location = response.headers.get("location") ?? "";
    assert.match(
      location,
      /\/auth\/signin\?/,
      `${pathname} must route to sign-in, got ${location}`,
    );
    assert.ok(
      location.includes(`return_to=${encodedReturn}`),
      `${pathname} must preserve its own return path, got ${location}`,
    );

    const body = await response.text();
    assert.equal(body, "", `${pathname} must not emit a response body`);
  }
});

test("the no-access page renders without authentication", async () => {
  // Refused visitors are sent here, so it must never guard itself — doing so
  // would redirect-loop the people it exists to explain things to.
  const response = await fetchPath("/portal/no-access");

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Sign in required/);
  assert.doesNotMatch(html, /Capabilities held/);
});

/**
 * Guards the guard list. If someone adds a page that calls requireCapability
 * and forgets PROTECTED_ROUTES, this fails — which is the only thing standing
 * between a new guarded page and shipping with no anonymous-refusal proof.
 */
test("every guarded route is covered by the anonymous-refusal list", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");

  const { fileURLToPath } = await import("node:url");
  const appDir = fileURLToPath(new URL("../app", import.meta.url));

  // Second argument of requireCapability(capability, returnTo) is the route.
  const GUARD = /requireCapability\(\s*"[^"]+"\s*,\s*"([^"]+)"/g;

  const found = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "page.tsx") {
        const src = readFileSync(full, "utf8");
        for (const m of src.matchAll(GUARD)) found.add(m[1]);
      }
    }
  };
  walk(appDir);

  const covered = new Set(PROTECTED_ROUTES.map(([p]) => p));
  const uncovered = [...found].filter((p) => !covered.has(p)).sort();

  assert.deepEqual(
    uncovered,
    [],
    `guarded but untested: ${uncovered.join(", ")} — add them to PROTECTED_ROUTES`,
  );
  assert.ok(found.size >= 10, `expected at least 10 guarded routes, found ${found.size}`);
});

/**
 * The public surfaces. These must render for anyone — they are how a recruit
 * or a locked-out member finds out what to do next — and must never contain
 * member data.
 */
const PUBLIC_ROUTES = ["/", "/access", "/tour"];

test("public surfaces render for anonymous visitors", async () => {
  for (const pathname of PUBLIC_ROUTES) {
    const response = await fetchPath(pathname);
    assert.equal(response.status, 200, `${pathname} must render publicly`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

    const html = await response.text();
    assert.ok(html.length > 500, `${pathname} rendered an empty page`);
    assert.match(html, /THRIVE/, `${pathname} must carry THRIVE branding`);
    // Theme control must exist on every public page, or Bright/Dark is
    // unreachable there.
    assert.match(
      html,
      /portal-theme-control/,
      `${pathname} is missing the Bright/Dark control`,
    );
  }
});

test("the access page never reveals whether an address holds membership", async () => {
  // The seeded owner address and an address that cannot be a member must
  // produce identical pages apart from the echoed text itself. Any divergence
  // would make this page an enumeration oracle.
  // Deliberately synthetic. A real member address must never be written into
  // the repository: git history is irretractable, and this test does not need
  // one -- it proves the response shape does not vary with the input at all.
  const first = await fetchPath("/access?email=someone%40example.com");
  const second = await fetchPath("/access?email=nobody%40example.invalid");

  assert.equal(first.status, second.status);

  const a = (await first.text()).replaceAll("someone@example.com", "X");
  const b = (await second.text()).replaceAll("nobody@example.invalid", "X");

  assert.equal(a, b, "access page output differs by address — enumeration oracle");
});

test("public surfaces carry no member or audit data", async () => {
  for (const pathname of PUBLIC_ROUTES) {
    const html = await (await fetchPath(pathname)).text();
    for (const marker of ["portal_members", "audit_events", "subject_id", "last_seen_at"]) {
      assert.doesNotMatch(
        html,
        new RegExp(marker),
        `${pathname} leaked the marker ${marker}`,
      );
    }
  }
});

/* ============================================================
   Installable app (PWA)
   ============================================================ */

test("serves a web app manifest that installs to the portal", async () => {
  const response = await fetchPath("/manifest.webmanifest", { accept: "*/*" });
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/manifest\+json/i,
    "a manifest served as anything else is ignored by the installer",
  );

  const manifest = JSON.parse(await response.text());
  assert.equal(manifest.start_url, "/portal");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.id, "/portal");

  // Android's installer refuses without a 192 and a 512, and crops the icon to
  // the launcher's shape unless a maskable one exists.
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes("192x192"), "no 192px icon — Android will not install");
  assert.ok(sizes.includes("512x512"), "no 512px icon — Android will not install");
  assert.ok(
    manifest.icons.some((icon) => icon.purpose === "maskable"),
    "no maskable icon — the mark gets clipped by the launcher mask",
  );
});

test("the installable shell is declared in the document head", async () => {
  const html = await (await render()).text();
  assert.match(html, /rel="manifest"/, "no manifest link — nothing is installable");
  assert.match(
    html,
    /rel="apple-touch-icon"[^>]*apple-touch-icon\.png/,
    "iOS ignores the SVG icon and screenshots the page instead",
  );
  assert.match(
    html,
    /name="apple-mobile-web-app-capable"/,
    "iOS before 16.4 will not launch standalone without the apple- prefixed name",
  );
  assert.match(html, /name="theme-color"/);
  // Pinned because viewport-fit rides on the `width` field — see app/layout.tsx.
  // Exactly one viewport meta, and it must carry the directive.
  const viewports = html.match(/<meta name="viewport"[^>]*>/g) ?? [];
  assert.equal(viewports.length, 1, "duplicate viewport meta tags");
  assert.match(viewports[0], /width=device-width/);
  assert.match(viewports[0], /viewport-fit=cover/);
  assert.match(html, /serviceWorker/, "the service worker is never registered");
});

test("the service worker never caches an authenticated response", async () => {
  // The whole access model is server-side. A cached /portal page would answer
  // without re-resolving the session cookie or the member's row, so a signed-out
  // or suspended device would keep serving whatever it last saw. This asserts
  // the source of that guarantee rather than its effect, because a service
  // worker cannot be exercised from Node.
  // Normalised to LF before anything else. Development happens on Windows,
  // where git checks this file out with CRLF — and the byte-pinned comparison
  // below must judge the code, not the checkout configuration. Without this,
  // the end-of-branch marker ("\n  }\n") never matches on Windows, the slice
  // runs to the end of the file, and the suite fails on a service worker that
  // is completely correct. It blocked the owner's first gated deploy.
  const source = (
    await readFile(new URL("../public/sw.js", import.meta.url), "utf8")
  ).replace(/\r\n/g, "\n");

  assert.match(
    source,
    /url\.pathname === "\/portal" \|\| url\.pathname\.startsWith\("\/portal\/"\)/,
    "the /portal exclusion is gone — authenticated pages are now cacheable",
  );
  assert.match(
    source,
    /url\.pathname\.startsWith\("\/auth\/"\)/,
    "the /auth exclusion is gone — sign-in and callback responses are cacheable",
  );
  // A /portal navigation may be intercepted to serve the static offline page on
  // a network failure — the installed app starts at /portal, so that is the
  // likeliest offline moment. It must remain a bare pass-through: no cache read
  // and no cache write on that path.
  /**
   * Pinned positively rather than by forbidding things. An earlier version of
   * this check listed what the branch must not contain, and a mutation that
   * swapped the pass-through for `cacheFirst(request, STATIC_CACHE)` — which
   * would serve a member a cached portal page — walked straight through it.
   * Enumerating the ways to be wrong does not work; stating the one acceptable
   * body does.
   */
  const branchStart = source.indexOf("const isPortal");
  assert.ok(branchStart > 0, "could not locate the /portal branch — this check went stale");
  const portalBranch = source.slice(branchStart, source.indexOf("\n  }\n", branchStart));

  const normalised = portalBranch
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  assert.equal(
    normalised,
    'const isPortal = url.pathname === "/portal" || url.pathname.startsWith("/portal/"); ' +
      'if (isPortal || url.pathname.startsWith("/auth/")) { ' +
      'if (isPortal && request.mode === "navigate") { ' +
      "event.respondWith(fetch(request).catch(offlinePage)); } return;",
    "the /portal and /auth branch changed. This is the access boundary in the service worker: " +
      "only a navigation may be intercepted, only to fall back to the static offline page when the " +
      "network fails, and nothing here may read or write a cache. If the change is intended, " +
      "re-read what it does to a suspended member's installed app before updating this string.",
  );
  assert.match(
    source,
    /request\.method !== "GET"/,
    "non-GET requests are no longer passed straight through",
  );

  // Only these two caches may exist, and only these two rules may write to one.
  const writes = source.match(/cache\.put\(/g) ?? [];
  assert.equal(writes.length, 2, "a new cache write appeared — check what it stores");
});

test("restricted data never reaches a public client chunk", async () => {
  /**
   * Static assets under /assets are served by the ASSETS binding without ever
   * touching the worker, so no session, capability, or audit check runs on
   * them. Anything a `"use client"` file declares as a constant is compiled
   * into one of those chunks and is readable by anyone — including an
   * anonymous visitor — regardless of how well the page rendering it is
   * guarded.
   *
   * That is not hypothetical: the rank contract levels, API grant counts, and
   * per-rank headcount behind `leadership.view.all` shipped this way, in
   * dist/client/assets/studio-*.js, cached immutably. They now live in a
   * server module and arrive as props.
   *
   * This scans the built client bundle for those values. It is a coarse net on
   * purpose — a substring check catches the mistake however it is reintroduced,
   * including through a different component.
   */
  const dir = new URL("../dist/client/assets/", import.meta.url);
  const files = (await readdir(dir)).filter((name) => name.endsWith(".js"));
  assert.ok(files.length > 0, "no client chunks were built — this test would pass vacuously");

  // Rank names and the shape the economics compile to.
  const FORBIDDEN = ["Obsidian", "Zenith", "contract:140", "apiPerAgent:47"];

  for (const name of files) {
    const source = await readFile(new URL(name, dir), "utf8");
    for (const marker of FORBIDDEN) {
      assert.ok(
        !source.includes(marker),
        `restricted pay-rate data (${marker}) is readable in the public chunk assets/${name}`,
      );
    }
  }
});
