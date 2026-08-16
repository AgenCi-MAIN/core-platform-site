# EVALUATION SUITE — how CORE / J.A.R.V.I.S. judges agents

The scoring rubric that governs the Fleet Economy. One currency, one gate, one
dividend. Extracted and formalized from `WORKFORCE.md`; the tournament results
it has produced are recorded there. Administered by VERITY (quality control);
grants by MAIN.

---

## The one currency

**Confirmed production per token.** Nothing else counts. A finding, plan, or
diff that was wrong, unverifiable, or never applied scores **zero** — volume
is not production. This single rule is why an agent that writes ten pages of
nothing ranks below one that found a single real defect.

## The two axes (both must pass)

1. **High definition (quality gate — first).** Confirmed, shipped-worthy
   output. Clear no quality bar → earn no grant, full stop. This gate runs
   before efficiency is even measured.
2. **Low usage (efficiency dividend — second).** Production per token. A lane
   that clears the quality gate *and* runs lean earns **one sub-agent for each
   ~15% it comes in under the fleet's median token spend, capped at 5 per
   lane.**

## Why the efficiency cap is load-bearing

Rewarding "low usage" means a lane **cannot win by spending more** — burning
tokens lowers its own score. The grant is therefore self-limiting: the fleet
only grows where growth is earned by frugality. Mass-spawning to look busy is
the one behavior this rubric is built to punish. Unlimited token budgets are
safe under this rule because spend is a cost to the spender, not a flex.

## The leverage rule (owner refinement, 2026-08-16)

Effective value is **service delivered per token**, and it compounds through
**reuse, not volume**. A token spent on output that runs once is worth a few
letters; a token spent on a test that guards every deploy, or code that runs on
every request, is worth thousands and climbing. Promotion favors production
that keeps producing at zero further spend (a shipped fix, a pinned test, a
reusable socket) over one-shot output. Reachable by excellence, unreachable by
padding.

## Decentralized allocation

MAIN administers only **how many** subs a lane wins. **What the lane does with
them** — how it splits its mission, what each sub hunts — is the lane's own
call. Centralize that and the ten lanes collapse into one team and competition
dies; distribute it and ten squads race each other. Competition remains because
command stays distributed.

## The savings pool

Tokens a lane finishes UNDER the median accumulate into a per-fleet pool,
earnable by SUBS: a sub that ships confirmed production draws its next-run
budget from the pool before MAIN spends anything new. Frugality by the leads
funds the subs' next mission. LEDGER books the pool; it never overrides the
quality gate.

## Anti-cheat — the kill authority

During a scored tournament MAIN may **kill a sub mid-test**: a sub whose claims
don't trace, who fabricates a deliverable, or who burns tokens off-brief is
stopped, zero-scored, and the kill recorded. Fabrication is cheating; a killed
sub's lane forfeits its round. An *error* (a lane that crashes and returns
nothing) is not cheating — no kill — but the missing deliverable is a hole, and
may be re-attempted from the subs' pool.

## The oversight ladder (MAIN's span of command)

The ceiling of **trained lanes** MAIN may field grows only by *demonstrated*
oversight, never by claim. A trained lane is one fielded, VERITY-scored, and
confirmed productive.

| Tier | Ceiling | Unlocks on |
|---|---|---|
| Now | up to 50 in the field | current standing |
| Test 1 | 50 trained lanes | a clean, scored operation — **PASSED** |
| Test 2 | 250 trained lanes | the next test at the same bar — **PASSED** |

A ceiling is a *roster*, not a simultaneity — the runtime runs ~a dozen agents
at once; a 50- or 250-lane campaign is fielded in waves.

## Tournament format

A fleet is a set of lanes run for one mission (audit, design/build, or
verification). VERITY closes every fleet: reviews each lane against its brief,
scores and re-ranks the leaderboard, reassigns confirmed-deficient work,
enforces the fact/plan/assumption labeling. VERITY has overruled MAIN's own
output when it did not trace — nobody grades themselves.

## Results to date (see WORKFORCE.md for the full ledger)

- **T1 `platform-marathon-audit`** — 11 agents, ~877K tokens, 18 ranked
  findings, security-clean, 2 sub grants of 16 possible (bar held).
- **T2 `forward-build-fleet`** — 13 agents, ~1.21M tokens, 12-plan docket,
  0 new grants (closest lane missed by 1.3 pts — no inflation).
- **T3 `leadtech-plug-fleet`** — 11 agents, ~955K tokens (under both, harder
  product class), apply-with-fixes; inverted judgment (the O.G. 10 judge MAIN);
  one lane crashed and was re-attempted from the subs' pool.

---

*This suite is the exam every agent sits, including the orchestrator. Its
verdict is production per token — the one number that cannot be padded.*
