/**
 * Portal authorization, exercised against the real Cloudflare runtime.
 *
 * These tests boot the built worker in Miniflare — actual workerd, actual D1 —
 * apply the real migrations from db/sql/, and drive the portal over HTTP with
 * the session cookie that Sign in with Google mints. Everything here therefore
 * covers the database-backed paths that cannot be reached from the plain-Node
 * suite in rendered-html.test.mjs: membership lookup, subject binding, role
 * resolution, capability enforcement, and audit writes.
 *
 * Run `npm run build` first; these load dist/server.
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

/**
 * vinext's SSR chunks use dynamic import specifiers, which Miniflare's
 * automatic module collection cannot follow, so every emitted module is
 * enumerated explicitly.
 */
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
const SEED_SQL = sqlStatements(readFileSync(join(ROOT, "db/sql/0002_portal_seed_owner.sql"), "utf8"));
const SEEDED_OWNER_EMAIL = "bankerrunners@gmail.com";

/**
 * Identity is asserted the same way production does it: a session cookie
 * HMAC-signed under SESSION_SECRET, minted here exactly as
 * app/auth/callback/route.ts mints it. The secret is plumbed into the worker
 * as a Miniflare binding, so a cookie signed with anything else must fail.
 */
const SESSION_SECRET = "portal-authorization-test-secret";

function mintSessionToken(identity, { secret = SESSION_SECRET, expiresInSeconds = 3600 } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: identity.subject,
    email: identity.email,
    name: identity.fullName ?? null,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const body = `v1.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function identityHeaders(identity) {
  return identity ? { cookie: `core_session=${mintSessionToken(identity)}` } : {};
}

/** Boot a worker with a fresh, empty D1. `migrate`/`seed` opt into schema and data. */
async function startPortal({ migrate = true, seed = true } = {}) {
  const mf = new Miniflare({
    modulesRoot: SERVER_DIR,
    modules: MODULES,
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "site-creator-d1" },
    r2Buckets: { CALL_RECORDINGS: "core-call-recordings" },
    bindings: { SESSION_SECRET },
    serviceBindings: { ASSETS: () => new Response("Not found", { status: 404 }) },
  });

  const db = await mf.getD1Database("DB");
  const recordings = await mf.getR2Bucket("CALL_RECORDINGS");
  if (migrate) for (const s of INIT_SQL) await db.prepare(s).run();
  if (migrate && seed) for (const s of SEED_SQL) await db.prepare(s).run();

  const get = (pathname, identity) =>
    mf.dispatchFetch(`http://localhost${pathname}`, {
      redirect: "manual",
      headers: {
        accept: "text/html",
        ...identityHeaders(identity),
      },
    });

  const audit = async () =>
    (
      await db
        .prepare("SELECT actor_email, actor_role, action, decision, reason FROM audit_events ORDER BY id")
        .all()
    ).results;

  const addMember = (email, role, status = "active", subjectId = null) =>
    db
      .prepare(
        "INSERT INTO portal_members (email, subject_id, display_name, role, status, granted_by) VALUES (?, ?, ?, ?, ?, 'test')",
      )
      .bind(email, subjectId, email.split("@")[0], role, status)
      .run();

  return { mf, db, recordings, get, audit, addMember, dispose: () => mf.dispose() };
}

test("an unmigrated database never serves portal content", async () => {
  // The binding exists but no tables do — a real state between provisioning
  // D1 and applying 0001. Membership cannot be verified, so nothing may render.
  const portal = await startPortal({ migrate: false });
  try {
    const response = await portal.get("/portal", {
      subject: "subject-x",
      email: "someone@example.com",
    });
    // Assert the actual contract, not merely "not 200". The looser form
    // accepted an HTTP 500 — which is precisely what the portal was doing:
    // an unhandled missing-table error on every route, rather than a refusal.
    assert.equal(response.status, 307, `expected a redirect, got ${response.status}`);
    assert.match(
      response.headers.get("location") ?? "",
      /\/portal\/no-access$/,
      "must route to the explanation page",
    );
    const body = await response.text();
    assert.equal(body, "", "must not emit a body");
  } finally {
    await portal.dispose();
  }
});

test("a seeded owner signs in, binds their subject, and is audited", async () => {
  const portal = await startPortal();
  try {
    const before = await portal.db
      .prepare("SELECT subject_id FROM portal_members WHERE email = ?")
      .bind(SEEDED_OWNER_EMAIL)
      .first();
    assert.equal(before.subject_id, null, "seed must leave subject_id unbound");

    const response = await portal.get("/portal", {
      subject: "subject-owner-1",
      email: SEEDED_OWNER_EMAIL,
    });
    assert.equal(response.status, 200);

    const html = await response.text();
    assert.match(html, /Capabilities held/);
    assert.match(html, /members\.manage/, "owner holds the full capability set");
    assert.match(html, /Leadership view/, "owner sees leadership panel");

    const after = await portal.db
      .prepare("SELECT subject_id, last_seen_at FROM portal_members WHERE email = ?")
      .bind(SEEDED_OWNER_EMAIL)
      .first();
    assert.equal(after.subject_id, "subject-owner-1", "subject binds on first sign-in");
    assert.ok(after.last_seen_at, "last_seen_at recorded");

    const rows = await portal.audit();
    assert.ok(
      rows.some((r) => r.action === "members.bind_subject" && r.reason === "first_sign_in"),
      "first sign-in is recorded",
    );
    assert.ok(
      rows.some((r) => r.decision === "allow" && r.reason === "active_member"),
      "the allow is recorded",
    );
  } finally {
    await portal.dispose();
  }
});

test("subject binding happens once, not on every sign-in", async () => {
  const portal = await startPortal();
  try {
    const identity = { subject: "subject-owner-1", email: SEEDED_OWNER_EMAIL };
    await (await portal.get("/portal", identity)).text();
    await (await portal.get("/portal", identity)).text();

    const binds = (await portal.audit()).filter((r) => r.action === "members.bind_subject");
    assert.equal(binds.length, 1, "subject must bind exactly once across two sign-ins");
  } finally {
    await portal.dispose();
  }
});

test("a stranger who signs in successfully is still refused", async () => {
  // The central design claim: identity alone grants nothing.
  const portal = await startPortal();
  try {
    const response = await portal.get("/portal", {
      subject: "subject-stranger",
      email: "stranger@example.com",
    });
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/portal\/no-access/);

    const rows = await portal.audit();
    assert.ok(
      rows.some((r) => r.decision === "deny" && r.reason === "not_a_member"),
      "the refusal is recorded",
    );
  } finally {
    await portal.dispose();
  }
});

test("a different subject cannot take over an existing member's email", async () => {
  const portal = await startPortal();
  try {
    const identity = { subject: "subject-owner-1", email: SEEDED_OWNER_EMAIL };
    await (await portal.get("/portal", identity)).text();

    const response = await portal.get("/portal", {
      subject: "subject-attacker",
      email: SEEDED_OWNER_EMAIL,
    });
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /\/portal\/no-access/);

    const rows = await portal.audit();
    assert.ok(
      rows.some((r) => r.decision === "deny" && r.reason === "subject_conflict"),
      "the conflict is recorded",
    );

    const row = await portal.db
      .prepare("SELECT subject_id FROM portal_members WHERE email = ?")
      .bind(SEEDED_OWNER_EMAIL)
      .first();
    assert.equal(row.subject_id, "subject-owner-1", "the original binding survives");
  } finally {
    await portal.dispose();
  }
});

test("a suspended member is refused", async () => {
  const portal = await startPortal();
  try {
    await portal.addMember("suspended@example.com", "agent", "suspended");
    const response = await portal.get("/portal", {
      subject: "subject-suspended",
      email: "suspended@example.com",
    });
    assert.equal(response.status, 307);

    const rows = await portal.audit();
    assert.ok(
      rows.some((r) => r.decision === "deny" && r.reason === "status_suspended"),
      "the suspension is recorded",
    );
  } finally {
    await portal.dispose();
  }
});

test("capabilities are enforced per role, not merely displayed", async () => {
  const portal = await startPortal();
  try {
    await portal.addMember("agent@example.com", "agent");
    const identity = { subject: "subject-agent", email: "agent@example.com" };

    const dashboard = await portal.get("/portal", identity);
    assert.equal(dashboard.status, 200, "agent holds dashboard.view.self");
    const html = await dashboard.text();
    assert.doesNotMatch(html, /Leadership view/, "agent must not see leadership panel");

    for (const guarded of ["/portal/audit", "/portal/members"]) {
      const response = await portal.get(guarded, identity);
      assert.equal(response.status, 307, `agent must be refused ${guarded}`);
      assert.match(response.headers.get("location") ?? "", /\/portal\/no-access/);
      assert.equal(await response.text(), "", `${guarded} must emit no body`);
    }

    const rows = await portal.audit();
    assert.ok(
      rows.some((r) => r.decision === "deny" && r.reason === "capability_not_held"),
      "capability refusals are recorded",
    );
  } finally {
    await portal.dispose();
  }
});

test("a manager reads the roster and the audit log, but not the founder console", async () => {
  const portal = await startPortal();
  try {
    await portal.addMember("manager@example.com", "manager");
    const identity = { subject: "subject-manager", email: "manager@example.com" };

    const roster = await portal.get("/portal/members", identity);
    assert.equal(roster.status, 200, "manager holds members.view");
    const html = await roster.text();
    assert.match(html, new RegExp(SEEDED_OWNER_EMAIL.replace(".", "\\.")), "roster lists members");
    assert.match(html, /cannot change it/, "manager is told they lack members.manage");

    // The audit log is founder-only (owner's order, 2026-08-15): a manager —
    // and every other role — is refused regardless of capabilities.
    const audit = await portal.get("/portal/audit", identity);
    assert.equal(audit.status, 307, "the audit log answers only the founder");
  } finally {
    await portal.dispose();
  }
});

test("the INVESTIGATOR console answers the seeded founder identity and no one else", async () => {
  const portal = await startPortal();
  try {
    // A second owner — every capability, but NOT the founder identity.
    await portal.addMember("second-owner@example.com", "owner");
    const otherOwner = { subject: "sub-owner-2", email: "second-owner@example.com" };
    const denied = await portal.get("/portal/investigator", otherOwner);
    assert.equal(denied.status, 307, "a non-founder owner is refused");
    assert.match(
      denied.headers.get("location") ?? "",
      /\/portal\/no-access$/,
      "refusal routes to the explanation page",
    );

    // The founder-only rule covers the audit log too: a second owner with
    // every capability is still refused there.
    const auditDenied = await portal.get("/portal/audit", otherOwner);
    assert.equal(auditDenied.status, 307, "a non-founder owner cannot read the audit log");

    // The seeded founder (bankerrunners@gmail.com) is admitted to both.
    const founder = { subject: "sub-founder", email: SEEDED_OWNER_EMAIL };
    const ok = await portal.get("/portal/investigator", founder);
    assert.equal(ok.status, 200, "the founder identity is admitted");
    const auditOk = await portal.get("/portal/audit", founder);
    assert.equal(auditOk.status, 200, "the founder reads the audit log");

    const rows = await portal.audit();
    assert.ok(
      rows.some((r) => r.reason === "founder_only" && r.decision === "deny"),
      "the refusal is audited by name",
    );
  } finally {
    await portal.dispose();
  }
});

test("Dialer Beta lists transferred calls and gates protected recording playback", async () => {
  const portal = await startPortal();
  try {
    await portal.addMember("reviewer@example.com", "reviewer");
    await portal.addMember("agent-calls@example.com", "agent");
    await portal.db
      .prepare(
        `INSERT INTO dialer_transfers
          (transfer_id, source_system, direction, status, consent_status,
           caller_number_masked, agent_email, queue_name, duration_seconds,
           recording_object_key, recording_mime_type)
         VALUES (?, 'test-dialer', 'inbound', 'ready', 'verified', ?, ?, ?, 83, ?, 'audio/mpeg')`,
      )
      .bind(
        "transfer-test-001",
        "(***) ***-0142",
        "reviewer@example.com",
        "Inbound transfer",
        "calls/transfer-test-001.mp3",
      )
      .run();
    await portal.recordings.put(
      "calls/transfer-test-001.mp3",
      new Uint8Array([73, 68, 51, 4]),
      { httpMetadata: { contentType: "audio/mpeg" } },
    );

    const reviewer = { subject: "subject-reviewer", email: "reviewer@example.com" };
    const page = await portal.get("/portal/calls", reviewer);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Dialer transfer/);
    assert.match(html, /transfer-test-001/);
    assert.match(html, /Open recording/);

    const recording = await portal.get("/portal/calls/recording?id=1", reviewer);
    assert.equal(recording.status, 200);
    assert.equal(recording.headers.get("content-type"), "audio/mpeg");
    // A recording is consent- AND capability-gated on every request. It must
    // never be HTTP-cacheable: a stored copy would replay past a later consent
    // revocation or capability loss without the worker re-running either gate.
    assert.match(
      recording.headers.get("cache-control") ?? "",
      /no-store/,
      "call recordings must be no-store — a cacheable copy bypasses the consent and capability re-check",
    );
    assert.deepEqual(new Uint8Array(await recording.arrayBuffer()), new Uint8Array([73, 68, 51, 4]));

    const refused = await portal.get("/portal/calls/recording?id=1", {
      subject: "subject-agent-calls",
      email: "agent-calls@example.com",
    });
    assert.equal(refused.status, 403, "an agent without calls.review cannot open a recording");
  } finally {
    await portal.dispose();
  }
});

test("the audit page renders real recorded events for an owner", async () => {
  const portal = await startPortal();
  try {
    const identity = { subject: "subject-owner-1", email: SEEDED_OWNER_EMAIL };
    await (await portal.get("/portal", identity)).text();

    const response = await portal.get("/portal/audit", identity);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /active_member/, "recorded reasons are displayed");
    assert.doesNotMatch(html, /No events recorded/);
  } finally {
    await portal.dispose();
  }
});

test("the database rejects a role the application does not recognise", async () => {
  // Defence in depth: the CHECK constraint stops an unknown role reaching the
  // row at all, so invalid_role can only ever arise from a pre-existing row.
  const portal = await startPortal();
  try {
    await assert.rejects(
      () => portal.addMember("bad@example.com", "superuser"),
      "CHECK constraint must reject an unknown role",
    );
  } finally {
    await portal.dispose();
  }
});

/* ============================================================
   THRIVE Radio — upload, list, stream, delete.

   These exercise the real R2 binding in Miniflare. The security
   property that matters most is the last one: the music routes
   share a bucket with call recordings, so a key outside the
   music/ prefix must be refused. If that ever regresses, a
   member could read a recording without passing the consent gate.
   ============================================================ */

/** A tiny but structurally valid payload. Content is irrelevant to these routes. */
function audioBytes(seed = "core") {
  return new Uint8Array([0x49, 0x44, 0x33, 0x04, ...Buffer.from(seed)]);
}

function multipart(parts) {
  // Build the body by hand. Miniflare does not derive a Content-Type boundary
  // from a FormData body, so the worker sees a POST it cannot parse and
  // request.formData() throws. Constructing the body explicitly is what a real
  // browser sends, and it is what this route must handle.
  const CRLF = "\r\n";
  const boundary = "----thriveboundary" + parts.length + "x" + parts[0].name.length;
  const enc = new TextEncoder();
  const chunks = [];

  for (const part of parts) {
    chunks.push(enc.encode("--" + boundary + CRLF));
    if (part.filename !== undefined) {
      chunks.push(
        enc.encode(
          'Content-Disposition: form-data; name="' +
            part.name +
            '"; filename="' +
            part.filename +
            '"' +
            CRLF +
            "Content-Type: " +
            (part.type || "application/octet-stream") +
            CRLF +
            CRLF,
        ),
      );
      chunks.push(part.data);
    } else {
      chunks.push(
        enc.encode('Content-Disposition: form-data; name="' + part.name + '"' + CRLF + CRLF),
      );
      chunks.push(enc.encode(String(part.value)));
    }
    chunks.push(enc.encode(CRLF));
  }
  chunks.push(enc.encode("--" + boundary + "--" + CRLF));

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const body = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    body.set(c, at);
    at += c.length;
  }

  return { body, contentType: "multipart/form-data; boundary=" + boundary };
}

function uploadRequest(portal, identity, filename, fields = {}) {
  const parts = [{ name: "file", filename, type: "audio/mpeg", data: audioBytes(filename) }];
  for (const [name, value] of Object.entries(fields)) parts.push({ name, value });

  const { body, contentType } = multipart(parts);

  return portal.mf.dispatchFetch("http://localhost/portal/music/upload", {
    method: "POST",
    body,
    redirect: "manual",
    headers: {
      "content-type": contentType,
      ...identityHeaders(identity),
    },
  });
}

function jsonGet(portal, pathname, identity) {
  return portal.mf.dispatchFetch(`http://localhost${pathname}`, {
    redirect: "manual",
    headers: identityHeaders(identity),
  });
}

test("anonymous visitors cannot upload or list music", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  const upload = await uploadRequest(portal, null, "anon.mp3");
  assert.equal(upload.status, 401, "anonymous upload must be refused");

  const list = await jsonGet(portal, "/portal/music/list", null);
  assert.equal(list.status, 401, "anonymous list must be refused");
});

test("a member without members.manage cannot upload, and the refusal is audited", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("agent@example.com", "agent");

  const res = await uploadRequest(
    portal,
    { subject: "sub-agent", email: "agent@example.com" },
    "agent-track.mp3",
  );
  assert.equal(res.status, 403, "an agent must not be able to upload");

  const rows = await portal.audit();
  const deny = rows.find((r) => r.action === "music.upload" && r.decision === "deny");
  assert.ok(deny, "the refused upload must be audited");
  assert.equal(deny.reason, "capability_not_held");
  assert.equal(deny.actor_role, "agent");
});

test("an owner uploads a track, and every member can list and play it", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("owner@example.com", "owner");
  await portal.addMember("support@example.com", "support");

  const owner = { subject: "sub-owner", email: "owner@example.com" };
  const upload = await uploadRequest(portal, owner, "Crystalize Radio Edit.MP3", {
    title: "Crystalize",
    artist: "Lexurus",
  });

  // Read the body once: consuming it for the failure message and then again
  // for the payload throws "Body has already been read".
  const uploadBody = await upload.text();
  assert.equal(upload.status, 201, uploadBody);
  const created = JSON.parse(uploadBody);
  assert.equal(created.key, "music/crystalize-radio-edit.mp3", "filename must be normalised");

  // It really is in the bucket, under the music prefix.
  const stored = await portal.recordings.get(created.key);
  assert.ok(stored, "object must exist in R2");

  // The upload is attributable.
  const rows = await portal.audit();
  const allow = rows.find((r) => r.action === "music.upload" && r.decision === "allow");
  assert.ok(allow, "the upload must be audited");
  assert.equal(allow.actor_email, "owner@example.com");

  // Support holds dashboard.view.self but not members.manage: can listen, cannot upload.
  const support = { subject: "sub-support", email: "support@example.com" };

  const list = await jsonGet(portal, "/portal/music/list", support);
  assert.equal(list.status, 200);
  const body = await list.json();
  assert.equal(body.tracks.length, 1);
  assert.equal(body.tracks[0].title, "Crystalize");
  assert.equal(body.tracks[0].artist, "Lexurus");

  const play = await jsonGet(
    portal,
    `/portal/music/track?key=${encodeURIComponent(created.key)}`,
    support,
  );
  assert.equal(play.status, 200, "a member must be able to stream");
  assert.match(play.headers.get("content-type") ?? "", /^audio\//);
  // Member audio must never be HTTP-cacheable. A stored copy answers the next
  // request without the worker re-resolving the session or the member's row —
  // the exact boundary public/sw.js excludes /portal to protect, arriving one
  // layer up through the HTTP cache. `max-age` here would keep a suspended
  // member's browser serving audio their membership no longer entitles them to.
  assert.match(
    play.headers.get("cache-control") ?? "",
    /no-store/,
    "member audio must be no-store — a cacheable copy bypasses the membership re-check",
  );

  const supportUpload = await uploadRequest(portal, support, "nope.mp3");
  assert.equal(supportUpload.status, 403, "support must not be able to upload");
});

test("the music routes cannot be used to read a call recording", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("owner@example.com", "owner");
  const owner = { subject: "sub-owner", email: "owner@example.com" };

  // Put an object outside the music prefix, exactly where a recording lives.
  await portal.recordings.put("recordings/secret-call.mp3", audioBytes("secret"));

  for (const key of [
    "recordings/secret-call.mp3",
    "music/../recordings/secret-call.mp3",
    "MUSIC/secret.mp3",
    "music/",
  ]) {
    const res = await jsonGet(
      portal,
      `/portal/music/track?key=${encodeURIComponent(key)}`,
      owner,
    );
    assert.equal(res.status, 400, `key "${key}" must be refused, got ${res.status}`);
  }

  // And the refusal is recorded.
  const rows = await portal.audit();
  assert.ok(
    rows.some((r) => r.action === "music.play" && r.decision === "deny"),
    "an out-of-prefix key must be audited as a denial",
  );

  // The listing must not surface it either.
  const list = await jsonGet(portal, "/portal/music/list", owner);
  const body = await list.json();
  assert.equal(body.tracks.length, 0, "a non-music object must never appear in the library");
});

test("a track larger than 1 MB uploads — the framework limit does not decide", async (t) => {
  // vinext classifies any multipart POST without an action id as a progressive
  // Server Action and enforces experimental.serverActions.bodySizeLimit before
  // the route handler runs. At its 1 MB default that rejected ordinary tracks
  // with a plain-text 413 the client could not parse, so the browser reported
  // a JSON syntax error and the real cause stayed hidden.
  //
  // next.config.ts raises the limit to match MAX_UPLOAD_BYTES. This asserts a
  // payload well past the old ceiling reaches the route, so that if the two
  // ever drift apart again the suite says so instead of the interface.
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("owner@example.com", "owner");
  const owner = { subject: "sub-owner", email: "owner@example.com" };

  const parts = [{
    name: "file",
    filename: "long-track.mp3",
    type: "audio/mpeg",
    data: new Uint8Array(3 * 1024 * 1024).fill(0x55),
  }];
  const { body, contentType } = multipart(parts);

  const res = await portal.mf.dispatchFetch("http://localhost/portal/music/upload", {
    method: "POST",
    body,
    redirect: "manual",
    headers: { "content-type": contentType, ...identityHeaders(owner) },
  });

  const text = await res.text();
  assert.notEqual(res.status, 413, `3 MB upload was refused as too large: ${text}`);
  assert.equal(res.status, 201, text);
  assert.equal(JSON.parse(text).size, 3 * 1024 * 1024);
});

test("unsupported and empty files are refused", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("owner@example.com", "owner");
  const owner = { subject: "sub-owner", email: "owner@example.com" };

  const exe = await uploadRequest(portal, owner, "payload.exe");
  assert.equal(exe.status, 415, "a non-audio extension must be refused");

  const noExt = await uploadRequest(portal, owner, "trackwithoutextension");
  assert.equal(noExt.status, 415, "a file with no extension must be refused");

  const emptyPayload = multipart([
    { name: "file", filename: "empty.mp3", type: "audio/mpeg", data: new Uint8Array(0) },
  ]);
  const res = await portal.mf.dispatchFetch("http://localhost/portal/music/upload", {
    method: "POST",
    body: emptyPayload.body,
    redirect: "manual",
    headers: {
      "content-type": emptyPayload.contentType,
      ...identityHeaders(owner),
    },
  });
  assert.equal(res.status, 400, "an empty file must be refused");
});

test("an owner can remove a track", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("owner@example.com", "owner");
  const owner = { subject: "sub-owner", email: "owner@example.com" };

  const upload = await uploadRequest(portal, owner, "temp.mp3");
  const { key } = await upload.json();

  const del = await portal.mf.dispatchFetch(
    `http://localhost/portal/music/upload?key=${encodeURIComponent(key)}`,
    {
      method: "DELETE",
      redirect: "manual",
      headers: identityHeaders(owner),
    },
  );
  assert.equal(del.status, 200);
  assert.equal(await portal.recordings.get(key), null, "the object must be gone from R2");
});


/* ============================================================
   Session integrity.

   Identity used to come from oai-authenticated-user-* headers
   that the Sites hosting platform injected and stripped from
   outside requests. Self-hosted there is no such platform, so
   anyone could send those headers. These tests pin down that a
   request is identified ONLY by a session cookie signed under
   this deployment's SESSION_SECRET.
   ============================================================ */

test("the retired platform identity headers grant nothing", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  // Exactly the request that would have impersonated the owner before.
  const response = await portal.mf.dispatchFetch("http://localhost/portal", {
    redirect: "manual",
    headers: {
      accept: "text/html",
      "oai-authenticated-user-id": "subject-owner-1",
      "oai-authenticated-user-email": SEEDED_OWNER_EMAIL,
    },
  });

  assert.equal(response.status, 307, "header-asserted identity must be anonymous");
  assert.match(
    response.headers.get("location") ?? "",
    /\/auth\/signin\?/,
    "an anonymous visitor is sent to sign-in",
  );

  const rows = await portal.audit();
  assert.ok(
    rows.some((r) => r.decision === "deny" && r.reason === "anonymous"),
    "the refusal must be recorded as anonymous, not as the impersonated member",
  );
});

test("a forged, tampered, or expired session cookie is anonymous", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  const owner = { subject: "subject-owner-1", email: SEEDED_OWNER_EMAIL };
  const valid = mintSessionToken(owner);

  // Signed under the wrong secret; payload otherwise perfect.
  const forged = mintSessionToken(owner, { secret: "not-the-deployment-secret" });
  // Correct signature, payload altered afterwards.
  const [, payload, mac] = valid.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({
      ...JSON.parse(Buffer.from(payload, "base64url").toString()),
      email: "attacker@example.com",
    }),
  ).toString("base64url");
  const tampered = `v1.${tamperedPayload}.${mac}`;
  // Correctly signed but past its expiry.
  const expired = mintSessionToken(owner, { expiresInSeconds: -60 });

  for (const [label, token] of [
    ["forged", forged],
    ["tampered", tampered],
    ["expired", expired],
    ["garbage", "v1.not-even-a-token"],
  ]) {
    const response = await portal.mf.dispatchFetch("http://localhost/portal", {
      redirect: "manual",
      headers: { accept: "text/html", cookie: `core_session=${token}` },
    });
    assert.equal(response.status, 307, `a ${label} cookie must be anonymous`);
    assert.match(
      response.headers.get("location") ?? "",
      /\/auth\/signin\?/,
      `a ${label} cookie must route to sign-in`,
    );
  }

  // The control: the valid token this suite mints does admit the owner, so
  // the refusals above are the signature check working, not a broken helper.
  const control = await portal.get("/portal", owner);
  assert.equal(control.status, 200, "the control cookie must be accepted");
});

/* ============================================================
   Membership writes.

   These are the actions that decide who reaches the portal at
   all, so the interface is never what stops them — the route
   re-resolves the session and asserts members.manage on every
   request. The last two tests guard invariants whose failure
   locks everyone out permanently, recoverable only through
   direct database access.
   ============================================================ */

function manage(portal, identity, body) {
  return portal.mf.dispatchFetch("http://localhost/portal/members/manage", {
    method: "POST",
    body: JSON.stringify(body),
    redirect: "manual",
    headers: { "content-type": "application/json", ...identityHeaders(identity) },
  });
}

test("membership writes are refused without members.manage", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("manager@example.com", "manager");
  await portal.addMember("target@example.com", "agent");

  // A manager holds members.view — the roster is visible to them — but not
  // members.manage. Reading the list must not imply changing it.
  const res = await manage(portal, { subject: "sub-mgr", email: "manager@example.com" }, {
    action: "role",
    email: "target@example.com",
    role: "owner",
  });
  assert.equal(res.status, 403, await res.text());

  const row = await portal.db
    .prepare("SELECT role FROM portal_members WHERE email = ?")
    .bind("target@example.com")
    .first();
  assert.equal(row.role, "agent", "the role must be untouched");

  const anon = await portal.mf.dispatchFetch("http://localhost/portal/members/manage", {
    method: "POST",
    body: JSON.stringify({ action: "grant", email: "x@example.com", role: "owner" }),
    redirect: "manual",
    headers: { "content-type": "application/json" },
  });
  assert.equal(anon.status, 401, "anonymous callers get nothing");

  const rows = await portal.audit();
  assert.ok(
    rows.some((r) => r.action === "members.manage" && r.decision === "deny"),
    "the refusal must be recorded",
  );
});

test("an owner grants access, and the grant is audited", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  const owner = { subject: "sub-owner-1", email: SEEDED_OWNER_EMAIL };
  const res = await manage(portal, owner, {
    action: "grant",
    email: "  NewPerson@Example.COM ",
    displayName: "New Person",
    role: "agent",
  });
  assert.equal(res.status, 201, await res.text());

  const row = await portal.db
    .prepare("SELECT email, role, status, granted_by FROM portal_members WHERE email = ?")
    .bind("newperson@example.com")
    .first();
  assert.ok(row, "the address must be stored lowercased and trimmed");
  assert.equal(row.role, "agent");
  assert.equal(row.status, "active");
  assert.equal(row.granted_by, SEEDED_OWNER_EMAIL);

  // Granting the same address twice must not create a second row — two rows
  // for one person is the identity_ambiguous state the portal refuses.
  const again = await manage(portal, owner, {
    action: "grant",
    email: "newperson@example.com",
    role: "owner",
  });
  assert.equal(again.status, 409);

  const rows = await portal.audit();
  assert.ok(
    rows.some((r) => r.action === "members.grant" && r.decision === "allow"),
    "the grant must be audited",
  );
});

test("nobody changes their own role or status", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("admin@example.com", "admin");
  const admin = { subject: "sub-admin", email: "admin@example.com" };

  const promote = await manage(portal, admin, {
    action: "role",
    email: "admin@example.com",
    role: "owner",
  });
  assert.equal(promote.status, 409, "self-promotion must be refused");

  const revoke = await manage(portal, admin, {
    action: "status",
    email: "admin@example.com",
    status: "revoked",
  });
  assert.equal(revoke.status, 409, "self-revocation must be refused");

  const row = await portal.db
    .prepare("SELECT role, status FROM portal_members WHERE email = ?")
    .bind("admin@example.com")
    .first();
  assert.equal(row.role, "admin");
  assert.equal(row.status, "active");
});

test("owner rows are peer-protected: nobody changes an owner from the portal", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  // Several active owners is the live roster shape. Without this rule any
  // one of them could suspend the rest and hold the portal alone — which
  // also covers the older last-active-owner case, since no owner can be
  // demoted or suspended here at all. Changing an owner is a
  // database-console operation by design (governance note 4).
  await portal.addMember("second-owner@example.com", "owner");
  await portal.addMember("admin@example.com", "admin");
  await portal.addMember("agent@example.com", "agent");
  const actor = { subject: "sub-owner-1", email: SEEDED_OWNER_EMAIL };
  const admin = { subject: "sub-admin", email: "admin@example.com" };

  // An owner against a fellow owner: role and status, both refused.
  const demote = await manage(portal, actor, {
    action: "role",
    email: "second-owner@example.com",
    role: "manager",
  });
  assert.equal(demote.status, 409, "an owner must not demote another owner");

  const suspend = await manage(portal, actor, {
    action: "status",
    email: "second-owner@example.com",
    status: "suspended",
  });
  assert.equal(suspend.status, 409, "an owner must not suspend another owner");

  // An administrator against an owner: refused the same way.
  const adminDemote = await manage(portal, admin, {
    action: "role",
    email: SEEDED_OWNER_EMAIL,
    role: "agent",
  });
  assert.equal(adminDemote.status, 409, "an admin must not demote an owner");

  const adminRevoke = await manage(portal, admin, {
    action: "status",
    email: "second-owner@example.com",
    status: "revoked",
  });
  assert.equal(adminRevoke.status, 409, "an admin must not revoke an owner");

  for (const target of [SEEDED_OWNER_EMAIL, "second-owner@example.com"]) {
    const row = await portal.db
      .prepare("SELECT role, status FROM portal_members WHERE email = ?")
      .bind(target)
      .first();
    assert.equal(row.role, "owner", `${target} survives with role intact`);
    assert.equal(row.status, "active", `${target} survives with status intact`);
  }

  // Four refusals above → four audit rows. `some()` would let a regression
  // that audits only the first refusal pass unnoticed.
  const rows = await portal.audit();
  const denies = rows.filter(
    (r) => r.reason === "owner_peer_protected" && r.decision === "deny",
  );
  assert.equal(denies.length, 4, "every refusal must be audited by name");

  // The control: the same actor changing a non-owner row still works, so the
  // refusals above are the peer protection, not a broken route.
  const control = await manage(portal, actor, {
    action: "role",
    email: "agent@example.com",
    role: "manager",
  });
  assert.equal(control.status, 200, await control.text());
});

/* ============================================================
   The JARVIS Presence.

   The pet's whole safety story is that its route is just another
   guarded portal route: anonymous callers get nothing, suspended
   members get nothing, and with no ANTHROPIC_API_KEY configured it
   fails closed with an honest 503 — audited — instead of faking an
   answer. Miniflare has no key, which makes the closed path the
   testable one.
   ============================================================ */

test("the presence is guarded and fails closed without its key", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  // Anonymous: refused before anything else happens.
  const anon = await portal.mf.dispatchFetch("http://localhost/portal/presence", {
    method: "POST",
    body: JSON.stringify({ question: "hi" }),
    redirect: "manual",
    headers: { "content-type": "application/json" },
  });
  assert.equal(anon.status, 401, "anonymous callers get nothing");

  // Suspended member: refused.
  await portal.addMember("benched@example.com", "agent", "suspended");
  const suspended = await portal.mf.dispatchFetch("http://localhost/portal/presence", {
    method: "POST",
    body: JSON.stringify({ question: "hi" }),
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      ...identityHeaders({ subject: "sub-benched", email: "benched@example.com" }),
    },
  });
  assert.equal(suspended.status, 403, "suspended members get nothing");

  // Active member, no key configured: honest 503, never a fabricated answer.
  await portal.addMember("asker@example.com", "agent");
  const res = await portal.mf.dispatchFetch("http://localhost/portal/presence", {
    method: "POST",
    body: JSON.stringify({ question: "What is THRIVE?" }),
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      ...identityHeaders({ subject: "sub-asker", email: "asker@example.com" }),
    },
  });
  // Read the body exactly once — a Response body is a one-shot stream, and
  // consuming it inside an assertion message eats it before the real check.
  const body = await res.json().catch(() => ({}));
  assert.equal(res.status, 503, JSON.stringify(body));
  assert.match(
    String(body.error ?? ""),
    /not connected/i,
    "the refusal says the truth: the key is not set",
  );

  const rows = await portal.audit();
  assert.ok(
    rows.some(
      (r) =>
        r.action === "pet.chat" &&
        r.decision === "deny" &&
        r.reason === "presence_not_configured",
    ),
    "the closed path is audited by name",
  );
});

test("the presence daily cap counts spend events only, and trips at the boundary", async (t) => {
  // The cap query must count answers (presence_answered / presence_refused),
  // NOT the capability_granted allow row assertCapability writes on every
  // request — counting those double-books each answer and silently halves
  // the cap. This test pins both sides of that line: grant rows are free,
  // spend rows are not, and the 40th spend row closes the gate.
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("chatty@example.com", "agent");
  const identity = { subject: "sub-chatty", email: "chatty@example.com" };

  const seedAudit = (reason, n) =>
    Promise.all(
      Array.from({ length: n }, () =>
        portal.db
          .prepare(
            "INSERT INTO audit_events (actor_email, actor_role, action, decision, reason, resource) VALUES (?, 'agent', 'pet.chat', 'allow', ?, 'presence')",
          )
          .bind("chatty@example.com", reason)
          .run(),
      ),
    );

  // 39 real answers today, plus a pile of capability_granted rows that must
  // NOT count. If the filter regresses, these 40 grant rows alone trip the cap.
  await seedAudit("presence_answered", 39);
  await seedAudit("capability_granted", 40);

  const ask = () =>
    portal.mf.dispatchFetch("http://localhost/portal/presence", {
      method: "POST",
      body: JSON.stringify({ question: "one more?" }),
      redirect: "manual",
      headers: { "content-type": "application/json", ...identityHeaders(identity) },
    });

  // At 39 spend rows the request must get PAST the cap — Miniflare has no
  // API key, so passing the cap shows up as the honest 503, never a 429.
  const under = await ask();
  assert.equal(under.status, 503, "at 39 answers the cap must not trip (grant rows are free)");

  // The 40th spend row closes the gate.
  await seedAudit("presence_answered", 1);
  const over = await ask();
  const overBody = await over.json().catch(() => ({}));
  assert.equal(over.status, 429, JSON.stringify(overBody));

  const rows = await portal.audit();
  assert.ok(
    rows.some(
      (r) => r.action === "pet.chat" && r.decision === "deny" && r.reason === "presence_daily_cap",
    ),
    "the cap refusal is audited by name",
  );
});

test("a recording without verified consent is refused, byteless, and the refusal audited", async (t) => {
  // The all-party consent gate is the load-bearing telephony control; until
  // this test existed, deleting the gate left the whole suite green. Both
  // 409 branches are pinned: consent not verified, and not-ready.
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("reviewer2@example.com", "reviewer");
  const reviewer = { subject: "sub-reviewer2", email: "reviewer2@example.com" };

  const insertTransfer = (transferId, status, consent, objectKey) =>
    portal.db
      .prepare(
        `INSERT INTO dialer_transfers
          (transfer_id, source_system, direction, status, consent_status,
           caller_number_masked, agent_email, queue_name, duration_seconds,
           recording_object_key, recording_mime_type)
         VALUES (?, 'test-dialer', 'inbound', ?, ?, '(***) ***-0007', 'reviewer2@example.com', 'Q', 10, ?, 'audio/mpeg')`,
      )
      .bind(transferId, status, consent, objectKey)
      .run();

  // Recording exists and is ready — but consent is only pending.
  await insertTransfer("transfer-consent-pending", "ready", "pending", "calls/pending.mp3");
  await portal.recordings.put("calls/pending.mp3", new Uint8Array([1, 2, 3, 4]));

  const denied = await portal.get("/portal/calls/recording?id=1", reviewer);
  const deniedBody = await denied.text();
  assert.equal(denied.status, 409, "unverified consent must refuse an entitled reviewer");
  assert.match(deniedBody, /consent/i, "the refusal names consent");
  assert.doesNotMatch(deniedBody, /[\u0001\u0002]/, "no audio bytes may leak");

  // Verified consent but the recording is not ready: the parallel 409.
  await insertTransfer("transfer-not-ready", "processing", "verified", null);
  const notReady = await portal.get("/portal/calls/recording?id=2", reviewer);
  assert.equal(notReady.status, 409, "an unready recording is refused");

  const rows = await portal.audit();
  assert.ok(
    rows.some(
      (r) =>
        r.action === "calls.recording.open" &&
        r.decision === "deny" &&
        r.reason === "consent_not_verified",
    ),
    "every deny is audited — the consent refusal included",
  );
});

test("leadership economics refuse every role that lacks leadership.view.all", async (t) => {
  // Pay-rate economics arrive as server-rendered props, so this guard is the
  // one most exposed to a silent capability-string regression: if either page
  // ever asserted a capability every role holds, an agent would read full
  // rank economics in the SSR HTML and only this test would notice.
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.addMember("field-agent@example.com", "agent");
  const identity = { subject: "sub-field-agent", email: "field-agent@example.com" };

  for (const guarded of ["/portal/leadership", "/portal/pay-rates"]) {
    const response = await portal.get(guarded, identity);
    assert.equal(response.status, 307, `an agent must be refused ${guarded}`);
    assert.match(response.headers.get("location") ?? "", /\/portal\/no-access/);
    assert.equal(await response.text(), "", `${guarded} must emit no body to a refused role`);
  }

  const denies = (await portal.audit()).filter(
    (r) =>
      r.actor_email === "field-agent@example.com" &&
      r.decision === "deny" &&
      r.reason === "capability_not_held",
  );
  assert.equal(denies.length, 2, "both refusals are audited, one row each");
});

test("the INVESTIGATOR console refuses anonymous visitors toward sign-in", async (t) => {
  // requireFounder pages were invisible to the anonymous-refusal completeness
  // scan (it only matched requireCapability) — this pins the anonymous path
  // for the one founder page the hand-kept list had missed.
  const portal = await startPortal();
  t.after(portal.dispose);

  const response = await portal.get("/portal/investigator");
  assert.equal(response.status, 307, "anonymous callers are redirected, never rendered");
  assert.match(
    response.headers.get("location") ?? "",
    /\/auth\/signin\?return_to=%2Fportal%2Finvestigator/,
    "an anonymous visitor is sent to sign-in with a return path, not no-access",
  );
  assert.equal(await response.text(), "", "no body leaks");
});

/* ============================================================
   Identity resolution.

   Both keys are unique, so a lookup by subject and a lookup by
   email each return at most one row — but they can return two
   DIFFERENT rows. The previous single or(email, subject) query
   with limit(1) and no ordering resolved that arbitrarily.
   ============================================================ */

test("subject binding wins when the provider address has changed", async (t) => {
  const portal = await startPortal({ seed: false });
  t.after(portal.dispose);

  // One membership, already bound, whose recorded address is now stale.
  await portal.addMember("old-address@example.com", "manager", "active", "subject-stable");

  const response = await portal.get("/portal", {
    subject: "subject-stable",
    email: "new-address@example.com",
  });

  assert.equal(response.status, 200, "the bound subject is the person's identity");

  const rows = await portal.audit();
  const allow = rows.find((r) => r.action === "portal.access" && r.decision === "allow");
  assert.ok(allow, "the sign-in must be audited");
  assert.equal(allow.actor_role, "manager", "the role must come from the bound row");
});

test("a caller matching two different memberships is refused, not guessed", async (t) => {
  // No seed: this test owns the whole table, so the row count below is exact.
  const portal = await startPortal({ seed: false });
  t.after(portal.dispose);

  // Row A: the address being presented now, never signed in.
  await portal.addMember("alice@example.com", "owner", "active", null);
  // Row B: a different membership this subject is already bound to.
  await portal.addMember("alice.old@example.com", "support", "active", "subject-alice");

  const response = await portal.get("/portal", {
    subject: "subject-alice",
    email: "alice@example.com",
  });

  assert.equal(response.status, 307, "an ambiguous identity must not be resolved");
  assert.match(response.headers.get("location") ?? "", /\/portal\/no-access$/);

  const rows = await portal.audit();
  const deny = rows.find((r) => r.reason === "identity_ambiguous");
  assert.ok(deny, "the ambiguity must be audited by name");
  assert.equal(deny.decision, "deny");

  // Neither membership was granted, and neither was mutated. Without the fix
  // one of these rows would have been claimed by the wrong person.
  const members = (
    await portal.db
      .prepare("SELECT email, role, subject_id FROM portal_members ORDER BY email")
      .all()
  ).results;
  // Look them up by address rather than by position: "alice.old@" sorts before
  // "alice@" because '.' precedes '@', which is easy to get backwards.
  const byEmail = Object.fromEntries(members.map((m) => [m.email, m]));
  assert.equal(members.length, 2, "no row may be created or removed");
  assert.equal(
    byEmail["alice@example.com"].subject_id,
    null,
    "the unbound row must NOT have been claimed",
  );
  assert.equal(
    byEmail["alice.old@example.com"].subject_id,
    "subject-alice",
    "the bound row must be untouched",
  );

  // The refusal page names the situation rather than showing a generic error.
  const page = await portal.get("/portal/no-access", {
    subject: "subject-alice",
    email: "alice@example.com",
  });
  assert.match(await page.text(), /Two memberships match you/);
});

test("the ordinary single-match paths still resolve", async (t) => {
  const portal = await startPortal({ seed: false });
  t.after(portal.dispose);

  // Matched by email only: first sign-in binds the subject.
  await portal.addMember("fresh@example.com", "agent");
  const first = await portal.get("/portal", {
    subject: "subject-fresh",
    email: "fresh@example.com",
  });
  assert.equal(first.status, 200, "an unbound email row must bind and admit");

  const bound = (
    await portal.db
      .prepare("SELECT subject_id FROM portal_members WHERE email = ?")
      .bind("fresh@example.com")
      .all()
  ).results[0];
  assert.equal(bound.subject_id, "subject-fresh");

  // Matched by neither: still refused.
  const stranger = await portal.get("/portal", {
    subject: "subject-nobody",
    email: "nobody@example.com",
  });
  assert.equal(stranger.status, 307);
});

/* ============================================================
   A missing table fails closed with an explanation, not a 500
   ------------------------------------------------------------
   resolvePortalAccess already fails closed when portal_members is absent, but
   that protection covered sign-in only. Every page that queried a SECOND table
   afterwards read it bare, so a database missing dialer_transfers or
   audit_events threw and surfaced as HTTP 500 with a stack trace -- on a route
   the member was entitled to see. The record documents two migration paths that
   must not both be applied, so an absent table is a real possibility here, not
   a hypothetical.
   ============================================================ */

test("a missing dialer_transfers table explains itself instead of throwing", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  await portal.db.prepare("DROP TABLE dialer_transfers").run();

  const response = await portal.get("/portal/calls", {
    subject: "subject-owner-1",
    email: SEEDED_OWNER_EMAIL,
  });

  assert.equal(response.status, 200, "a missing table produced an error response");
  const html = await response.text();

  assert.match(html, /is not provisioned/, "the page did not say why it is empty");
  assert.doesNotMatch(
    html,
    /no such table|D1_ERROR|SQLITE/i,
    "the database driver's error text reached the member",
  );
  // The counts must not report zero over rows nobody managed to read.
  assert.doesNotMatch(
    html,
    /Awaiting first transfer/,
    "an unread inbox was described as an empty one",
  );
});

test("the audit log never renders an unread table as an empty one", async (t) => {
  const portal = await startPortal();
  t.after(portal.dispose);

  // recordAudit swallows its own write failures by design, so dropping this
  // table exercises the read path without breaking authorization.
  await portal.db.prepare("DROP TABLE audit_events").run();

  const response = await portal.get("/portal/audit", {
    subject: "subject-owner-1",
    email: SEEDED_OWNER_EMAIL,
  });

  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /is not provisioned/);
  assert.doesNotMatch(
    html,
    /No events recorded/,
    "the audit log claimed nothing happened when it simply could not look",
  );
  assert.doesNotMatch(html, /no such table|D1_ERROR|SQLITE/i);
});
