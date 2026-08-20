/**
 * Browser inbound voice release: deterministic SWML, machine auth, D1 races,
 * subscriber entitlement, team-return idempotency, and voicemail-only audio.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Miniflare } from "miniflare";
import { buildInboundRoutePlan } from "../app/portal/calls/route/route-plan.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_DIR = join(ROOT, "dist/server");
const ORIGIN = "https://localhost";
const SESSION_SECRET = "browser-voice-session-test-secret";
const MACHINE_SECRET = "browser-voice-machine-test-secret";
const SIGNING_KEY = "browser-voice-signing-test-key";
const SPACE = "thrive-company.signalwire.com";
const MAIN_NUMBER = "+12053515118";
const MOBILE_FALLBACK = "+12055550999";
const TEAM_HUNT = "/public/core-team-hunt";
const CALLER = "+13125550142";
const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const TOKEN_VALUE = "test-subscriber-token-never-persist";

function collectModules(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...collectModules(path));
    else if (/\.(js|mjs)$/.test(entry)) out.push(path);
  }
  return out;
}

const ENTRY = join(SERVER_DIR, "index.js");
const MODULES = [
  { type: "ESModule", path: ENTRY },
  ...collectModules(SERVER_DIR)
    .filter((path) => path !== ENTRY)
    .map((path) => ({
      type: "ESModule",
      path,
      name: relative(SERVER_DIR, path).replace(/\\/g, "/"),
    })),
];

function sqlStatements(text) {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

const INIT_SQL = sqlStatements(readFileSync(join(ROOT, "db/sql/0001_portal_init.sql"), "utf8"));
const VOICE_SQL = sqlStatements(readFileSync(join(ROOT, "db/sql/0011_inbound_browser_voice.sql"), "utf8"));

function machineSignature(path, raw) {
  return createHmac("sha256", SIGNING_KEY).update(`${ORIGIN}${path}${raw}`, "utf8").digest("base64");
}

function basic(secret = MACHINE_SECRET) {
  return `Basic ${Buffer.from(`signalwire:${secret}`).toString("base64")}`;
}

function mintSession(identity) {
  const now = Math.floor(Date.now() / 1000);
  const body = `v1.${Buffer.from(JSON.stringify({
    sub: identity.subject,
    email: identity.email,
    name: identity.name ?? null,
    iat: now,
    exp: now + 3600,
  })).toString("base64url")}`;
  const mac = createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${mac}`;
}

async function startVoice() {
  const outboundRequests = [];
  const mf = new Miniflare({
    modulesRoot: SERVER_DIR,
    modules: MODULES,
    compatibilityDate: "2026-05-15",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: { DB: "site-creator-d1" },
    r2Buckets: { CALL_RECORDINGS: "core-call-recordings" },
    bindings: {
      SESSION_SECRET,
      SIGNALWIRE_INGEST_SECRET: MACHINE_SECRET,
      SIGNALWIRE_SIGNING_KEY: SIGNING_KEY,
      SIGNALWIRE_PUBLIC_ORIGIN: ORIGIN,
      SIGNALWIRE_VOICE_SPACE_URL: SPACE,
      SIGNALWIRE_VOICE_PROJECT_ID: PROJECT_ID,
      SIGNALWIRE_VOICE_API_TOKEN: "provider-api-token-test-value",
      SIGNALWIRE_PRIVATE_MOBILE_NUMBER: MOBILE_FALLBACK,
      SIGNALWIRE_MAIN_NUMBER: MAIN_NUMBER,
      SIGNALWIRE_TEAM_HUNT_ADDRESS: TEAM_HUNT,
      SIGNALWIRE_CALLER_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    },
    serviceBindings: { ASSETS: () => new Response("Not found", { status: 404 }) },
    outboundService: async (request) => {
      outboundRequests.push({
        host: new URL(request.url).hostname,
        path: new URL(request.url).pathname,
        authenticated: request.headers.has("authorization"),
      });
      const url = new URL(request.url);
      if (url.hostname !== SPACE) return new Response("unexpected host", { status: 502 });
      if (url.pathname === "/api/fabric/subscribers/tokens") {
        const body = await request.json();
        const member = String(body.reference ?? "").match(/^core-member-(\d+)$/)?.[1];
        return Response.json({ token: TOKEN_VALUE, subscriber_id: `subscriber-${member ?? "unknown"}` });
      }
      if (url.pathname.startsWith("/api/recordings/")) {
        return new Response(new Uint8Array([73, 68, 51, 4, 0, 1]), {
          headers: { "content-type": "audio/mpeg", "content-length": "6" },
        });
      }
      return new Response("unexpected provider path", { status: 502 });
    },
  });
  const db = await mf.getD1Database("DB");
  const recordings = await mf.getR2Bucket("CALL_RECORDINGS");
  for (const statement of [...INIT_SQL, ...VOICE_SQL]) await db.prepare(statement).run();

  const addMember = async (email, subject, role = "agent", status = "active") => {
    await db
      .prepare(
        "INSERT INTO portal_members (email, subject_id, display_name, role, status, granted_by) VALUES (?, ?, ?, ?, ?, 'voice-test')",
      )
      .bind(email, subject, email.split("@")[0], role, status)
      .run();
    return (await db.prepare("SELECT id FROM portal_members WHERE email = ?").bind(email).first()).id;
  };
  const assign = (memberId, number) => db
    .prepare(
      `INSERT INTO voice_number_assignments
        (member_id, line_type, e164_number, provider_number_id, provider_subscriber_id,
         subscriber_reference, subscriber_address, status)
       VALUES (?, 'personal', ?, ?, ?, ?, ?, 'active')`,
    )
    .bind(
      memberId,
      number,
      `number-${memberId}`,
      `subscriber-${memberId}`,
      `core-member-${memberId}`,
      `/private/core-member-${memberId}?channel=audio`,
    )
    .run();
  const setPresence = (memberId, browserSessionId, readyState, expiresAt) => db
    .prepare(
      `INSERT INTO voice_presence
        (member_id, browser_session_id, ready_state, last_heartbeat_at, expires_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         browser_session_id = excluded.browser_session_id,
         ready_state = excluded.ready_state,
         expires_at = excluded.expires_at`,
    )
    .bind(memberId, browserSessionId, readyState, expiresAt)
    .run();
  const memberFetch = (path, identity, { method = "GET", body } = {}) => mf.dispatchFetch(`http://localhost${path}`, {
    method,
    redirect: "manual",
    headers: {
      accept: "application/json",
      origin: "http://localhost",
      cookie: `core_session=${mintSession(identity)}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const machinePost = (path, payload, { credential = true, sign = true, signature } = {}) => {
    const raw = JSON.stringify(payload);
    return mf.dispatchFetch(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(credential ? { authorization: basic() } : {}),
        ...(sign ? { "x-signalwire-signature": signature ?? machineSignature(path, raw) } : {}),
      },
      body: raw,
      redirect: "manual",
    });
  };
  return {
    mf,
    db,
    recordings,
    outboundRequests,
    addMember,
    assign,
    setPresence,
    memberFetch,
    machinePost,
    dispose: () => mf.dispose(),
  };
}

function routeEvent(callId, to, over = {}) {
  return { call: { id: callId, from: CALLER, to, ...over } };
}

function connectSteps(document) {
  return document.sections.main.filter((step) => step.connect).map((step) => step.connect);
}

function allTargets(connect) {
  if (connect.to) return [connect.to];
  return (connect.parallel ?? []).map((item) => item.to);
}

test("the route plan is an 8s/8s/20s hunt and records only announced voicemail", () => {
  const plan = buildInboundRoutePlan({
    callId: "plan-call-1",
    callerId: "+12055550101",
    callerMasked: "***-***-0142",
    calledLineMasked: "***-***-0101",
    personalTarget: { memberId: 1, address: "/private/core-member-1" },
    personalAttempt: 1,
    teamTargets: [
      { memberId: 2, address: "/private/core-member-2" },
      { memberId: 3, address: "/private/core-member-3" },
    ],
    teamAttempt: 1,
    fallbackNumber: MOBILE_FALLBACK,
    lifecycleUrl: "https://signalwire:secret@example.test/portal/calls/ingest",
    voicemailStatusUrl: "https://signalwire:secret@example.test/portal/calls/voicemail",
  });
  const connects = connectSteps(plan);
  assert.equal(connects[0].timeout, 8);
  assert.match(connects[0].to, /core-member-1/);
  const personalContext = new URL(connects[0].to, "https://fabric.invalid").searchParams;
  assert.equal(personalContext.get("core_caller"), "***-***-0142");
  assert.equal(personalContext.get("core_line"), "***-***-0101");
  assert.equal(connects[1].timeout, 8);
  assert.equal(connects[1].parallel.length, 2);
  assert.equal(connects[2].timeout, 20);
  assert.equal(connects[2].to, MOBILE_FALLBACK);
  assert.match(JSON.stringify(connects[2].confirm), /Press 1 to accept/);

  const main = plan.sections.main;
  const recordIndex = main.findIndex((step) => step.record);
  const announcementIndex = main.findIndex((step) => step.play?.url?.includes("leave your name"));
  assert.ok(recordIndex > announcementIndex && announcementIndex > 2, "recording starts only after the fallback and announcement");
  assert.equal(main.filter((step) => step.record).length, 1);
  assert.equal(main[recordIndex].record.beep, true);
  assert.doesNotMatch(JSON.stringify(plan), /record_call|transcrib|ai_agent/i);
});

test("production-shaped inbound flow enforces entitlement, races, team return, and voicemail idempotency", async (t) => {
  const voice = await startVoice();
  t.after(voice.dispose);

  const alice = { email: "alice@example.com", subject: "subject-alice" };
  const bob = { email: "bob@example.com", subject: "subject-bob" };
  const stale = { email: "stale@example.com", subject: "subject-stale" };
  const unassigned = { email: "unassigned@example.com", subject: "subject-unassigned" };
  const suspended = { email: "suspended@example.com", subject: "subject-suspended" };
  const revoked = { email: "bankerrunners@gmail.com", subject: "subject-revoked" };
  const founder = { email: "btcmao518@gmail.com", subject: "subject-founder" };
  const aliceId = await voice.addMember(alice.email, alice.subject);
  const bobId = await voice.addMember(bob.email, bob.subject);
  const staleId = await voice.addMember(stale.email, stale.subject);
  await voice.addMember(unassigned.email, unassigned.subject);
  const suspendedId = await voice.addMember(suspended.email, suspended.subject, "agent", "suspended");
  await voice.addMember(revoked.email, revoked.subject, "owner", "revoked");
  const founderId = await voice.addMember(founder.email, founder.subject, "owner", "active");
  await voice.assign(aliceId, "+12055550101");
  await voice.assign(bobId, "+12055550102");
  await voice.assign(staleId, "+12055550103");
  await voice.assign(suspendedId, "+12055550104");
  await voice.assign(founderId, "+12055550105");

  const aliceSession = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const bobSession = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const issueAlice = await voice.memberFetch("/portal/calls/session", alice, {
    method: "POST",
    body: { browserSessionId: aliceSession, fingerprint: "A".repeat(43), purpose: "register" },
  });
  assert.equal(issueAlice.status, 200);
  assert.match(issueAlice.headers.get("cache-control") ?? "", /no-store/);
  assert.equal((await issueAlice.json()).token, TOKEN_VALUE);
  const persisted = JSON.stringify((await voice.db.prepare("SELECT * FROM voice_presence").all()).results);
  assert.doesNotMatch(persisted, new RegExp(TOKEN_VALUE));

  const issueBob = await voice.memberFetch("/portal/calls/session", bob, {
    method: "POST",
    body: { browserSessionId: bobSession, fingerprint: "B".repeat(43), purpose: "register" },
  });
  assert.equal(issueBob.status, 200);
  for (const deniedIdentity of [unassigned, suspended, revoked]) {
    const denied = await voice.memberFetch("/portal/calls/session", deniedIdentity, {
      method: "POST",
      body: {
        browserSessionId: crypto.randomUUID(),
        fingerprint: "C".repeat(43),
        purpose: "register",
      },
    });
    assert.equal(denied.status, 403, `${deniedIdentity.email} must not mint a subscriber token`);
  }

  for (const [identity, browserSessionId] of [[alice, aliceSession], [bob, bobSession]]) {
    const ready = await voice.memberFetch("/portal/calls/presence", identity, {
      method: "POST",
      body: { action: "available", browserSessionId },
    });
    assert.equal(ready.status, 200);
  }
  const refreshAlice = await voice.memberFetch("/portal/calls/session", alice, {
    method: "POST",
    body: {
      browserSessionId: aliceSession,
      fingerprint: "A".repeat(43),
      purpose: "refresh",
    },
  });
  assert.equal(refreshAlice.status, 200);
  assert.equal(
    (await voice.db
      .prepare("SELECT ready_state FROM voice_presence WHERE member_id = ?")
      .bind(aliceId)
      .first()).ready_state,
    "available",
  );
  const offlineAlice = await voice.memberFetch("/portal/calls/presence", alice, {
    method: "POST",
    body: { action: "offline", browserSessionId: aliceSession },
  });
  assert.equal(offlineAlice.status, 200);
  const refreshOffline = await voice.memberFetch("/portal/calls/session", alice, {
    method: "POST",
    body: {
      browserSessionId: aliceSession,
      fingerprint: "A".repeat(43),
      purpose: "refresh",
    },
  });
  assert.equal(refreshOffline.status, 409);
  const registerAliceAgain = await voice.memberFetch("/portal/calls/session", alice, {
    method: "POST",
    body: {
      browserSessionId: aliceSession,
      fingerprint: "A".repeat(43),
      purpose: "register",
    },
  });
  assert.equal(registerAliceAgain.status, 200);
  const readyAliceAgain = await voice.memberFetch("/portal/calls/presence", alice, {
    method: "POST",
    body: { action: "available", browserSessionId: aliceSession },
  });
  assert.equal(readyAliceAgain.status, 200);
  await voice.setPresence(staleId, "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "available", "2020-01-01T00:00:00.000Z");
  await voice.setPresence(suspendedId, "dddddddd-dddd-4ddd-8ddd-dddddddddddd", "available", "2099-01-01T00:00:00.000Z");

  const unsigned = await voice.machinePost("/portal/calls/route", routeEvent("unauthorized-call", MAIN_NUMBER), {
    credential: false,
    sign: false,
  });
  assert.equal(unsigned.status, 401);
  assert.equal(await unsigned.text(), "");
  const badSignature = await voice.machinePost("/portal/calls/route", routeEvent("forged-call", MAIN_NUMBER), {
    signature: "forged",
  });
  assert.equal(badSignature.status, 401);
  assert.equal(await badSignature.text(), "");
  assert.equal((await voice.db.prepare("SELECT COUNT(*) AS count FROM inbound_voice_calls").first()).count, 0);

  const personalCallId = "personal-call-001";
  const personal = await voice.machinePost(
    "/portal/calls/route",
    routeEvent(personalCallId, "+12055550101"),
  );
  assert.equal(personal.status, 200);
  assert.match(personal.headers.get("cache-control") ?? "", /no-store/);
  const personalPlan = await personal.json();
  const personalConnects = connectSteps(personalPlan);
  assert.equal(personalConnects[0].timeout, 8);
  assert.match(personalConnects[0].to, new RegExp(`core-member-${aliceId}`));
  assert.equal(personalConnects[1].timeout, 8);
  assert.deepEqual(allTargets(personalConnects[1]).map((target) => target.match(/core-member-(\d+)/)?.[1]), [String(bobId)]);
  assert.equal(personalConnects[2].timeout, 20);
  assert.equal(personalConnects[2].to, MOBILE_FALLBACK);
  assert.doesNotMatch(JSON.stringify(personalPlan), new RegExp(CALLER.replace(/\+/g, "\\+")));
  const inventedOffer = await voice.memberFetch("/portal/calls/offer-event", alice, {
    method: "POST",
    body: {
      action: "ringing",
      providerCallId: personalCallId,
      stage: "team",
      attempt: 1,
      browserSessionId: aliceSession,
    },
  });
  assert.equal(inventedOffer.status, 409, "a browser cannot invent an offer the route planner did not create");

  const callRow = await voice.db
    .prepare("SELECT * FROM inbound_voice_calls WHERE provider_call_id = ?")
    .bind(personalCallId)
    .first();
  assert.equal(callRow.caller_number_masked, "***-***-0142");
  assert.notEqual(callRow.caller_ciphertext, CALLER);
  assert.ok(callRow.caller_ciphertext && callRow.caller_cipher_iv);
  const replay = await voice.machinePost("/portal/calls/route", routeEvent(personalCallId, "+12055550101"));
  assert.equal(replay.status, 200);
  assert.equal(
    (await voice.db.prepare("SELECT COUNT(*) AS count FROM inbound_voice_calls WHERE provider_call_id = ?").bind(personalCallId).first()).count,
    1,
  );

  await voice.db.prepare("UPDATE voice_presence SET expires_at = '2020-01-01T00:00:00.000Z' WHERE member_id = ?").bind(aliceId).run();
  const skippedOwner = await voice.machinePost(
    "/portal/calls/route",
    routeEvent("personal-owner-stale", "+12055550101"),
  );
  const skippedConnects = connectSteps(await skippedOwner.json());
  assert.doesNotMatch(JSON.stringify(skippedConnects[0]), new RegExp(`core-member-${aliceId}`));
  await voice.setPresence(aliceId, aliceSession, "available", "2099-01-01T00:00:00.000Z");

  const raceCallId = "main-race-call-001";
  const main = await voice.machinePost("/portal/calls/route", routeEvent(raceCallId, MAIN_NUMBER));
  assert.equal(main.status, 200);
  const mainConnects = connectSteps(await main.json());
  assert.equal(mainConnects[0].timeout, 8);
  assert.equal(allTargets(mainConnects[0]).length, 2);
  assert.equal(mainConnects[1].timeout, 20);

  const initialOfferBody = { providerCallId: raceCallId, stage: "team", attempt: 1 };
  const [aliceRinging, bobRinging] = await Promise.all([
    voice.memberFetch("/portal/calls/offer-event", alice, {
      method: "POST",
      body: { ...initialOfferBody, action: "ringing", browserSessionId: aliceSession },
    }),
    voice.memberFetch("/portal/calls/offer-event", bob, {
      method: "POST",
      body: { ...initialOfferBody, action: "ringing", browserSessionId: bobSession },
    }),
  ]);
  assert.equal(aliceRinging.status, 200);
  assert.equal(bobRinging.status, 200);
  const [aliceAnswer, bobAnswer] = await Promise.all([
    voice.memberFetch("/portal/calls/offer-event", alice, {
      method: "POST",
      body: { ...initialOfferBody, action: "answered", browserSessionId: aliceSession },
    }),
    voice.memberFetch("/portal/calls/offer-event", bob, {
      method: "POST",
      body: { ...initialOfferBody, action: "answered", browserSessionId: bobSession },
    }),
  ]);
  assert.deepEqual([aliceAnswer.status, bobAnswer.status].sort((a, b) => a - b), [200, 409]);
  const wonCall = await voice.db
    .prepare("SELECT id, accepted_member_id FROM inbound_voice_calls WHERE provider_call_id = ?")
    .bind(raceCallId)
    .first();
  const winnerId = wonCall.accepted_member_id;
  const loserId = winnerId === aliceId ? bobId : aliceId;
  const winner = winnerId === aliceId ? alice : bob;
  const loser = winnerId === aliceId ? bob : alice;
  const winnerSession = winnerId === aliceId ? aliceSession : bobSession;
  const offerRows = (await voice.db
    .prepare("SELECT member_id, status FROM voice_call_offers WHERE voice_call_id = ? ORDER BY member_id")
    .bind(wonCall.id)
    .all()).results;
  assert.equal(offerRows.filter((offer) => offer.status === "answered").length, 1);
  assert.equal(offerRows.filter((offer) => offer.status === "answered_elsewhere").length, 1);
  assert.equal((await voice.db.prepare("SELECT ready_state FROM voice_presence WHERE member_id = ?").bind(winnerId).first()).ready_state, "busy");

  const transferBody = { providerCallId: raceCallId, browserSessionId: winnerSession };
  const prepared = await voice.memberFetch("/portal/calls/team-transfer", winner, {
    method: "POST",
    body: { ...transferBody, action: "prepare" },
  });
  assert.equal(prepared.status, 200);
  assert.equal((await prepared.json()).destination, TEAM_HUNT);
  const preparedAgain = await voice.memberFetch("/portal/calls/team-transfer", winner, {
    method: "POST",
    body: { ...transferBody, action: "prepare" },
  });
  assert.equal(preparedAgain.status, 200);

  const childCallId = "team-transfer-child-001";
  const teamRoute = await voice.machinePost(
    "/portal/calls/route",
    routeEvent(childCallId, TEAM_HUNT, { parent_id: raceCallId }),
  );
  assert.equal(teamRoute.status, 200);
  const teamPlan = await teamRoute.json();
  const teamTargets = allTargets(connectSteps(teamPlan)[0]);
  assert.ok(teamTargets.some((target) => target.includes(`core-member-${loserId}`)));
  assert.ok(teamTargets.every((target) => !target.includes(`core-member-${winnerId}`)));
  assert.match(teamTargets[0], new RegExp(`core_call_id=${raceCallId}`));
  assert.match(teamTargets[0], /core_attempt=2/);
  const afterTeamRoute = await voice.db
    .prepare("SELECT active_provider_call_id, accepted_member_id, routing_stage, status FROM inbound_voice_calls WHERE id = ?")
    .bind(wonCall.id)
    .first();
  assert.equal(afterTeamRoute.active_provider_call_id, childCallId);
  assert.equal(afterTeamRoute.accepted_member_id, null);
  assert.equal(afterTeamRoute.routing_stage, "team");
  assert.equal(afterTeamRoute.status, "offering");
  const committed = await voice.memberFetch("/portal/calls/team-transfer", winner, {
    method: "POST",
    body: { ...transferBody, action: "commit" },
  });
  assert.equal(committed.status, 200);
  assert.equal((await committed.json()).alreadyTransferred, true);

  const loserSession = loserId === aliceId ? aliceSession : bobSession;
  const loserRinging = await voice.memberFetch("/portal/calls/offer-event", loser, {
    method: "POST",
    body: {
      action: "ringing",
      providerCallId: raceCallId,
      stage: "team",
      attempt: 2,
      browserSessionId: loserSession,
    },
  });
  assert.equal(loserRinging.status, 200);
  const loserAnswer = await voice.memberFetch("/portal/calls/offer-event", loser, {
    method: "POST",
    body: {
      action: "answered",
      providerCallId: raceCallId,
      stage: "team",
      attempt: 2,
      browserSessionId: loserSession,
    },
  });
  assert.equal(loserAnswer.status, 200);
  assert.equal(
    (await voice.db.prepare("SELECT accepted_member_id FROM inbound_voice_calls WHERE id = ?").bind(wonCall.id).first()).accepted_member_id,
    loserId,
  );

  const secondPrepare = await voice.memberFetch("/portal/calls/team-transfer", loser, {
    method: "POST",
    body: { providerCallId: raceCallId, browserSessionId: loserSession, action: "prepare" },
  });
  assert.equal(secondPrepare.status, 200);
  const cancelled = await voice.memberFetch("/portal/calls/team-transfer", loser, {
    method: "POST",
    body: { providerCallId: raceCallId, browserSessionId: loserSession, action: "cancel" },
  });
  assert.equal(cancelled.status, 200);
  const afterCancel = await voice.db
    .prepare("SELECT accepted_member_id, status FROM inbound_voice_calls WHERE id = ?")
    .bind(wonCall.id)
    .first();
  assert.equal(afterCancel.accepted_member_id, loserId);
  assert.equal(afterCancel.status, "connected");

  const ended = await voice.memberFetch("/portal/calls/offer-event", loser, {
    method: "POST",
    body: {
      action: "ended",
      providerCallId: raceCallId,
      stage: "team",
      attempt: 2,
      browserSessionId: loserSession,
    },
  });
  assert.equal(ended.status, 200);
  assert.equal((await voice.db.prepare("SELECT status FROM inbound_voice_calls WHERE id = ?").bind(wonCall.id).first()).status, "completed");
  assert.equal((await voice.db.prepare("SELECT ready_state FROM voice_presence WHERE member_id = ?").bind(loserId).first()).ready_state, "available");

  await voice.db.prepare("UPDATE voice_presence SET ready_state = 'offline', expires_at = CURRENT_TIMESTAMP").run();
  const voicemailCallId = "main-voicemail-call-001";
  const voicemailRoute = await voice.machinePost("/portal/calls/route", routeEvent(voicemailCallId, MAIN_NUMBER));
  assert.equal(voicemailRoute.status, 200);
  const voicemailConnects = connectSteps(await voicemailRoute.json());
  assert.equal(voicemailConnects.length, 1);
  assert.equal(voicemailConnects[0].to, MOBILE_FALLBACK);

  const voicemailEvent = {
    event_type: "calling.call.record",
    params: {
      call_id: voicemailCallId,
      state: "finished",
      url: `https://${SPACE}/api/recordings/recording-001`,
      recording_id: "recording-001",
      duration: 12,
      record: { audio: { format: "mp3" } },
    },
  };
  const stored = await voice.machinePost("/portal/calls/voicemail", voicemailEvent);
  assert.equal(stored.status, 204);
  const storedReplay = await voice.machinePost("/portal/calls/voicemail", voicemailEvent);
  assert.equal(storedReplay.status, 204);
  const callbackRows = (await voice.db
    .prepare("SELECT * FROM voice_callback_tasks WHERE voice_call_id = (SELECT id FROM inbound_voice_calls WHERE provider_call_id = ?)")
    .bind(voicemailCallId)
    .all()).results;
  assert.equal(callbackRows.length, 1);
  assert.equal(callbackRows[0].assigned_member_id, null);
  assert.ok(callbackRows[0].voicemail_object_key);
  assert.ok(await voice.recordings.get(callbackRows[0].voicemail_object_key));

  const unassignedBootstrap = await voice.memberFetch("/portal/calls/bootstrap", unassigned);
  assert.equal(unassignedBootstrap.status, 200);
  const unassignedView = await unassignedBootstrap.json();
  assert.equal(unassignedView.phoneEnabled, false);
  assert.deepEqual(unassignedView.history, []);
  assert.deepEqual(unassignedView.callbackTasks, []);
  const unassignedClaim = await voice.memberFetch(`/portal/calls/callback-tasks/${callbackRows[0].id}/claim`, unassigned, {
    method: "POST",
  });
  assert.equal(unassignedClaim.status, 403);
  const unassignedAudio = await voice.memberFetch(`/portal/calls/voicemail/audio?id=${callbackRows[0].id}`, unassigned);
  assert.equal(unassignedAudio.status, 403);

  const offlineClaim = await voice.memberFetch(`/portal/calls/callback-tasks/${callbackRows[0].id}/claim`, alice, {
    method: "POST",
  });
  assert.equal(offlineClaim.status, 409, "an assigned but Offline employee cannot claim a shared callback");

  await voice.setPresence(aliceId, aliceSession, "available", "2099-01-01T00:00:00.000Z");
  const claim = await voice.memberFetch(`/portal/calls/callback-tasks/${callbackRows[0].id}/claim`, alice, {
    method: "POST",
  });
  assert.equal(claim.status, 200);
  const claimAudit = await voice.db
    .prepare(
      "SELECT reason, actor_email, decision FROM audit_events WHERE action = 'calls.callback.claim' AND resource = ? ORDER BY id DESC LIMIT 1",
    )
    .bind(`callback:${callbackRows[0].id}`)
    .first();
  assert.deepEqual(claimAudit, {
    reason: "claim_attempt_authorized",
    actor_email: alice.email,
    decision: "allow",
  });
  const audio = await voice.memberFetch(`/portal/calls/voicemail/audio?id=${callbackRows[0].id}`, alice);
  assert.equal(audio.status, 200);
  assert.match(audio.headers.get("cache-control") ?? "", /no-store/);
  assert.deepEqual(new Uint8Array(await audio.arrayBuffer()), new Uint8Array([73, 68, 51, 4, 0, 1]));
  const otherAudio = await voice.memberFetch(`/portal/calls/voicemail/audio?id=${callbackRows[0].id}`, bob);
  assert.equal(otherAudio.status, 404);
  const founderAudio = await voice.memberFetch(`/portal/calls/voicemail/audio?id=${callbackRows[0].id}`, founder);
  assert.equal(founderAudio.status, 200);

  const bobBootstrap = await voice.memberFetch("/portal/calls/bootstrap", bob);
  assert.equal(bobBootstrap.status, 200);
  const bobView = await bobBootstrap.json();
  assert.equal("subscriberAddress" in bobView, false, "private Subscriber routing addresses never enter bootstrap");
  assert.ok(!bobView.history.some((call) => call.providerCallId === personalCallId), "employees see no unrelated personal history");
  await voice.setPresence(bobId, bobSession, "available", "2099-01-01T00:00:00.000Z");
  const ringingForBobHistory = await voice.memberFetch("/portal/calls/offer-event", bob, {
    method: "POST",
    body: {
      action: "ringing",
      providerCallId: personalCallId,
      stage: "team",
      attempt: 1,
      browserSessionId: bobSession,
    },
  });
  assert.equal(ringingForBobHistory.status, 200);
  const offeredToBob = await voice.memberFetch("/portal/calls/offer-event", bob, {
    method: "POST",
    body: {
      action: "missed",
      providerCallId: personalCallId,
      stage: "team",
      attempt: 1,
      browserSessionId: bobSession,
    },
  });
  assert.equal(offeredToBob.status, 200);
  const bobHistoryAfterOffer = await voice.memberFetch("/portal/calls/bootstrap", bob);
  assert.equal(bobHistoryAfterOffer.status, 200);
  assert.ok(
    (await bobHistoryAfterOffer.json()).history.some(
      (call) => call.providerCallId === personalCallId && call.activityStatus === "missed",
    ),
    "employees see calls that were offered to their browser",
  );
  const founderBootstrap = await voice.memberFetch("/portal/calls/bootstrap", founder);
  assert.equal(founderBootstrap.status, 200);
  const founderView = await founderBootstrap.json();
  assert.equal(founderView.founder, true);
  assert.ok(founderView.history.some((call) => call.providerCallId === personalCallId));
  assert.ok(voice.outboundRequests.every((request) => request.authenticated));
});

test("the additive voice migration pins assignment, offer, and callback uniqueness", async (t) => {
  const voice = await startVoice();
  t.after(voice.dispose);
  const memberId = await voice.addMember("constraints@example.com", "subject-constraints");
  await voice.assign(memberId, "+12055550201");
  await assert.rejects(() => voice.assign(memberId, "+12055550202"), /UNIQUE|constraint/i);
  await voice.db
    .prepare(
      `INSERT INTO inbound_voice_calls
        (provider_call_id, line_type, called_number_masked, caller_number_masked, routing_stage, status)
       VALUES ('constraint-call', 'shared', '***-***-5118', '***-***-0142', 'team', 'offering')`,
    )
    .run();
  const callId = (await voice.db.prepare("SELECT id FROM inbound_voice_calls WHERE provider_call_id = 'constraint-call'").first()).id;
  const insertOffer = () => voice.db
    .prepare("INSERT INTO voice_call_offers (voice_call_id, stage, attempt, member_id, status) VALUES (?, 'team', 1, ?, 'ringing')")
    .bind(callId, memberId)
    .run();
  await insertOffer();
  await assert.rejects(insertOffer, /UNIQUE|constraint/i);
  const insertTask = () => voice.db
    .prepare("INSERT INTO voice_callback_tasks (voice_call_id, status, due_at) VALUES (?, 'open', '2099-01-01T00:00:00.000Z')")
    .bind(callId)
    .run();
  await insertTask();
  await assert.rejects(insertTask, /UNIQUE|constraint/i);
});

test("the browser phone waits for SDK user initialization before connecting and cleanup cannot strand Registering", () => {
  const source = readFileSync(join(ROOT, "app/portal/calls/browser-phone.tsx"), "utf8");
  const constructorAt = source.indexOf("const client = new SignalWire(credentials");
  const waitForUserAt = source.indexOf("await waitForSignalWireUser(client)", constructorAt);
  const connectAt = source.indexOf("await client.connect()", constructorAt);
  const sessionAt = source.indexOf("client.session.incomingCalls$", constructorAt);
  const registerAt = source.indexOf("await client.register()", constructorAt);

  assert.ok(constructorAt >= 0, "the SignalWire client is constructed in the browser phone");
  assert.match(source.slice(constructorAt, waitForUserAt), /skipConnection:\s*true/);
  assert.ok(waitForUserAt > constructorAt, "the SDK user observable resolves after async credential initialization");
  assert.ok(connectAt > waitForUserAt, "the deferred WebSocket connection opens only after the SDK user exists");
  assert.ok(sessionAt > connectAt, "the session is read only after connection and authentication");
  assert.ok(registerAt > sessionAt, "incoming-call observation is ready before the user registers online");
  assert.match(
    source,
    /client\.user\$\.subscribe\(\(user\)\s*=>\s*{\s*if \(user\) finish\(resolve\);\s*}\)/,
    "the startup gate waits on the SDK's public user observable",
  );
  assert.match(
    source,
    /client\.errors\$\.subscribe\(\(error\)\s*=>\s*{\s*finish\(\(\) => reject\(error\)\);\s*}\)/,
    "SDK authentication errors reject the startup gate instead of hanging",
  );
  assert.match(
    source,
    /try\s*{\s*client\.destroy\(\);\s*}\s*catch\s*{[^}]*}/,
    "a partially initialized SDK client cannot interrupt the error-state transition",
  );
});
