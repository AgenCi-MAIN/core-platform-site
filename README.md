# CORE-J.A.R.V.I.S 2.0.0 — THRIVE Agency Operating Portal

A permissioned operating portal for the THRIVE agency, deployed as a single
Cloudflare Worker with a D1 database and R2 storage via
[Vinext](https://github.com/cloudflare/vinext).

**Architecture and governance reference:** [GRANDPLAN.md](GRANDPLAN.md)  
**Operating record (live URLs, database IDs, deploy history):** [CORE_PLATFORM_RECORD.md](CORE_PLATFORM_RECORD.md)

---

## What this is

The public site at `/` and `/tour` is open to anyone. Everything under
`/portal` is closed by default and opens only to people who hold an active
membership row at the role that row carries. Two independent checks run on
every request:

1. **Identity** — Sign in with Google proves who the visitor is.
2. **Membership** — an active `portal_members` row in D1 proves they belong to
   CORE and fixes their role.

Identity alone grants nothing. The portal fails closed: if the database is
unreachable or unmigrated, access is refused rather than assumed. Every allow
and every deny is written to an append-only `audit_events` table.

---

## Architecture

```
Browser
  │
  ├── /          Public overview (THRIVE model, five ranks)
  ├── /tour      Onboarding tour
  ├── /access    Public sign-in intake (never looks up membership — by design)
  ├── /auth/**   OAuth 2.0 + PKCE flow with Google
  │
  └── /portal/** Closed — requires identity + active membership
        ├── identity:   HMAC-SHA256 signed cookie (SESSION_SECRET)
        └── membership: D1 portal_members row (role + status)

Cloudflare D1
  ├── portal_members   allowlist, role, subject binding
  ├── audit_events     append-only access log
  └── dialer_transfers call metadata (recording bytes live in R2)

Cloudflare R2
  └── CALL_RECORDINGS  audio bytes
```

---

## Role / capability matrix

| Capability | owner | admin | manager | reviewer | agent | support |
|------------|:-----:|:-----:|:-------:|:--------:|:-----:|:-------:|
| `portal.access` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `dashboard.view.self` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `book.view.self` | ✓ | ✓ | ✓ | | ✓ | |
| `calls.review` | ✓ | ✓ | ✓ | ✓ | | |
| `scripts.manage` | ✓ | ✓ | | ✓ | | |
| `team.view` | ✓ | ✓ | ✓ | ✓ | | ✓ |
| `leadership.view.all` | ✓ | ✓ | ✓ | | | |
| `members.view` | ✓ | ✓ | ✓ | | | |
| `members.manage` | ✓ | ✓ | | | | |
| `audit.view` | ✓ | ✓ | | | | |

Capabilities are deny-by-default. Guard pages with `requireCapability(...)`,
writes with `assertCapability(...)`. Never import `app/portal/access.ts` from
a `"use client"` file.

---

## Prerequisites

- Node.js `>=22.13.0`

## Prerequisites

Node.js `>=22.13.0`

## Quick start

```bash
npm install
npm run dev          # local dev server (Vinext + Wrangler together)
npm run build        # production build
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint
npm run test         # build + run both test suites in Miniflare
npm run deploy       # test → preflight → wrangler deploy (use this, not bare wrangler)
```

This project does not use `wrangler.jsonc`. Bindings are declared in
`.openai/hosting.json`; `wrangler.json` is generated into `dist/server/` at
build time — that is the config `wrangler deploy` reads.

## Project layout

```
app/              Next.js application
├── google-auth.ts      Identity: HMAC-signed core_session cookie
├── portal/             Authenticated application
│   ├── access.ts       Authorization: membership, roles, capabilities, audit
│   ├── pay-rates/      Restricted — leadership.view.all only
│   ├── members/        Restricted — members.view / members.manage
│   ├── audit/          Restricted — audit.view
│   └── ...             Other portal sections
├── auth/               OAuth flow: signin / callback / signout
├── access/             Public sign-in intake
└── tour/               Public onboarding tour
db/
├── schema.ts           Drizzle schema
└── sql/                Hand-written migrations (THE path for the live DB)
drizzle/                Generated migrations (never apply to the live DB)
worker/index.ts         Cloudflare Worker entry
public/sw.js            Service worker (never caches /portal or /auth)
tests/                  Node test runner suites
scripts/                verify-build.mjs, dev-signin.mjs
```

## Sign in with Google

Identity is first-party — no hosting platform authenticates for us.
`app/google-auth.ts` owns the session; `app/auth/` owns the flow.

- `/auth/signin` starts an authorization-code flow with PKCE.
- `/auth/callback` exchanges the code server-side and mints the `core_session`
  cookie: an HMAC-SHA256-signed token under `SESSION_SECRET`. Only
  `email_verified` Google addresses are accepted.
- `/auth/signout` clears the session cookie.
- `getAuthUser()` reads identity on every request. Any cookie that fails
  verification — bad signature, expired, malformed — is anonymous.

The retired `oai-authenticated-user-*` headers are ignored. Self-hosted, any
client can send them; they are therefore untrusted by construction.
`tests/portal-authorization.test.mjs` pins this shut.

Secrets (set with `wrangler secret put`, or `.dev.vars` locally):

| Secret | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client from Google Cloud console |
| `GOOGLE_CLIENT_SECRET` | Server-side only; never exposed to the client |
| `SESSION_SECRET` | Signs session cookies; rotating it signs everyone out |

Local dev without a real Google round-trip:

```bash
AS_EMAIL=you@example.com node scripts/dev-signin.mjs
```

## Deploying to your own Cloudflare account

**Already deployed.** See [DEPLOYMENT.md](DEPLOYMENT.md) for what is live,
the database ID, and the redeploy command. The runbook below is the
from-scratch path.

1. **OAuth client** — [Google Cloud console](https://console.cloud.google.com/apis/credentials) →
   Web application client. Add `https://<worker-domain>/auth/callback` as an
   authorized redirect URI.
2. **Authenticate** — `npx wrangler login`
3. **Provision storage**:
   ```bash
   npx wrangler d1 create site-creator-d1
   npx wrangler r2 bucket create site-creator-r2
   ```
   Copy the `database_id` into `.openai/hosting.json`.
4. **Apply schema and seed**:
   ```bash
   npx wrangler d1 execute site-creator-d1 --file=db/sql/0001_portal_init.sql --remote
   npx wrangler d1 execute site-creator-d1 --file=db/sql/0002_portal_seed_owner.sql --remote
   ```
   Read `0002`'s header comments before applying.
5. **Deploy**:
   ```bash
   npm run deploy
   ```
6. **Set secrets**:
   ```bash
   npx wrangler secret put GOOGLE_CLIENT_ID -c dist/server/wrangler.json
   npx wrangler secret put GOOGLE_CLIENT_SECRET -c dist/server/wrangler.json
   npx wrangler secret put SESSION_SECRET -c dist/server/wrangler.json
   ```
   Generate `SESSION_SECRET`: `openssl rand -base64 48`

Subsequent deploys: `npm run deploy`.

## Database schema

Two migration trees — apply only one to any given database:

| Path | Idempotent | Use for |
| --- | --- | --- |
| `db/sql/0001_portal_init.sql` | Yes (`IF NOT EXISTS`) | Live D1 database |
| `drizzle/` (generated) | No | Local / dev only |

After changing `db/schema.ts`, run `npm run db:generate` to keep the generated
migrations in sync.

## Known gotchas

- **No wrangler.jsonc** — bindings live in `.openai/hosting.json`; `dist/server/wrangler.json` is generated at build time.
- **Two migration trees** — apply `db/sql/` only to the live database; see above.
- **Never import `app/portal/access.ts` from `"use client"` files** — authorization must never run in the browser.
- **Service worker must never cache `/portal` or `/auth`** — a cached page answers without re-resolving the session; a test pins this.
- **Capabilities are deny-by-default** — adding one to a role is a governance decision.
- **Windows/PowerShell dev** — npm scripts have no `FOO=bar cmd` inline env syntax; use `.dev.vars` instead.

## Resources

- [GRANDPLAN.md](GRANDPLAN.md) — architecture, rules, capability matrix
- [CORE_PLATFORM_RECORD.md](CORE_PLATFORM_RECORD.md) — live URLs, IDs, deploy history
- [DEPLOYMENT.md](DEPLOYMENT.md) — deploy runbook and Windows traps
- [Vinext](https://github.com/cloudflare/vinext)
- [Drizzle ORM D1](https://orm.drizzle.team/docs/get-started/d1-new)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
