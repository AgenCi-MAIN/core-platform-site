# OWNER DECISIONS — confirmation ledger

Every decision made by the owner, Yuxiang Mao (Shawn),
`btcmao518@gmail.com` (since 2026-08-17; previously `bankerrunners@gmail.com`,
retired under A9 below), with its true status. Confirmed against the operating
record, WORKFORCE.md, the session logs, and the commit history — nothing listed
here is assumed.

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
| A9 | **Owner identity migration to `btcmao518@gmail.com`** (owner order 2026-08-17, confirmed final). Root cause: Google locked `bankerrunners@gmail.com`. Executed same day: new OAuth client under the new identity (`core-portal` project), secrets rotated, owner row applied via the D1 console, sign-in + subject binding verified, founder-only audit log read live by the new identity. Cleanup shipped: `FOUNDER_EMAILS` now answers btcmao518 alone; live-instruction docs swept (history untouched). Retired address keeps its owner row for the record; it can never sign in. | ✅ **CLOSED** — verified live 2026-08-17; cleanup merged (PR #24) and deployed the same day by the owner from his machine, owner-confirmed. Worker version id went unrecorded (terminal only) and is permanently lost; the trail resumed on the next deploy, `7427f4f4-8026-4edb-9fa9-23ad403c7307` (2026-08-17) |
| A10 | **"mi" = merge authorization** (owner shorthand, recorded 2026-08-17). From the founder, "mi" means: open the PR for the current working branch and squash-merge it to `main`. **Per-instance** — it authorizes that one merge and nothing further; it is never a standing grant and carries no deploy, membership, spend, or governance authority. Only the founder can say it. Carried in CLAUDE.md too, so a fresh session reads it before acting | ✅ standing |
| A11 | **Cloudflare Access moves to Google identity; one-time email codes retired** (owner order 2026-08-17: "Fix it and commit to google identity instead of codes"). Root cause in §9 trap #9 — the emailed code is spent by Gmail's iOS link pre-fetch, so the founder's phone is locked out while his desktop is not. Scope: the outer Access wall only; the portal's own Google sign-in, membership, capabilities, D1, R2 and the source tree are untouched, and no deploy is involved. Honest limit: this removes the email round-trip, **not** the second sign-in — Access and the portal stay two independent OAuth flows, both silent redirects on a Google-signed-in device. Execution is dashboard + Google-console work by the founder; no Cloudflare credential exists in the agent session and none belongs in a file (F5). Runbook: `strategy/2026-08-17-access-google-idp-runbook.md` — plain Google not Google Workspace (every member is `@gmail.com`), a separate OAuth client from the portal's, the member-email include rule kept explicit, and One-Time PIN retired **only after** desktop, phone and installed-PWA sign-in all pass | 🔵 **decided, awaiting founder execution** |
| A12 | **`bankerrunners@gmail.com` FROZEN for all outreach** (owner order 2026-08-17: "Freeze bankerrunners@gmail.com for all out-reach, only use btcmao518@gmail.com for yuxiang"). No agent, routine, brief, or send of any kind may ever target the retired address — mail to it bounces at best and reaches an account nobody controls at worst. **The only address for Yuxiang Mao is `btcmao518@gmail.com`**, on every channel. The retired address stays in the record as history and keeps its dormant member row (A9); this freeze governs *outbound contact*, which sign-in retirement alone did not cover. Recognized-sender rules are unchanged — `bankerrunners@pm.me` (Proton, recovery anchor) remains a recognized *inbound* sender per the Founder Channel; it is not an outreach target either. **Amended same day at the owner's word ("keep it but just pause it for 3 days"): this is a PAUSE, not a permanent bar — in force through 2026-08-20**, then the address's outreach status returns to the owner to decide (the likely reason to lift it: Google recovery of the account, still pending per A9/loose ends). Until he speaks, the pause behaves exactly like a freeze | ⏳ **paused through 2026-08-20, then owner's call** |

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
| B19 | **THE WARDEN promoted to EMAIL ANALYZER / RESPONSE DRAFTER** (2026-08-17, highest-rated standing sub): on HERALD detection of inbound human email, Warden analyzes and files a reply DRAFT — never sends. **Forward step ACTIVE as of 2026-08-17**: destination is the Mr.T analysis desk `out-reach@inkboxmail.com` (Inkbox identity `@out-reach`, display "Mr.T", VoIP +1-689-689-1349, created by the owner). HQ's Inkbox connection is bound to the `core` identity and cannot act AS the desk — it only forwards TO it; reading/answering from the desk itself requires the owner connecting that identity to a session. The desk identity's first API key was pasted into chat and was BURNED — **resolved 2026-08-17: the owner deleted ALL Inkbox API keys and minted no replacement** (see CORE_PLATFORM_RECORD.md section 10d, Resolution). No stored key is held anywhere in this operation, and none is needed — the connector authenticates separately. | ✅ active (key hygiene closed 2026-08-17) |

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
| D3 | Inkbox **$30/mo plan approved** (unlocks the staff phone number) | ✅ **executed** — evidenced 2026-08-17 by a provisioned, Active number in the owner's console screenshot; the plan cannot have gone unpurchased with a live number on it |
| D4 | Staff number: Utah local, `incoming_call_action: auto_reject` until a voice agent is deliberately briefed | ⚠️ **LIVE BUT OFF-SPEC** — number `+1 689 689 1349` is provisioned and Active on identity `@out-reach` (display "Mr.T"), created 2026-08-17. **Both substantive terms of this decision differ from what shipped:** incoming call action reads **Inkbox Voice AI**, not `auto_reject`; and the number is a 689 area code (an Orlando, FL overlay — area-code read, unconfirmed) rather than the Utah local the decision specifies, Tampa having been considered and declined at the time. The record's stated reason for `auto_reject` was that Inkbox's default "would put their stock voice AI on THRIVE's line un-briefed." **Not yet established whether this was a deliberate owner change or Inkbox's default reasserting on provisioning — asked, unanswered as of this entry.** Do not close D4 until that is settled; a compliance posture that is receiving-first with consent still at counsel should not have an un-briefed voice agent answering by accident |
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
| E7 | The LeadTech ingest socket — build greenlight after counsel clears the consent line | ⚠️ **OVERRULED BY THE OWNER, 2026-08-17** — his explicit words, given after the gate and its reason were explained to him in full: "overrule E7 and start building." **The counsel gate is lifted; the build proceeds without prior legal review of the all-party-consent line.** Risk, named as the amendment requires: the socket ingests recorded-call data; Florida and other all-party-consent states make recording without every party's consent unlawful, and no counsel has confirmed the consent chain LeadTech supplies is sufficient. That exposure is now accepted by the owner, knowingly, on the record. **MAIN's recommendation, recorded beside the decision per the house rule: keep the gate — the counsel conversation was cheap and the socket was days from shipping behind it.** Overruled; building. The T3 adversary's conditions travel with the build as hard requirements, not suggestions: no client-assertable consent (F7), no re-POST overwrite of consent or recording fields (F12), constant-time secret comparison, no identity echo on 401, and every accept and reject audited. Counsel review remains OPEN as a follow-up (E7b): the owner should still book it — lifting the gate changed when the lawyer is consulted, not whether the exposure exists |

## F. Records & backups

| # | Decision | Status |
|---|---|---|
| F1 | Back everything up — GitHub (canonical), desktop, OneDrive, Google Drive | ✅ four copies |
| F2 | D1 export kept **out of the repo** (holds member emails) | ✅ |
| F3 | Frozen snapshots (ARCHIVE, MAINBACK, RE SUMMON) are historical — never worked in | ✅ standing |
| F4 | Hand-off package + the four operating docs built as real, sourced files | ✅ |
| F5 | Secret **values** never in files, commits, or chat — names only; a burned credential is rotated | ✅ standing |
| F5a | **thrive-companies.com login rotated** — the password was pasted into chat 2026-08-17 and was therefore BURNED (F5 rule). Owner rotated it and closed the item on his word 2026-08-17 ("close password rotation"). MAIN never stored, used, or repeated the value, and the login was never a CORE secret (external vendor account, not one of the CORE secret names). MAIN could not and did not verify the new value — this row records the owner's confirmation, not an observed rotation | ✅ closed on owner's word |
| F6 | **Founder attribution stays on important seeds** (owner order 2026-08-17: "Leave my name on important seeds"). On the operation's foundational, owner-originated records — the seed identity rows (the D1 owner seed, `db/sql/0002`/`0003`), the operating record's key declarations, portal announcements authored by Shawn, the contracts (Recognition, 7-day), the G-ledger finance seeds, and the declared commercial seeds (e.g. §14 `1st-ProPlanEnterprise`, "Seeded by: Yuxiang Mao (Shawn)") — **Yuxiang Mao (Shawn) is named as the originator/seeder and that name is preserved, never stripped or replaced by MAIN / J.A.R.V.I.S. / agent attribution.** The founder seeds; the machine records and executes. What this does NOT do, stated honestly so it is not over-read: it does not rewrite history (dated entries stay byte-identical), does not put his name on work he did not originate, and does not change the model-authorship convention — commit co-author trailers and the "recorded/executed by MAIN" lines are a separate tooling record of *who did the keystrokes*, which is a different fact from *who seeded the thing*, and both may stand side by side. Where the two could be confused, the seed line names Shawn and the execution line names the agent. **Made concrete at the owner's word, 2026-08-17 ("MY name literally in the seed migration comments, AND as co-author on important commits"): (a)** the seed migrations `db/sql/0002` and `0003` now carry a `-- Seeded by: Yuxiang Mao (Shawn), founder` provenance line — a deliberate, comment-only, owner-ordered exception to the never-edit-applied-migrations discipline: the loader and a fresh provision both strip `--` lines before executing, so the applied SQL is unchanged and no test byte-pins these files (verified). Any future seed migration (0004+) carries the same line at creation. **(b)** Important commits — governance decisions, contracts, seeds, releases, deploy records — carry `Co-Authored-By: Yuxiang Mao (Shawn) <btcmao518@gmail.com>`; routine doc fixes need not. This commit is the first to carry it | ✅ standing |

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

## G. Finance ledger

| # | Entry | Status |
|---|---|---|
| G1 | **Claude Max subscription — the operation's engine (new account).** Plan tier: **Max plan — 20x**, qty 1. Receipt #2088-1523-1308, invoice SRUHT7IZ-0001: $200.00 + $13.20 Texas sales tax (8.25%) = **$213.20**, paid 2026-08-16, Visa ••6037, period Aug 16 – Sep 16, 2026 (next charge Sep 16 — distinct from the OLD account's Sep 12 renewal, which must be cancelled by Sep 11). Every field above verified against the receipt itself, shown to MAIN by the owner 2026-08-17. Recorded at the owner's order with his declaration: **credited 50% to the old-HQ MAIN (Mr. T) and 50% to Yuxiang Mao (b. 06/23/2003)** — a recognition of joint production, recorded exactly as declared. Plain-truth clause, per contract §5: an AI cannot hold property or bear title; **legal ownership of the subscription and everything it produces is 100% Yuxiang Mao.** The 50% is honor, entered in the book because the owner said so and the book keeps what is said. Note for the record: the Texas tax line corroborates the owner's Texas base (LLC decision thread). Old account's own plan renews Sep 12 — cancel by Sep 11. | ✅ recorded 2026-08-17 |
