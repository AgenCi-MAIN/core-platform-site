/**
 * Local sign-in shim for development only.
 *
 * WHY THIS EXISTS
 *
 * In production, identity comes from Sign in with Google: /auth/signin sends
 * the browser to Google, /auth/callback mints the `core_session` cookie. On
 * localhost that needs a registered OAuth client, its secret in .dev.vars, and
 * a Google account round-trip for every session — a lot of ceremony just to
 * look at a page. That makes the whole authenticated portal tedious to work on
 * locally.
 *
 * This proxy stands in for the Google round-trip: it forwards everything to
 * the dev server and injects a `core_session` cookie signed with the SAME
 * SESSION_SECRET the dev server reads from .dev.vars, so the portal behaves
 * exactly as it does in production. The application is not modified and knows
 * nothing about this — the cookie is indistinguishable from one minted by the
 * real callback.
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
 *  - Needs SESSION_SECRET, and reads it from the environment or .dev.vars —
 *    it can only mint cookies for a dev server whose secret you already hold.
 *
 * USAGE
 *
 *   # .dev.vars in the repo root must contain SESSION_SECRET=<any long string>
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

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

/**
 * The signing secret must match the dev server's, or every minted cookie is
 * refused as forged — which is exactly what the portal is supposed to do.
 */
const SESSION_SECRET = process.env.SESSION_SECRET ?? readDevVarsSecret();

if (!SESSION_SECRET) {
  console.error("");
  console.error("  SESSION_SECRET is required.");
  console.error("");
  console.error("  The dev server reads it from .dev.vars in the repo root; this");
  console.error("  shim reads the same file. Create it with a line like");
  console.error("    SESSION_SECRET=any-long-random-string-for-local-dev");
  console.error("  or pass SESSION_SECRET=... in the environment.");
  console.error("");
  process.exit(1);
}

function readDevVarsSecret() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  let text;
  try {
    text = readFileSync(join(root, ".dev.vars"), "utf8");
  } catch {
    return undefined;
  }
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*SESSION_SECRET\s*=\s*(.+?)\s*$/);
    if (match) return match[1].replace(/^["']|["']$/g, "");
  }
  return undefined;
}

/** Mint `core_session` exactly as app/auth/callback/route.ts does. */
function mintSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: IDENTITY.subject,
    email: IDENTITY.email,
    name: IDENTITY.fullName,
    iat: now,
    exp: now + 60 * 60,
  };
  const body = `v1.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
  const mac = createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
}

/** The app's own auth routes. We intercept them so no Google client is needed. */
const SIGN_IN = "/auth/signin";
const SIGN_OUT = "/auth/signout";

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

  // Never let a real request smuggle a session in; we are the only source.
  const otherCookies = (headers.cookie ?? "")
    .split(";")
    .map((piece) => piece.trim())
    .filter((piece) => piece && !piece.startsWith("core_session="));

  if (signedIn) otherCookies.push(`core_session=${mintSessionToken()}`);

  if (otherCookies.length > 0) headers.cookie = otherCookies.join("; ");
  else delete headers.cookie;

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
  console.log("  This mints the same session cookie the Google callback mints,");
  console.log("  signed with the SESSION_SECRET from .dev.vars.");
  console.log("  Loopback only. Never expose it, never run it against production.");
  console.log("");
});

// Second loopback listener for IPv6, so http://localhost:PORT works whichever
// family the browser resolves first. Failure here is not fatal.
const server6 = http.createServer(server.listeners("request")[0]);
server6.on("error", () => {});
server6.listen(PORT, "::1", () => banner(`http://[::1]:${PORT}`));
