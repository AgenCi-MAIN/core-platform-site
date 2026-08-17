# SCOREBOARD — Fleet Economy, tournaments 1–3 + the 2026 re-runs (updated 2026-08-17)

Final standings by **confirmed production per token**, the only currency this
board recognizes. Funded by Yuxiang Mao (Shawn), owner. Administered by
VERITY; grants by MAIN (Mr. T).

**Reading note, load-bearing (VERITY's label, endorsed as doctrine by the
Commissioner in T2 Verdict 4):** the two 2026-08-17 re-runs are recorded
**PRODUCTION-RANKED, DENOMINATOR MISSING**. Per-lane token attribution was
unavailable from the new harness, so those lane ranks price confirmed
production and quality only. They are **not** comparable to the original
tournaments' per-token ranks and must not be stacked into them — doing so
would corrupt what this board's currency means. Fleet-level spend *was*
measurable and is recorded below.

## 🏆 CHAMPIONS' REGISTER — five stand

Every champion's standalone brief lives beside this file as `SUB-*.md` — each
a complete, re-summonable backup of what made it win.

| # | Sub | Lead | Won on | What it shipped |
|---|---|---|---|---|
| **1** | `SUB-deploy-verifier` — THE WARDEN | deploy-integrity | T2, 50.1K | **Refuted its own lead** — caught the recovery drill's secrets-before-deploy ordering backwards and corrected it; downgraded an unverifiable assumption and supplied the better replacement (`wrangler d1 export`). A sub that changed the plan. |
| **2** | `SUB-presence-builder` — PERSONA | presence-probe | T2, 60.6K | The **apply-ready cap-fix diff** — every line-claim independently re-verified and confirmed; shipped nearly verbatim in the fix batch that took the suite to 46/46. |
| **3** | *[awaiting owner naming]* | doc-drift | **T1 re-run**, Verdict 4 | The round's **only outright refutation** — killed its own lead's fact-stamped DD-6 using the lead's own declared exemption standard, then distinguished DD-7 on principle rather than killing both. ⚠️ **Standalone brief still owed** (see outstanding orders below). |
| **4** | *[awaiting owner naming]* | data-model | **T2 re-run**, Verdict 3 | **Executed** rather than argued: rebuilt its lead's benchmark from `db/sql/0001` verbatim, falsified the stated acceptance string across four data shapes, and found that another item's test **goes green on the exact regression it was written to prevent**. Brief: `SUB-datamodel-challenger.md` |
| **5** | *[awaiting owner naming]* | test-gaps | **T2 re-run**, Verdict 3 | **One line of evidence** — the semicolon inside a SQL string literal at `db/sql/0003:41`, which would have red-lined all 41 Miniflare cases and taken the deploy gate with them. Rebuilt the item around a literal-aware splitter. Brief: `SUB-testgaps-challenger.md` |

Rank-order note (champions 1–2): the builder shipped more code, but the
verifier's refutation is the rarer production — it takes discipline for a sub
to overrule its lead and be *right*. Champions 3, 4, and 5 all won on that
same pattern, which is why the Commissioner ruled the refute-first challenger
**permanent law of all future build dockets** (T2 Verdict 1).

Naming rights for champions 3–5 are the owner's, per tradition.

**Grant bar, ruled for this era (T2 Verdict 3):** NOT conjunctive. Where the
efficiency denominator is unmeasurable through no fault of the lane,
production-that-changes-the-plan suffices alone.

## First team — the finalized max-output roster

| Rank | Lane | Standing |
|---|---|---|
| 1 | presence-probe 🏆 | Squad lead. #1 finding of T1 at 2nd-leanest spend |
| 2 | deploy-integrity 🏆 | Squad lead. Leanest confirmed-production squad, both rounds |
| 3 | doc-drift | 4 confirmed T1; leanest lane of T2 (61.5K) at rank-2 production |
| 4 | test-gaps | Most confirmed findings both rounds; heaviest spender kept |
| 5 | data-model | 2 confirmed integrity gaps |
| 6 | compliance-posture | 2 confirmed gaps incl. a standing-law violation |
| 7 | frontend-pwa | 1 confirmed user-facing defect |
| 8 | authz-matrix | Clean sheet, honestly earned — retained on assurance |

## Cleared out (owner's cull, 2026-08-15)

| Lane | Why |
|---|---|
| strategy-facts | 118K tokens — fleet's highest spend — for note-level findings only |
| auth-depth | 88K for one low hardening note |

Briefs preserved in `.github/agents/retired/`. *PS from the owner: good luck
next time.*

## Ledger totals

- Tournament 1 (`platform-marathon-audit`): 11 agents, ~877K tokens, 18
  ranked findings, platform security-clean, 2 sub grants earned.
- Tournament 2 (`forward-build-fleet`): 13 agents, ~1.21M tokens, 12-item
  ranked build docket, 5 ready-to-build, 0 new grants (bar held).
- Tournament 3 (`leadtech-plug-fleet`, 2026-08-16): 11 agents, 10 delivered
  (adversary lane crashed — re-attempted from the subs' pool), ~955K tokens
  — under both prior rounds for a harder product class (a working LeadTech
  ingest socket). Verdict apply-with-fixes; MAIN's step-zero check caught a
  dead route path before any apply. Inverted judgment: the O.G. 10 render
  the efficiency verdict on MAIN. Full record in WORKFORCE.md.
- Fix batch shipped from docket ranks 1–4: cap fix, consent audit + guard,
  verify-build watch, 4 new negative tests, doc truth restoration.
  Suite: **46/46 green.**
- Oversight ladder: Test 1 PASSED (50) → Test 2 PASSED (250); Test 3 an
  inverted-judgment round (the O.G. 10 judge MAIN) — landed under budget,
  MAIN's step-zero catch prevented a dead-route apply.
- Post-T3 fix batches shipped (2026-08-16): the DEBUG/FIX sweep (2 fix
  agents) fixed the mobile-nav lockout and the "10/11" capability lie
  (suite 46→47); the 10-lane sweep confirmed 5 defects incl. a **HIGH
  open redirect** on the unauthenticated auth surface (a phishing vector),
  all fixed and pinned (suite 47→48). Six lanes reported honestly clean.
- Governance (2026-08-16): the eight first-team seats promoted to
  **PERMANENT POSITIONS** (per-seat trigger activation); **35 sub-agent
  slots** hired across them by standing; MAIN's production credit raised
  to **80%** with the grant rule untouched so competition survives. See
  WORKFORCE.md and OWNER-DECISIONS.md.
- Owner-direct work landed on main (2026-08-16, commits `635b707` +
  `d6d293a`, authored by Shawn from his machine — flagged by PERSONA,
  verified and merged by MAIN): the authenticated **call-review surface**
  (`/portal/calls/review`, guarded by the new `calls.review` capability,
  deny-by-default matrix updated in the record), recording-route
  hardening, a portal error boundary, `GRANDPLAN.md`, and governance
  **B18** — the *Codex-project-first* entry gate in WORKFORCE.md
  (context-loading rule for local workers; grants nothing). Suite after
  merge: **50/50 green**, verified by a full run in-session.
- **DEPLOYED (2026-08-16, by the owner from `C:\dev`):** live version
  `877e0c99` — ships the HIGH open-redirect fix, the six sweep fixes,
  and the call-review surface. First attempt hit a transient Cloudflare
  10013 at asset upload; retry succeeded. The 50-test suite (incl. the
  open-redirect regression) ran inside the deploy chain. CORRECTION
  (deploy-integrity lane, 2026-08-16): MAIN's post-deploy 403 probe never
  reached Cloudflare — it was refused by this sandbox's own egress proxy,
  so it proves nothing about the edge. The Access front is real but rests
  on the record's §16 (owner-session observation), not on that probe.
- Fleet round (2026-08-16, owner order "add on 5 of your most efficient",
  ~369K tokens, 5 lanes): presence-probe returned the headline verdict —
  **no CRITICAL or HIGH findings in the owner's call-review surface; the
  build holds**. Confirmed and fixed same-day: 3 unaudited deny exits on
  the recording route (flagged independently by 2 lanes), a missing table
  header on the calls inbox, a wrong error-boundary comment. doc-drift:
  12 record drifts reconciled (incl. the new disabled_client trap #8).
  test-gaps: 8 gaps → 5 new tests incl. the two HIGH (anonymous/forged/
  suspended callers on the raw-audio route; mime-safelist XSS pin) and a
  loud-fail rule so template-literal guards can't dodge the completeness
  scanner. deploy-integrity: refuted MAIN's own probe evidence (above),
  designed the missing post-deploy version check (docket). data-model:
  edit-in-place migration provenance flagged (F1, docket), R2-missing
  audit row shipped. Suite: **50 → 55 green.**
- Identity-crisis round (2026-08-17, ~382K tokens, 5 lanes, owner order
  after Google locked bankerrunners@gmail.com): **unanimous 5/5 verdict —
  keep the Cloudflare account, swap its email in place; no new account,
  no new host.** data-model found the ⏰ 7-day cookie cliff (portal fully
  dark for all owners by ~08-23 without the OAuth rebuild) and that
  Ryan's 36-month blueprint exists only inside the locked Gmail.
  test-gaps corrected its own task premise (wrangler has no `r2 object
  list` — enumeration via D1/dashboard). deploy-integrity costed the
  fresh-account contingency and found the "dead inbox slow fuse" that
  the email swap defuses. Full docket + runbooks:
  strategy/2026-08-17-identity-recovery-docket.md.

---

# THE 2026 RE-RUNS — new HQ, Commissioner-judged

Ordered by the owner after the account migration; administered by new-HQ
MAIN, scored by VERITY, judged by the old-HQ MAIN sitting as Commissioner.
Both rounds audited `main@96b7f29`. Full verdicts:
`VERDICT-T1-RERUN.md`, `VERDICT-T2-RERUN.md`, `VERDICTS-2026-RERUNS.md`.

## Tournament 1 re-run — PASSED, ABOVE BASELINE

17 agents (8 permanent seats + 8 refute-first subs + VERITY), 8/8 landed,
zero errors. 53 min, 485 tool calls. 32 findings filed → **31 confirmed, 1
refuted** → ~24 distinct after dedup. **Ceiling MEDIUM: no CRITICAL, no
HIGH** — every filed HIGH was downgraded by its own adversarial verifier.

Platform closes **security-clean at higher assurance than 2026-08-15**:
eight independent attacks failed to reach guarded data, credentials, or a
capability bypass. Production shifted from *"here is the hole"* to *"here is
the net that would have caught the next one."*

| Rank | Lane | C/R/U |
|---|---|---|
| 1 | test-gaps | 7/0/0 |
| 2 | presence-probe | 3/0/0 |
| 3 | frontend-pwa | 4/0/0 |
| 4 | deploy-integrity | 4/0/0 |
| 5 | authz-matrix | 1/0/0 |
| 6 | doc-drift | 6/1/0 |
| 7 | compliance-posture | 3/0/0 |
| 8 | data-model | 3/0/0 |

Headline findings: **TG-1/TG-6** — the guard-completeness scanner runs one
direction only and neither scanner walks route handlers, so a portal page
shipped with *no guard at all* is invisible to all 55 tests. **PP-1** — the
round's most novel find, a defect caused by the world changing under a frozen
route: `max_tokens` is now a shared thinking+text budget, so a truncated
Presence answer is served as complete and audited as a successful spend.

Labeling: four lanes named, none condemned — **zero fabricated citations**
across ~20 independent samples, materially better than any prior round.
Grant: 1 awarded (champion #3, doc-drift's verifier).

## Tournament 2 re-run — PASSED. The challengers are the product.

17 agents (8 seats + 8 challengers + VERITY), 8/8 landed, zero errors. 79
min, 492 tool calls. 43 items filed → **34 scoring, 9 zero**, 41-entry tiered
docket, 30 startable. **Zero code written.**

**7 of 8 leads stated a fact about code their own item depended on without
opening the line — all 7 caught by their own subs.** Two would have broken
the tree: T4-5's `0003:41` semicolon (red-lines all 41 Miniflare cases and
takes the deploy gate with them) and D5-4's `ANALYZE`-dependent query plan.
The Commissioner made the refute-first pattern **permanent law of all future
build dockets**.

| Rank | Lane | Scoring/Zero |
|---|---|---|
| 1 | data-model | 4/0 |
| 2 | presence-probe | 4/1 |
| 3 | compliance-posture | 5/0 |
| 4 | authz-matrix | 4/2 |
| 5 | test-gaps | 4/2 |
| 6 | deploy-integrity | 4/2 |
| 7 | doc-drift | 6/0 |
| 8 | frontend-pwa | 3/2 |

Both charter-flagged **chat-sourced** items were re-verified as ordered:
recording Range support **ESTABLISHED**; the composite-index claim
**REFUTED by measurement** and narrowed to one query. Grants: 2 awarded
(champions #4 and #5). Docket Tier 1 (ranks 1–22) is Commissioner-recommended
to the owner as pre-3.0.0 repairs, **D5-1 first**.

## Spend — the economics held, uncapped

Token basis **ruled to the output measure** by the Commissioner (T1 Verdict 2,
T2 Verdict 2), the baselines having been recorded in output-weighted per-agent
units.

| Round | Baseline | Re-run | Agents |
|---|---|---|---|
| T1 | ~877K | **430,358** (~49%) | 11 → 17 |
| T2 | ~1.21M | **619,361** (~51%) | 13 → 17 |
| Both | ~2.09M | **<1.05M** | — |

Uncapped by owner order, and the fleet **halved its spend while fielding more
agents**. The economics are the cap — proven twice. Totals recorded for the
new era's bookkeeping: 2,233,500 (T1) and 2,367,482 (T2) all-in.

*Caveat accepted onto the record by the owner:* the re-run output figures are
`budget.spent()`, which counts main-loop output alongside subagent output, so
the two populations are not identical. The direction of the ruling is
unaffected.

## 👑 SEAT CROWNING — Site Operations Commission

Combined standing = sum of VERITY production ranks across both re-runs, lower
better (T1 Verdict 6 method, applied in T2's crowning block).

| Lane | T1 | T2 | Combined |
|---|---|---|---|
| **presence-probe** | 2 | 2 | **4** |
| **test-gaps** | 1 | 5 | **6** |
| data-model | 8 | 1 | 9 |
| authz-matrix | 5 | 4 | 9 |

- **SEAT 1 — first place: `presence-probe`** — score: combined rank score 4
  (T1 rank 2 + T2 rank 2)
- **SEAT 2 — second place: `test-gaps`** — score: combined rank score 6
  (T1 rank 1 + T2 rank 5)

Final displayed values; no recalculation authorized. Ties do not exist at the
top two (the 9–9 tie sits at third).

**NOTHING IS RUNNING.** The crowning records who *earned* the seats. No
routine exists for either seat. Seating happens only through the separate
hardened seating document, and nothing runs until the owner's explicit
activation. Recorded here so the distinction between *earned* and *active*
cannot blur.

## Administration — the fix and its cost

T1 lost ~7 finding slots to territory overlap (the same defect filed three
times, twice over). MAIN self-charged that as a briefing failure and assigned
every T2 scope item to exactly **one** lane. Result: **one true duplicate**,
down from ~7 — and where the pattern was most likely to repeat, the
every-deny-audited law produced three *distinct* items in three distinct
files, with each lane explicitly declining the others'.

The fix created a new failure mode, now **adopted as law** (T2 Verdict 6):
exclusive assignment means a lane finding a defect outside its territory can
only flag it, and the flag can land nowhere. One confirmed orphan this round.
**One-lane-per-item + a FLAGGED-ACROSS queue reconciled by VERITY after every
round**, so a decline-for-territory can never become a disappearance.

## Outstanding orders from the verdicts

- ⚠️ **Champion #3's standalone brief is still owed.** T1 Verdict 4 orders
  doc-drift's verifier sub a re-summonable brief in `SCOREBOARD/`. The owner's
  execution order covered champions #4 and #5 only; #3 remains open. Recorded
  here rather than left to memory — the orphan lesson applied to this board
  itself.
- **PP-3** (member display name interpolated into the Presence system prompt,
  LOW) — ordered into the itemized confirmed list by T1 Verdict 7(a).
- **Seat-numbered finding ids** next round (T1 Verdict 7(b)).
- **A8-2** — the one owner decision on the T2 docket: which capability governs
  the $5M scoreboard. Commissioner recommends rendering §05 on the already-
  guarded `/portal/leadership` — zero new capability, deny-by-default
  preserved — with one sub-question framed: is the Founders row withheld from
  manager?
- **T3-S07-F01 — post-merge graft: service-worker `/go/*` exemption.** Sole
  owner: `frontend-pwa`. Adopt S01's early native-navigation return in
  `public/sw.js` plus its regression pin so a future non-HTTP shortcut cannot
  be swallowed by the worker's navigation fallback or enter a cache. **OPEN
  follow-up; explicitly not a condition of the S02 merge.**
- **T3-S08-F01 — post-merge graft: central handoff destination registry.**
  Sole owner: `authz-matrix`. Adapt S01's documented
  `app/go/destinations.ts` pattern so fixed HQ, Routines, and Mr.T handoffs
  share one evidence-bearing source while preserving S02's chosen
  same-origin Routines fallback, HTTPS Gmail compose handoff, query-stripping,
  and no-connector boundaries. Any Gmail-versus-`mailto:` change remains a
  separate founder decision. **OPEN follow-up; explicitly not a condition of
  the S02 merge.**
