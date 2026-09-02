# Deployment record — THRIVE / CORE portal

What is actually live, how it got there, and what to do next time. Written
2026-08-14, when the portal was first self-hosted on Cloudflare.

**This file must never contain secret values.** Secret *names* are listed; the
values live only in Cloudflare's secret store and in whatever password manager
the owner keeps.

## What is live

| Thing | Value |
| --- | --- |
| Public URL | `https://site-creator-vinext-starter.thrive18.workers.dev` — **the address to give a member.** Corrected 2026-08-18; this row named the retired `bankerrunners` address, which is frozen, unadministered, and backed by the abandoned database. |
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
https://site-creator-vinext-starter.thrive18.workers.dev/auth/callback
```

**Corrected 2026-08-18** — this block printed the pre-migration `bankerrunners`
callback. Both route handlers build the redirect from
`` `${url.origin}/auth/callback` ``, so the URI follows whatever host serves the
request; Google rejects any it has not registered. Owner-confirmed sign-in at
`thrive18` therefore proves the console lists that callback. Full reasoning in
CORE_PLATFORM_RECORD.md §3.

⚠️ On a **custom-domain cutover** the app immediately starts sending a callback
Google has never seen. Register the new URI *before* the switch or sign-in
breaks at that moment, with no warning from the code.

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

## Post-deploy probes — the telephony ingest

`/portal/calls/ingest` is the only path on this domain that Cloudflare Access
does not protect (CORE_PLATFORM_RECORD.md § 10e, OWNER-DECISIONS D10).
Everything else in this file can be checked from the deploy output; this cannot,
because the bypass is Zero Trust console state and the refusal is worker code,
and only a request from outside exercises both together. Run all five after
any deploy that touches the route — **and after any change to an Access
policy**, which is the case nothing else in the pipeline would notice.

Use `curl.exe`, not `curl`: in PowerShell the bare name is an alias for
`Invoke-WebRequest`, which does not take these flags and does not print the
status line.

```powershell
$h = "https://site-creator-vinext-starter.thrive18.workers.dev"
```

- [ ] **POST with no credential → `401`, empty body.**
      ```powershell
      curl.exe -sS -i -X POST "$h/portal/calls/ingest" -d '{}'
      ```
      Expect `Content-Length: 0` — no JSON, no field name, no reason. A
      refusal that explains itself tells an unauthenticated caller which half
      of the credential to fix next.

- [ ] **POST with a wrong secret of equal length → a byte-identical `401`.**
      Send a credential the same length as the real one, and diff the whole
      response against the probe above: status line, headers, body length. Any
      difference distinguishes *no credential* from *wrong credential*, which
      is the first rung of guessing the right one. The comparison behind it is
      constant-time for the same reason — a response that differs only in
      timing is the same oracle, more quietly.

- [ ] **GET the ingest path → `405`, and never a `302` to
      `cloudflareaccess.com`.**
      ```powershell
      curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" "$h/portal/calls/ingest"
      ```
      A `302` to `cloudflareaccess.com` means the bypass is not in place and
      the carrier cannot reach the route at all — SignalWire keeps
      answering calls and nothing records them. Anything that returns a body
      means the path answers reads, which a write-only ingest has no business
      doing.

- [ ] **GET `/portal/calls` → `302` to `cloudflareaccess.com`.**
      ```powershell
      curl.exe -sS -o NUL -w "%{http_code} %{redirect_url}`n" "$h/portal/calls"
      ```
      This is the probe that proves the bypass did not widen. The transfer
      inbox sits one path segment from the ingest route; if it answers
      anonymously, the bypass is covering a prefix rather than a path.

- [ ] **The same valid payload POSTed twice → exactly one row.**
      Post a payload carrying a `transfer_id` you can recognise, twice, then
      count it:
      ```sql
      SELECT COUNT(*) FROM dialer_transfers WHERE transfer_id = '<the id>';
      ```
      The answer is `1`. Carriers retry, and a retry must update the row, never
      duplicate it. Run the query in the Cloudflare dashboard D1 console —
      `wrangler d1 execute --remote` has failed on this account before (see
      "How the database was provisioned"). Both deliveries should still appear
      in `audit_events`: one row written, two arrivals recorded, because the
      audit trail is the whole basis on which unattended traffic is later
      trusted.

**The bypass must be scoped to the exact path, and anything mounted beneath it
inherits the bypass silently.** A policy on `/portal/calls/ingest` covers that
path. A policy on `/portal/calls`, or one written with a trailing wildcard,
hands the same anonymity to everything under it — including
`/portal/calls/recording`, which serves call audio, and the review pages that
render protected transfer context. Nothing announces that: a route added under
a bypassed prefix six months from now is public from the moment it deploys,
with no error, no log line, and no failing test unless someone wrote one to
look. The probes above are the only thing that notices, which is why the
fourth one — a gated path proving it is still gated — is not the
optional one.

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
- 2026-08-18: **version
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

- 2026-08-18: **version `607b3001-86e0-4dfb-aca5-ad809f6787e8`** — deployed by the owner at
  17:59:23 UTC, at 100% of traffic. **Recorded retroactively**, from
  `wrangler deployments list` rather than from the deploy output: this
  version served for over an hour before anything wrote it down, and the
  record still named `fd0926a3` as current while the owner was looking at
  this build in his browser. The `Tee-Object` practice in §7 exists exactly
  to prevent that and was not used here.

  **The outage this version ran into, and what actually caused it.** At
  19:27:44 UTC the site began returning **Cloudflare Error 1102, "Worker
  exceeded resource limits"** (Ray `a2d3514d3ff24757`). The cause was not the
  code: **the migrated Cloudflare account was on the Workers FREE plan**,
  which allows **10 ms of CPU per request**. This portal server-renders React
  on every page and does not fit in 10 ms. The owner upgraded to **Workers
  Paid** and the ceiling went to 30 s; no redeploy was needed, because a plan
  change applies to new requests immediately.

  **This is a migration trap, not a capacity problem — see §9.** The
  2026-08-18 account migration moved the data, the secrets, the bindings and
  the Access gate. It did not move the *subscription*. A new Cloudflare
  account starts on Workers Free, so the portal was running on a 10 ms budget
  from the moment it landed on `thrive18` and only failed once real use put
  enough pages through it. `fd0926a3` recorded "worker startup 30 ms" in its
  own deploy output — above the free per-request CPU allowance before a
  single line of page code runs — and nobody read it as the warning it was.

  **Second symptom, same cause, worth naming because it looked unrelated:**
  the sidebar rendered at two different sizes on consecutive loads of the
  same page — tight rows one moment, hugely spaced with the section dot
  dropped below its label the next. That is not a CSS bug and could not be
  fixed by editing CSS. One complete stylesheet cannot produce two layouts;
  a worker cut off mid-response delivers an incomplete one. If a visual
  defect is *inconsistent between reloads*, suspect delivery before design.

  **Still outstanding on this version, and unrelated to the plan:** the
  commission schedule document is baked into the worker bundle as a single
  698,296-character string literal — **33% of the entire 2 MB worker** — of
  which 641 KB is thirty base64-encoded PNGs. Base64 inflates them by a
  third over their 480 KB decoded size, they are re-materialized on every
  request to `/portal/commission/document` (served `no-store`, so nothing
  caches), and they are parsed at every isolate cold start. Moving them to R2
  behind the existing guard is the fix. It is now an efficiency item rather
  than an outage, and it must NOT be solved by moving them to `public/`:
  static assets are served before the app's checks run, so a suspended member
  still on the Access allowlist could pull the comp grid.

- 2026-08-18: **version `cde4601e-c354-4217-bed8-cfad831e2512`** — deployed
  by the owner at 17:30:00 UTC. **Recovered 2026-08-18 from
  `wrangler deployments list`; it was never recorded at the time and nothing
  else in this file or the record mentions it.** No deploy output survives,
  so its contents can only be bounded: it falls between `fd0926a3`
  (`main@9be299d`) and `607b3001` at 17:59, i.e. somewhere in the block of
  merges that had been sitting undeployed. It served for 29 minutes.
  It is listed here rather than left out because a gap in a version trail is
  worse than an entry that admits what it does not know.

- 2026-08-18 (current serving version): **version
  `d3bc401f-2da5-49bb-832a-9973054efea7`** — created 19:58:42 UTC, deployed
  by the owner immediately after applying
  `db/sql/0006_command_passes.sql` to the live D1 (4 queries, 9 rows
  written). Worker startup 21 ms, down from 30 ms on `fd0926a3`. Total
  upload 2791.05 KiB (gzip 944.55 KiB); 23 worker modules totalling
  743.99 KiB; one changed client asset uploaded
  (`/assets/index-B5t2wzej.css`), 35 unchanged. Bindings confirmed: `env.DB`
  → `site-creator-d1`, `env.CALL_RECORDINGS` → `site-creator-r2`.

  **The id was missing at first and had to be recovered**, because the deploy
  output was read from scrollback rather than a log file — `Current Version
  ID` is the last line `wrangler deploy` prints and it scrolled past.
  `npx wrangler deployments list -c dist/server/wrangler.json` recovered both
  this id and `cde4601e` above.
  **Four deploys happened on 2026-08-18 and two of them went unrecorded until
  a list command went looking.** That is the failure the `Tee-Object`
  practice in §7 exists to prevent, and it has now cost the record three
  times. The list command is the reliable backstop and should be run after
  every deploy regardless: `wrangler deployments list` needs no foresight,
  whereas piping to a log file needs someone to remember before the fact.

  **What this version carries over `607b3001`:** PR #92 — the Command Center
  pass-bypass fix (`hasLivePass` now requires the `pass` claim, so a copied
  `core_session` cookie is no longer a valid pass), the sidebar rail pin, the
  restored iOS safe-area insets on the sidebar, and the record corrections to
  §10a, A18 and A21.

  **This is the first deploy on which the lodge lock is real.** The migration
  ran first and the code second, which is the required order: the reverse
  gives 500s at the lodge instead of a door. A21's narrowing of A13 is now in
  force — a named `COMMAND_CENTER_EMAILS` address no longer opens the
  Command Center on its own. **It is still not usable**, because no UI exists
  to issue a code: `command/page.tsx` has no form and never renders the
  `issued` param. The lock is on the door and nobody can be given a key.

  **Also live for the first time on this deploy:** everything merged between
  `9be299d` and here that had only ever run locally — the THRIVE theme
  rounds, the Training tabs, the Leadership Playbook, and the rail density
  work (#79, #81, #87, #91).

- 2026-08-20: **version `9147c300-97dc-44dc-a3cf-154636207ae4`** - deployed
  from the clean isolated worktree at exact merged
  `main@38606f86c2825cb758f563246ba96aa349fa775a`, after PR #114 fixed the
  SignalWire browser-phone registration lifecycle. The repository-required
  `npm run deploy` chain rebuilt the Worker, passed 124/124 tests, passed the
  deployment preflight, and activated the version at 100% on
  `site-creator-vinext-starter.thrive18.workers.dev`. Bindings remained
  `env.DB` to `site-creator-d1` and `env.CALL_RECORDINGS` to `site-creator-r2`;
  startup time was 22 ms. Post-deploy probes returned 200 for the public root
  and 307 sign-in redirects for `/portal` and `/portal/calls`. Existing secret
  names remained present without exposing their values. No migration, secret
  update, provider-routing change, purchase, or call was performed. Previous
  rollback version: `e4433197-df69-4b7c-a406-0fd2e7b396e3`.

  Documentation status: recorded locally on
  `codex/deploy-log-browser-phone-20260820`; not yet merged and requiring a new
  one-use founder `mi`.

- 2026-08-21: **version `f25e66aa-95ea-4d6a-b1c4-8d2e03a7c519`** — created
  2026-08-21T01:21:23Z, deployed from
  `main@1724c9c` — PR #118, "fix(calls): accept SignalWire call context",
  the External SWML call-context parser repair recorded in
  CORE_PLATFORM_RECORD.md §19w (nested `call.call_id` accepted;
  `call.from_number` / `call.to_number` / `call.parent.call_id` honored;
  legacy shapes kept as fallbacks; missing provider id fails closed).
  The recording session had no Cloudflare credentials, so the full version
  id was recovered by the founder from Cloudflare and supplied at action
  time on 2026-08-21; the work order's prefix matched it. Recorded by
  Agent 1 from the owner's work order — Agent 1 did not perform
  this deploy and has not independently probed the serving version. No
  migration, secret change, provider-routing change, purchase, or call was
  part of this recording task. Previous rollback version:
  `9147c300-97dc-44dc-a3cf-154636207ae4`.


- 2026-08-21: **version `5c67d18b-c4d8-4b3f-9841-47d34d70eefb`** —
  **unreconciled.** Created 2026-08-21T04:07:49Z, attributed to
  `btcmao518@gmail.com`, source "Unknown (deployment)". No merge to `main`
  corresponds to it; it predates the `34dd833` commit by roughly ten
  minutes. Listed so the version trail has no gap, not because its contents
  are known. See CORE_PLATFORM_RECORD.md §19y.

- 2026-08-21: **version `fb98f2be-8e44-4de7-86e4-99c1032b93ea`** — deployed
  by the owner from `C:\dev\core-platform-site` at exact merged
  `main@34dd833` (PR #120), created 2026-08-21T05:46:33Z. Ships the
  `connect.confirm` repair that removes the illegal `return` method, after
  the `npm run deploy` chain rebuilt, passed 128/128 tests, and passed the
  preflight. Bindings remained `env.DB` to `site-creator-d1` and
  `env.CALL_RECORDINGS` to `site-creator-r2`; startup time was 19 ms. **This
  deploy did not restore inbound calling** — every call was still refused at
  the credential check (§19y). Previous rollback version:
  `f25e66aa-95ea-4d6a-b1c4-8d2e03a7c519`.

- 2026-08-21: **version `8fdfb5d2-6b17-4196-ba18-3288e771377f`** — created
  2026-08-21T06:28:49Z, source "Secret Change": the owner set
  `SIGNALWIRE_INGEST_SECRET_PREVIOUS` to the value believed to be in
  SignalWire's resource URL. No code change. No call was placed afterward,
  so the attempt was never tested, and the audit table records no traffic at
  all until the 24th.

- 2026-08-24: **version id PENDING RECOVERY** — a "Secret Change" version
  created when the owner set a freshly generated
  `SIGNALWIRE_INGEST_SECRET` and matched it in the SignalWire resource URL,
  restoring inbound calling to 3647 (CORE_PLATFORM_RECORD.md §19z). The id
  was not captured at the time; recover it with
  `npx wrangler deployments list -c dist/server/wrangler.json` and
  substitute it here. No code change; secret **names** only, never values.

  **Note for the next deploy:** `main` carries `b6e1e4e` ("Upgrade Next to
  16.3.2 and patch React Server DOM for published advisories", merged
  2026-08-23) which has **not** been deployed — the serving Worker predates
  it. A security patch merged but not shipped is exactly the gap this log
  exists to make visible. **Closed 2026-08-26 by the deploy below.**

- 2026-08-26: **version `572f72e7-f372-4708-bfdf-697e2c5cb238`** — deployed by
  the owner from `C:\dev\core-platform-site` at `main@2aac5ea`, via
  `npm run deploy`. Bindings confirmed present in the deploy output:
  `env.DB` → `site-creator-d1` and `env.CALL_RECORDINGS` → `site-creator-r2`.
  Worker startup 19 ms, upload 3712.26 KiB (gzip 1148.35 KiB), no asset
  changes to upload — expected, since everything shipped here is server-side.

  **Three things that had been merged-but-unshipped are now live**, which is
  the whole reason this log tracks the gap:
  - `b6e1e4e` — Next 16.3.2 and the React Server DOM advisory patches, merged
    2026-08-23. The note directly above is closed by this line.
  - PR #122 (`2aac5ea`) — lifecycle callbacks to `/portal/calls/ingest` were
    denied `bad_signature` because the guard verified against the bare origin
    while the route handed out a credentialed URL. Call state had stopped
    being recorded (CORE_PLATFORM_RECORD.md §19z).
  - A21's command-pass lock, listed in OWNER-DECISIONS as merged and not
    deployed since 2026-08-18. **The A21 caveat still stands:** there is no UI
    to issue a pass, so the lock is now enforced without an issuing path.

  **Pre-deploy gate, run in full before the owner deployed:** `vinext build`
  clean, **131/131 tests passing** against real workerd + D1, and
  `verify:build` reporting "Build verified — safe to deploy" (worker 2323 KB,
  D1 `e19d74e0-1913-41a5-b695-cd1acc94d5ed`, 17 assets).

  **Post-deploy smoke test, anonymous, from outside:** `/` serves 200;
  `/portal` and `/portal/members` both answer `307` to
  `/auth/signin?return_to=…`; `/auth/signin` answers `302` to Google with the
  `thrive18` callback. The portal fails closed on the new version.

  **This deploy changed no one's access.** The roster lives in D1 and is
  untouched by shipping code. Founder order A30 (portal access reduced to
  `btcmao518@gmail.com` and `ray@inkbox.ai`) still requires
  `db/sql/0012_roster_reduction_2026_08_26.sql` to be run against the remote
  database, and that file is not on `main` yet.

  **A31 re-confirmed on the new version.** The anonymous smoke test above
  reached application code and received the worker's own redirect — no
  Cloudflare Access interstitial, no challenge. Deploying could never have
  fixed this (the edge gate is dashboard configuration, not code), and this
  entry records that it is still absent after the deploy rather than leaving
  the question open.

- 2026-08-26 (later): **version `6dbafe27-5818-4042-81fb-b0a4fbcb4741`**, created
  2026-08-26T22:55:27Z — the IMO Operating
  Portal rebrand (A32), deployed by the owner from `C:\dev\core-platform-site`
  at `main@7c0ef9e` (PR #125). Id recovered from
  `wrangler deployments list` the same night rather than left pending.

  **Verified live from outside the session, anonymously**, which is the half
  that matters after this particular deploy went wrong once:

  | Surface | Status | `THRIVE` | `IMO` |
  | --- | --- | --- | --- |
  | `/` | 200 | **0** | 20 |
  | `/access` | 200 | **0** | 28 |
  | `/tour` | 200 | **0** | 28 |
  | `/portal/members` | 307 → `/auth/signin` | — | — |

  **The failure this entry exists to record.** An earlier deploy the same
  evening shipped `main@25fd5ad` and the owner reported the site still read
  THRIVE. The cause was not the deploy: **the rebrand had never been merged.**
  It sat on `claude/member-access-removal-bk3gga` while the deploy instruction
  given to the owner was a bare `git pull && npm run deploy`, which faithfully
  shipped a `main` that had never carried the change. He deployed correctly;
  there was nothing to deploy.

  The lesson is narrow and worth keeping: **a change is not shippable until it
  is on `main`**, and "it is committed and pushed" is not that. A branch push
  and a merge are different events, and only the second one is visible to
  `git pull`. Every deploy instruction should name the commit it expects to be
  at HEAD so the mismatch is caught before `wrangler` runs, not afterwards from
  a screenshot.

  **Still reading THRIVE by design, so it is not filed as a defect twice:** the
  portal theme picker's third option is still labelled *Thrive*, held under the
  founder's order of 2026-08-18 ("DO NOT TAKE THRIVE COLOR OUT"). Renaming the
  label while keeping the palette is a one-line change awaiting his word (A32).

- 2026-08-26 (later still): **version `2e61ea69-b335-4956-b61f-4b80e8cf20aa`**,
  created 2026-08-26T23:21:16Z — the `Thrive` → `Blue` theme relabel (A33),
  deployed by the owner at `main@97bd78e` (PR #126). **Verified live from
  outside the session:** the public theme picker renders `Bright`, `Dark`,
  `Blue`, with zero occurrences of `Thrive`. The palette is unchanged and the
  theme id is still `thrive`, so no member's saved preference was reset.

  **The deploy instruction named the expected commit this time**, and the check
  did its job: the owner ran `git log --oneline -1` before `npm run deploy` and
  confirmed `97bd78e` at HEAD. That is the practice the earlier failure in this
  log argued for, used once and working.

- 2026-08-27: **serving version `460bec64-6ba4-4ae5-a5d0-79f2fca5b0e8`**,
  created 2026-08-27T02:35:08.537Z, deployed by the owner from
  `C:\dev\core-platform-site`. Id recovered from
  `npx wrangler deployments list` after the fact and reconciled against merge
  times, which is how the rest of this entry can be stated rather than guessed.

  **Eight deploys went out across 2026-08-26/27**, and matching each against
  the merge it followed reconstructs the whole inbound-accept saga. Merge times
  are UTC from `git show -s --format=%cI`:

  | Deploy (UTC) | Version | First carried |
  |---|---|---|
  | 26th 23:36:33 | `acd9a4ea-755e-4536-b052-e5d763f68ebc` | predates #129 |
  | 26th 23:48:06 | `0490c1f5-d9d4-4d0e-9d93-ce536592b9de` | predates #129 |
  | 27th 00:33:17 | `ae38c76d-e9f9-4970-8741-2fd1f693454a` | #129 (23:57:27) + #130 (00:16:36) |
  | 27th 00:42:11 | `4013d435-5754-4064-87bd-31f346eb5b1f` | no new merge since |
  | 27th 00:54:36 | `790fbd88-3f5a-4a42-9b40-f4220fe84715` | **raced #131 — see below** |
  | 27th 00:57:28 | `b749e25d-763c-4db5-addf-387fe5d5c072` | #131 (00:55:02) |
  | 27th 01:15:58 | `22b498de-4a0c-4e29-8dcd-dffc817e5949` | #132 (01:13:42) |
  | 27th 02:35:08 | `460bec64-6ba4-4ae5-a5d0-79f2fca5b0e8` | #133 (02:32:32) — **live** |

  **The 00:54:36 deploy beat its own merge by twenty-six seconds.** PR #131
  merged at 00:55:02; that deploy went out at 00:54:36, so it shipped `main`
  *without* the accept-digit fix. Nothing broke, because the owner deployed
  again at 00:57:28 and that one carried it. But the near-miss is the exact
  shape of the failure this log was started for: a deploy that looks like it
  shipped a fix, does not, and makes the fix look broken. `git log --oneline -1`
  before `npm run deploy` catches it in one line, and is why that check is
  written into the deploy instructions.

  **The three accept-gate deploys map one-to-one onto the three founder
  reports**, which is what makes CORE_PLATFORM_RECORD.md §19ab evidence rather
  than recollection:
  - `b749e25d` (#131) → "it auto connect when i hit 1, its good" — then, minutes
    later, "it went back to where i need to hit 1 again!" Same version, both
    outcomes: the race, not a regression.
  - `22b498de` (#132) → operator side fixed, and "from the customers side …
    it sounds like the platform kept spamming 1" — the retries, audible on the
    bridged call.
  - `460bec64` (#133) → "fixed", verified from **both** sides.

  Also carried by these deploys: PR #129 (Cloud AI Command Center cards became
  real links), PR #130 (the "Inbound calling is live" announcement and the
  `AgenCi-MAIN` repo references), and PR #98 (`/portal/training` could be swiped
  1686px sideways on a phone).

  **Pre-deploy gate, run in full in-session before each:** 134/134 tests
  against real workerd + D1, and `verify:build` reporting "Build verified —
  safe to deploy" (worker 1591 KB, D1 `e19d74e0-1913-41a5-b695-cd1acc94d5ed`,
  17 assets).

  **Still outstanding after all eight**, and unchanged by shipping code:
  `db/sql/0009_member_requests.sql` has never been applied to the remote
  database, so the pending-request badge reads an absent table. It fails
  closed — `readRows` classifies the missing table and the badge simply never
  appears — which is the honest failure and also the invisible one.

- 2026-08-27 (later): **version `e89e1249-acd3-491d-95ce-1eaa50ff9476`** —
  `main@4f0c2af` (PR #134). Worker startup 21 ms, upload 2965.81 KiB (gzip
  650.47 KiB), 8 new assets uploaded and 66 already present. Bindings
  confirmed in the deploy output: `env.DB` → `site-creator-d1`,
  `env.CALL_RECORDINGS` → `site-creator-r2`. Pre-deploy gate 134/134 and
  "Build verified — safe to deploy" (worker 1591 KB, D1
  `e19d74e0-1913-41a5-b695-cd1acc94d5ed`, 17 assets).

  **THE FIRST DEPLOY NOT RUN BY THE OWNER.** Executed by a spawned Claude
  session in the same Cloudflare-credentialed environment, on the founder's
  explicit instruction ("Spawn a session with the repo, which can then run the
  full npm run deploy"). Documentation-only content: the §19ab verification and
  the recovered version ids.

  **The commit guard held, and was checked properly.** The session confirmed
  `4f0c2af` at HEAD, then went further than asked — `git ls-remote origin main`
  to prove it was the tip of the remote rather than a stale local checkout, and
  a check that nothing was mid-merge. That is the §19y/00:54:36 lesson being
  applied by someone who had never seen it happen, which is what recording it
  was for.

  **⚠️ THE SPAWNED SESSION HAD NO REPOSITORY, AND CLONED ONE IT INFERRED.**
  The container came up empty: no git source was attached, because the parent
  session called `create_session` without `source_url`. Rather than stop, the
  session identified the repo from context, cloned it, verified the commit, and
  deployed to production. Every identifying detail lined up — `npm run deploy`
  matched the briefed chain verbatim, and DEPLOYMENT.md independently named the
  worker, the D1 id and the R2 bucket — and it disclosed the deviation
  unprompted, calling it "a bigger step than you authorised".

  It was right to flag it. **The defect is in the briefing, not the judgement:**
  a session told to deploy a specific commit should be handed the repository,
  not left to work out which one was meant. Inferring a production target from
  context is a step that happens to be correct here and would be indefensible
  if the inference were wrong. **Every future deploy session must pass
  `source_url` and `source_revision` to `create_session`**, so the guard checks
  a repo that was given to it rather than one it chose.

  Also disclosed: `npm install` rewrote `package-lock.json` (90 deletions, libc
  metadata on optional deps from a newer npm) *after* the build was produced, so
  it had no bearing on what shipped; restored with `git checkout --`, tracked
  tree clean. No secret value was printed, logged or written at any point —
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` were confirmed present by
  name only. `db/sql/0009` remains deliberately unapplied.

### "Source: Unknown (deployment)" is normal, and §19z's suspicion is partly withdrawn

`CORE_PLATFORM_RECORD.md` §19z records version `5c67d18b-c4d8-4b3f-9841-47d34d70eefb`
(2026-08-21) as **an unexplained deploy**, resting on two observations: it was
attributed to `btcmao518@gmail.com` with source **"Unknown (deployment)"**, and
no merge to `main` corresponded to it.

The `wrangler deployments list` output of 2026-08-26 shows **both** of that
night's deploys — `6dbafe27` and `2e61ea69`, each a plain `npm run deploy` from
the owner's machine, each with a known commit — carrying the identical
`Source: Unknown (deployment)` and an empty `Message`. **That attribute is
simply what a wrangler CLI deploy looks like in this listing.** It is not a
signal of anything irregular, and it should never again be cited as one.

What survives of the §19z observation is the narrower half: no merge to `main`
corresponded to `5c67d18b`. That remains unreconciled and is worth nothing more
alarming than "someone deployed a working tree", which the CLI permits and which
this project has done. The suspicious-looking source line was the weaker half of
the case and is withdrawn.

### db/sql/0013 exists and is NOT applied anywhere (2026-09-02)

The dashboard rebuild added `db/sql/0013_weekly_commitments.sql` — the
`weekly_commitments` table behind the dashboard's weekly commitment panel
(lead budget + call target, one row per member per ISO week, written only by
`POST /portal/checkin`). **The file has not been run against any database:
not the remote, not a local copy.** No agent session may apply it; that is
the founder's move.

Until it is applied, the panel is *empty, not broken, not fake*: every read
of the table goes through the classified read wrapper, which turns the
missing table into a `not_provisioned` fault, and the panel renders the
honest "not provisioned" copy in place of bars and form. A member who POSTs
a check-in before the migration lands is bounced back to
`/portal?checkin=unavailable` with nothing written and the denial audited.
Like `db/sql/0009` before it, this failure mode is honest **and invisible** —
nothing will nag about it, so this note is the reminder.

Apply with (from the project directory, with Cloudflare auth):

```powershell
npx wrangler d1 execute site-creator-d1 --file=db/sql/0013_weekly_commitments.sql --remote
```

or paste the file's statements into the dashboard D1 console, as 0001/0002
were. The file is idempotent (`IF NOT EXISTS` throughout) and safe to re-run;
it also inserts one `audit_events` row recording the table's creation. Do
NOT additionally apply the generated `drizzle/0004_*.sql` — same table, no
`IF NOT EXISTS`, and the two paths must never both touch one database
(CLAUDE.md rule).

### db/sql/0014 exists and is NOT applied anywhere (2026-09-02, owner direction)

The Book of Business rebuild added `db/sql/0014_book_of_business.sql` — the
`book_customers` and `book_policies` tables behind the Book's entry forms
(a member's own customers and policies, self-scoped by `member_id`, phone
stored masked with the last four digits only, policy number as its last four
characters only; written only by `POST /portal/book/customers` and
`POST /portal/book/policies` behind the new `book.edit.self` capability).
**The file has not been run against any database.** Applying it is the
founder's move.

Until it is applied the Book is *not provisioned, not broken, not fake*: the
page says so, offers no form whose POST must fail, and a POST that arrives
anyway is bounced to `/portal/book?view=customers&book=not_provisioned` with
nothing written and the denial audited. The dashboard's "Policies this week"
tile and the Policies sold / New clients production tiles read the same
tables and say "book not provisioned" / "source pending" until then.

Apply with (from the project directory, with Cloudflare auth):

```powershell
npx wrangler d1 execute site-creator-d1 --file=db/sql/0014_book_of_business.sql --remote
```

or paste the file's statements into the dashboard D1 console. The file is
idempotent (`IF NOT EXISTS` throughout) and inserts one `audit_events` row
recording the tables' creation. Do NOT additionally apply the generated
`drizzle/0005_*.sql` — same tables, no `IF NOT EXISTS`, and the two paths
must never both touch one database (CLAUDE.md rule).
