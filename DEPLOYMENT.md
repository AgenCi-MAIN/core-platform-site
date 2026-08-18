# Deployment record — THRIVE / CORE portal

What is actually live, how it got there, and what to do next time. Written
2026-08-14, when the portal was first self-hosted on Cloudflare.

**This file must never contain secret values.** Secret *names* are listed; the
values live only in Cloudflare's secret store and in whatever password manager
the owner keeps.

## What is live

| Thing | Value |
| --- | --- |
| Public URL | `https://site-creator-vinext-starter.bankerrunners.workers.dev` |
| Worker name | `site-creator-vinext-starter` |
| Cloudflare account | `Btcmao518@gmail.com's Account` (`f39f3a77e56b28e4dfae29489a997014`) — GitHub SSO; migrated 2026-08-18, old account abandoned after cutover |
| workers.dev subdomain | `thrive18` — `https://site-creator-vinext-starter.thrive18.workers.dev` (was `bankerrunners`) |
| D1 database | `site-creator-d1` — `e19d74e0-1913-41a5-b695-cd1acc94d5ed` (new account) |
| R2 bucket | `site-creator-r2` (binding `CALL_RECORDINGS`) |
| First owner | `bankerrunners@gmail.com`, role `owner`, seeded by SQL |
| Second owner | `ryandavidson.zenith@gmail.com`, role `owner`, granted 2026-08-14 |
| Source branch | `main` (originally `claude/new-session-9a8g4o`, merged as PR #1; work has landed on `main` through the PR trail since) |

The D1 id is committed in `.openai/hosting.json`; `vite.config.ts` reads it
into the D1 binding config it hands the Cloudflare Vite plugin, which emits
`dist/server/wrangler.json` at build time — the config `wrangler deploy`
reads. (`build/sites-vite-plugin.ts` does not carry the id: it copies
`hosting.json` and `drizzle/` into `dist/.openai/` and hides the Vite build
manifest. Corrected 2026-08-17 against the code.)

## Identity

Sign in with Google, implemented in-app — see README "Sign in with Google".
The Google OAuth client is a **Web application** client in the `core-portal`
Google Cloud project (`core-portal-505803`) under `btcmao518@gmail.com` —
re-homed 2026-08-17 after Google locked the original `bankerrunners@gmail.com`
account, killing the old client with it (see CORE_PLATFORM_RECORD.md §3 and
`strategy/2026-08-17-identity-recovery-docket.md`). Exactly one authorized
redirect URI:

```
https://site-creator-vinext-starter.bankerrunners.workers.dev/auth/callback
```

Authorized JavaScript origins: none (the flow is server-side only).

The consent screen is **External** and unpublished, so Google shows an
"unverified app" interstitial on first sign-in — expected for a private app;
continue via **Advanced → Go to THRIVE Portal**.

Secrets set on the worker (names only):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`

Confirm with `npx wrangler secret list -c dist/server/wrangler.json`.

## How the database was provisioned

`wrangler d1 execute --remote` failed on wrangler 4.92.0 with
`Authentication error [code: 10000]` despite a Super Administrator token, so
the schema was applied through the **Cloudflare dashboard → Storage & databases
→ D1 → site-creator-d1 → Console** instead: the contents of
`db/sql/0001_portal_init.sql`, then `db/sql/0002_portal_seed_owner.sql`.

Verified with `SELECT email, role, status FROM portal_members;` returning one
row: `bankerrunners@gmail.com | owner | active`.

Either path is fine; do not use both on one database *and* also apply the
drizzle migrations — `0001` uses `CREATE TABLE IF NOT EXISTS` and the generated
migration does not, so they collide. See README for the full explanation.

## Redeploying after a code change

From the project directory:

```powershell
cd "C:\Users\k2547\OneDrive\Desktop\core-platform-site"
git pull
npm install
npm run deploy
```

`npm run deploy` chains build → tests → preflight → `wrangler deploy`, and any
failure stops it before anything ships. The preflight
(`scripts/verify-build.mjs`) is what makes gotcha 2 below impossible to hit
silently: among other things it refuses when a source file is newer than the
build output, or when the built config still carries the placeholder database
id. Run it alone any time with `npm run verify:build` — it needs no network and
no credentials.

The long form still works if you need to deploy without the gate:
`npm run build` then `npx wrangler deploy -c dist/server/wrangler.json`.

Secrets survive deploys; they only need setting again if they change.

## Gotchas that cost time, so they are written down

1. **Every new terminal starts in `C:\Users\k2547`.** `cd` into the project
   first or every file-relative command fails.
2. **`npm run build` used to fail instantly on Windows.** The scripts began
   with `WRANGLER_LOG_PATH=... vinext build`, which is Unix-only syntax that
   cmd.exe cannot parse. Fixed in commit `d9830f0`. The failure was silent
   enough that `wrangler deploy` kept shipping a stale `dist/` — which is why
   deploys reported the placeholder database id `00000000-...` long after the
   real id was committed. If a deploy ever mentions that placeholder again,
   the build did not run.
3. **PowerShell may block `npx`** with "running scripts is disabled on this
   system". Fix: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use
   `npx.cmd`.
4. **R2 must be enabled once in the dashboard** before `r2 bucket create`
   works; wrangler cannot enable it (`code: 10042`).
5. **`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`** is a cosmetic
   Node-on-Windows crash during wrangler shutdown. The command's real output is
   printed above it.
6. **Never paste example values from documentation or chat into a real field.**
   A placeholder client id pasted into `GOOGLE_CLIENT_ID` produced Google's
   `Error 401: invalid_client` and cost a rebuild of the OAuth client. Copy
   credentials only from Google's own screen, with its copy button.

## Follow-ups

- [x] **Rotate `SESSION_SECRET`.** Done 2026-08-14 — rotated after a candidate
      value touched a chat transcript during setup. (Rotating signs everyone
      out; nothing else breaks, and nobody needs to know the value.)
- [x] **Delete the stray D1 database named `8`.** Done 2026-08-14 — it was
      created by accident, confirmed empty, and deleted. The record § 2 keeps
      the note.
- [x] **Add the other owners — Nate Nguyen.** Done 2026-08-15:
      `epiclife.nguyen@gmail.com` confirmed by the owner and live on the
      roster. **Oscar Valencia remains genuinely pending** — his sign-in
      address is still unconfirmed; once confirmed, grant with the SQL in
      [CORE_PLATFORM_RECORD.md](CORE_PLATFORM_RECORD.md) § Members.
- [ ] **Consider a custom domain** in place of the workers.dev URL. Changing it
      means adding the new `/auth/callback` URI to the Google client before
      cutting over.
- [x] **Merge PR #1.** Done — merged; the deployment has since moved through
      releases up to 2.0.0 (see RELEASE-2.0.0.md).

## Deploy log addendum (2026-08-17)

- 2026-08-16: version `877e0c99` — open-redirect fix + call-review surface
  (first attempt hit transient Cloudflare 10013 at asset upload; retry
  succeeded).
- 2026-08-17: post-PR#24 deploy by the owner — ships the single-identity
  founder gate (FOUNDER_EMAILS = btcmao518@gmail.com). Version id was not
  captured into the record (owner's terminal only); it is permanently lost.
- 2026-08-17: version `5c9ed9eb-c9a3-4152-bfc9-67279c1ccce6` — deployed by
  the owner from `C:\dev` after PR #36 (`main@93edcfd`). Ships the founder's
  own J.A.R.V.I.S. command prompt, theme + performance controls, Presence
  expansion, and every merge since the founder-gate deploy — **the first code
  deploy after the founder gate**, and the first with its **version id
  captured at deploy time, closing the A9/§18 standing follow-up.** Suite ran
  green inside the deploy chain.
- 2026-08-17 (later): **version `7427f4f4-8026-4edb-9fa9-23ad403c7307`** —
  deployed by the owner from `C:\dev\core-platform-site` at `main@3141e99`.
  New content over 5c9ed9eb: PR #37, the cosmos-overlay fix on the public
  pages (the full tree it ships also carries #34–#36, already live since
  5c9ed9eb). One new client asset (`index-xSrqyJO7.css`, the 596-line
  globals.css change); everything else rode in the worker bundle. Suite ran
  green inside the chain (55/55) and the preflight passed.
  *Practice that made the ids survivable, keep using it:* pipe the deploy
  through `Tee-Object -FilePath "$env:USERPROFILE\Desktop\deploy-<date>.log"`.
  Two version ids have now been lost to terminal scrollback; none since.
  *Reconciliation note (2026-08-17):* the two entries above were first
  recorded independently — 5c9ed9eb on the old session's branch, 7427f4f4 on
  main via PR #38 — and each claimed to close the version-id follow-up, with
  #38's entry also calling 7427f4f4 the first post-gate code deploy. Merged
  here into the one true timeline: 5c9ed9eb came first and closed the
  follow-up; 7427f4f4 is the current serving version.
- 2026-08-17 (third): **version `95741dc5-8d09-4400-8a00-71d806912195`** —
  deployed by the owner from `C:\dev\core-platform-site` at `main@4375633`.
  **First code deploy of the Tournament 3 winner and of Tier 1.** New over
  7427f4f4: the S02 Field Console — `/portal/command` plus the `/go/hq`,
  `/go/routines` and `/go/desk` handoffs, every one founder-gated by
  `requireFounder` — and Tier 1 batch 1 (D5-1 runbook lockout, A8-1 identity
  pin, A8-5 audit-action parameter across all six founder call sites, T4-1
  inverse guard net). Suite 55 → **60**, green inside the chain; preflight
  passed. `/portal/command` is reachable in production from this version
  onward; before it, the surface existed only in the repository.
  Version id captured at deploy time via the `Tee-Object` practice — third
  consecutive id preserved, none lost since it was adopted.
- Account note (2026-08-17, SUPERSEDED next entry): the Cloudflare ACCOUNT
  email was to be swapped to btcmao518@gmail.com via support ticket (password
  lost, old inbox dead) — see strategy/2026-08-17-identity-recovery-docket.md.
  Overtaken by events: the owner chose a full account migration instead.
- 2026-08-18 (ACCOUNT MIGRATION): **version `5ecbce7a-020c-4892-9866-427c8c0a6cf5`**
  — first deploy to the NEW Cloudflare account (`Btcmao518@gmail.com's
  Account`, `f39f3a77e56b28e4dfae29489a997014`, GitHub SSO), at
  `main@b1cfffb` (#57). New serving URL:
  **`https://site-creator-vinext-starter.thrive18.workers.dev`** (new
  subdomain `thrive18`). Full data migration preceded it: D1 exported from
  the old account (7,453 statements) and imported into the new
  `site-creator-d1` (`e19d74e0-…`), roster of five owners verified by query;
  bucket `site-creator-r2` recreated (old bucket held no recordings; radio
  tracks re-upload from the owner's originals); all three secrets re-set;
  Google OAuth client gained the new origin + callback. **Owner sign-in on
  the new URL verified 2026-08-18** — the migrated membership row and
  subject binding answered. The OLD account
  (`e6f9d0a3…`/`bankerrunners` subdomain) is unreachable for administration
  (dashboard credentials lost, CLI token replaced) but its worker remains
  running behind its Access gate; members must be cut over promptly, since
  activity on the old site writes to the abandoned database and will not
  carry forward. Still open on the new account at the time of that entry: the
  Cloudflare Access edge gate, then the member announcement.
- 2026-08-18 (later): **Access edge gate rebuilt on the new account and
  verified by the owner.** Zero Trust team `thrive18`
  (`thrive18.cloudflareaccess.com`), login method Google ONLY (email PIN
  excluded — A11), using the same "THRIVE Portal" OAuth client as the app's
  own sign-in (the planned separate client was never created; the one client
  carries both origins/callbacks). Access application "THRIVE Portal" fronts
  `site-creator-vinext-starter.thrive18.workers.dev`, session 1 week, Allow
  policy = four named owner emails (btcmao518, ryandavidson.zenith,
  epiclife.nguyen, andrew.davidson.zenith — bankerrunners deliberately
  omitted: its Google account is locked and cannot pass a Google gate).
  Setup notes that cost time, kept for the next rebuild: the Google client's
  secret is only visible at creation (a rotation was needed — the fresh
  secret went to BOTH the Access IdP and the worker's GOOGLE_CLIENT_SECRET);
  and the first Test failed "User email was not returned" until the OAuth
  consent scopes (openid / userinfo.email / userinfo.profile) were added on
  the Google Auth Platform "Data Access" page. Remaining member-facing step:
  the cutover announcement. When a new member is seated they must be added
  in TWO places — the portal roster AND this Access policy.
- 2026-08-18 (current serving version): **version
  `fd0926a3-a01d-400a-8cda-b26095e8c7b2`** — deployed by the owner from
  `C:\dev\core-platform-site` at `main@9be299d`, on the new Cloudflare
  account, serving `https://site-creator-vinext-starter.thrive18.workers.dev`.
  Bindings confirmed present in the deploy output: `env.DB` →
  `site-creator-d1` and `env.CALL_RECORDINGS` → `site-creator-r2`. 41 client
  assets read from `dist/client`; no changed assets to upload, so the client
  bundle is unchanged from the previous version and the delta is worker-side.
  Total upload 2735.50 KiB (gzip 933.22 KiB); worker startup 30 ms.
  Version id captured at deploy time — the preserved-id streak continues.

  **What this version carries over `5ecbce7a`:** everything merged to main
  since the account migration, including the guarded verbatim Training
  library and its Training tab above Book of Business (#47, #48), the
  LeadTech/Retreaver/Twilio honest not-connected surfaces and the
  `COMMAND_CENTER_EMAILS` named allowlist (#55), the THRIVE navy theme rounds
  (#59, #60), the in-portal commission schedule (#58), the sales-tools and
  mission-map wiring (#62), the outreach log carrying decision A14 (#63,
  documentation only), and the THRIVE inbound portal, leaderboard and
  marketplace at the branch tip (#64).

  **Vercel note, recorded so it is not rediscovered:** a Vercel build of this
  repository fails at the post-build step with "The Next.js output directory
  `.next` was not found". The build itself succeeds — Vercel auto-detects the
  Next.js preset because `next` is a dependency, but `vinext build` emits
  `dist/client` and `dist/server`, not `.next`. This is not a settings bug to
  fix: the portal is a Cloudflare Worker needing the workerd runtime and the
  D1 binding, neither of which Vercel provides, so a Vercel deployment could
  only ever serve assetless static output at a second, unadministered
  address. Deploy only via `npm run deploy`.

  **Closed 2026-08-18:** the repository now carries a `vercel.json` setting
  `git.deploymentEnabled: false`. Vercel was connected to this repository and
  building on every push, so every commit — including documentation-only ones
  — produced a red "Build Failed" that meant nothing. The flag stops Vercel
  building at all while leaving the project connected. **The owner then
  deleted the Vercel project outright (2026-08-18), which is the clean end
  state.** `vercel.json` is deliberately kept even though the project is
  gone: it costs nothing, and it means a future accidental reconnection of
  this repository to Vercel produces no builds rather than a fresh run of
  red failures. Nothing about the Cloudflare deploy path changes.
