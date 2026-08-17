# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares the D1 and R2 bindings (and, for self-hosted
  deploys, the real D1 `database_id`)
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Sign in with Google

Identity comes from a first-party Google OAuth flow implemented in this app —
there is no hosting platform in front of it. `app/google-auth.ts` owns the
session; `app/auth/{signin,callback,signout}/route.ts` own the flow:

- `/auth/signin` starts an authorization-code flow with PKCE against Google.
- `/auth/callback` exchanges the code server-side and mints the `core_session`
  cookie — an HMAC-SHA256-signed token under `SESSION_SECRET`. Only verified
  Google addresses (`email_verified`) are accepted.
- `/auth/signout` clears the session cookie.
- `getAuthUser()` reads identity from the cookie on every request. Any cookie
  that fails verification — bad signature, expired, malformed — is anonymous.
- Use `signInPath(returnTo)` / `signOutPath(returnTo)` for browser links; the
  helpers validate the return path.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity.

The retired `oai-authenticated-user-*` headers from the previous hosting
platform are ignored entirely; a request carrying them is anonymous. This is
load-bearing: self-hosted, any client could send those headers, so nothing may
trust them. `tests/portal-authorization.test.mjs` pins this down.

Sign-in requires three secrets, absent from git:

| Secret | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client from Google Cloud console |
| `GOOGLE_CLIENT_SECRET` | Its secret; used only server-side in the code exchange |
| `SESSION_SECRET` | Long random string signing session cookies; rotating it signs everyone out |

Locally, put them in `.dev.vars` (gitignored). For a signed-in local session
without a Google round-trip, use the shim: `AS_EMAIL=you@example.com node
scripts/dev-signin.mjs` — it mints the same cookie the callback mints, using
the same `SESSION_SECRET` from `.dev.vars`.

Sign in with Google establishes identity only; it does not prove membership.
`portal_members` decides who gets in, exactly as before.

## Deploying to your own Cloudflare account

**Already deployed once.** [DEPLOYMENT.md](DEPLOYMENT.md) records what is live —
URL, database and bucket ids, how the schema was applied, the redeploy command,
and the Windows-specific traps worth reading before touching any of this again.
The runbook below is the from-scratch path.

One-time setup:

1. **OAuth client** — In [Google Cloud console](https://console.cloud.google.com/apis/credentials)
   create an OAuth client ID of type "Web application". Add the authorized
   redirect URI `https://<your-worker-domain>/auth/callback` (and
   `http://localhost:3001/auth/callback` for local dev if you want the real
   flow locally). Note the client ID and secret.
2. **Authenticate wrangler** — `npx wrangler login`.
3. **Provision storage**:
   ```bash
   npx wrangler d1 create site-creator-d1
   npx wrangler r2 bucket create site-creator-r2
   ```
   Copy the `database_id` UUID that `d1 create` prints into the
   `d1_database_id` field of `.openai/hosting.json`.
4. **Apply the schema and the owner seed** (this is the manual `db/sql/` path;
   see the next section before mixing it with drizzle migrations):
   ```bash
   npx wrangler d1 execute site-creator-d1 --file=db/sql/0001_portal_init.sql --remote
   npx wrangler d1 execute site-creator-d1 --file=db/sql/0002_portal_seed_owner.sql --remote
   npx wrangler d1 execute site-creator-d1 --file=db/sql/0003_add_owner_btcmao518.sql --remote
   ```
   **All three, in order — `0003` is not optional.** `0002` seeds
   `bankerrunners@gmail.com`, which Google locked on 2026-08-17 and which can
   never sign in again. Only `0003` grants the live founder identity. Stopping
   at `0002` produces a portal that builds, deploys, and answers — and that
   nobody on earth can log into, including the founder.
5. **Deploy**:
   ```bash
   npm run build
   npx wrangler deploy -c dist/server/wrangler.json
   ```
6. **Set the secrets** (prompted interactively; applies without a redeploy):
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID -c dist/server/wrangler.json
   npx wrangler secret put GOOGLE_CLIENT_SECRET -c dist/server/wrangler.json
   npx wrangler secret put SESSION_SECRET -c dist/server/wrangler.json
   ```
   Generate `SESSION_SECRET` with `openssl rand -base64 48` or similar.
7. Visit the site and sign in with the Google account granted by **`0003`** —
   the current founder identity. Do **not** expect the `0002` seed address to
   work; it is retired and Google-locked. If you skipped `0003` at step 4, this
   is where you discover it, locked out of your own portal, with the D1 console
   as the only way back in (see `CORE_PLATFORM_RECORD.md` §5). Subsequent
   deploys are just step 5.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## CORE Portal (Phase 2)

The authenticated CORE application lives under `app/portal/`, separate from the
public presentation page at `app/page.tsx`.

- `app/portal/access.ts` — server-side authorization. Two checks run on every
  request: Sign in with Google establishes identity, and an active
  `portal_members` row establishes CORE membership and role. Identity alone
  grants nothing.
- `db/schema.ts` — `portal_members` (the allowlist) and `audit_events`
  (append-only allow/deny record).
- `db/sql/0001_portal_init.sql` — the same schema as hand-written DDL, for
  applying manually with `wrangler d1 execute`.
- `db/sql/0002_portal_seed_owner.sql` — first-owner bootstrap. **Read its header
  comments before applying.**

### How the schema actually reaches a deployed database

Self-hosted on your own Cloudflare account, nothing applies migrations for
you: you run the two files in `db/sql/` against the real database with
`wrangler d1 execute` (step 4 of the deploy runbook above). A fresh database
with the schema but no members fails closed — nobody can sign in, including
the owners — so `0002_portal_seed_owner.sql` seeds the first owner; **read its
header comments before applying it**.

The `drizzle/` directory holds the equivalent history as generated drizzle
migrations (kept in sync via `npm run db:generate` after any change to
`db/schema.ts`). Applying `db/sql/0001_portal_init.sql` by hand *and* applying
the drizzle migrations to the same database will collide: `0001` uses
`CREATE TABLE IF NOT EXISTS`, the generated migration does not. Pick one path
per database — the runbook uses the `db/sql/` path.

Capabilities are deny-by-default; roles are `owner`, `admin`, `manager`,
`reviewer`, `agent`, `support`. Guard a page with `requireCapability(...)` and a
write with `assertCapability(...)`. Never import `app/portal/access.ts` from a
`"use client"` file.

The portal fails closed: if the `DB` binding is unreachable, access is refused
rather than assumed. Full design notes, provisioning steps, verification state,
and open decisions are in `CORE_PLATFORM_RECORD.md` in the repository root —
the operating record and the single source of truth for this platform.
