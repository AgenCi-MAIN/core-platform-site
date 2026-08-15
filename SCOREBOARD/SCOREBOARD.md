# SCOREBOARD — Fleet Economy, tournaments 1 & 2 (2026-08-15)

Final standings by **confirmed production per token**, the only currency this
board recognizes. Funded by Yuxiang Mao (Shawn), owner. Administered by
VERITY; grants by MAIN (Mr. T).

## 🏆 WINNING SUBS — worth-to-invest (owner's designation)

The two earned sub-agents both shipped production. Their standalone briefs
live beside this file as `SUB-*.md` — each is a complete, re-summonable
backup of what made it win.

| Rank | Sub | Lead | Spend | What it shipped |
|---|---|---|---|---|
| **1** | `SUB-deploy-verifier` | deploy-integrity | 50.1K | **Refuted its own lead** — caught the recovery drill's secrets-before-deploy ordering backwards and corrected it; downgraded an unverifiable assumption and supplied the better replacement (`wrangler d1 export`). A sub that changed the plan. |
| **2** | `SUB-presence-builder` | presence-probe | 60.6K | The **apply-ready cap-fix diff** — every line-claim independently re-verified and confirmed; shipped nearly verbatim in the fix batch that took the suite to 46/46. |

Rank order note: the builder shipped more code, but the verifier's refutation
is the rarer production — it takes discipline for a sub to overrule its lead
and be *right*. Both draw first from the savings pool next run.

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
- Fix batch shipped from docket ranks 1–4: cap fix, consent audit + guard,
  verify-build watch, 4 new negative tests, doc truth restoration.
  Suite: **46/46 green.**
- Oversight ladder: Test 1 PASSED (50) → Test 2 PASSED (250).
