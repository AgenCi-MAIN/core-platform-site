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
Worker. The public site is open to anyone; everything under `/portal` is closed
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
| Local checkout | `C:\Users\k2547\OneDrive\Desktop\Core Folder 1\core-platform-site` |

The D1 id lives in `.openai/hosting.json`; `build/sites-vite-plugin.ts` carries
it into `dist/server/wrangler.json` at build time, which is the config
`wrangler deploy` actually reads.

**Stray resource to clean up:** an empty D1 database named `8`
(`5bc64b69-1c83-4826-adf8-dcad4f576885`), created by accident.
Remove with `npx wrangler d1 delete 8`.

---

## 3. Identity — Sign in with Google

Implemented in the app itself; there is no hosting platform in front of it.

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

### Secrets (names only)

| Secret | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client id, ends `.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret, starts `GOCSPX-` |
| `SESSION_SECRET` | Long random string signing session cookies |

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
| `audit.view` | ✅ | ✅ | — | — | — | — |

Guard a page with `requireCapability(...)`; guard a write with
`assertCapability(...)`. Never import `app/portal/access.ts` from a
`"use client"` file. Adding a capability to a role is a governance decision.

---

## 5. Members

| Email | Name | Role | Granted |
| --- | --- | --- | --- |
| `bankerrunners@gmail.com` | Yuxiang Mao (Shawn) | owner | bootstrap, 2026-08-14 |
| `ryandavidson.zenith@gmail.com` | Ryan Davidson | owner | by Shawn, 2026-08-14 |

Pending: **Oscar Valencia** and **Nate Nguyen** are named as owners in the
agreement record, but their sign-in addresses were never confirmed. Confirm the
exact Google address each one signs in with before granting — seeding a wrong
address grants nothing and looks like a broken portal.

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

The Members page is read-only — write actions were deliberately never wired
into the UI. Grants go through the D1 console:
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
    'bankerrunners@gmail.com',
    'Granted by Shawn on YYYY-MM-DD.'
  );

INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'bankerrunners@gmail.com',
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
```

If `wrangler d1 execute --remote` fails with `Authentication error [code: 10000]`
(it did on wrangler 4.92.0 despite Super Administrator permissions), paste the
file contents into the D1 console instead. That is how the live database was
provisioned.

`drizzle/` holds the same history as generated migrations, kept in sync by
`npm run db:generate` after any change to `db/schema.ts`. **Do not apply both
paths to one database** — `0001` uses `CREATE TABLE IF NOT EXISTS`, the drizzle
migration does not, and they collide. The live database used the `db/sql/` path.

---

## 7. Deploying a change

From the project directory, in this order. The build is what bakes the D1 id and
the app code into the deploy config, so a deploy without a fresh build ships
whatever `dist/` last contained.

```powershell
cd "C:\Users\k2547\OneDrive\Desktop\Core Folder 1\core-platform-site"
git pull
npm install
npm run build
npx wrangler deploy -c dist/server/wrangler.json
```

Secrets survive deploys; they only need setting again if they change.

### Verifying before you deploy

```powershell
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # builds, then runs both suites in Miniflare (real workerd, real D1)
```

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
$env:AS_EMAIL="bankerrunners@gmail.com"; node scripts/dev-signin.mjs
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

---

## 10. Open follow-ups

- [ ] **Rotate `SESSION_SECRET`.** A candidate value was pasted into a chat
      transcript during setup. If that value is the one in use, replace it:
      `npx wrangler secret put SESSION_SECRET -c dist/server/wrangler.json`.
      Rotating signs everyone out and breaks nothing else.
- [ ] **Delete the stray D1 database `8`**: `npx wrangler d1 delete 8`.
- [ ] **Confirm Oscar Valencia's and Nate Nguyen's sign-in addresses**, then
      grant them (section 5).
- [ ] **Consider a custom domain** in place of the workers.dev URL. Add the new
      `/auth/callback` URI to the Google OAuth client *before* cutting over, or
      sign-in breaks at the moment the domain changes.
- [ ] **Wire member management into the portal UI**, so grants and revocations
      stop requiring the D1 console. `members.manage` is already the gate; the
      write actions were deliberately deferred.
- [ ] **Merge PR #1** once the deployment is considered settled.

---

## 10a. The live site is ahead of this repository

The deployed portal shows surfaces this branch does not all contain — **Call
Lab**, **Script Vault**, **Quoter**, a system-readiness panel, and seat counts.
Before building on any assumption drawn from the code here, check the running
site first.

What is accurate in this document regardless: the access model, the identity
flow, the role and capability matrix, the deployment and secret inventory. What
may be stale: the surface list in section 5 of the presentation README and any
route inventory.

Reconciling the two — bringing this repository up to what is deployed, or
redeploying from this branch deliberately — is worth doing before the next
significant change, so that the code, the record, and the running system stop
disagreeing.

## 10b. The board presentation

`presentation/` holds four self-contained HTML pieces built for the CEO board,
the narration script, and a README explaining the reasoning behind each. Open
any of them in a browser; no build step, no network required.

The rule they all follow, and which should survive into anything that replaces
them: state what runs today as fact, label what is planned as planned, and say
out loud what the technology cannot do. A board that finds overstatement on its
own stops believing the accurate parts too.

## 11. Where things are

| Path | What |
| --- | --- |
| `app/page.tsx` | Public presentation page |
| `app/access/page.tsx` | Public sign-in intake — performs no membership lookup by design |
| `app/portal/` | The authenticated application |
| `app/portal/access.ts` | Authorization: capabilities, roles, resolution, audit |
| `app/google-auth.ts`, `app/auth/*` | Sign in with Google |
| `db/schema.ts`, `db/sql/`, `drizzle/` | Data model and migrations |
| `tests/` | Access-model test suites (Node test runner + Miniflare) |
| `scripts/dev-signin.mjs` | Local sign-in shim, development only |
| `.openai/hosting.json` | Binding declarations and the real D1 id |
| `DEPLOYMENT.md` | Deployment record — overlaps this file, deploy-focused |
| `README.md`, `AGENTS.md` | Project docs and agent quick-start |

The access page deliberately performs **no** membership lookup: an
unauthenticated page that reported whether an address holds membership would be
a roster enumeration oracle. Its response is byte-identical for a member and a
stranger. Keep it that way.
