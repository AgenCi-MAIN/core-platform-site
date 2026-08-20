/**
 * Twilio inbound voice webhook — the Switchboard transfer system, Phase 1.
 *
 * Boots the built worker in Miniflare (actual workerd, actual D1), applies the
 * real db/sql migrations, and drives the webhook over HTTP exactly as Twilio
 * would: application/x-www-form-urlencoded with an `X-Twilio-Signature` header.
 * Signatures are computed here with Node's crypto so a forged or absent one is
 * a real, independent check — not the worker grading its own homework.
 *
 * Run `npm run build` first; these load dist/server.
 *
 * What is pinned:
 *  - an unsigned or wrong-signed request is refused 403 with an empty body and
 *    a `deny/signature_invalid` audit row — the security boundary;
 *  - a valid request rings the configured roster (one <Number> each), logs one
 *    `dialer_transfers` row (inbound / received / pending / masked number), and
 *    audits `allow/call_received`;
 *  - an empty roster fails safe to a courtesy greeting + <Hangup/>, still
 *    logged and audited — never silence, never voicemail;
 *  - the output NEVER contains a `record` attribute or <Record> verb
 *    (recording is OFF until counsel clears the wording, A29/E7b);
 *  - a Twilio retry of the same CallSid does not duplicate the row;
 *  - an unconfigured webhook fails closed 503, and GET is refused 405.
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

const AUTH_TOKEN = "test-twilio-auth-token";
const WEBHOOK_URL = "http://localhost/hooks/twilio/voice";
const ROSTER = "+15125550100, +15125550101";

/** The base64 HMAC-SHA1 Twilio would send for these params at this URL. */
function twilioSignature(authToken, url, params) {
  let data = url;
  for (const key of Object.keys(params).sort()) data += key + params[key];
  return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}

async function startWebhook({ configured = true, targets = ROSTER } = {}) {
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
            TWILIO_AUTH_TOKEN: AUTH_TOKEN,
            TWILIO_WEBHOOK_VOICE_URL: WEBHOOK_URL,
            ...(targets ? { TWILIO_DIAL_TARGETS: targets } : {}),
          }
        : {}),
    },
    serviceBindings: { ASSETS: () => new Response("Not found", { status: 404 }) },
  });

  const db = await mf.getD1Database("DB");
  for (const s of INIT_SQL) await db.prepare(s).run();

  /** POST a Twilio-shaped webhook. `sign: false` omits the header; `badSig` forges it. */
  const call = (params, { sign = true, badSig = null } = {}) => {
    const body = new URLSearchParams(params).toString();
    const headers = { "content-type": "application/x-www-form-urlencoded" };
    if (badSig !== null) headers["X-Twilio-Signature"] = badSig;
    else if (sign) headers["X-Twilio-Signature"] = twilioSignature(AUTH_TOKEN, WEBHOOK_URL, params);
    return mf.dispatchFetch(WEBHOOK_URL, { method: "POST", body, headers, redirect: "manual" });
  };

  const transfers = async () =>
    (await db.prepare("SELECT * FROM dialer_transfers ORDER BY id").all()).results;
  const audit = async () =>
    (
      await db
        .prepare("SELECT action, decision, reason, resource, request_path, detail FROM audit_events ORDER BY id")
        .all()
    ).results;

  return { mf, db, call, transfers, audit, dispose: () => mf.dispose() };
}

const params = (over = {}) => ({
  CallSid: "CAtest0000000000000000000000000001",
  From: "+19415551234",
  To: "+15125550100",
  CallStatus: "ringing",
  Direction: "inbound",
  ...over,
});

test("an unsigned webhook is refused 403 and audited, with no dial and no log", async (t) => {
  const w = await startWebhook();
  t.after(w.dispose);

  const res = await w.call(params(), { sign: false });
  assert.equal(res.status, 403, "no signature must be refused");
  assert.equal(await res.text(), "", "refusal echoes nothing");

  assert.deepEqual(await w.transfers(), [], "an unauthenticated call is never logged");
  const rows = await w.audit();
  assert.ok(
    rows.some((r) => r.action === "twilio.voice.inbound" && r.decision === "deny" && r.reason === "signature_invalid"),
    "the refusal is audited",
  );
});

test("a forged signature is refused 403", async (t) => {
  const w = await startWebhook();
  t.after(w.dispose);

  const res = await w.call(params(), { badSig: "not-a-real-signature" });
  assert.equal(res.status, 403);
  assert.deepEqual(await w.transfers(), []);
});

test("a valid webhook rings the roster, logs one masked row, and audits the allow", async (t) => {
  const w = await startWebhook();
  t.after(w.dispose);

  const res = await w.call(params());
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/xml/);
  const xml = await res.text();

  assert.match(xml, /<Dial answerOnBridge="true" timeout="20">/, "it dials");
  assert.match(xml, /<Number>\+15125550100<\/Number>/, "first roster number rings");
  assert.match(xml, /<Number>\+15125550101<\/Number>/, "second roster number rings");
  assert.match(xml, /Please hold while we connect you/, "the connect greeting plays");
  assert.doesNotMatch(xml, /recorded/i, "the greeting says nothing about recording");

  const rows = await w.transfers();
  assert.equal(rows.length, 1, "exactly one call row");
  const row = rows[0];
  assert.equal(row.source_system, "twilio");
  assert.equal(row.direction, "inbound");
  assert.equal(row.status, "received");
  assert.equal(row.consent_status, "pending", "consent pending — recording is OFF");
  assert.equal(row.external_call_id, "CAtest0000000000000000000000000001");
  assert.equal(row.transfer_id, "twilio:CAtest0000000000000000000000000001");
  assert.match(row.caller_number_masked, /^\+1•+1234$/, "caller number is stored masked, never in full");
  assert.doesNotMatch(row.caller_number_masked ?? "", /9415551234/, "the full number never rests in D1");

  const rows2 = await w.audit();
  const allow = rows2.find((r) => r.action === "twilio.voice.inbound" && r.decision === "allow");
  assert.ok(allow, "the call is audited allow");
  assert.equal(allow.reason, "call_received");
  assert.doesNotMatch(allow.detail ?? "", /9415551234/, "no caller number in the audit detail");
});

test("output never carries a recording directive", async (t) => {
  const w = await startWebhook();
  t.after(w.dispose);

  const xml = await (await w.call(params())).text();
  // A29/E7b: no <Record> verb, no record= attribute, in any casing.
  assert.doesNotMatch(xml, /<Record/i, "no Record verb");
  assert.doesNotMatch(xml, /\brecord\s*=/i, "no record attribute");
});

test("an empty roster fails safe to a courtesy greeting and a hang-up, still logged", async (t) => {
  const w = await startWebhook({ targets: "" });
  t.after(w.dispose);

  const res = await w.call(params());
  assert.equal(res.status, 200);
  const xml = await res.text();
  assert.doesNotMatch(xml, /<Dial/, "nobody to ring, so no dial");
  assert.match(xml, /<Hangup\/>/, "clean hang-up");
  assert.match(xml, /not able to take your call/, "a courtesy message, never silence");

  const rows = await w.transfers();
  assert.equal(rows.length, 1, "the missed call is still logged");
  const audited = await w.audit();
  assert.ok(
    audited.some((r) => r.action === "twilio.voice.inbound" && r.reason === "call_received_no_targets"),
    "audited with the no-targets reason",
  );
});

test("a Twilio retry of the same CallSid does not duplicate the row", async (t) => {
  const w = await startWebhook();
  t.after(w.dispose);

  await (await w.call(params())).text();
  await (await w.call(params())).text();

  const rows = await w.transfers();
  assert.equal(rows.length, 1, "idempotent on CallSid — one row for one call");
});

test("an unconfigured webhook fails closed 503", async (t) => {
  const w = await startWebhook({ configured: false });
  t.after(w.dispose);

  // Without a token there is no way to verify anyone; sign with a placeholder
  // so the request is well-formed but unverifiable.
  const res = await w.call(params(), { badSig: "anything" });
  assert.equal(res.status, 503, "no token, no answering");
  assert.deepEqual(await w.transfers(), [], "nothing is logged for an unconfigured line");
  const rows = await w.audit();
  assert.ok(
    rows.some((r) => r.action === "twilio.voice.inbound" && r.decision === "deny" && r.reason === "not_configured"),
  );
});

test("GET is refused", async (t) => {
  const w = await startWebhook();
  t.after(w.dispose);

  const res = await w.mf.dispatchFetch(WEBHOOK_URL, { method: "GET", redirect: "manual" });
  assert.equal(res.status, 405);
});
