# OWNER DECISIONS — confirmation ledger

Every decision made by the owner, Yuxiang Mao (Shawn),
`bankerrunners@gmail.com`, with its true status. Confirmed against the
operating record, WORKFORCE.md, the session logs, and the commit history —
nothing listed here is assumed.

**Status key:** ✅ EXECUTED (done and in force) · ⏳ PENDING (decided, awaiting
an action) · 🔵 OPEN (still the owner's to decide)

---

## A. Access & governance

| # | Decision | Status |
|---|---|---|
| A1 | Owner rows are peer-protected — no owner/admin may change another owner from the portal; D1-console only, refusal audited | ✅ |
| A2 | Audit log and INVESTIGATOR console are **founder-only** by identity (`requireFounder`), not capability — any other email denied and audited | ✅ |
| A3 | `audit.view` removed from every role | ✅ |
| A4 | `pet.chat` granted to all six roles (the Presence isolation contract) | ✅ |
| A5 | Proton aliases are **not** identities — none sign in, never grant an alias a member row; sole founder identity is the Gmail address | ✅ |
| A6 | Ryan Davidson + Nate Nguyen seated as owners | ✅ |
| A7 | **Andrew Davidson** (`andrew.davidson.zenith@gmail.com`) approved as owner | ✅ granted from the portal 2026-08-15; signed in and bound 2026-08-16 (roster verified by the owner) |
| A8 | Oscar Valencia — named as owner, no grant until his exact sign-in address is confirmed | 🔵 |
| A9 | **Owner identity migration to `btcmao518@gmail.com`** (owner order 2026-08-17, confirmed final). Additive owner grant staged (`db/sql/0003`); founder access staged as a two-identity transition set (`FOUNDER_EMAILS` = btcmao518 + bankerrunners) so the audit surface can't lock out mid-move. `bankerrunners` retained as fallback until btcmao518 is confirmed signing in and bound, then dropped. **Blocked on the disabled Google OAuth client** — no sign-in possible until it is re-enabled. History (seed, prior grants, audit) is left intact, not rewritten. | ⏳ staged; awaits live grant + OAuth re-enable + sign-in proof |

## B. The AI staff

| # | Decision | Status |
|---|---|---|
| B1 | **VERITY** appointed first permanent PA / quality control | ✅ |
| B2 | **HERALD** appointed — hourly inbound watch, never sends | ✅ running |
| B3 | **INVESTIGATOR** appointed — hourly read-only oversight, zero writes | ✅ running |
| B4 | **MAILKEEPER** appointed — daily Gmail keeper, flag-only on money/security | ✅ running |
| B5 | **LEDGER** appointed as VERITY's permanent PA (MAIN's pick) | ✅ |
| B6 | **Fleet Economy** instituted — competition scored on production per token | ✅ |
| B7 | Sub-agent allocation **decentralized** — MAIN grants how many, the lane commands its own | ✅ |
| B8 | **Savings pool** — under-median tokens fund the subs' next missions | ✅ |
| B9 | **Oversight ladder** — 50 lanes on Test 1, 250 on Test 2 | ✅ both passed |
| B10 | **Test 3 terms** — inverted judgment (the O.G. 10 judge MAIN), 50/50 budget split, kill authority against cheating subs | ✅ |
| B11 | **Cull** — strategy-facts and auth-depth cleared out on production-per-token | ✅ |
| B12 | **PERSONA** promoted — reads all agents, drafts recruits, 3-hourly patrol, one wake per patrol | ✅ running |
| B13 | **THE WARDEN** promoted — mentors underperformers, may pause subs **only after notifying the owner**, 24/7 standing | ✅ |
| B14 | **Eight permanent positions** — the first team promoted from bench to tenured seats, per-seat trigger activation | ✅ |
| B15 | **MAIN comp level raised to 80%** — recognition of orchestration standing; the grant rule untouched so competition survives | ✅ |
| B16 | Token caps **unlimited** — made safe because spend lowers a lane's own score | ✅ standing |
| B17 | New recruits enter **under** an O.G. lane, VERITY-reviewed | ✅ |
| B18 | **Codex project first** — every workforce assignment must confirm the CORE Codex workspace and load the governing records before work begins; this grants no external credentials or capabilities | ✅ standing |

## C. The platform

| # | Decision | Status |
|---|---|---|
| C1 | Build the **JARVIS Presence** (the talking pet, pitch #2) with a hard isolation contract | ✅ live |
| C2 | Release **2.0.0** — platform + AI staff as one versioned whole | ✅ |
| C3 | Deploy from the owner's Windows machine only, via `npm run deploy` | ✅ standing |
| C4 | `PRESENCE_MODEL` — Opus 5 (current) vs Haiku 4.5 (~5× cheaper) | 🔵 |
| C5 | Leadership page shows live company oversight, aggregates only | ✅ deployed |

## D. Telephony & comms

| # | Decision | Status |
|---|---|---|
| D1 | NumberBarn — Local number `(850) 809-0050` on the Park plan | ✅ then superseded |
| D2 | **Disregard the NumberBarn decline — consolidate on Inkbox**; the 850 number is allowed to lapse, knowingly | ✅ |
| D3 | Inkbox **$30/mo plan approved** (unlocks the staff phone number) | ⏳ not yet purchased |
| D4 | Staff number: Utah local, `incoming_call_action: auto_reject` until a voice agent is deliberately briefed | ⏳ blocked on D3 |
| D5 | The Aug-13 Google recovery email/phone change — **confirmed as the owner's own** | ✅ closed |
| D6 | Copilot — keep **Pro+**, cancel the duplicate Pro | ⏳ owner's click |
| D7 | YouTube Music trial — cancel on Sep 13 | ⏳ reminder armed |
| D8 | Two Slack Pro trials — decide before conversion | 🔵 |

## E. Partners (Ryan & Andrew Davidson)

| # | Decision | Status |
|---|---|---|
| E1 | Eight outbound emails, each explicitly ordered, each logged with its message id | ✅ |
| E2 | WORKFORCE.md shared verbatim with both brothers | ✅ |
| E3 | **LeadTech** approved as integration source #1 (Andrew gave permission) | ⏳ socket held |
| E4 | **Retention AI** approved as integration source #2, reusing the same socket pattern | ⏳ socket held |
| E5 | Centralization: enter once → fan out (leaderboard + RetentionOS + Discord bot) | ✅ spec recorded |
| E6 | Which system is the center — CORE / RetentionOS / consolidate (the A/B/C call) | 🔵 owner + partners |
| E7 | The LeadTech ingest socket — build greenlight after counsel clears the consent line | 🔵 |

## F. Records & backups

| # | Decision | Status |
|---|---|---|
| F1 | Back everything up — GitHub (canonical), desktop, OneDrive, Google Drive | ✅ four copies |
| F2 | D1 export kept **out of the repo** (holds member emails) | ✅ |
| F3 | Frozen snapshots (ARCHIVE, MAINBACK, RE SUMMON) are historical — never worked in | ✅ standing |
| F4 | Hand-off package + the four operating docs built as real, sourced files | ✅ |
| F5 | Secret **values** never in files, commits, or chat — names only; a burned credential is rotated | ✅ standing |

---

## What still needs the owner (the short list)

1. **Inkbox $30 upgrade** — unlocks the staff phone number (D3, D4)
2. **`PRESENCE_MODEL`** — one word for the ~5× cost cut (C4)
3. **Counsel on the consent line**, then the socket greenlight (E7)
4. **Carrier statements + LeadTech CPL data** — the pilot's entry ticket (E3)
6. **The A/B/C centralization decision** (E6)
7. Oscar's sign-in address (A8) · Copilot cancel (D6) · Slack trials (D8)

---

*Confirmation ledger maintained by MAIN (Mr. T). Every row traces to the
record; a decision that is not written here does not exist.*
