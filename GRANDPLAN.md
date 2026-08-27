# CORE / THRIVE — Grand Plan

> The single architectural contract for this system. Updated when the rules
> change. Read before committing anything that touches auth, membership, or
> the capability matrix.

> **Business plan of record:** the owner-ratified 12-month operating plan
> (Aug 2026 → Aug 2027, $5M/mo AP target, founder role map, Yuxiang's
> intelligence build order) lives at
> [`strategy/2026-08-17-founder-operating-plan-12mo-5m.md`](strategy/2026-08-17-founder-operating-plan-12mo-5m.md)
> — ingested from the owner's email 2026-08-17. This file stays the
> *architectural* contract; that one is the *business* contract.

---

## System identity

**Code name:** CORE-J.A.R.V.I.S 2.0.0  
**Product name:** THRIVE agency operating portal  
**Deployment target:** Single Cloudflare Worker (`site-creator-vinext-starter`)  
**Stack:** Next.js 16 + React 19 · Drizzle ORM · D1 (SQLite) · R2 · Vinext  
**Repo:** `AgenCi-MAIN/core-platform-site`

---

## Architecture overview

```
Browser
  │
  ├── / , /tour          ← App-level public (no app auth) — but Cloudflare Access 403s anonymous requests at the edge since 2026-08-16
  ├── /access            ← Public intake (intentionally looks up NOTHING)
  ├── /auth/signin       ← OAuth start (PKCE)
  ├── /auth/callback     ← OAuth completion → mints core_session cookie
  ├── /auth/signout      ← Clears session
  │
  └── /portal/**         ← Closed by default
        │
        ├── identity check   app/google-auth.ts
        │     └── HMAC-SHA256 signed cookie (SESSION_SECRET)
        │         7-day TTL · google-prefixed subject · email_verified only
        │
        └── membership check  app/portal/access.ts
              └── D1 portal_members row
                  subject lookup first → email lookup second
                  status must be "active"
                  role must be one of six known values
                  every outcome written to audit_events
                  fails CLOSED if DB is unreachable

Cloudflare D1
  ├── portal_members   (allowlist + role + subject binding)
  ├── audit_events     (append-only; never updated or deleted)
  └── dialer_transfers (call metadata; recording bytes in R2)

Cloudflare R2
  └── CALL_RECORDINGS  (audio bytes; D1 holds the index)
```

---

## Two-factor access model

Every request to `/portal` runs two independent checks:

| Check | Where | How |
|-------|-------|-----|
| Identity | `app/google-auth.ts` | HMAC-signed `core_session` cookie under `SESSION_SECRET` |
| Membership | `app/portal/access.ts` | Active row in `portal_members` with a known role |

Identity alone grants nothing. Anyone with a Google account can pass step 1.
Step 2 is what actually protects the portal.

**Fail-closed invariants:**
- If `SESSION_SECRET` is absent → anonymous.
- If `DB` binding is absent or unreachable → denied.
- If the `portal_members` schema is not migrated → denied (not a 500).
- If two membership rows conflict (subject vs. email) → denied; human resolves.
- If a subject matches one row and an email matches a different row → denied.
- If `status ≠ "active"` → denied.
- If `role` is not one of the six known values → denied.

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
| `audit.view` | — | — | — | — | — | — |

**Rules:**
- Capabilities are deny-by-default; a role holds exactly what is listed.
- Adding a capability to a role is a governance decision — record it here.
- Guard a protected page with `requireCapability(...)`.
- Guard a write with `assertCapability(...)`.
- Never import `app/portal/access.ts` from a `"use client"` file.

---

## Five ranks

| # | Name | Phase | Contract level |
|---|------|-------|---------------|
| I | Ember | Bronze / Captive | 50% |
| II | Vector | Silver / Producer | 80% |
| III | Apex | Gold / Thrive | 95% |
| IV | Dominion | Diamond / Core 1.0 | 100% |
| V | Zenith | Obsidian / Core 2.0 | 110% |

Contract levels are the designed rank structure — an illustration of the
model, not a quote, offer, or compensation record for any individual.

---

## Required secrets

| Name | Purpose |
|------|---------|
| `GOOGLE_CLIENT_ID` | OAuth client ID from Google Cloud console |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret; used server-side only |
| `SESSION_SECRET` | Long random string; signs session cookies; rotating it signs everyone out |

No secret value ever appears in source, commits, comments, or this document.
Only names are listed here. Values live in Cloudflare's secret store and the
operator's password manager.

---

## What this system will never do

- Give insurance advice, recommend coverage, or bind policies.
- Make employment or compensation decisions.
- Cache any response under `/portal` or `/auth`.
- Trust identity asserted in a request header.
- Accept a Google address where `email_verified` is not `true`.
- Grant portal access when the database is unreachable.

---

## Operating boundaries

- **Licensed activity** stays with licensed people. J.A.R.V.I.S. is an
  intelligence and coordination layer, not a licensed agent.
- **Compliance takes priority over production.** This is a constraint on the
  system design, not a slogan.
- **Disconnected data sources are labelled as such.** The portal never shows a
  number that looks meaningful but has no authoritative source behind it.

---

## Migration path

Two migration trees exist. Apply only one to any given database.

| Path | Idempotent | Used on |
|------|-----------|---------|
| `db/sql/0001_portal_init.sql` | Yes (`IF NOT EXISTS`) | Live database |
| `drizzle/` (generated) | No | Never applied to live DB |

Apply `db/sql/` with `wrangler d1 execute --remote`. Then seed the first
owner with `db/sql/0002_portal_seed_owner.sql` — read its header comments
before applying.

---

## Deploy sequence

```bash
npm run deploy
# = npm test && node scripts/verify-build.mjs && wrangler deploy -c dist/server/wrangler.json
```

Never hand-roll the steps. A deploy without a fresh build ships whatever
`dist/` last held; that failure is silent and has cost days.

---

## Performance and caching rules

- `/assets/**` — immutable; content-hashed; cache-first in service worker.
- `/favicon.svg`, `/icon-*.png`, `/apple-touch-icon.png`, `/offline.html` —
  stale-while-revalidate in service worker.
- `/portal/**` and `/auth/**` — never cached at any layer.
- Public routes (`/`, `/tour`) — `Cache-Control: public, max-age=60,
  stale-while-revalidate=600` is set at the Next.js response level.

---

## Audit log promise

Every `portal.access` resolution writes one row to `audit_events` before
returning. The row records: action, decision, reason, actor email, actor
subject, actor role, and the request path (stated by the caller, never read
from a request header).

`recordAudit` never throws — a logging failure must not become a
denial-of-service on the portal — but failures are logged to the server
console so the gap is visible.

---

## Service worker invariant

The service worker contains exactly **two** `cache.put` call sites:
1. Inside `cacheFirst` — reached only for `/assets/**` paths.
2. Inside `staleWhileRevalidate` — reached only for files in `PRECACHE`.

Neither is reachable from the `/portal` or `/auth` branches. A test pins
the cache-write count to two. If that test starts failing, check the service
worker before anything else.

---

## Open decisions / roadmap

- [ ] Connect CRM, carrier, and dialer data sources to the portal.
- [x] `dialer_transfers` inbox and review flow — live as of 877e0c99
  (2026-08-16); see CORE_PLATFORM_RECORD §12.
- [ ] Goal engine: turn pace targets into daily operating numbers.
- [ ] Script versioning: compliance-reviewed language folded back from calls.
- [ ] Portfolio memory: aggregate case outcomes back into coaching context.
- [ ] `waitUntil` context plumbed through to `recordAudit` for non-blocking
      allow-path audit writes.

---

*Last updated: 2026-08-16. Update this document whenever a rule, capability,
or architectural boundary changes.*
