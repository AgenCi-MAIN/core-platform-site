# CORE / THRIVE platform

Read [CORE_PLATFORM_RECORD.md](CORE_PLATFORM_RECORD.md) before doing anything
non-trivial here. It is the operating record: what is live, how identity and
membership work, the role/capability matrix, the SQL for granting access, the
deploy sequence, and the traps that have already cost time once.

## What this is

A permissioned operating portal for THRIVE, deployed as one Cloudflare Worker at
`https://site-creator-vinext-starter.bankerrunners.workers.dev`. The public site
is open; everything under `/portal` is closed by default.

Two independent checks run on every request: **Sign in with Google** establishes
identity, and an active `portal_members` row establishes membership and role.
Identity alone grants nothing — anyone can complete step one. The portal fails
closed: if the database is unreachable or unmigrated, access is refused rather
than assumed. Every allow and deny is written to the append-only `audit_events`
table.

## Rules that are load-bearing

- **Never trust identity from a request header.** The retired
  `oai-authenticated-user-*` headers are ignored on purpose; self-hosted, any
  client can send them. Identity comes only from the HMAC-signed `core_session`
  cookie. Two test suites pin this shut — if you find yourself weakening them,
  stop.
- **Never import `app/portal/access.ts` from a `"use client"` file.** It is
  server-only by construction and authorization must never move to the client.
- **`app/access/page.tsx` must never look up membership.** An unauthenticated
  page that reported whether an address is a member would be a roster
  enumeration oracle. Its response is byte-identical for a member and a stranger.
- **Never put secret values in files, commits, comments, or chat.** Only secret
  *names*. The three that must exist are `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET`.
- **The service worker must never cache `/portal` or `/auth`.** `public/sw.js`
  caches content-hashed assets and a few root files, and passes everything else
  straight to the network. A cached portal page answers without re-resolving the
  session or the member's row, which is the one way an installed phone can keep
  serving a suspended member. A test pins the exclusions and the cache-write
  count.
- **Capabilities are deny-by-default.** A role holds exactly what
  `ROLE_CAPABILITIES` lists. Adding one is a governance decision, not a
  convenience fix — guard pages with `requireCapability`, writes with
  `assertCapability`.
- **Do not apply both migration paths to one database.** `db/sql/0001` uses
  `CREATE TABLE IF NOT EXISTS`; the generated drizzle migration does not. The
  live database used the `db/sql/` path.

## Commands

```bash
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # builds, then runs both suites in Miniflare (real workerd + D1)
npm run build        # bakes the D1 id and the app into dist/
npm run verify:build # preflight: is what is on disk actually deployable?
npm run db:generate  # after any change to db/schema.ts
```

Deploy (Windows, from the project directory, after `git pull`):

```powershell
npm run deploy
```

That is build → tests → preflight → `wrangler deploy`, chained so any failure
stops it. Do not hand-roll the sequence: a deploy without a fresh build ships
whatever `dist/` last held, and that failure is silent — it cost days once.
`scripts/verify-build.mjs` is what now catches it.

The test suite is the safety net for the access model — anonymous refusal on
every guarded route, subject binding and conflict, identity ambiguity, suspended
members, per-role capability enforcement, recording consent gating, and session
forgery. Run it before pushing anything that touches auth.

## Environment notes

Development happens on Windows/PowerShell. Two things bite repeatedly: every new
terminal starts in `C:\Users\k2547`, not the project; and npm scripts must stay
free of Unix-only inline-env syntax (`FOO=bar cmd`), which cmd.exe cannot parse —
that failure is silent and causes stale deploys.
