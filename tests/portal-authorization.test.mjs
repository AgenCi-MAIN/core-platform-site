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
