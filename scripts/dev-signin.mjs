/**
 * Local sign-in shim for development only.
 *
 * WHY THIS EXISTS
 *
 * `/signin-with-chatgpt` is provided by the Sites hosting platform, not by this
 * application. The platform authenticates the visitor and then forwards the
 * request to the worker carrying `oai-authenticated-user-*` headers. On
 * localhost neither exists, so the sign-in link 404s and every guarded page is
 * unreachable. That makes the whole authenticated portal impossible to look at
 * locally.
 *
 * This proxy stands in for the platform: it forwards everything to the dev
 * server and injects those same identity headers, so the portal behaves exactly
 * as it does in production. The application is not modified and knows nothing
 * about this.
 *
 * SAFETY
 *
 *  - Binds to 127.0.0.1 ONLY. It hands out an owner identity, so it must never
 *    be reachable from the network. An earlier version of this idea listened on
 *    every interface, which put owner access on the LAN.
 *  - Lives in scripts/ and is never imported by the app or bundled.
 *  - Refuses to start unless NODE_ENV is undefined or "development".
 *  - Prints the identity it is impersonating on every start, so it can never be
 *    running quietly.
 *
 * USAGE
 *
 *   AS_EMAIL=you@example.com node scripts/dev-signin.mjs
 *   AS_EMAIL=you@example.com PORT=3010 TARGET=3001 node scripts/dev-signin.mjs
 *
 * AS_EMAIL is required and has no default, so no member address is ever
 * committed to this repository.
 *
 * Then browse http://127.0.0.1:3010 instead of the dev server directly.
 * The role comes from the portal_members row for that email, exactly as in
 * production — this only asserts identity, never authorisation.
 */

import http from "node:http";

if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") {
  console.error(`Refusing to start with NODE_ENV=${process.env.NODE_ENV}.`);
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 3010);
const TARGET = Number(process.env.TARGET ?? 3001);
const HOST = "127.0.0.1";
/**
 * The dev server may bind IPv6 loopback (::1) only — vinext does on Windows —
 * so dialling 127.0.0.1 is refused. Resolving "localhost" picks whichever
 * family is actually listening.
 */
const UPSTREAM_HOST = process.env.TARGET_HOST ?? "localhost";

/**
 * The address to impersonate must be supplied at run time. It is deliberately
 * NOT defaulted to a real person: git history is irretractable, and a member
 * address committed here would be permanent and published to the remote.
 */
if (!process.env.AS_EMAIL) {
  console.error("");
  console.error("  AS_EMAIL is required.");
  console.error("");
  console.error("  Use the address that has a portal_members row, e.g.");
  console.error("    AS_EMAIL=you@example.com node scripts/dev-signin.mjs");
  console.error("");
  process.exit(1);
}

const IDENTITY = {
  email: process.env.AS_EMAIL,
  subject: process.env.AS_SUBJECT ?? "dev-local-subject",
  fullName: process.env.AS_NAME ?? process.env.AS_EMAIL,
};

/** The two paths the hosting platform owns. We emulate them. */
const SIGN_IN = "/signin-with-chatgpt";
const SIGN_OUT = "/signout-with-chatgpt";

/** Toggled by the emulated sign-out, so the refusal pages can be seen too. */
let signedIn = true;

function safeReturn(raw) {
  const value = raw ?? "/portal";
  if (!value.startsWith("/") || value.startsWith("//")) return "/portal";
  return value;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);

  if (url.pathname === SIGN_IN) {
    signedIn = true;
    const to = safeReturn(url.searchParams.get("return_to"));
    console.log(`  sign-in  -> ${IDENTITY.email}, returning to ${to}`);
    res.writeHead(302, { location: to });
    res.end();
    return;
  }

  if (url.pathname === SIGN_OUT) {
    signedIn = false;
    const to = safeReturn(url.searchParams.get("return_to") ?? "/");
    console.log(`  sign-out -> anonymous, returning to ${to}`);
    res.writeHead(302, { location: to });
    res.end();
    return;
  }

  // Keep the original Host. Rewriting it makes the app build absolute
  // redirects pointing at the upstream port, which bounces the browser off
  // the proxy and back to an unauthenticated dev server.
  const headers = { ...req.headers };

  // Never let a real request smuggle these in; we are the only source.
  delete headers["oai-authenticated-user-id"];
  delete headers["oai-authenticated-user-email"];
  delete headers["oai-authenticated-user-full-name"];
  delete headers["oai-authenticated-user-full-name-encoding"];

  if (signedIn) {
    headers["oai-authenticated-user-id"] = IDENTITY.subject;
    headers["oai-authenticated-user-email"] = IDENTITY.email;
    headers["oai-authenticated-user-full-name"] = encodeURIComponent(IDENTITY.fullName);
    headers["oai-authenticated-user-full-name-encoding"] = "percent-encoded-utf-8";
  }

  const upstream = http.request(
    { host: UPSTREAM_HOST, port: TARGET, method: req.method, path: req.url, headers },
    (proxied) => {
      res.writeHead(proxied.statusCode ?? 502, proxied.headers);
      proxied.pipe(res, { end: true });
    },
  );

  upstream.on("error", (error) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      `Dev proxy could not reach the dev server on ${HOST}:${TARGET}.\n\n` +
        `Start it with:  npm run dev\n\n${error.message}\n`,
    );
  });

  req.pipe(upstream, { end: true });
});

function banner(where) {
  console.log(`  listening   ${where}   ->   http://${UPSTREAM_HOST}:${TARGET}`);
}

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("  THRIVE local sign-in shim  (development only)");
  banner(`http://${HOST}:${PORT}`);
  console.log(`  signed in as ${IDENTITY.email}`);
  console.log("");
  console.log("  This impersonates the hosting platform's identity headers.");
  console.log("  Loopback only. Never expose it, never run it against production.");
  console.log("");
});

// Second loopback listener for IPv6, so http://localhost:PORT works whichever
// family the browser resolves first. Failure here is not fatal.
const server6 = http.createServer(server.listeners("request")[0]);
server6.on("error", () => {});
server6.listen(PORT, "::1", () => banner(`http://[::1]:${PORT}`));
