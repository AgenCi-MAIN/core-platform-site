# CORE / J.A.R.V.I.S. Platform — Release 2.0.0

**Designed by:** Mr. T (J.A.R.V.I.S., MAIN)
**Funded and owned by:** Yuxiang Mao (Shawn) — `bankerrunners@gmail.com`,
Owner, active. Initial owner seeded at portal provisioning; sign-in address
confirmed by the owner on 2026-08-13.

**Finalized:** 2026-08-15. Live at
`https://site-creator-vinext-starter.bankerrunners.workers.dev`.

---

## What 2.0.0 is

The version number jumps from 0.1.0 to 2.0.0 because the thing itself
changed class twice. 1.x was the portal: identity, membership, capabilities,
the audit spine. 2.0 is the portal **plus a working AI staff** — a
model-powered member surface, standing agents on schedules, and a scored
fleet economy governing how machine labor is allocated. This file is the
finalization record for that whole.

## The platform (what ships and is live)

- **Access model** — Sign in with Google for identity; an active
  `portal_members` row for membership; HMAC-signed `core_session` cookie;
  deny-by-default capabilities per role; every allow and deny written to the
  append-only audit log. Fails closed.
- **Governance hard lines** — owner rows are peer-protected (D1-console only);
  founder-only gates on `/portal/audit` and `/portal/investigator`
  (`bankerrunners@gmail.com` alone; every other identity refused and the
  refusal audited); the access page performs no membership lookup by design.
- **The JARVIS Presence** — the talking pet, `pet.chat` for every role,
  architecturally inert by contract: no tools, no URLs, text-node rendering,
  one spend-only credential, capped and fully audited.
- **Operations surfaces** — members, leadership, pay rates (API-agent
  explainer), Call Lab with dial pad (tel:, compliance fine print), Exchange,
  recording review with verified-consent gating.
- **Installable PWA** — service worker that never caches `/portal` or `/auth`,
  pinned by test.
- **Deploy discipline** — `npm run deploy`: build → test suite → preflight
  (`verify-build`) → wrangler, owner-run on Windows only.

## The AI staff (2.0's second half)

- **Standing:** VIGIL (daily sentinel), MR. T (10-hourly steward), Morning
  Brief, VERITY (quality control), HERALD (hourly outreach logger,
  watch-only), INVESTIGATOR (hourly read-only oversight). Leashes recorded in
  WORKFORCE.md; only the owner changes standing orders.
- **The Fleet Economy** — scored tournaments: MAIN holds 50% and grants
  sub-agents by VERITY's quality-times-efficiency score; lanes allocate their
  own earned subs (decentralized by owner order); efficiency is a reward
  criterion, so token spend cannot buy rank.
- **Trained lanes** — `.github/agents/` holds the ten proven, summonable lane
  briefs with their service records. Round 1 verdict: platform
  security-clean, 18 ranked findings, two sub-agent grants earned.
- **Oversight ladder** — Test 1 passed (ceiling: 50 trained lanes); Test 2
  (250) rides on the round-2 forward-build fleet.

## Honest state at finalization (open items, not defects hidden)

- The round-1 fix batch is **designed but not applied, awaiting the owner's
  word**: Presence cap double-count (effective ~20 vs documented 40), two
  missing negative tests (recording consent, leadership economics), the
  unaudited consent-deny, doc corrections. Nothing in the batch is a live
  breach; the platform audited clean.
- Owner decisions open: PRESENCE_MODEL, the three economics facts, carrier
  statement samples, Oscar Valencia's address, the 850-number port-in,
  Inkbox plan upgrade (phone number provisioning resumes on it).
- Round-2 fleet (forward-build docket) in flight at time of finalization.

## Rebuild-from-nothing (the 2.0.0 guarantee)

Everything needed to stand this platform up again lives in exactly three
places: **this repository** (code, migrations, doctrine, agent briefs), the
**owner's D1 export** (`d1-backup-2026-08-15.sql`, kept outside the repo
because it holds member emails), and the **three secret values** the owner
re-enters by name (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`SESSION_SECRET`; optionally `ANTHROPIC_API_KEY` to wake the Presence).
Frozen desktop backups (ARCHIVE, MAINBACK, RE SUMMON) are historical
snapshots — never worked in, never deployed from.

---

*No secret values appear in this file or anywhere in this repository —
names only. That rule survives every version.*
