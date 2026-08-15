# Fleet report — delivered 2026-08-15 (workforce bench)

Filed verbatim as delivered by the specialist. Doctrine labels ([documented]/[published]/[inference]/[unverified]) are the analyst's own.

---

All source material read: `CLAUDE.md`, `CORE_PLATFORM_RECORD.md` (§ 4–6, § 10a, the Call Lab/dialer design), `db/schema.ts`, `db/sql/0001_portal_init.sql`, `app/portal/access.ts`, `app/portal/read-guard.ts`, `app/portal/calls/` (page, storage, recording route), `app/portal/members/manage/route.ts`, `app/portal/pay-rates/model.ts` (the incident header), and `strategy/2026-08-15-exit-architecture.md` (scorecard rows 1–18, extension 19–26). No files were modified. The roadmap follows.

---

# Thrive OS v0 — Instrumentation Roadmap for the Exit Scorecard

## 0. Ground truth: what exists today vs. what must be built

| Asset | Status | Relevant scorecard rows |
|---|---|---|
| Identity (HMAC `core_session` cookie) + membership (`portal_members`) + deny-by-default capabilities | **Live** | prerequisite for everything |
| Append-only `audit_events` | **Live** | compliance evidence (row 15's audit trail pattern) |
| `dialer_transfers` table + `CALL_RECORDINGS` R2 + consent gate + Call Lab inbox UI | **Live as receiving surface only** — the page's own readiness panel says "External dialer: Not connected"; no ingest route exists | call metrics, row 24 |
| Fail-closed read pattern (`readRows`/`readFaultCopy`, em-dash-not-zero metric tiles in `app/portal/calls/page.tsx`) | **Live** — the exact pattern every scorecard tile must reuse | all |
| Carrier production/lapse data, agent roster, leader/office structure, Lead Tech API | **Do not exist in this system at all** | rows 1, 3–7, 11, 12, 18–22, 24 |

The single most important structural fact: **`portal_members` is the auth allowlist, not the agent roster.** It holds 2 owners today and will never hold every writing agent, and overloading it would entangle authorization with analytics. Thrive OS needs a separate agent registry, joined to `portal_members` by normalized email only when an agent happens to have portal access.

The second: **carrier reports key agents by carrier writing number, not email.** Every phase that ingests carrier data needs an identity-mapping table, and unmatched rows must surface honestly (the read-guard discipline: "not known" is not "zero").

---

## 1. Metric-by-metric design

### Row 1 — Monthly AP
- **Source:** carrier commission/production statements, manual monthly CSV upload (Phase 1). No carrier offers the portal a feed today; an SFTP/API feed is a later optimization, not a prerequisite.
- **Derivation:** `SUM(annual_premium_cents)` over `production_records` for the statement month, status in (`submitted`,`issued`,`placed`) — *which statuses count is an owner decision* (submitted AP and issued AP are different numbers; carriers report both; the scorecard should probably show both rather than pick).
- **Schema:** `production_uploads` + `production_records` (sketch in Phase 1).
- **Capabilities:** `production.upload`, `production.view.all` (aggregates), `scorecard.view`.

### Row 3 — Active writers (wrote ≥1 policy this month)
- **Source:** same upload. `COUNT(DISTINCT agent)` with ≥1 record in month.
- **Constraint:** "wrote" needs a pinned definition (submitted vs issued) — governance decision, and the strategy doc's Part 2b point 1 demands the *distribution*, not just the count.

### Row 4 — Active ratio (active ÷ contracted)
- **Source:** numerator from production upload; **denominator needs the agent registry** (`agent_roster` with contract lifecycle), which nothing today provides. Manual roster entry (or CSV) in Phase 1.

### Row 5 — AP per active writer / Row 19 — blended AP per active writer (distribution)
- **Source:** derived from rows 1/3, plus per-agent percentiles (p25/median/p75, and counts in the funnel bands $0–10K / $10–25K / $25K+ that Part 1b's funnel defines). Pure SQL over `production_records`; no new tables.

### Row 6 — 13-month persistency by monthly cohort
- **Source:** carrier lapse/termination reports, monthly CSV upload (Phase 2).
- **Schema:** append-only `policy_status_events` — raw events, cohort curves computed at read time. Storing raw events instead of a pre-aggregated persistency table is deliberate: the strategy doc's core warning is that blended persistency flatters a growing book; vintage curves must be recomputable per cohort forever, and an aggregate table would bake in today's cohort definition.
- **Cohort key:** policy issue month (from Phase 1 records). This is why Phase 1's `production_records` must capture `issued_at` even before Phase 2 exists — **start capturing cohort vintages now** (the strategy doc says exactly this).

### Row 7 — Placement rate
- **Source:** same two uploads: placed ÷ submitted per month, from `production_records.status` transitions / `policy_status_events`. Free once Phase 2 lands.

### Row 11 — Time-to-first-application (new agent)
- **Source:** `agent_roster.contracted_at` → `MIN(production_records.submitted_at)` per agent.
- **Honest limitation to flag on the dashboard:** many carrier statements are month-granular. Day-level "Day ≤10" measurement really wants the application-submission system (CRM/e-app), which doesn't exist as a feed. Phase 1 delivers a month-granular approximation labeled as such; day-level precision is a Phase 3+ item once any per-application source exists. Do not display month-granular data as day-precise — that violates the § 10b doctrine (fact vs plan vs assumption) that governs everything shown to a future data room.

### Row 12 — 30/60/90-day agent retention
- **Source:** `agent_roster` lifecycle + append-only `agent_status_events` (contracted → activated → writing → terminated). Retention at N days = share of a contracting cohort still active at +N. Entered manually at first (roster maintenance is a real operating habit to build), automatable later.

### Row 18 — Office cohort curve (agents/office at 6/12 months)
- **Source:** `offices.opened_at` × `agent_roster.office_id` × `agent_status_events`. Phase 4 tables; trivially derivable once they exist.

### Rows 19–22 — Leader engine (blended distribution, leaders/agents-per-leader, Gate-D replications, squads)
- **Source:** `leader_assignments` (append-only history of who reports to whom) + `offices` + `office_gate_events`. Row 20 = distinct leaders with ≥N productive agents; row 21 = gate events of type `replicated`; row 22 = leaders whose productive-agent count ≥12 ("office-qualified" per Part 1c). "Productive" threshold ($10K? $25K? ≥1 policy?) is **the owner's single most consequential definition** — Part 2b shows the whole 1,000-agent capacity model pivots on it.

### Row 24 — Lead capacity utilization (calls available ÷ calls needed)
- **Source:** numerator: Lead Tech (API does not exist as an integration; nearest proxy is dialer ingest call counts once Phase 3 lands). Denominator: derived from active writers × target calls/writer (config, owner-set). Honest v0: dialer-ingested call volume ÷ modeled need, labeled as proxy. Full row 24 (and rows 9, 10, 14, 15) is **blocked on a Lead Tech API that must be specified with the Lead Tech side** — flag to owner as an external dependency, not portal work.

### Rows the portal should *not* claim: 2, 8, 13, 25, 26 (finance-system numbers), 10, 23 (Lead Tech + CRM), 17 (an experiment, not a query). The scorecard page should render these rows as manually-entered attestations with an "entered by, on date" provenance line, or as em-dashes — never as computed values it didn't compute.

---

## 2. Invariants that constrain every phase (and the one near-violation to design around)

1. **Identity from the signed cookie only.** The Phase 3 ingest route is the first endpoint since the header retirement that authenticates something other than a browser. It must NOT resurrect the header-identity pattern: authenticate the *source system* with an HMAC over the body using a dedicated secret (name only: `DIALER_INGEST_SECRET`), timestamped to bound replay, and treat the payload's `agent_email` as a **claim to be matched against `agent_roster`, never as identity**. Same for the CSV upload route: the uploader is identified by their session cookie; the file identifies nobody.
2. **Production data is exactly the pay-rates class.** `app/portal/pay-rates/model.ts` documents the incident: a `const` inside a `"use client"` file compiled rank economics into an anonymous, immutable-cached `/assets/` chunk the worker never saw. Per-agent AP is strictly more sensitive. Rule for every dashboard: data is read in the guarded server component and passed as **props** to any client chart component; no scorecard module may sit behind `"use client"`, and no client file may import a module containing production constants. Pin it (see VIGIL section).
3. **Fail-closed reads.** Every metric tile uses `readRows` and renders `—` on fault, exactly as `calls/page.tsx` does. A scorecard that shows `$0 AP` over an unreadable table is a false statement in a document whose whole purpose is diligence-grade honesty.
4. **Append-only where the number is the valuation.** `production_records`, `policy_status_events`, `agent_status_events`, `leader_assignments`, `office_gate_events`: no UPDATE/DELETE. Corrections happen by **superseding an upload batch** (a `superseded_by` pointer on `production_uploads`), which preserves what the company believed at each point in time — that *is* the data-room story. Every upload, supersession, all-production view, and gate decision writes `audit_events` rows via `assertCapability`/`recordAudit`.
5. **Two migration trees.** Each phase ships a new hand-written `db/sql/000N_*.sql` using `CREATE TABLE IF NOT EXISTS` (the live path) **and** runs `npm run db:generate` so `drizzle/` stays in sync — but only the `db/sql/` file is applied to the live database. Never both.
6. **No scorecard anywhere public; SW untouched.** `/access` keeps zero lookups; `public/sw.js` already excludes all `/portal` — new routes inherit that for free, and the character-pinned test must not be touched.
7. **Data minimization (decision to put to owner, recommended strongly):** ingest **no insured PII** — policy number, carrier, writing agent, dates, premium, status only. Every scorecard row computes without a policyholder name or DOB. This keeps the new tables out of the breach-notification class and keeps "the hidden gold mine" household-graph question (Part 2's point 5) a separate, deliberate, counsel-reviewed project — not something that arrives silently inside a metrics CSV.
8. **Secrets discipline:** new secret *names* only (`DIALER_INGEST_SECRET`, later perhaps `LEADTECH_API_KEY`). Values never in files, commits, or chat.

---

## 3. Phase 1 — Manual monthly carrier CSV → production dashboard (rows 1, 3, 4, 5, 19-partial)

**The smallest thing that makes the top of the scorecard real. Highest value-per-effort of anything in this document: four of the six exit numbers (Part 1's closing list) light up.**

### Schema (`db/sql/0003_production_init.sql` + `db/schema.ts` additions)

```ts
export const PRODUCTION_RECORD_STATUSES = [
  "submitted", "issued", "placed", "declined", "withdrawn",
] as const;
export const UPLOAD_STATUSES = ["active", "superseded"] as const;
export const AGENT_STATUSES = [
  "licensed", "contracted", "activated", "writing", "inactive", "terminated",
] as const;

/** One carrier statement file. Provenance for every number on the scorecard. */
export const productionUploads = sqliteTable("production_uploads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  carrier: text("carrier").notNull(),
  statementMonth: text("statement_month").notNull(),   // "YYYY-MM"
  uploadedBy: text("uploaded_by").notNull(),            // session email, never client-supplied
  filename: text("filename"),
  sha256: text("sha256").notNull(),                     // dedupe + tamper evidence
  rowCount: integer("row_count").notNull(),
  unmatchedCount: integer("unmatched_count").notNull().default(0),
  status: text("status").$type<UploadStatus>().notNull().default("active"),
  supersededBy: integer("superseded_by"),               // later upload id; rows never edited
  receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  index("production_uploads_month_idx").on(t.statementMonth),
  uniqueIndex("production_uploads_sha_idx").on(t.sha256),
  check("production_uploads_status_check",
    sql`${t.status} IN (${literalSet(UPLOAD_STATUSES)})`),
  check("production_uploads_month_check",
    sql`${t.statementMonth} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'`),
]);

/** One policy line from a statement. Append-only; corrections supersede the upload. */
export const productionRecords = sqliteTable("production_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadId: integer("upload_id").notNull(),
  carrier: text("carrier").notNull(),
  policyNumber: text("policy_number").notNull(),        // carrier-scoped id; no insured PII
  carrierAgentId: text("carrier_agent_id"),             // writing number as printed
  agentEmail: text("agent_email"),                      // resolved via agent_carrier_ids; NULL = unmatched
  productLine: text("product_line"),                    // "final_expense" etc — free text v1
  status: text("status").$type<ProductionRecordStatus>().notNull(),
  annualPremiumCents: integer("annual_premium_cents").notNull(),
  submittedAt: text("submitted_at"),                    // day if the carrier gives it, else "YYYY-MM"
  issuedAt: text("issued_at"),                          // cohort key for Phase 2 — capture from day one
  statementMonth: text("statement_month").notNull(),
}, (t) => [
  index("production_records_upload_idx").on(t.uploadId),
  index("production_records_agent_idx").on(t.agentEmail),
  index("production_records_month_idx").on(t.statementMonth),
  uniqueIndex("production_records_policy_idx")
    .on(t.uploadId, t.carrier, t.policyNumber),
  check("production_records_status_check",
    sql`${t.status} IN (${literalSet(PRODUCTION_RECORD_STATUSES)})`),
  check("production_records_premium_check", sql`${t.annualPremiumCents} >= 0`),
]);

/** The agent registry — NOT portal_members. Joined to it by normalized email only. */
export const agentRoster = sqliteTable("agent_roster", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),                       // normalizeEmail() before write
  displayName: text("display_name"),
  status: text("status").$type<AgentStatus>().notNull().default("contracted"),
  licensedAt: text("licensed_at"),
  contractedAt: text("contracted_at"),                  // cohort key for rows 11/12
  officeId: integer("office_id"),                       // Phase 4
  leaderEmail: text("leader_email"),                    // convenience mirror; history in Phase 4
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  uniqueIndex("agent_roster_email_idx").on(t.email),
  index("agent_roster_status_idx").on(t.status),
  check("agent_roster_status_check",
    sql`${t.status} IN (${literalSet(AGENT_STATUSES)})`),
]);

/** Carrier writing number → agent. One agent has one id per carrier. */
export const agentCarrierIds = sqliteTable("agent_carrier_ids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentEmail: text("agent_email").notNull(),
  carrier: text("carrier").notNull(),
  carrierAgentId: text("carrier_agent_id").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  uniqueIndex("agent_carrier_ids_idx").on(t.carrier, t.carrierAgentId),
  index("agent_carrier_ids_agent_idx").on(t.agentEmail),
]);
```

### Surfaces
- `POST /portal/production/upload` — route handler mirroring `members/manage/route.ts` exactly: `resolvePortalAccess(path)` → `assertCapability(session, "production.upload", "production_uploads", path)` → parse CSV server-side (size-capped, ~2 MB), resolve agents via `agent_carrier_ids`, insert batch, count unmatched, audit row with `{carrier, month, rows, unmatched, sha256}`. Same-carrier-same-month re-upload supersedes the previous batch (and audits the supersession). Optionally store the raw file in R2 for provenance — **decision needed**, since a new bucket/prefix touches `.openai/hosting.json` and `scripts/verify-build.mjs`.
- `/portal/production` — scorecard v0 page (server component): monthly AP (submitted and issued shown separately), active writers, active ratio (with denominator source labeled), AP/active writer, and the row-19 distribution bands. Every tile through `readRows` + em-dash. Unmatched-agent count displayed, not hidden.
- `/portal/production/mine` — or a section of the agent dashboard: `production.view.self` filtered by `eq(productionRecords.agentEmail, normalizeEmail(session.email))` — the filter applied server-side from the session, never from a query param.
- Roster management (add agent, map carrier id) — small form posting to a `roster.manage`-guarded route, same shape as members/manage.

### Capabilities (all governance decisions for the owner — proposed defaults only)

| Capability | owner | admin | manager | reviewer | agent | support |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `production.upload` | ✅ | ✅ | — | — | — | — |
| `production.view.all` | ✅ | ✅ | ✅? | — | — | — |
| `production.view.self` | ✅ | ✅ | ✅ | — | ✅ | — |
| `roster.manage` | ✅ | ✅ | ✅? | — | — | — |

The `manager` cells are the real questions (all-company vs. team-scoped comes in Phase 4 with `leader_assignments`; until then it's binary). Adding any of these to `ROLE_CAPABILITIES` is, per the file's own comment, a governance decision to record.

### Decisions required from owner before Phase 1 starts
1. Which carriers, and one sample statement file per carrier (column mapping is per-carrier config).
2. Definition of "active writer" and which statuses count toward "Monthly AP".
3. PII minimization (recommended: no insured data) — this determines the parser's drop-list.
4. Capability matrix above.
5. Store raw CSVs in R2, or D1 rows + sha256 only?
6. Roster bootstrap: who enters the current contracted-agent list, keyed to which emails.

### Effort: **6–8 days** (parser + idempotent supersede logic 2, upload route + audit 1, roster + mapping UI 1.5, dashboard pages 1.5, tests 1.5, migration/deploy 0.5).

### VIGIL / test-suite pins
- Anonymous refusal on `/portal/production`, `/upload`, `/mine` (extend the existing guarded-route sweep).
- `production.view.self` for agent A returns zero rows of agent B (subject-binding-style test).
- Upload without `production.upload` → 403 + deny audit row; successful upload → allow audit row with sha256 in detail.
- Same-file re-upload is idempotent (sha256 unique); same-month re-upload supersedes and audits.
- **Client-chunk canary:** seed a sentinel premium value in the test fixture, build, and grep `dist/client/assets/*` for it — the automated version of the pay-rates lesson. VIGIL's daily invariant list gains: "no production/roster module is imported from any `use client` file."
- Fault path: dashboard renders `—` (not `0`) when `production_records` is absent — same assertion style as the calls-page metric test.

---

## 4. Phase 2 — Cohort persistency from carrier lapse reports (rows 6, 7)

**Second because the strategy doc says it plainly: persistency vintage curves *are* the valuation (Part 2, gap 2), and every month not captured is a cohort lost.** Rides entirely on Phase 1's upload machinery — same route, new record type.

### Schema (`db/sql/0004_policy_events.sql`)

```ts
export const POLICY_EVENT_TYPES = [
  "issued", "placed", "lapsed", "cancelled", "reinstated",
  "charged_back", "death_claim",
] as const;

/** Append-only policy lifecycle. Vintage curves are computed, never stored. */
export const policyStatusEvents = sqliteTable("policy_status_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadId: integer("upload_id").notNull(),             // same provenance chain
  carrier: text("carrier").notNull(),
  policyNumber: text("policy_number").notNull(),
  eventType: text("event_type").$type<PolicyEventType>().notNull(),
  eventDate: text("event_date").notNull(),              // carrier's date, "YYYY-MM-DD" or "YYYY-MM"
  recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  index("policy_events_policy_idx").on(t.carrier, t.policyNumber),
  index("policy_events_type_idx").on(t.eventType),
  uniqueIndex("policy_events_dedupe_idx")
    .on(t.carrier, t.policyNumber, t.eventType, t.eventDate),
  check("policy_events_type_check",
    sql`${t.eventType} IN (${literalSet(POLICY_EVENT_TYPES)})`),
]);
```

### Surfaces
- Lapse-report upload through the Phase 1 route (`reportType: "lapse"` in the payload).
- `/portal/production/persistency` — vintage table: one row per issue-month cohort, columns at months 3/6/9/13; cells with insufficient age render `—`, **never extrapolated** (a young cohort showing blank is the honest state the strategy doc demands). Placement rate (row 7) as placed ÷ submitted per month on the same page.
- Read guarded by `production.view.all` (no self-view of persistency in v1 — per-agent persistency is a coaching feature and a separate governance question).

### Decisions from owner
1. Cohort persistency formula: policy-count or premium-weighted (buyers ask for both; recommend computing both, cheap).
2. Whether charged_back is folded into persistency or shown separately (recommend separately; row 8 belongs to finance).
3. Per-agent persistency visibility — defer, but decide it's deferred.

### Effort: **3–5 days** (parser variants 1–2, vintage-curve SQL + page 1.5, tests 1, migration 0.5).

### VIGIL / test pins
- Vintage math pinned against a hand-computed fixture (a cohort with known lapses at known months — the one query a buyer will re-derive).
- No UPDATE/DELETE path on `policy_status_events` exists in any route (grep-level pin).
- Dedupe index makes re-uploading a lapse report a no-op, not a double-count.

---

## 5. Phase 3 — Dialer ingest per the existing design (call metrics; row 24 proxy; feeds row 11 precision later)

**Third despite the strategy's emphasis on demand, because it has an external dependency neither phase above has: an approved dialer with transfer credentials, which § 10a's own readiness panel lists as "Not connected". The receiving surface, consent gate, and vault already exist — this phase builds the front door.**

### What gets built
- `POST /api/dialer/ingest` (or `/portal/api/...` — route placement decision): authenticates the **source system**, not a person — HMAC-SHA256 over `timestamp + body` with `DIALER_INGEST_SECRET`, ±5-minute window, constant-time compare. This deliberately mirrors the session-token verification posture and deliberately does *not* mirror the retired header pattern: nothing in the payload is treated as identity. Writes `dialer_transfers` (schema already complete — `transferId` unique index makes ingest idempotent) and streams recording bytes to `CALL_RECORDINGS` under a server-generated object key. `consent_status` defaults `pending` — the existing playback gate then does its job with no changes.
- Consent verification workflow: a `calls.review`-guarded action to set `consent_status`, audited (currently no write path exists at all).
- Call-metrics aggregation on `/portal/calls` (or a sibling page): calls/agent/day, talk-time, transfer counts by queue — joined to `agent_roster` via `agentEmail`.
- Row 24 proxy: ingested call volume ÷ (active writers × owner-set target calls/writer) — labeled "proxy until Lead Tech API," with the target stored in a small `scorecard_config` key-value table (owner-editable, audited) rather than a constant.

### Schema
`dialer_transfers` needs at most additive columns (e.g., `campaign`, `leadSource` for row 14 later) — additive `ALTER TABLE ... ADD COLUMN` in `db/sql/0005`, which is safe under the two-trees rule.

### Decisions from owner
1. Which dialer, and its webhook/export contract (this is the schedule risk — the portal side is days; the vendor side is unbounded).
2. Consent verification procedure: who verifies, against what evidence, per-state recording rules (Part 2 gap 3 — this is compliance-spine work, not a checkbox).
3. Retention/deletion policy for recordings (the `PrototypeNotice` on the calls page already promises this governance exists before real data flows).
4. Target calls-per-writer for the row 24 proxy.

### Effort: **8–12 days** portal-side (ingest route + HMAC + R2 streaming 3, consent workflow 1.5, metrics pages 2, tests 2.5 — this is a new authentication surface and gets the heaviest test budget, plus vendor integration slop 1–3).

### VIGIL / test pins
- Forged/expired/replayed HMAC → 401, no row written, deny audit event (the ingest analog of the session-forgery suite).
- Ingested calls default `consent_status = 'pending'` and the recording route still refuses them (extends the existing consent-gate tests).
- Idempotent ingest on duplicate `transferId`.
- Recording object keys are server-generated — a payload-supplied key must not be honored (path-traversal / object-overwrite pin).
- SW test untouched: new `/api` or `/portal` paths remain uncached by construction.

---

## 6. Phase 4 — Leader engine + gate dashboards (rows 18, 19–22)

**Last by dependency, not value: rows 20–22 only mean something once production data (Phase 1) defines "productive." Note: `agent_roster.officeId`/`leaderEmail` land in Phase 1, so partial row-20 counts are available early; this phase adds history, gates, and the dashboards.**

### Schema (`db/sql/0006_leader_engine.sql`)

```ts
export const OFFICE_GATES = [
  "candidate", "incubator", "shadow_branch", "open", "expand", "flagship", "replicated",
] as const;   // Part 1b's Gates A–D + Part 1c's pre-office stages

export const offices = sqliteTable("offices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  city: text("city").notNull(),
  name: text("name").notNull(),
  gate: text("gate").$type<OfficeGate>().notNull().default("candidate"),
  leaderEmail: text("leader_email"),
  openedAt: text("opened_at"),                 // null until Gate A passes
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  uniqueIndex("offices_name_idx").on(t.name),
  check("offices_gate_check", sql`${t.gate} IN (${literalSet(OFFICE_GATES)})`),
]);

/** Append-only. A gate change is a capital decision; the evidence rides with it. */
export const officeGateEvents = sqliteTable("office_gate_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  officeId: integer("office_id").notNull(),
  fromGate: text("from_gate").notNull(),
  toGate: text("to_gate").notNull(),
  decidedBy: text("decided_by").notNull(),     // session email
  evidence: text("evidence"),                  // JSON: {activeWriters, trailingAp, persistencyOk...}
  occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  index("office_gate_events_office_idx").on(t.officeId),
  check("office_gate_events_from_check", sql`${t.fromGate} IN (${literalSet(OFFICE_GATES)})`),
  check("office_gate_events_to_check", sql`${t.toGate} IN (${literalSet(OFFICE_GATES)})`),
]);

/** Append-only reporting history: who reported to whom, when. Rows 20–22 read this. */
export const leaderAssignments = sqliteTable("leader_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agentEmail: text("agent_email").notNull(),
  leaderEmail: text("leader_email").notNull(),
  effectiveFrom: text("effective_from").notNull(),
  effectiveTo: text("effective_to"),           // null = current; "closing" sets this, never deletes
  recordedBy: text("recorded_by").notNull(),
  recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  index("leader_assignments_agent_idx").on(t.agentEmail),
  index("leader_assignments_leader_idx").on(t.leaderEmail),
]);
```

(`agent_status_events` — same shape as `policy_status_events`, keyed by agentEmail — also lands here if not pulled into Phase 1, completing row 12.)

### Derivations
- Row 20: leaders = distinct `leaderEmail` with ≥1 current assignment; agents-per-leader distribution; "productive leader" applies the owner's productive-agent definition through a join to `production_records`.
- Row 21: `office_gate_events` where `toGate = 'replicated'`, per month.
- Row 22: leaders whose count of *productive* current assignees ≥ 12 (and ≥ 6 for incubator tracking).
- Row 18: agents with active status at `openedAt + 6/12 months`, per office, as a cohort table with the same `—`-for-too-young discipline as persistency.
- Gate dashboard: for each office, current gate vs. Gate-A/B/C thresholds (12/25/50 productive agents, $300K/$625K/$1.25M trailing AP — thresholds in `scorecard_config`, not constants) computed live from Phases 1–2 data. **The dashboard advises; a human decides and the gate event records who.** Automating gate transitions would move a capital decision into code — do not.

### Capabilities (governance decisions)
- `leadership.manage` (record assignments, move gates): owner/admin, likely manager-excluded initially.
- Team-scoped production visibility — `production.view.team` (a manager/leader sees production for agents currently assigned to them, resolved server-side through `leader_assignments` by session email). This is the phase where the row-based scoping pattern gets its first real test; it must be filtered in SQL from the session, never by a client-supplied leader parameter.

### Decisions from owner
1. The "productive" threshold (blocks rows 20–22 semantics).
2. Gate thresholds as config values, and whether persistency-acceptable is a Gate-A hard requirement (Part 1b says yes; Part 2b says the compliance spine belongs in the gates too — a `evidence` JSON field is where "state consent architecture live" gets attested).
3. Whether leaders are portal members (they need to be, to hold `production.view.team`) — which forces confirming their sign-in addresses, the same trap § 5 records for Oscar and Nate.
4. `leadership.view.all` currently exists and is held by owner/admin/manager — whether the new dashboards ride on it or on new capabilities.

### Effort: **6–10 days** (schema + assignment/gate write routes with audit 2.5, dashboards 2.5, team-scoping + tests 2.5, migration 0.5).

### VIGIL / test pins
- Team scoping: leader A's session cannot retrieve leader B's team production by any parameter manipulation.
- Gate events append-only; a gate change without `leadership.manage` → 403 + deny audit.
- Leader-assignment "changes" close the old row (`effectiveTo`) and open a new one — history is never rewritten (the org chart at any past date must be reconstructible; that's the founder-dependence and leader-defection evidence base).
- Client-chunk canary extended to office/leader economics.

---

## 7. Sequence summary (value-per-effort order = phase order, with one caveat)

| Phase | Rows made real | Effort | External dependency | Cumulative scorecard coverage |
|---|---|---|---|---|
| 1. Carrier CSV → production + roster | 1, 3, 4, 5, 19(bands) | 6–8 d | carrier statement samples only | 4 of Part 1's six exit numbers |
| 2. Lapse reports → vintage curves | 6, 7 (+11, 12 month-granular) | 3–5 d | none new | "the valuation" rows |
| 3. Dialer ingest | call metrics, 24-proxy | 8–12 d | **dialer vendor contract** | demand-side begins |
| 4. Leader engine + gates | 18, 20, 21, 22, 12-complete | 6–10 d | leader sign-in addresses | scaling-plan dashboards |

Caveat: if the dialer vendor negotiation stalls, **Phase 4 should jump ahead of Phase 3** — it has zero external dependencies once Phase 1's roster exists, and rows 19–22 are what the 30-month scaling plan steers by. Phase 3's portal-side work can start the week credentials exist.

Total portal-side effort: roughly **23–35 days** to a scorecard where rows 1, 3–7, 11, 12, 18–22 are measured, 24 is proxied, and the finance/Lead Tech rows are honestly labeled manual — which is the "data room as a punch list you already pass" the strategy file ends on.

### Flags (things that would violate or strain existing invariants if done naively)
1. **Any client-side chart library holding production data as a module constant** re-runs the pay-rates incident with worse data. Props-from-guarded-server-page only; the build-grep canary test is the enforcement.
2. **The ingest route is the first non-cookie authentication path since the header retirement.** It must be spec'd and test-pinned with the same paranoia as `portal-authorization.test.mjs` — treat "payload says agent X" as a claim, never identity.
3. **Do not overload `portal_members` as the agent roster** — it would couple analytics writes to the table that grants access, and roster churn would start touching auth-critical rows.
4. **Pre-aggregating persistency** would silently bake in cohort definitions; keep raw events append-only and compute.
5. **Every schema change ships as a new `db/sql/000N` file applied alone** — the drizzle tree is regenerated for sync but never applied to the live database (CLAUDE.md's two-trees rule).
6. **Nothing in any phase touches `public/sw.js`, `/access`, or the retired-header posture** — the existing character-pinned and enumeration-oracle tests stay exactly as they are.