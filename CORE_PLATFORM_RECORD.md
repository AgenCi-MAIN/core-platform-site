# CORE / THRIVE platform — operating record

The single reference for what exists, where it lives, and how to operate it.
Written 2026-08-14, the day the portal was first self-hosted and signed into.

**No secret values appear in this file, and none ever should.** Secret *names*
are listed so you know what must exist; the values live only in Cloudflare's
secret store, Google Cloud console, and whatever password manager the owner
keeps. If a value ever lands in this file, rotate it rather than deleting it.

---

## 1. What this is

A permissioned operating portal for THRIVE, deployed as a single Cloudflare
Worker. The app serves a public site and a closed `/portal` — but since
2026-08-16 Cloudflare Access fronts the whole workers.dev domain: anonymous
requests are refused 403 at the edge before this application runs (see §16).
Everything under `/portal` is closed
by default and opens only to people who hold a membership row, at the role that
row carries. Two independent checks run on every request:

1. **Identity** — Sign in with Google proves who the visitor is.
2. **Membership** — an active `portal_members` row proves they belong to CORE
   and fixes their role.

Identity alone grants nothing: anyone on earth can complete step 1. Step 2 is
what actually protects the portal, and it fails closed — if the database is
unreachable or unmigrated, access is refused rather than assumed.

Every allow and every deny is written to an append-only `audit_events` table.

---

## 2. Live infrastructure

| Thing | Value |
| --- | --- |
| Public URL | `https://site-creator-vinext-starter.bankerrunners.workers.dev` |
| Worker name | `site-creator-vinext-starter` |
| Cloudflare account | `Bankerrunners@gmail.com's Account` — `e6f9d0a344a0a7b317601ffbe23f871e` |
| workers.dev subdomain | `bankerrunners` |
| D1 database | `site-creator-d1` — `e00c30f0-7017-49d8-9f81-446cef9e32c3` |
| R2 bucket | `site-creator-r2` (binding `CALL_RECORDINGS`) |
| GitHub repo | `bankerrunners/core-platform-site` |
| Working branch | `claude/new-session-9a8g4o` (PR #1) |
| Local checkout | **`C:\dev\core-platform-site` — the working copy. Deploy from here.** Corrected 2026-08-17: this row previously named `C:\Users\k2547\OneDrive\Desktop\core-platform-site`, which is **not** the copy deploys run from and **must not be worked in**. A git repository inside OneDrive fights the sync client for file handles: on 2026-08-17 that produced three escalating `Deletion of directory ... failed. Should I try again?` prompts in a single operation — first a remote-tracking ref, then untracked build output, then **`app/auth/callback`, which is tracked source**, leaving a half-reset tree one command away from a deploy. Three frozen backup copies also exist under ARCHIVE, MAINBACK, and RE SUMMON — never work in those either. |

The D1 id lives in `.openai/hosting.json`; `build/sites-vite-plugin.ts` carries
it into `dist/server/wrangler.json` at build time, which is the config
`wrangler deploy` actually reads.

~~Stray resource to clean up~~ — the accidental empty D1 database named `8`
(`5bc64b69-1c83-4826-adf8-dcad4f576885`) was deleted by the owner on
2026-08-15. Exactly one D1 database exists: `site-creator-d1`.

---

## 3. Identity — Sign in with Google

Implemented in the app itself. (Since 2026-08-16 Cloudflare Access sits in
front of the domain, but the app trusts nothing from it — identity still comes
only from the app's own `core_session` cookie.)

| File | Responsibility |
| --- | --- |
| `app/google-auth.ts` | Session cookie (`core_session`), token mint/verify, cookie helpers, return-path validation |
| `app/auth/signin/route.ts` | Starts OAuth 2.0 authorization-code flow with PKCE |
| `app/auth/callback/route.ts` | Exchanges the code server-side, validates the ID token, mints the session |
| `app/auth/signout/route.ts` | Clears the session cookie |
| `app/portal/access.ts` | Membership, roles, capabilities, audit writes |

The session token is `v1.<base64url payload>.<base64url hmac>`, authenticated
with HMAC-SHA256 under `SESSION_SECRET`. A token that fails verification for any
reason — bad format, bad signature, expired, malformed payload — is treated as
no identity at all. Sessions last 7 days.

Only Google addresses with `email_verified: true` are accepted. An unverified
address can be claimed by anyone at the provider, and since the allowlist is
keyed by email, admitting one would let a stranger register a member's address
and inherit their access.

**The retired `oai-authenticated-user-*` headers are ignored entirely.** Under
the previous hosting platform those headers carried identity, trustworthy only
because the platform stripped them from incoming requests. Self-hosted there is
no such platform, so a header would be writable by anyone — sending the owner's
email in a request header would have been enough to take the portal over.
`tests/portal-authorization.test.mjs` pins this shut with two suites: one
proving the retired headers grant nothing, one proving a forged, tampered, or
expired cookie is anonymous.

### Google OAuth client

Type **Web application**, in the Google Cloud project on the owner's account.
Exactly one authorized redirect URI:

```
https://site-creator-vinext-starter.bankerrunners.workers.dev/auth/callback
```

Authorized JavaScript origins: none — the flow is entirely server-side.

The consent screen is **External** and unpublished, so first-time users see an
"unverified app" interstitial. That is expected for a private app; continue via
**Advanced → Go to THRIVE Portal**.

**RESOLVED 2026-08-17: the client lives in the `core-portal` Cloud project
under `btcmao518@gmail.com`** (project id `core-portal-505803`). Google locked
the original `bankerrunners@gmail.com` account on 2026-08-17, killing the old
client with it; a new client was minted under the new identity, the two
Google secrets rotated via `wrangler secret put`, and sign-in verified live
the same night (btcmao518 signed in, bound, and read the founder-only audit
log). Full incident + decision record:
`strategy/2026-08-17-identity-recovery-docket.md`. Still open from that
docket: the Cloudflare account email swap (blocked on a lost password —
support ticket path; a scoped API token hedge exists), and Google recovery of
the old account for GitHub/Drive.

### Secrets (names only)

| Secret | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client id, ends `.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret, starts `GOCSPX-` |
| `SESSION_SECRET` | Long random string signing session cookies |
| `ANTHROPIC_API_KEY` | Powers the JARVIS Presence (member Q&A pet). Optional — absent means the Presence answers with an honest 503, nothing else breaks. Get one at console.anthropic.com, set with `npx wrangler secret put ANTHROPIC_API_KEY -c dist/server/wrangler.json`. |

**The Presence's isolation contract (governance, 2026-08-15).** The
`pet.chat` capability was granted to every role: the Presence is the one
model-powered surface members can talk to, and it is safe because it is
architecturally inert — the model gets no tools, its output is rendered as
plain text, and the route holds no credential except the API key (which can
spend tokens and nothing else). A prompt injection through it yields words
in a chat bubble. Spend is bounded: ~700 tokens per answer, 40
answers/member/day (counted from the audit log), every exchange audited
with token usage. Adding a tool or a write path to that route is a
governance decision. Model: `claude-opus-5` by default; set the
`PRESENCE_MODEL` variable (a plain var, not a secret) to
`claude-haiku-4-5` for the budget option (~5× cheaper per answer) —
owner's call, undecided as of this writing.

List what is set (never prints values):

```powershell
npx wrangler secret list -c dist/server/wrangler.json
```

Rotating `SESSION_SECRET` signs everyone out and breaks nothing else. Nobody
ever needs to know its value.

---

## 4. Roles and capabilities

Deny by default: a role holds exactly what is listed and nothing more.
Capabilities are enforced server-side, not merely hidden in the interface.

| Capability | owner | admin | manager | reviewer | agent | support |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `portal.access` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `dashboard.view.self` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `book.view.self` | ✅ | ✅ | ✅ | — | ✅ | — |
| `calls.review` | ✅ | ✅ | ✅ | ✅ | — | — |
| `scripts.manage` | ✅ | ✅ | — | ✅ | — | — |
| `team.view` | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| `leadership.view.all` | ✅ | ✅ | ✅ | — | — | — |
| `members.view` | ✅ | ✅ | ✅ | — | — | — |
| `members.manage` | ✅ | ✅ | — | — | — | — |
| `pet.chat` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

`audit.view` is granted to **no role**: the audit log and the INVESTIGATOR
console are founder-only, gated by identity (`requireFounder`), not by
capability — see the governance note in § 5. The name survives only as the
audit-row action for those pages' own allow/deny records.

Guard a page with `requireCapability(...)`; guard a write with
`assertCapability(...)`. Never import `app/portal/access.ts` from a
`"use client"` file. Adding a capability to a role is a governance decision.

---

## 5. Members

| Email | Name | Role | Granted |
| --- | --- | --- | --- |
| `btcmao518@gmail.com` | Yuxiang Mao (Shawn) — **current founder identity** | owner | owner-migration 2026-08-17 (`db/sql/0003`); signed in and bound 2026-08-17 |
| `bankerrunners@gmail.com` | Yuxiang Mao (Shawn) — retired identity (Google locked the account 2026-08-17; cannot sign in; row retained for the record; **outreach PAUSED through 2026-08-20 — do not email this address; after that, owner's word required, A12**) | owner | bootstrap, 2026-08-14 |
| `ryandavidson.zenith@gmail.com` | Ryan Davidson | owner | by Shawn, 2026-08-14 |
| `epiclife.nguyen@gmail.com` | Nate Nguyen | owner | by Shawn, from the portal, confirmed on the live roster 2026-08-15 |
| `andrew.davidson.zenith@gmail.com` | Andrew Davidson (Ryan's brother) | owner | approved by Shawn 2026-08-15 ("shawn-aprooved"); granted from the portal 2026-08-15, first sign-in bound 2026-08-16 — LIVE (roster screenshot verified by the owner) |

Pending: **Oscar Valencia** is named as an owner in the agreement record, but
his sign-in address was never confirmed. Confirm the exact Google address he
signs in with before granting — seeding a wrong address grants nothing and
looks like a broken portal.

**The owner's other addresses are aliases, not identities (recorded
2026-08-15).** Shawn is Primary admin of a Proton account carrying several
alias addresses (as shown on his admin panel: `bankerrunners@pm.me`,
`bankerrunner@pm.me`, `thrivelife.mao@pm.me`, plus `bankerrunners@proton…`,
`BankerBankss@proton…`, `schmitzLanwalker@proton…`, `schmitzLanwalker@pm…`,
`CORE_inbox_pm@pm…` — those last were truncated on screen; confirm the full
spelling before ever writing one anywhere that matters). All of them are the
same person. **None of them signs in to the portal.** The one and only portal
identity for Shawn is `btcmao518@gmail.com` (migrated 2026-08-17 from
`bankerrunners@gmail.com`, which Google locked). Never grant an alias its own
member row — a second row for the same human is the identity-ambiguity state
the portal refuses, and an alias grant would sit unused as a standing
credential. NumberBarn (business line) is registered under one of these
aliases; that is a vendor login, not a portal identity.

**The audit log and the INVESTIGATOR console are founder-only (governance,
set by Shawn 2026-08-15).** Both `/portal/audit` and `/portal/investigator`
are gated by `requireFounder` — identity, not capability: only the founder
(`btcmao518@gmail.com` since the 2026-08-17 migration; originally the
2026-08-13 seed `bankerrunners@gmail.com`, retired when Google locked it —
verified via Google sign-in and the HMAC-signed session) resolves them. Any
other email —
including a second owner — is refused and the refusal audited as
`founder_only`. `audit.view` was removed from every role's grant list (the
capability name survives only as the audit-row action). In the sidebar, the
Audit item renders only for the founder, and the INVESTIGATOR console is
reached through the wordless status-dot control, likewise rendered only in
the founder's own sidebar. Tests pin both gates.

**Owner rows are peer-protected (governance, set by Shawn 2026-08-15).** No
owner or administrator can change another owner's role or status from the
portal — `/portal/members/manage` refuses with `owner_peer_protected` and the
refusal is audited. Changing or removing an owner is a D1-console operation
only (the SQL below). This subsumes the earlier last-active-owner rule: no
owner can be demoted or suspended through the route at all.

**Console inserts must use a lowercase email — this is load-bearing.** The
unique index on `portal_members.email` is case-sensitive and every app write
lowercases first. A mixed-case row inserted by hand at the console would be
invisible to the route's lookups, and a later portal grant of the lowercase
form would create a second row for the same person — the identity-ambiguity
state, this time wearing an owner's face. Adversarial audit 2026-08-15 rated
the route SOLID with this as the one out-of-band gap; a `CHECK
(email = lower(email))` constraint is the durable fix if a migration is ever
cut for other reasons.

### How membership actually works

- `email` must be the address of the Google account the person signs in with,
  lowercased. It is not necessarily the address on file elsewhere in CORE.
- `subject_id` starts NULL and binds permanently on that person's first
  successful sign-in. After binding, a different Google account presenting the
  same email is refused (`subject_conflict`) rather than handed the membership.
- Resolution is **subject first, then email**. If the two lookups return
  different rows, access is refused as `identity_ambiguous` rather than guessed.
- A role the application does not recognise is refused as `invalid_role`, not
  run with undefined permissions.

### Granting someone access

**Normally: Portal → Members.** Grants, role changes, and status changes are
live in the interface. Every one of them posts to `/portal/members/manage`,
which re-resolves the session, asserts `members.manage`, and writes an audit row
under your name whatever the outcome. Three rules are enforced server-side and
cannot be clicked past: one approver may grant any role, nobody may change their
own row, and the last active owner cannot be demoted or suspended.

**The D1 console is now the fallback, not the procedure.** It is still the only
way in when nobody can sign in at all — an empty roster, a locked-out owner, a
portal that will not load — so the SQL stays here. Reach for it in that case and
not otherwise; a grant applied by hand writes no audit row, so the log will not
show who did it.

**Cloudflare dashboard → Storage & databases → D1 → `site-creator-d1` → Console**

```sql
INSERT OR IGNORE INTO `portal_members`
  (`email`, `display_name`, `role`, `status`, `granted_by`, `status_note`)
VALUES
  (
    'person@example.com',
    'Their Name',
    'agent',              -- owner | admin | manager | reviewer | agent | support
    'active',
    'btcmao518@gmail.com',
    'Granted by Shawn on YYYY-MM-DD.'
  );

INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'members.manage',
    'allow',
    'role_granted',
    'portal_members',
    '{"granted":"person@example.com","role":"agent"}'
  );

SELECT email, display_name, role, status FROM portal_members;
```

Always write the audit row alongside the grant — the audit trail is what makes
the access model worth trusting, and a silent grant defeats it.

### Suspending or revoking

```sql
UPDATE `portal_members`
   SET `status` = 'suspended',           -- or 'revoked'
       `status_note` = 'Reason, date, who decided.',
       `updated_at` = CURRENT_TIMESTAMP
 WHERE `email` = 'person@example.com';
```

Anything other than `active` refuses access at sign-in and records the refusal.
Prefer suspend/revoke over deleting the row: deleting discards the subject
binding and the history of who they were.

---

## 6. Data model

Three tables, defined in `db/schema.ts` (Drizzle) and mirrored as hand-written
DDL in `db/sql/0001_portal_init.sql`.

**`portal_members`** — the allowlist. Unique index on `email`, unique index on
`subject_id`, index on `role`. CHECK constraints reject unknown roles and
statuses at the database level, so an invalid role can only ever arrive from a
pre-existing row.

**`audit_events`** — append-only allow/deny record. Every access decision,
capability check, and member change lands here with actor, action, decision,
reason, resource, request path, and detail. Never edited, never deleted.

**`dialer_transfers`** — call records for the Dialer Beta surface, including
consent status and the R2 object key for the recording. Recordings are gated
twice: the caller must hold `calls.review`, and `consent_status` must be
`verified` before a recording will play.

### Applying the schema to a fresh database

```powershell
npx wrangler d1 execute site-creator-d1 --file=db/sql/0001_portal_init.sql --remote
npx wrangler d1 execute site-creator-d1 --file=db/sql/0002_portal_seed_owner.sql --remote
npx wrangler d1 execute site-creator-d1 --file=db/sql/0003_add_owner_btcmao518.sql --remote
```

**All three, in order — `0003` is not optional (D5-1, Tier 1, 2026-08-17).**
`0002` seeds `bankerrunners@gmail.com`, retired and Google-locked since
2026-08-17; only `0003` grants the live founder identity. A rebuild that stops
at `0002` produces a portal that builds, deploys, and answers — and that
nobody can sign into, founder included. The D1 console (§5) is then the only
way back in, which is exactly the case that section says it is retained for.

If `wrangler d1 execute --remote` fails with `Authentication error [code: 10000]`
(it did on wrangler 4.92.0 despite Super Administrator permissions), paste the
file contents into the D1 console instead. That is how the live database was
provisioned.

**Founder-attribution exception (owner order F6, 2026-08-17).** The seed
migrations `0002`/`0003` carry a `-- Seeded by: Yuxiang Mao (Shawn)` provenance
comment. This is the one sanctioned edit to an applied migration: it is
comment-only, the loader and a fresh provision strip `--` lines before running,
so the applied SQL is unchanged and re-provisioning is byte-identical in effect.
Do NOT read it as a licence to edit applied-migration SQL — that discipline
holds; only the founder-attribution comment is exempt, and only because the
owner ordered his name on the seeds.

`drizzle/` holds the same history as generated migrations, kept in sync by
`npm run db:generate` after any change to `db/schema.ts`. **Do not apply both
paths to one database** — `0001` uses `CREATE TABLE IF NOT EXISTS`, the drizzle
migration does not, and they collide. The live database used the `db/sql/` path.

---

## 7. Deploying a change

From the project directory:

```powershell
cd "C:\Users\k2547\OneDrive\Desktop\core-platform-site"
git pull
npm install
npm run deploy
```

`npm run deploy` is build → the full test suite (50 cases at this writing) →
preflight → `wrangler deploy`, chained so
that any failure stops the deploy. It cannot ship a stale `dist/`, because the
build always runs first and the preflight checks the result. Secrets survive
deploys; they only need setting again if they change.

### What the preflight checks, and why it exists

`scripts/verify-build.mjs` runs between the tests and the deploy. It refuses if:

- there is no build output, or the worker bundle is implausibly small;
- the built config carries the placeholder database id `00000000-…`, or an id
  that disagrees with `.openai/hosting.json`;
- the `CALL_RECORDINGS` R2 binding or the assets directory is missing;
- **any source file is newer than the build output** — this is the one that
  catches trap § 9.2 directly;
- the installable-app files (`sw.js`, `offline.html`, the icons) are not in
  `dist/client`.

It needs no network and no Cloudflare credentials, so `npm run verify:build` is
safe to run on its own at any time to ask "is what is on disk deployable?"

This exists because the silent-stale-build failure in § 9.2 cost days: `npm run
build` failed invisibly on Windows, and every deploy afterwards reported success
while shipping the previous version. Nothing in that loop ever said "this is
stale". Now something does.

### Running the checks individually

```powershell
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm test              # builds, then runs both suites in Miniflare (real workerd, real D1)
npm run verify:build  # preflight only, no build, no deploy
```

To deploy without the gate — an emergency rollback, say — the long form still
works: `npm run build` then `npx wrangler deploy -c dist/server/wrangler.json`.
Prefer `npm run deploy`. The gate is there because this is an auth system.

The test suite is the safety net for the access model. It boots the built worker
in Miniflare with a real D1 and R2, applies the real migrations, and drives the
portal over HTTP — anonymous refusal on every guarded route, subject binding,
subject conflict, identity ambiguity, suspended members, per-role capability
enforcement, recording consent gating, music-prefix escape attempts, and session
forgery. If a change breaks the access model, these fail.

---

## 8. Local development

```powershell
npm run dev
```

For a signed-in local session without a Google round-trip, use the shim. It
mints the same cookie the callback mints, signed with the `SESSION_SECRET` from
`.dev.vars`:

```powershell
# .dev.vars in the repo root must contain SESSION_SECRET=<any long string>
$env:AS_EMAIL="btcmao518@gmail.com"; node scripts/dev-signin.mjs
```

Then browse `http://127.0.0.1:3010` instead of the dev server directly. The shim
binds loopback only, refuses to start outside development, and prints the
identity it is impersonating on every start. The role still comes from the
`portal_members` row for that address — it asserts identity, never authorisation.

`.dev.vars` is gitignored. Never commit it.

---

## 9. Traps that cost real time

1. **Every new terminal starts in `C:\Users\k2547`.** `cd` into the project
   first or every file-relative command fails with a confusing error.
2. **`npm run build` used to fail instantly on Windows.** The scripts began with
   `WRANGLER_LOG_PATH=... vinext build` — Unix-only syntax cmd.exe cannot parse.
   Fixed in commit `d9830f0`. The failure was quiet enough that `wrangler deploy`
   kept shipping a stale `dist/`, which is why deploys reported the placeholder
   database id `00000000-...` long after the real id was committed. **If a deploy
   ever mentions that placeholder again, the build did not run.**
3. **PowerShell may block `npx`** with "running scripts is disabled on this
   system". Fix: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or call
   `npx.cmd` instead.
4. **R2 must be enabled once in the dashboard** before `r2 bucket create` works
   (`code: 10042`). Wrangler cannot enable it; it needs billing verification.
5. **`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`** is a cosmetic
   Node-on-Windows crash during wrangler shutdown. The command's real output is
   printed above it — scroll up before assuming failure.
6. **Never paste example values from documentation or chat into a real field.**
   A placeholder client id pasted into `GOOGLE_CLIENT_ID` produced Google's
   `Error 401: invalid_client` and cost a full rebuild of the OAuth client. Copy
   credentials only from Google's own screen, using its copy button.
7. **Google takes a minute or two to propagate credential changes.** An
   `invalid_client` immediately after saving may just be timing — wait two
   minutes and retry once before assuming the value is wrong.
8. **`Error 401: disabled_client` is not `invalid_client`.** `invalid_client`
   means the value is wrong (traps 6–7). `disabled_client` means the client
   itself was turned off or deleted in Google Cloud console — the stored
   secrets may be perfectly correct. Do not rebuild credentials for it; check
   the client's enabled state first. Hit live on 2026-08-16.
9. **"This One-Time Pin has already been used!" on a phone, while the same
   account signs in fine on the desktop.** This is the Cloudflare Access wall
   (§16), not the portal's Google sign-in — Access is configured with One-Time
   PIN, so it mails a code. The Access email carries both a six-digit code and
   a single-use login link, and the link is spent by the first GET that touches
   it. On iOS, Gmail pre-fetches links before the user taps, so the fetch spends
   the code and the tap arrives second. The desktop escapes it because the code
   is typed into the tab already waiting.
   **Workaround:** never tap the link. Leave the tab on the "enter code" prompt,
   copy the six digits, and paste them back into *that same tab* — requesting a
   fresh code from a new tab invalidates the one the old tab awaits.
   **On an installed PWA (§10c) it is worse:** an iOS home-screen web app has
   its own cookie container, so an Access session completed in Safari does not
   carry into the installed icon, and leaving the app to fetch the code tends to
   lose the waiting context. PWA plus One-Time PIN fights itself on iOS.
   **The real fix is decided (A11, owner order 2026-08-17):** point Access at
   Google as the identity provider and retire the codes. It removes the email
   round-trip; it does not remove the second sign-in, since Access and the
   portal remain independent OAuth flows. That is Zero Trust dashboard work on
   the outer wall protecting everything, and the Access config is not in this
   repo (recovery docket §6: screenshot it) — steps, ordering, and the
   lockout-safe cutover are in
   `strategy/2026-08-17-access-google-idp-runbook.md`.
   Hit live on 2026-08-17, on the phone, from the welcome email's own link.

---

## 10. Open follow-ups

- [x] ~~Rotate `SESSION_SECRET`~~ — done by the owner, 2026-08-15, value never
      disclosed to anyone (which is the correct way to do it). All prior
      session cookies are invalid; one fresh Google sign-in per member.
- [x] ~~Delete the stray D1 database `8`~~ — deleted by the owner, 2026-08-15.
- [ ] **Confirm Oscar Valencia's sign-in address**, then grant him from
      **Portal → Members**. ~~Nate Nguyen~~ — granted by Shawn from the portal
      as `epiclife.nguyen@gmail.com`, confirmed on the live roster 2026-08-15.
      Section 5 keeps the SQL for the case where nobody can sign in at all.
- [x] ~~**Record the Worker version id on the next deploy.**~~ **Done
      2026-08-17.** **Correction, same day:** this entry first credited
      `7427f4f4` with closing the follow-up and called it the first post-gate
      code deploy. Both were wrong — **`5c9ed9eb-c9a3-4152-bfc9-67279c1ccce6`
      (post-PR#36) came first and is what closed it.** The error was honest
      but real: `5c9ed9eb` was recorded only on the old session's branch and
      had not reached `main` when this was written, so the record was
      corrected from the branch rather than the other way round. See
      DEPLOYMENT.md for the reconciled timeline. **Live version is now
      `95741dc5-8d09-4400-8a00-71d806912195`** (`main@4375633`), the third id
      preserved in a row. The version trail is restored. The gap it closes: the earlier 08-17 founder-gate deploy is
      owner-confirmed but its id existed only in the terminal and was lost, so
      between 08-16 and now the record could say *what* was live but not
      *which build*. **Standing practice that fixed it, keep using it:** pipe
      the deploy through `Tee-Object` to a dated log file — the id survives the
      scrollback. See §7.
- [ ] **Consider a custom domain** in place of the workers.dev URL. Add the new
      `/auth/callback` URI to the Google OAuth client *before* cutting over, or
      sign-in breaks at the moment the domain changes.
- [x] **Wire member management into the portal UI.** Done — `/portal/members`
      now grants, changes roles, and changes status through
      `/portal/members/manage`, which re-resolves the session and asserts
      `members.manage` on every request. Three governance defaults are settled
      in that route's header comment and each is reversible: one approver may
      grant any role, nobody may change their own row, and owner rows are
      peer-protected — no owner or administrator changes another owner from
      the portal (set by Shawn 2026-08-15, superseding the last-active-owner
      rule). Ships with the next deploy.
- [x] **Make the portal installable on a phone.** Done — see § 10c.
- [ ] **Merge PR #1** once the deployment is considered settled.
- [ ] **Decide the Quoter seam.** The sidebar links out to
      `app.insurancetoolkits.com`, which is outside this app's access model
      entirely: revoking someone here does not revoke them there. Either label
      it as leaving the portal, or bring it inside. This is a decision, not a
      bug.

---

## 10a. Sidebar labels are not route names

The deployed portal and this repository **are** in sync. The sidebar deliberately
uses operator-facing names that differ from the directory names, which makes the
running site look like it carries surfaces the code does not have. It does not.

| Sidebar label | Route | Source |
| --- | --- | --- |
| Dashboard | `/portal` | `app/portal/page.tsx` |
| Announcements | `/portal/announcements` | |
| Library | `/portal/library` | |
| Radio | `/portal/music` | |
| Book of Business | `/portal/book` | |
| **Call Lab** | `/portal/calls` | |
| **Script Vault** | `/portal/scripts` | |
| Team | `/portal/team` | |
| Leadership | `/portal/leadership` | |
| **Exchange** | `/portal/shop` | |
| **Quoter** | — | **external link, see below** |
| Pay Rates | `/portal/pay-rates` | |
| Members | `/portal/members` | |
| Audit | `/portal/audit` | |

The label ↔ route mapping lives in `app/portal/components.tsx`. Rename a label
there freely; renaming a *directory* changes a URL and breaks bookmarks.

**Quoter is not part of the portal.** It is an outbound link to
`https://app.insurancetoolkits.com/fex/quoter` — a third-party tool. This is
worth knowing precisely because everything else in this document is about a
closed access model: the moment a member follows that link they are outside it.
No capability is checked, no audit row is written, and whatever they do there is
governed by that vendor's terms, not THRIVE's. That may be entirely fine — but it
is a seam in the boundary, and it should be a deliberate choice rather than a
detail nobody noticed.

## 10b. The board presentation

`presentation/` holds four self-contained HTML pieces built for the CEO board,
the narration script, and a README explaining the reasoning behind each. Open
any of them in a browser; no build step, no network required.

The rule they all follow, and which should survive into anything that replaces
them: state what runs today as fact, label what is planned as planned, and say
out loud what the technology cannot do. A board that finds overstatement on its
own stops believing the accurate parts too.

## 10c. Installing the portal on a phone (PWA)

The portal is installable. On iOS: Safari → Share → **Add to Home Screen**. On
Android: Chrome offers **Install app** on its own. It opens without browser
chrome, keeps its own icon, and starts at `/portal`.

This is not a second application. There is no App Store listing, no Apple
developer account, no separate codebase, and nothing to review before a change
reaches a member's phone — an installed copy is the same site in a standalone
window, and it picks up every deploy. It is also why building it was a day
rather than the two to four months a native iOS app would have been.

**Installing grants nothing.** The installed shell is a browser sending the same
`core_session` cookie to the same guarded routes, and every one of them
re-resolves identity and membership server-side. A visitor with no membership
row who installs it lands on `/access`, exactly as they would in a tab.

The service worker is the part worth reading before changing. `public/sw.js`
caches content-hashed build assets and a handful of root files, and **nothing
else** — no navigation, and nothing under `/portal` or `/auth`. That exclusion
is load-bearing, not a performance trade-off: a cached portal page would answer
without re-checking the session, so a suspended member's phone would keep
serving them the book of business and a signed-out device would keep showing
whatever it last saw. Anything the worker does not recognise is passed to the
network untouched. A test asserts the exclusions and the number of cache writes,
so adding one fails the suite rather than a member's device.

When the network is gone, a navigation gets `public/offline.html` — a static
page that shows nothing about anyone. That includes `/portal` navigations, and
it is the one place the worker touches a portal request: the manifest's
`start_url` is `/portal`, so launching an installed copy with no signal was
otherwise the single most likely offline moment and the only one that fell
through to the browser's error page. The interception catches a network
*failure* and nothing else — on success the server's response is returned
verbatim, no cache is read or written, and no portal content is ever involved.

A test pins that branch **character for character** after stripping comments.
Four mutations were tried against it — serving a cached portal page, caching the
response, widening it past navigations, and dropping the `/auth` exclusion — and
all four fail the suite. If you change it deliberately, the test tells you to
re-read what the change does to a suspended member's installed app before you
update the string.

| Path | What |
| --- | --- |
| `app/manifest.ts` | Web app manifest → `/manifest.webmanifest` |
| `public/sw.js` | Service worker — asset cache only, never `/portal` |
| `public/offline.html` | Offline fallback for navigations |
| `app/service-worker-boot.tsx` | Registration script, deferred to `load` |
| `public/icon-*.png`, `public/apple-touch-icon.png` | Install icons |

The icons were rasterised from `public/favicon.svg` by a script in the session
scratchpad, not by hand: the container had no imaging library, so it wrote the
PNGs with `zlib` and `struct` directly. To change the mark, edit the SVG and
re-render at 192, 512, maskable 512 (full-bleed, mark inside the safe circle),
and 180 for iOS.

Two things about this stack are worth knowing before touching the head tags.
vinext's viewport renderer has no `viewportFit` case, so that directive rides on
the `width` field in `app/layout.tsx`; and its `appleWebApp.capable` emits only
the modern `mobile-web-app-capable` name, which Safari does not read — the
`apple-` prefixed one is added through `other`. Both are commented at the point
of use and pinned by tests.

## 10d. Telephony — the AI staff line (Inkbox) and the parked number (NumberBarn)

Status as of 2026-08-15, recorded mid-provisioning so it can be resumed.

**The decision.** Shawn approved upgrading the Inkbox organization to the
$30/month plan (10 agent identities; 1 dedicated phone number with SMS/MMS
and calls; 300 SMS + 30 call minutes/month; custom email domains; watermark
removal). The upgrade is done at
`https://inkbox.ai/console/organizations?tab=billing`. Until it is paid, the
provisioning call below returns a plan-limit error — that is the one
remaining blocker; the API key and command are already proven good.

**The provisioning call.** Run on Windows PowerShell, three commands in one
window (the key lives only in that window's `$key` variable):

```powershell
$key = Read-Host "Paste your Inkbox API key"   # paste at the prompt, not into this line
$key.Length                                    # sanity check — prints a number, never the key
Invoke-RestMethod -Method Post -Uri "https://inkbox.ai/api/v1/phone/numbers" -Headers @{ "X-API-Key" = $key } -ContentType "application/json" -Body '{"agent_handle":"core","state":"UT","incoming_call_action":"auto_reject"}'
```

Success is JSON carrying a `+1…` number and `sms_status: "pending"`. Choices
embedded in that body, all deliberate: the number belongs to the `@core`
identity (J.A.R.V.I.S.); `state: "UT"` is home base (Tampa was considered and
declined — the staff line belongs where the company lives);
`incoming_call_action: "auto_reject"` because Inkbox's default would put
their stock voice AI on THRIVE's line un-briefed — flipping to
`hosted_agent` is a later, deliberate step after the voice agent is
configured. Releasing an Inkbox number is **irreversible**; the org cap is 3
numbers, 1 per identity.

**Key hygiene (incident, 2026-08-15 — CLOSED 2026-08-17).** One API key was
accidentally pasted into the session chat and was ordered revoked and
replaced — a key that has touched a transcript is burned, no exceptions.
Keys are minted at `inkbox.ai/console/api-keys` (the middle row-icon is
"new key with same scope"; the full secret is shown exactly once, at
creation). As everywhere in this record: secret *values* never appear in
files, commits, or chat — only names.

**Resolution, 2026-08-17 (owner-confirmed).** The owner deleted **all** API
keys in the Inkbox console. The console listing he reviewed immediately
before doing so showed a single key, `API Caller*1`, scope **Admin (all)**,
created 2026-08-15 by the retired "Bank Runner" identity, last used the day
it was created — an unrevoked full-scope credential owned by an identity
Google had since locked, which is the worst of the set and the one the
2026-08-15 incident had ordered killed. Nothing was minted to replace it,
deliberately: the Claude↔Inkbox connector authenticates separately and does
not use an API key, and the key's only real job — the REST call that
provisioned the staff number — was already complete. **Mint a key at the
moment a task needs REST access, never in advance**; an unused key is only
an unrevoked key waiting to leak, which is what put the Aug-12 set on the
list in the first place.

*Verification boundary, stated plainly:* MAIN did not and could not verify
the deletions independently — the Inkbox connector was disconnected from
the session at the time. This entry records the owner's own confirmation,
not an observed console state. The earlier expectation of three unused
Aug-12 keys plus a separate `@out-reach` desk key did not match the single
row the console showed; whether they were already gone, scoped to another
view, or never existed as recorded is **unresolved**, and the record should
not be read as settling it.

**Compliance posture.** The line is receiving-first. Outbound SMS is gated
by 10DLC campaign registration (Inkbox enforces this too), which matches the
portal's own no-outbound-consumer-texting stance. HERALD's hourly patrols
pick up SMS to the new number automatically once it exists.

**The parked number — owner decision, 2026-08-15 evening.** `(850) 809-0050`
sits at NumberBarn on the $2.99/mo Park plan under one of the owner's alias
logins. NumberBarn's charge card was declined on 2026-08-11 and the owner
ruled **"disregard — using Inkbox"**: telephony consolidates on Inkbox, the
declined card is deliberately left unfixed, and it is understood that
NumberBarn will eventually release the 850 number for non-payment —
accepted, not an accident. If that number ever matters again, the payment
method must be fixed before NumberBarn's grace window closes.

## 11. Where things are

| Path | What |
| --- | --- |
| `app/page.tsx` | Public presentation page |
| `app/access/page.tsx` | Public sign-in intake — performs no membership lookup by design |
| `app/portal/` | The authenticated application |
| `app/portal/access.ts` | Authorization: capabilities, roles, resolution, audit |
| `app/google-auth.ts`, `app/auth/*` | Sign in with Google |
| `db/schema.ts`, `db/sql/`, `drizzle/` | Data model and migrations |
| `app/manifest.ts`, `public/sw.js`, `public/offline.html` | Installable-app layer — see § 10c |
| `tests/` | Access-model test suites (Node test runner + Miniflare) |
| `scripts/dev-signin.mjs` | Local sign-in shim, development only |
| `.openai/hosting.json` | Binding declarations and the real D1 id |
| `DEPLOYMENT.md` | Deployment record — overlaps this file, deploy-focused |
| `README.md`, `AGENTS.md` | Project docs and agent quick-start |

The access page deliberately performs **no** membership lookup: an
unauthenticated page that reported whether an address holds membership would be
a roster enumeration oracle. Its response is byte-identical for a member and a
stranger. Keep it that way.

## 12. Operational update — authenticated dialer inbox and call review

Completed 2026-08-15 in the working tree.

The Call Lab now has a complete authenticated read-and-playback flow over the
existing data bindings:

- `/portal/calls` remains the D1-backed transfer inbox and now links each
  transfer to `/portal/calls/review/:id`.
- `/portal/calls/review` is a guarded landing page; the path-parameter detail
  route is the canonical review hand-off because the current Vinext page
  adapter does not reliably expose query parameters to RSC page components.
- The detail view renders protected transfer context from `dialer_transfers`,
  lifecycle and consent state, reviewer prompts, and a conditional R2 audio
  player.
- Playback remains independently guarded by the signed-session membership
  resolver, `calls.review`, verified consent, `ready` lifecycle state, a
  recording object key, and the `CALL_RECORDINGS` R2 binding. Responses remain
  private and `no-store`.
- Recording object keys are constrained to the `calls/` namespace and audio
  content types are sanitized before the response is emitted. Invalid
  namespaces are refused and audited.
- No new capability was added and no role grant changed. Existing owners,
  administrators, managers, and reviewers retain `calls.review`; agents and
  support remain denied by default.
- Structured coaching notes are intentionally not persisted by this read-only
  flow. A future write path needs an approved review record, retention policy,
  reviewer ownership, and a separate audited capability decision.

Verification completed:

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed, 49 tests.
- `npm run verify:build` — passed; build reported safe to deploy.

## 13. Operational update — Agency Drive and Gmail reconciliation

Completed 2026-08-15 through the connected Google account. No credentials,
one-time codes, message bodies, or secret values were copied into this record.

Google Drive was reconciled against the prior session transcript rather than
assuming its reported moves were complete:

- `CORE — THRIVE AGENCY HQ` is now the only item at the My Drive root.
- The canonical `Mr.T-2.0.0 — skills rack` document was moved into Agency HQ.
- The extra shared copy was renamed as superseded and moved, without changing
  its sharing state, into the new `90 — Archive & Superseded` folder.
- Nothing was deleted.
- The existing native Google Doc `00 — THE AGENCY (master file)` remains the
  master index. A connector-verified status section was appended with a native
  date chip, headings, and lists covering Drive, Gmail, portal delivery,
  integrity boundaries, and the owner-review queue.

Gmail was organized with reversible labels and selective archiving:

- Added `AGENCY/Action Required`, `AGENCY/Development & Deployments`,
  `AGENCY/Security & Access`, and `AGENCY/Telecom & Dialer`.
- Reused the existing Vendors, Receipts, Security Alerts, and Marketing labels.
- Labeled 31 messages across 18 threads as Action Required. At verification,
  18 of those messages across 17 threads remained unread for owner review.
- Marked read and archived 17 completed GitHub session-notification threads,
  five expired access-code threads, and four passive subscription/community
  threads. Three older receipt messages were labeled and archived. No message
  was deleted.
- The declined NumberBarn card notice was removed from Action Required, marked
  read, and archived under the standing owner decision to disregard that
  parked-number payment.
- Post-cleanup inbox verification reported 47 messages across 30 threads, with
  22 messages across 20 threads unread. Current access codes and unresolved
  human, billing, security, and onboarding items were deliberately retained.

Integrity correction: claims in older records about an active Inkbox staff
inbox, hourly HERALD polling, iMessage routing, persistent AI staff, phone
provisioning, or automated external outreach were not verified by this
assignment. They remain proposed or unconfirmed until the relevant service and
automation are connected and checked. AI task runtimes are not continuous
people; continuity comes from authenticated systems and durable records.

## 14. Owner-declared first Pro Plan Enterprise seed

Recorded from Yuxiang Mao's direct instruction on 2026-08-15.

- **Seed designation:** `1st-ProPlanEnterprise` (normalized from the owner's
  wording, "1st-ProPlanEnterprice").
- **Seeded by:** Yuxiang Mao (Shawn).
- **Owner-stated timestamp:** 11:33 on 2026-08-15. The instruction did not
  specify AM/PM or a timezone, so this record does not infer either one.
- **Commercial amount shown:** $200.00 monthly subscription plus $12.80 sales
  tax, for $212.80 due at checkout.
- **Evidence status:** owner-declared seed; payment completion not yet verified.
  The supplied checkout image still displayed the `Subscribe` action and is
  evidence of the quoted amount, not a successful charge or receipt.
- **Access effect:** none. This record does not grant, expand, or activate
  "total proxy access." `bankerrunners@gmail.com` retains only the founder and
  owner permissions already established by the portal's audited capability
  model. Any new proxy authority requires a defined scope, successful payment
  evidence if payment is a prerequisite, and a separate approved access change.

## 15. Workforce Codex-project entry gate

Owner instruction recorded on 2026-08-15: **the workforce must enter through
the CORE Codex project first.** This rule is now in force in `WORKFORCE.md`.

Operationally, each workforce assignment must start with the active workspace
confirmed as `C:\Users\k2547\OneDrive\Desktop\20xchat` and with `AGENTS.md`,
`CLAUDE.md`, `CORE_PLATFORM_RECORD.md`, and the applicable role brief loaded.
This is a project-context gate, not a credential grant: it does not authenticate
the worker to the production portal or any external service, alter a member
row, add a capability, or expand proxy authority. If the correct project
context cannot be verified, the assignment must fail closed before work begins.

## 16. CORE 2.0.0 portal announcement

Published 2026-08-16 from Shawn's direct instruction.

- **Title:** `What 2.0.0 is`.
- **Author displayed:** Shawn.
- **Source:** the owner-supplied text already recorded under the same heading in
  `RELEASE-2.0.0.md`; the portal renders that text without AI-authored additions.
- **Placement:** the announcement is the single pinned release on
  `/portal/announcements`, and its headline and text preview are surfaced on
  the authenticated `/portal` dashboard.
- **Audience and access:** every active portal role can read it through the
  existing `dashboard.view.self` guard. No capability, membership, role, or
  authentication rule changed.
- **Verification:** TypeScript and lint passed; the production suite passed all
  50 tests, including an active-support-role render of the dashboard and full
  announcement plus the existing anonymous-refusal coverage. The deployment
  preflight confirmed the D1 id, R2 binding, current source, and static assets.
- **Deployment:** Cloudflare Worker version
  `a25dd5c8-46e7-4e6a-b751-73a1346e92e0` activated successfully at
  `https://site-creator-vinext-starter.bankerrunners.workers.dev`.

Post-deploy unauthenticated HTTP checks returned a Cloudflare Access redirect
for `/`, `/portal`, and `/portal/announcements`. That external access layer is
currently in front of the application, including the formerly public root; the
deployment did not alter the Cloudflare Access policy. The portal's own signed
session, membership, and capability checks remain independently enforced behind
that layer.

## 17. Operational update — retired J.A.R.V.I.S. 1.0.0 release post

Completed 2026-08-16 from Shawn's direct instruction to take down the post.

- Removed the announcement record `jarvis-1-0-0`, titled
  `CORE-J.A.R.V.I.S. 1.0.0`, including its release statement and roadmap list.
- Preserved the pinned `What 2.0.0 is` release and the existing J.A.R.V.I.S.
  introduction.
- No authentication, membership, capability, role, D1, R2, or Cloudflare
  Access rule changed.
- The production build completed, all 50 portal authorization and rendering
  tests passed, and deployment verification passed.
- Cloudflare Worker version `a48e884f-81dc-4297-8fd3-d37c6a326471` deployed
  successfully at
  `https://site-creator-vinext-starter.bankerrunners.workers.dev`.
- The retired post title, record ID, and Passive Income Stream Blueprint text
  are absent from both the current source and built deployment output. An
  unauthenticated request to `/portal/announcements` continues to receive the
  expected Cloudflare Access redirect.

## 18. Outbound send — platform welcome email to the founder

Sent 2026-08-17 on the owner's explicit order ("send welcome email to me from
platform"). Recorded because an outbound send that is not in the record does
not exist.

- **From:** `out-reach@inkboxmail.com` — the platform identity (Mr.T, MAIN
  orchestrator), sent through Inkbox. Not from the founder's Gmail; "from
  platform" was read as the platform's own identity.
- **To:** `btcmao518@gmail.com` (Yuxiang Mao / Shawn, current founder identity).
- **Subject:** `Welcome to the CORE / THRIVE platform`.
- **Inkbox message id:** `41a4a7bd-fdd8-4562-aa4e-ec9c103040ca`; thread
  `a2da7f18-f2e2-455f-bcb1-1f6816f3ea57`. Status `sent`. Open tracking off.
- **Contents, all drawn from this record:** the founder's roster row and owner
  role; the live URL and which Google address signs in; the three access layers
  (Cloudflare Access at the edge since 2026-08-16, identity, membership) and the
  fact that membership fails closed; deny-by-default capabilities and the
  append-only `audit_events` table; the sidebar surfaces (§10a); the two caveats
  worth stating — Audit and INVESTIGATOR are founder-only by identity rather
  than capability, and Quoter is an outbound third-party link outside the access
  model; PWA install and the `/portal` + `/auth` caching exclusion; and a closing
  note that this identity never sends on its own authority.
- **No change** to source, authentication, membership, capabilities, roles, D1,
  R2, or the Cloudflare Access policy. Nothing was deployed. No secret value
  appears in the message.

### 18a. Correction and resend, same day

The founder reported not receiving the message. Two separate facts came out of
checking, and only one of them was a delivery problem.

- **It was delivered.** Inkbox status on `41a4a7bd-…` moved `sent` →
  `delivered` one second after the send; the sending domain `inkboxmail.com`
  is platform-verified and no bounce or domain warning was recorded. Gmail
  accepted it. `out-reach@inkboxmail.com` is a cold sender to that inbox, so
  Spam or the Promotions tab is the expected landing place — the address is
  worth allow-listing before any further sends to it are judged missing.
- **The HTML body was malformed, and it was the sender's error.** The first
  send wrapped the HTML in a `<![CDATA[ … ]]>` marker, which is XML syntax with
  no meaning in an email body; it was transmitted as literal body text, so the
  stored body began with `<![CDATA[`. The plain-text alternative was unaffected.
- **Resent clean:** Inkbox message id `f47be1f7-32fd-4e05-baae-296b95097b43`,
  thread `73b631a6-691e-4b88-bf53-ce02dd519e04`, status `delivered`, with
  `reply_to` set to `out-reach@inkboxmail.com`. Same recipient, same subject,
  same content; the body now begins at the opening `<div>`. Both sends went to
  `btcmao518@gmail.com` — the address was correct in both.

The rule this leaves behind: an email body is HTML, not XML. Never wrap it in a
CDATA section, and check a send's stored `body_html` rather than trusting that
a `sent` status means the message rendered.

## 19. Outbound send — morning brief to all active members

Sent 2026-08-17 on the owner's explicit order ("send a morning brief in detail
to ALL members including me. Stating what was improved"). Recorded because an
outbound send that is not in the record does not exist.

- **From:** `out-reach@inkboxmail.com` — the platform identity (Mr.T), sent
  through Inkbox. `reply_to` set to the desk. Open tracking off.
- **To:** every active member on the roster (§5), one individual send each so
  delivery status is per-recipient and the greeting is personal. The retired
  `bankerrunners@gmail.com` row was skipped — Google-locked, the inbox is dead.

| Recipient | Inkbox message id | Status at send-time check |
| --- | --- | --- |
| `btcmao518@gmail.com` (Shawn) | `6c298a89-7512-44a8-a797-8a3135c3d800` | `delivered`; stored `body_html` verified to begin at the opening `<div>` (§18a rule) |
| `ryandavidson.zenith@gmail.com` (Ryan Davidson) | `a4ad883c-74fc-4004-a202-6cc39ab81c31` | `sent` |
| `epiclife.nguyen@gmail.com` (Nate Nguyen) | `635fa64f-8a98-462f-bf36-e7a8f125ac26` | `sent` |
| `andrew.davidson.zenith@gmail.com` (Andrew Davidson) | `1497e7ec-1605-4a88-a8dd-3ac01dce24a8` | `sent` |

- **Subject:** `CORE / THRIVE — Morning Brief, August 17, 2026`. Identical
  body for all four recipients apart from the greeting name.
- **Contents, all drawn from this record and the merged PR trail:** the
  2026-08-16 Cloudflare Access edge lock and the three fail-closed layers; the
  founder identity migration to `btcmao518@gmail.com` (A9), stated without any
  secret value; the command prompt + portal chrome deploy (PR #36) and the
  Tournament 3 Field Console merge (PR #39); the public-page dark-theme
  overlay fix (PR #37, serving version `7427f4f4`); the Tier 1 hardening batch
  (PR #40: D5-1 rebuild lockout, A8-5 audit action truthfulness, T4-1 inverse
  guard net, A8-1 founder-set pin) with the suite at 58/58; Inkbox key hygiene
  closed (B19/10d) and the old-account trigger stand-down (§ of PR #42). A
  closing note restates that the desk sends only on the founder's explicit
  order and that replies are drafted, never acted on autonomously.
- **What the brief deliberately omits:** member roster details beyond what
  each member already is (no other members' emails appear in anyone's copy —
  each send is single-recipient), the nine caption-only routine briefs and
  other open gaps (internal, founder-facing, not member-facing), and all
  secret names and values.
- **No change** to source, authentication, membership, capabilities, roles,
  D1, R2, or the Cloudflare Access policy. Nothing was deployed.
