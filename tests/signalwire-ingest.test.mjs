/**
 * SignalWire call ingest — `/portal/calls/ingest`.
 *
 * Boots the built worker in Miniflare (actual workerd, actual D1), applies the
 * real db/sql migrations, and drives the route over HTTP exactly as the carrier
 * would. Credentials and signatures are built here with Node's crypto, so a
 * forged or absent one is an independent check rather than the worker grading
 * its own homework.
 *
 * Run `npm run build` first; these load dist/server.
 *
 * This route matters more than its size suggests: it is the one path Cloudflare
 * Access does not stand in front of, so it is the only place in the portal
 * where an anonymous request reaches application code. Everything below pins
 * the properties that make that safe.
 *
 * What is pinned:
 *  - every refusal is a byte-identical empty 401 — no status, header or body
 *    distinguishes an unconfigured deployment from a wrong secret, a missing
 *    signature or a forged one, so the endpoint cannot be used to learn what
 *    it wants;
 *  - both factors are required, and neither alone is enough;
 *  - a signature computed over the request's own host is refused, which is the
 *    whole reason the signed origin is stated rather than read;
 *  - a valid POST writes exactly one `dialer_transfers` row, with the caller's
 *    number masked and `source_system` set by CORE rather than by the sender;
 *  - the payload cannot assert consent, a recording, an agent, or its own
 *    transfer id;
 *  - redelivery updates one row rather than inserting a second, and a
 *    late-arriving earlier status does not demote a later one;
 *  - the carrier can assert only intake statuses; a posted `ready` or
 *    `needs_review` is refused rather than downgraded;
 *  - an unmapped line stores no agent rather than a name we cannot vouch for;
 *  - GET is refused 405, and no refused request ever writes.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Miniflare } from "miniflare";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_DIR = join(ROOT, "dist/server");

function collectModules(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...collectModules(p));
    else if (/\.(js|mjs)$/.test(entry)) out.push(p);
  }
  return out;
}

const ENTRY = join(SERVER_DIR, "index.js");
const MODULES = [
  { type: "ESModule", path: ENTRY },
  ...collectModules(SERVER_DIR)
    .filter((p) => p !== ENTRY)
    .map((p) => ({
      type: "ESModule",
      path: p,
      name: relative(SERVER_DIR, p).replace(/\\/g, "/"),
    })),
];

function sqlStatements(text) {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const INIT_SQL = sqlStatements(readFileSync(join(ROOT, "db/sql/0001_portal_init.sql"), "utf8"));

const SECRET = "test-ingest-secret-value";
const PREVIOUS_SECRET = "test-ingest-secret-outgoing";
const SIGNING_KEY = "test-signing-key-value";
/**
 * The origin is STATED configuration, not read off the request — so the tests
 * deliberately disagree with themselves: requests are dispatched over
 * `http://localhost` while signatures are computed against the configured
 * `https://localhost`. A route that verified against `request.url` would fail
 * every test below; this one passes them, which is the property.
 */
const ORIGIN = "https://localhost";
const PATH = "/portal/calls/ingest";
const SIGNED_URL = `${ORIGIN}${PATH}`;
const INGEST_URL = `http://localhost${PATH}`;

/** The line +1 205 555 0134 is mapped to an agent; +1 205 555 9999 is not. */
const AGENT_LINE = "+12055550134";
const AGENT_EMAIL = "agent@example.com";
const AGENT_MAP = JSON.stringify({ [AGENT_LINE]: AGENT_EMAIL });

const CALLER = "+19415551234";
const CALL_ID = "b8f1c2d4-0000-4000-8000-000000000001";

/**
 * The string the route rebuilds to verify: the STATED public origin plus the
 * literal path, then each field name immediately followed by its value in
 * sorted name order.
 */
function baseFor(params, origin = SIGNED_URL) {
  const p = new URLSearchParams(params);
  return [...p.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .reduce((acc, [name, value]) => `${acc}${name}${value}`, origin);
}

function signatureFor(key, base, hash = "sha1") {
  return createHmac(hash, key).update(base, "utf8").digest("base64");
}

function basic(secret) {
  return `Basic ${Buffer.from(`ingest:${secret}`).toString("base64")}`;
}

async function startIngest({ configured = true, agentMap = AGENT_MAP, previous = null } = {}) {
  const mf = new Miniflare({
    modulesRoot: SERVER_DIR,
    modules: MODULES,
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "site-creator-d1" },
    r2Buckets: { CALL_RECORDINGS: "core-call-recordings" },
    bindings: {
      SESSION_SECRET: "test-session-secret-value-not-a-real-one",
      ...(configured
        ? {
            SIGNALWIRE_INGEST_SECRET: SECRET,
            SIGNALWIRE_SIGNING_KEY: SIGNING_KEY,
            SIGNALWIRE_PUBLIC_ORIGIN: ORIGIN,
            ...(previous ? { SIGNALWIRE_INGEST_SECRET_PREVIOUS: previous } : {}),
            ...(agentMap ? { SIGNALWIRE_AGENT_MAP: agentMap } : {}),
          }
        : {}),
    },
    serviceBindings: { ASSETS: () => new Response("Not found", { status: 404 }) },
  });

  const db = await mf.getD1Database("DB");
  for (const s of INIT_SQL) await db.prepare(s).run();

  /**
   * POST a carrier-shaped form event. `secret: null` omits the Basic header,
   * `sign: false` omits the signature, and `signature` supplies a forged one.
   */
  const post = (params, { secret = SECRET, sign = true, signature = null } = {}) => {
    const body = new URLSearchParams(params).toString();
    const headers = { "content-type": "application/x-www-form-urlencoded" };
    if (secret !== null) headers["authorization"] = basic(secret);
    if (signature !== null) headers["x-signalwire-signature"] = signature;
    else if (sign) headers["x-signalwire-signature"] = signatureFor(SIGNING_KEY, baseFor(params));
    return mf.dispatchFetch(INGEST_URL, { method: "POST", body, headers, redirect: "manual" });
  };

  const transfers = async () =>
    (await db.prepare("SELECT * FROM dialer_transfers ORDER BY id").all()).results;

  return { mf, db, post, transfers, dispose: () => mf.dispose() };
}

const event = (over = {}) => ({
  CallSid: CALL_ID,
  From: CALLER,
  To: AGENT_LINE,
  Direction: "inbound",
  status: "received",
  ...over,
});

/** Accepted events answer 2xx; the exact success code is the route's to choose. */
function assertAccepted(res, note) {
  assert.ok(res.status >= 200 && res.status < 300, `${note}: expected a 2xx, got ${res.status}`);
}

/** Every refusal must look the same from outside. */
async function assertOpaqueRefusal(res, note) {
  assert.equal(res.status, 401, `${note}: must answer 401`);
  assert.equal(await res.text(), "", `${note}: must echo nothing`);
  assert.equal(
    res.headers.get("www-authenticate"),
    null,
    `${note}: must not name the scheme it wants`,
  );
}

test("an unconfigured deployment refuses, indistinguishably from a wrong secret", async (t) => {
  const unconfigured = await startIngest({ configured: false });
  t.after(unconfigured.dispose);
  const a = await unconfigured.post(event());
  await assertOpaqueRefusal(a, "unconfigured");
  assert.deepEqual(
    await unconfigured.transfers(),
    [],
    "nothing is written before the route is provisioned",
  );

  const configured = await startIngest();
  t.after(configured.dispose);
  const b = await configured.post(event(), { secret: "not-the-secret" });
  await assertOpaqueRefusal(b, "wrong secret");

  assert.equal(a.status, b.status, "unconfigured and wrong-secret must be indistinguishable");
});

test("neither factor alone is enough", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  await assertOpaqueRefusal(await w.post(event(), { secret: null }), "no credential");
  await assertOpaqueRefusal(await w.post(event(), { sign: false }), "secret but no signature");
  await assertOpaqueRefusal(
    await w.post(event(), { signature: signatureFor("wrong-key", baseFor(event())) }),
    "secret but forged signature",
  );
  await assertOpaqueRefusal(
    await w.post(event(), { signature: signatureFor(SIGNING_KEY, baseFor(event()), "sha256") }),
    "undocumented SHA-256 form signature",
  );

  assert.deepEqual(await w.transfers(), [], "no refused request reaches the transfer table");
});

test("a signature computed over the request host, not the stated origin, is refused", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  // The proxy-host substitution: the same body, signed against a host the
  // signer chose. Verifying against `request.url` would accept this.
  const params = event();
  const foreign = baseFor(params, `https://attacker.example${PATH}`);

  await assertOpaqueRefusal(
    await w.post(params, { signature: signatureFor(SIGNING_KEY, foreign) }),
    "signature over a foreign origin",
  );
  assert.deepEqual(await w.transfers(), [], "a host-substituted signature never writes");
});

test("a valid event writes one row, masked, with CORE's own keys", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  assertAccepted(await w.post(event()), "a fully authenticated event");

  const rows = await w.transfers();
  assert.equal(rows.length, 1, "exactly one row");
  const [row] = rows;

  assert.equal(row.source_system, "signalwire", "source is CORE's constant, not the sender's claim");
  assert.equal(row.transfer_id, `signalwire:${CALL_ID}`, "the transfer id is derived");
  assert.equal(row.caller_number_masked, "(***) ***-1234", "the caller's number is stored masked");
  assert.equal(row.agent_email, AGENT_EMAIL, "the connected line resolves through the secret map");
  assert.ok(
    !JSON.stringify(row).includes("9415551234"),
    "the unmasked caller number must not appear anywhere on the row",
  );
});

test("repeated Compatibility form fields retain submission order in the signature", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  const repeated = new URLSearchParams(event());
  repeated.append("Tag", "first");
  repeated.append("Tag", "second");
  assertAccepted(await w.post(repeated), "a signed event with repeated fields");
  assert.equal((await w.transfers()).length, 1);
});

test("the payload cannot assert consent, a recording, an agent, or its transfer id", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  const res = await w.post(
    event({
      transfer_id: "attacker-chosen-id",
      source_system: "twilio",
      consent_status: "granted",
      recording_object_key: "recordings/anything.mp3",
      recording_mime_type: "audio/mpeg",
      agent_email: "founder@example.com",
    }),
  );
  assertAccepted(res, "an event carrying fields the route does not read");

  const [row] = await w.transfers();
  assert.equal(row.transfer_id, `signalwire:${CALL_ID}`, "the transfer id is derived, never taken");
  assert.equal(row.source_system, "signalwire", "source system is a literal");
  assert.notEqual(row.consent_status, "granted", "consent is never client-assertable");
  assert.equal(row.recording_object_key, null, "a payload cannot make a recording playable");
  assert.equal(row.recording_mime_type, null, "nor name its type");
  assert.equal(row.agent_email, AGENT_EMAIL, "the agent comes from the map, not the payload");
});

test("redelivery updates one row, and a stale earlier status does not demote it", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  assertAccepted(await w.post(event({ status: "received" })), "first delivery");
  assertAccepted(await w.post(event({ status: "processing", CallDuration: "42" })), "later delivery");

  let rows = await w.transfers();
  assert.equal(rows.length, 1, "a redelivery updates rather than inserts");
  assert.equal(rows[0].status, "processing", "the later status wins");

  // Out-of-order delivery: an earlier event arriving after a later one. Both
  // deliveries of one call can be in flight at once, so this is ordinary
  // traffic rather than an attack, and losing to it would silently reopen a
  // call the carrier had already moved on from.
  assertAccepted(await w.post(event({ status: "received" })), "stale redelivery");

  rows = await w.transfers();
  assert.equal(rows.length, 1, "still one row");
  assert.equal(rows[0].status, "processing", "an earlier status must not demote a later one");
  assert.equal(
    rows[0].duration_seconds,
    42,
    "a value a later event stated is not erased by an older one",
  );
});

test("the carrier cannot assert a status only CORE's own review may set", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  // `ready` and `needs_review` are review states, reached inside the portal by
  // someone accountable for the decision. A carrier that could post one could
  // mark its own call reviewed, so the event is refused outright rather than
  // quietly downgraded — a silent downgrade would store a call under a status
  // nobody chose and look, from the row, exactly like a real one.
  for (const status of ["ready", "needs_review"]) {
    const res = await w.post(event({ status }));
    assert.equal(res.status, 400, `a carrier-asserted "${status}" must be refused`);
  }

  assert.deepEqual(await w.transfers(), [], "and no row is written by the attempt");
});

test("an unmapped line stores no agent rather than a guess", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  assertAccepted(await w.post(event({ To: "+12055559999" })), "a call to an unmapped line");
  const [row] = await w.transfers();
  assert.equal(row.agent_email, null, "an unmapped line is nobody, not a nearest match");
});

test("the outgoing secret is accepted during a rotation, and refused after it", async (t) => {
  const rotating = await startIngest({ previous: PREVIOUS_SECRET });
  t.after(rotating.dispose);
  assertAccepted(
    await rotating.post(event(), { secret: PREVIOUS_SECRET }),
    "the previous secret mid-rotation",
  );
  assert.equal((await rotating.transfers()).length, 1, "so a live call is not dropped");

  const finished = await startIngest();
  t.after(finished.dispose);
  await assertOpaqueRefusal(
    await finished.post(event(), { secret: PREVIOUS_SECRET }),
    "the previous secret once removed",
  );
});

test("an authenticated but unusable payload is refused 400, not retried forever", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  // No call id at all — nothing a retry could improve.
  const res = await w.post({ From: CALLER, To: AGENT_LINE });
  assert.equal(res.status, 400, "a payload we will never accept must not invite a retry");
  assert.deepEqual(await w.transfers(), [], "and nothing is written");
});

test("GET is refused 405 and never renders", async (t) => {
  const w = await startIngest();
  t.after(w.dispose);

  const res = await w.mf.dispatchFetch(INGEST_URL, { method: "GET", redirect: "manual" });
  assert.equal(res.status, 405, "this path exists for one POST");
  assert.equal(await res.text(), "", "and answers a browser with nothing");
});
