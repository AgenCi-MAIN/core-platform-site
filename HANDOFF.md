# CORE / J.A.R.V.I.S. — HANDOFF

The front door to the whole operation. If you are a developer, a partner's
team, or a future Mr. T picking this up cold: read this file first, then
follow the map. Everything named here is in this repository — one clone
holds the source code, the logs, the agent personas, the tournament records,
and the strategy blueprints.

**Owner:** Yuxiang Mao (Shawn), `btcmao518@gmail.com` (since 2026-08-17;
previously `bankerrunners@gmail.com`, retired — Google locked that account).
**Canonical source:** GitHub `bankerrunners/core-platform-site` — always
current; this handoff is a point-in-time copy.
**Live platform:** `https://site-creator-vinext-starter.bankerrunners.workers.dev`
(Version 877e0c99 as of 2026-08-16 — open-redirect fix + call-review surface live).
**No secret values** appear anywhere in this package — only secret *names*.
The three-to-four secrets live in Cloudflare/Google, re-entered by the owner.

---

## Read these first, in order

1. **`CLAUDE.md`** — the load-bearing rules. Non-negotiable. Read before touching anything.
2. **`CORE_PLATFORM_RECORD.md`** — the operating record: what's live, how identity and membership work, the traps already paid for, the deploy sequence.
3. **`WORKFORCE.md`** — the AI staff doctrine: the 100-role bench, the Fleet Economy, the three tournaments, the leaderboard, the leashes.
4. **`RELEASE-2.0.0.md`** — what version 2.0.0 is and the rebuild-from-nothing guarantee.
5. This file — the map below.

---

## The map — where everything you asked for lives

### SOURCE CODE
- `app/` — the application (a Cloudflare Worker via vinext / Next.js-style).
  - `app/portal/` — the authenticated portal: `access.ts` (authorization core),
    `page.tsx` (dashboard), `leadership/`, `calls/` (dialer + recording),
    `members/`, `presence/` (the AI pet), `audit/`, `investigator/`.
  - `app/auth/` — Sign in with Google (signin, callback, signout).
  - `app/google-auth.ts` — session cookie mint/verify (HMAC).
- `db/` — data model: `schema.ts`, `sql/` (the LIVE migration path), `drizzle/` (generated).
- `tests/` — the safety net: `portal-authorization.test.mjs` (Miniflare/D1 runtime, 50 cases total with `rendered-html.test.mjs`).
- `build/`, `scripts/`, `public/` — build plugin, the `verify-build` preflight, the installable-PWA layer (`sw.js`).
- `worker-env.d.ts`, `next.config.ts`, `vite.config.ts`, `package.json` — config.

### CHAT / LOGS
- `logs/SESSION-BACKUP-2026-08-15.md` (Part 1) and `-PART2.md` (Part 2) — the
  curated log of the entire working session: every decision, every shipped
  change, every owner-ordered outbound send (with message ids), the open
  items. This is the operative record of the chat — the written memory of
  what happened and why.

### PERSONA / SUBAGENTS
- `.github/agents/` — the trained-lane registry: one brief per summonable
  specialist (active), plus `retired/` (lanes cut by production-per-token).
- `W-SUBS/` — the rank-ordered **rebuild kits**, one folder per team member:
  - `00-MAIN-MR-T/` — how a fresh session becomes MAIN (Mr. T).
  - `0Q-VERITY/` — quality control + her PA, LEDGER.
  - `01-presence-probe/` … `08-authz-matrix/` — the eight first-team lanes,
    each with `BRIEF.md` (the re-summonable role) and `CODE-MANIFEST.md`
    (the exact files that lane owns). Squad leads carry their sub's brief.
- `SCOREBOARD/` — `TEAM-ROSTER.md` (the whole team), `SCOREBOARD.md`
  (standings + the two winning subs), and the winning subs' standalone briefs.

### TASKS RAN / TOURNAMENTS
- `WORKFORCE.md` — the three tournaments in full: `platform-marathon-audit`
  (T1), `forward-build-fleet` (T2), `leadtech-plug-fleet` (T3) — agents
  fielded, tokens spent, findings, grants, verdicts, and the oversight ladder.
- `SCOREBOARD/SCOREBOARD.md` → "Ledger totals" — the one-line summary of each.

### BLUEPRINTS
- `strategy/2026-08-15-exit-architecture.md` (+ `fleet-2026-08-15/`) — the
  exit-architecture corpus and the seven fleet reports.
- `strategy/2026-08-15-partner-state.md` — the Davidson-brothers partner
  context and the integration targets (LeadTech, Retention AI).
- `strategy/2026-08-16-centralization-spec.md` — the enter-once/fan-out
  single-source-of-truth spec (leaderboard + RetentionOS + Discord bot).
- Ryan's 36-month "Thrive Intelligence OS" blueprint lives in the owner's
  Gmail thread (message id in `logs/SESSION-BACKUP-2026-08-15-PART2.md`,
  send #8) — not in the repo, but recorded there.

---

## How to run it

```bash
npm ci
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # builds, then 50 tests in Miniflare (real workerd + D1)
npm run build       # bakes the D1 id and the app into dist/
npm run verify:build
```

Deploy (owner's Windows machine only, from the project dir, after git pull):
`npm run deploy` — build → tests → preflight → wrangler, chained.

## How to rebuild from nothing

This repo + the owner's D1 export (`d1-backup-*.sql`, kept OUT of the repo
because it holds member emails) + the secret *names* re-entered by the owner
(`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, optionally
`ANTHROPIC_API_KEY`). Frozen desktop snapshots (ARCHIVE, MAINBACK, RE SUMMON)
are historical — never worked in.

## What is NOT finished (honest open items, 2026-08-16)

- The LeadTech ingest socket is designed, built, and adversarially reviewed
  (2 criticals found) but **not applied** — held for route relocation, the 14
  fixes, the contract rewrite, and counsel sign-off on the Florida all-party
  consent line. See WORKFORCE.md Test 3 and the adversary findings.
- Andrew Davidson's owner seat is LIVE — granted from the portal, first
  sign-in bound 2026-08-16.
- Open owner decisions: PRESENCE_MODEL (Haiku), the Inkbox $30 upgrade,
  carrier statements (the pilot's entry ticket), the A/B/C centralization
  decision, Oscar Valencia's address.

---

*Handoff assembled by MAIN (Mr. T), 2026-08-16. Everything here traces to the
operating record. The canonical, always-current copy is the GitHub repo.*
