/**
 * Portal authorization, exercised against the real Cloudflare runtime.
 *
 * These tests boot the built worker in Miniflare — actual workerd, actual D1 —
 * apply the real migrations from db/sql/, and drive the portal over HTTP with
 * the identity headers the hosting platform injects. Everything here therefore
 * covers the database-backed paths that cannot be reached from the plain-Node
 * suite in rendered-html.test.mjs: membership lookup, subject binding, role
 * resolution, capability enforcement, and audit writes.
 *
 * Run `npm run build` first; these load dist/server.
 */
import assert from "node:assert/strict";
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

/** Boot a worker with a fresh, empty D1. `migrate`/`seed` opt into schema and data. */
async function startPortal({ migrate = true, seed = true } = {}) {
  const mf = new Miniflare({
    modulesRoot: SERVER_DIR,
    modules: MODULES,
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "site-creator-d1" },
    r2Buckets: { CALL_RECORDINGS: "core-call-recordings" },
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
        ...(identity
          ? {
              "oai-authenticated-user-id": identity.subject,
              "oai-authenticated-user-email": identity.email,
            }
          : {}),
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
    assert.notEqual(response.status, 200, "must not render the dashboard");
    const body = await response.text();
    assert.doesNotMatch(body, /Capabilities held/);
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

test("a manager can read the roster but an owner is required to see audit", async () => {
  const portal = await startPortal();
  try {
    await portal.addMember("manager@example.com", "manager");
    const identity = { subject: "subject-manager", email: "manager@example.com" };

    const roster = await portal.get("/portal/members", identity);
    assert.equal(roster.status, 200, "manager holds members.view");
    const html = await roster.text();
    assert.match(html, new RegExp(SEEDED_OWNER_EMAIL.replace(".", "\\.")), "roster lists members");
    assert.match(html, /cannot change it/, "manager is told they lack members.manage");

    const audit = await portal.get("/portal/audit", identity);
    assert.equal(audit.status, 307, "manager must not hold audit.view");
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
      ...(identity
        ? {
            "oai-authenticated-user-id": identity.subject,
            "oai-authenticated-user-email": identity.email,
          }
        : {}),
    },
  });
}

function jsonGet(portal, pathname, identity) {
  return portal.mf.dispatchFetch(`http://localhost${pathname}`, {
    redirect: "manual",
    headers: identity
      ? {
          "oai-authenticated-user-id": identity.subject,
          "oai-authenticated-user-email": identity.email,
        }
      : {},
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
      "oai-authenticated-user-id": owner.subject,
      "oai-authenticated-user-email": owner.email,
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
      headers: {
        "oai-authenticated-user-id": owner.subject,
        "oai-authenticated-user-email": owner.email,
      },
    },
  );
  assert.equal(del.status, 200);
  assert.equal(await portal.recordings.get(key), null, "the object must be gone from R2");
});

