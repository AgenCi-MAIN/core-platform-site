# SESSION BACKUP — 2026-08-16 UTC
# CORE-J.A.R.V.I.S 2.0.0 | THRIVE Operating Platform
# Owner: Yuxiang Mao (Shawn) — bankerrunners@gmail.com
# Repo: bankerrunners/core-platform-site
# Branch at backup: copilot/main
# Last commit: 70239cc — feat: CORE-J.A.R.V.I.S 2.0.0 identity rename

---

## 1. Identity & Naming (as of this backup)

| Field | Value |
|---|---|
| System name | CORE-J.A.R.V.I.S 2.0.0 |
| Operating platform overseen | THRIVE |
| package.json name | `core-jarvis` |
| package.json version | `2.0.0` |
| Page title | CORE-J.A.R.V.I.S 2.0.0 — The In-House Signal Exchange |
| PWA manifest name | CORE-J.A.R.V.I.S 2.0.0 — THRIVE Portal |
| PWA short_name | CORE-J.A.R.V.I.S |
| applicationName (iOS meta) | CORE-J.A.R.V.I.S |
| Worker name (Cloudflare, not yet renamed) | site-creator-vinext-starter |
| Public URL | https://site-creator-vinext-starter.bankerrunners.workers.dev |

> ⚠️ Worker name on Cloudflare still reflects the old identity. Rename requires
> Cloudflare dashboard action + fresh `npm run deploy`. Do not rename
> `.openai/hosting.json` until ready to redeploy — mismatch breaks live site.

---

## 2. Live Infrastructure

| Resource | Value |
|---|---|
| Cloudflare account | Bankerrunners@gmail.com — `e6f9d0a344a0a7b317601ffbe23f871e` |
| D1 database | `site-creator-d1` — `e00c30f0-7017-49d8-9f81-446cef9e32c3` |
| R2 bucket | `site-creator-r2` (binding: `CALL_RECORDINGS`) |
| GitHub repo | `bankerrunners/core-platform-site` |
| Local checkout | `C:\Users\k2547\OneDrive\Desktop\core-platform-site` |
| Secrets (names only — never put values here) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` |

Stale resources already cleaned:
- ~~Stray D1 `8` (`5bc64b69...`)~~ — deleted by owner 2026-08-15 ✅

---

## 3. Members (current state)

| Email | Name | Role | Status |
|---|---|---|---|
| bankerrunners@gmail.com | Yuxiang Mao (Shawn) | owner | Active ✅ |
| ryandavidson.zenith@gmail.com | Ryan Davidson | owner | Granted, confirmed ✅ |
| epiclife.nguyen@gmail.com | Nate Nguyen | owner | SQL prepared — **execution unconfirmed** ⚠️ |
| Oscar Valencia | — | owner | Address never confirmed ⚠️ |

Verify live state: `SELECT email, display_name, role, status FROM portal_members;`

---

## 4. What Is Built and Live

### Auth
- Sign in with Google (OAuth 2.0 + PKCE), HMAC-SHA256 session cookie (`core_session`)
- Retired `oai-authenticated-user-*` headers ignored entirely
- 29 auth tests passing; session forgery, expired cookie, tampered token all tested

### Portal
- `/portal` — requires active `portal_members` row
- `/portal/members` — member management (grant, role, status) gated on `members.manage`
- `/portal/calls` — Call Lab
- `/portal/scripts` — Script Vault
- `/portal/shop` — Exchange
- `/portal/music` — THRIVE Radio
- `/portal/announcements` — Announcements

### PWA
- Installable to phone home screen (manifest, icons, service worker)
- Service worker NEVER caches `/portal` or `/auth` — pinned by test character-for-character
- Icons: 192px, 512px, maskable 512px

### Deploy Gate
- `npm run deploy` = build → tests → preflight → wrangler (stops on any failure)
- `scripts/verify-build.mjs` refuses: stale dist, placeholder D1 id, missing bindings, missing PWA files

### Audit
- Append-only `audit_events` table — every allow and deny recorded

---

## 5. CORE-J.A.R.V.I.S Agent Structure

### Standing Staff (running routines on owner's account)
| Name | Cadence | Trigger | Job |
|---|---|---|---|
| VIGIL | Daily ~13:08 UTC | Only on regression | Eight security invariants, suite, deployability |
| MR. T | Every 10 hours | When something changed | Content dates, placeholder drift, stale record, unconfirmed grants |
| Morning Brief | Daily 12:00 UTC | Every day | Daily briefing |

### CORE-J.A.R.V.I.S Verification Bench (summon-on-demand)
| ID | Name | Scope |
|---|---|---|
| JARVIS-101 | Capability Cross-Reference Auditor | CAPABILITY-JOURNAL.md ↔ access.ts ↔ role matrix |
| JARVIS-102 | Session & Training Consistency Checker | SESSION_LOG + CORE_PLATFORM_RECORD ↔ live code |
| JARVIS-103 | Evaluation Suite Validator | Evaluation cases ↔ tests/ coverage |

Full 100-role bench: WORKFORCE.md

---

## 6. Capability Journal State

File: `CAPABILITY-JOURNAL.md`

| Capability | Status |
|---|---|
| Scoped task routing | Proven |
| Protected portal monitoring | Proven |
| External-action gating | Proven |
| Advanced training drills | Trial — first scored drill pending |

---

## 7. Open Items (unresolved, requires owner action)

| # | Item | Owner action required | Urgency |
|---|---|---|---|
| 1 | Confirm Nate Nguyen grant applied | Portal → Members | High |
| 2 | Confirm Oscar Valencia sign-in address + grant | Portal → Members | High |
| 3 | Pinned announcement names products not in codebase | Content decision | Medium |
| 4 | Three Library docs are unapproved drafts | Content decision | Medium |
| 5 | Approved incentive doc expires Aug 31 | Content decision | High |
| 6 | `LEAD_COST = 15` is a placeholder | Owner sets the number | Medium |
| 7 | `portal.access` capability — real gate or remove from matrix | Governance decision | Medium |
| 8 | `music.manage` — split from `members.manage`? | Governance decision | Low |
| 9 | Quoter seam — outbound link, no capability check, no audit row | Architecture decision | Low |
| 10 | Worker rename on Cloudflare (`core-jarvis`) | Dashboard + redeploy | Low |

---

## 8. Key Files Reference

| File | Purpose |
|---|---|
| `CLAUDE.md` | Load-bearing operating rules — read before any non-trivial work |
| `CORE_PLATFORM_RECORD.md` | What is live: infra, roles, capabilities, SQL, deploy sequence |
| `SESSION_LOG.md` | Chronological decision record |
| `WORKFORCE.md` | 100-role specialist bench + JARVIS-101/102/103 |
| `CAPABILITY-JOURNAL.md` | Evidence log for reusable operating lessons |
| `app/portal/access.ts` | Authorization — capabilities, role matrix, audit writes |
| `app/google-auth.ts` | Identity — session cookie, HMAC, getAuthUser() |
| `db/schema.ts` | Drizzle schema |
| `db/sql/` | Hand-written migrations — THE path applied to live DB |
| `tests/` | Auth safety net — 29 tests, run before every deploy |
| `scripts/verify-build.mjs` | Deploy gate preflight |
| `public/sw.js` | Service worker — never cache /portal or /auth |

---

## 9. Commit History (recent)

```
70239cc feat: CORE-J.A.R.V.I.S 2.0.0 identity — rename, capability journal, 3 sub-agents
abe1ba0 Portal 2.1: owner peer-protection, real icons, dial pad, next-gen chrome, back-button fix (#8)
```

Full history: `git log --oneline` in the repo.

---

## 10. How to Resume This Session

1. `cd C:\Users\k2547\OneDrive\Desktop\core-platform-site`
2. `git pull origin main`
3. Read `CLAUDE.md` and `CORE_PLATFORM_RECORD.md`
4. Check open items in §7 above
5. Run `npm run test` to confirm green before any work

**Never work in ARCHIVE, MAINBACK, or RE SUMMON copies. Always work in the live checkout.**

---

*Backup created: 2026-08-16 UTC by CORE-J.A.R.V.I.S 2.0.0 session agent.*
*This file is a point-in-time snapshot. For live state, SESSION_LOG.md is authoritative.*
