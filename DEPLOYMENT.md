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
| Cloudflare account | `Bankerrunners@gmail.com's Account` (`e6f9d0a344a0a7b317601ffbe23f871e`) |
| workers.dev subdomain | `bankerrunners` |
| D1 database | `site-creator-d1` — `e00c30f0-7017-49d8-9f81-446cef9e32c3` |
| R2 bucket | `site-creator-r2` (binding `CALL_RECORDINGS`) |
| First owner | `bankerrunners@gmail.com`, role `owner`, seeded by SQL |
| Second owner | `ryandavidson.zenith@gmail.com`, role `owner`, granted 2026-08-14 |
| Source branch | `claude/new-session-9a8g4o` (PR #1) |

The D1 id is committed in `.openai/hosting.json`; `build/sites-vite-plugin.ts`
carries it into `dist/server/wrangler.json` at build time, which is the config
`wrangler deploy` reads.

## Identity

Sign in with Google, implemented in-app — see README "Sign in with Google".
The Google OAuth client is a **Web application** client in the Google Cloud
project for this account, with exactly one authorized redirect URI:

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
  captured into the record (owner's terminal only) — record it on the next
  deploy.
- Account note: the Cloudflare ACCOUNT email is being swapped to
  btcmao518@gmail.com via support ticket (password lost, old inbox dead) —
  see strategy/2026-08-17-identity-recovery-docket.md. The `bankerrunners`
  workers.dev SUBDOMAIN is load-bearing (OAuth redirect URI, Access app,
  installed PWAs) and must NOT be renamed.
