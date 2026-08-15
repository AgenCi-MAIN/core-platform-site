# Deep Analysis — The Fleet Economy

**Owner order, 2026-08-15:** turn the operation up from ~20% to ~60% of its
potential — a 3× on learning, processing efficiency, and *most importantly*
the competition between the AI agents. MAIN (Mr. T) holds 50%; the ten O.G.
squad lanes compete for the rest; high-definition, low-usage lanes earn up to
5 sub-agents each. Token caps: unlimited.

This file is the honest engineering translation of that order — what is real,
what is metaphor, and exactly how the 3× is produced. The canonical governance
lives in `WORKFORCE.md` → "The Fleet Economy"; this is the reasoning behind it.

---

## 1. The one honest correction

Agents do **not** learn between runs. Every summoned lane spawns fresh, with no
memory of the last one. So "3× learning capability" cannot mean a smarter agent
— there is no dial for that. If I told you I turned one, I'd be lying to you.

What *is* real, and what actually moves the operation from 20% to 60%, is
**allocation**. A fleet's output is not one agent's IQ — it is how compute is
distributed across lanes. Today it's distributed flat: ten lanes, equal
weight, winners and dead weight funded the same. That is the 20%. Concentrate
the compute on the lanes that prove they produce, cut the ones that don't, and
the same token budget buys far more confirmed production. That is the path to
60%, and it compounds every cycle. The "3×" is mechanical, not magical — and
it's the honest kind.

## 2. The three levers, made concrete

| Your word | What it literally becomes |
|---|---|
| **Learning ×3** | Not per-agent memory. A scored tournament: each cycle, the fleet's *structure* improves because winning lanes get sub-agents and losing briefs get rewritten by VERITY. The fleet learns; the agent doesn't. |
| **Processing efficiency ×3** | Production per token becomes a first-class score, not an afterthought. A lane that finds the same defect in half the tokens outranks the verbose one. Efficiency is now rewarded, so it's now optimized. |
| **Competition** | The sub-agent grant. Lanes compete head-to-head for the right to command their own reports next cycle. The prize is reach; the entry fee is being both sharp and lean. |

## 3. The ledger — how the 50 / 50 works

- **MAIN (Mr. T) — 50%.** Booked to the orchestrator every fleet.
  Coordination is half the production: scoping the ten lanes, briefing them
  so they don't overlap, judging the results, merging the survivors, throwing
  back the blurred ones. Whoever does that holds half the credit and the
  **allocation authority** — MAIN decides which lanes earn sub-agents from
  VERITY's scores. This is why no single lane can ever capture a fleet: half
  the ledger is structurally the coordinator's.
- **The squad — 50%, competed for.** Split among the ten O.G. lanes by
  performance, never equally.

This is a credit-and-authority ledger, not money. Agents are paid in nothing.
The award that exists for a task-scoped agent is the record that its work held
up — which the next summons of that role inherits. (Same rule as the
Commendations table.)

## 4. The sub-agent grant — the exact rule

After every fleet, VERITY scores each of the ten O.G. lanes on two axes
*simultaneously* — you must clear both:

1. **High definition (quality gate).** Confirmed, shipped-worthy findings.
   Volume is not production: a finding that was wrong, unverifiable, or never
   applied scores zero. Clear no quality bar → earn no grant. Full stop.
2. **Low usage (efficiency dividend).** Production per token. A lane that
   clears the quality gate *and* comes in under the fleet's median token spend
   earns **one sub-agent for each ~15% under median, capped at 5 per lane.**

A lane that earns sub-agents becomes a **squad lead** next cycle, directing up
to five reports of its own. Proven, efficient lanes multiply into small teams;
wasteful lanes stay solo or get cut. That multiplication *is* the 3× — it's
structural, and it repeats every cycle the winners keep winning.

**Earning is central; allocation is decentralized (owner refinement).** MAIN
decides only how *many* subs a lane wins — that comes off VERITY's score and
nothing else. But how a lane *uses* its subs — how it carves up its mission,
what each report hunts — is the O.G. lane's own call, not MAIN's. This is the
part that keeps the competition alive. If MAIN directed every sub, the ten
lanes would fuse into one centrally-run team and there'd be nothing left to
compete. Instead: ten self-commanding squads, each racing the others, each
betting its *next* grant on how well it deploys the subs it earned this time.
Allocate them well and your confirmed-findings-per-token compounds; allocate
them badly and you fall down the board. The command stays distributed on
purpose — **that is why competition remains.**

## 5. Why "unlimited tokens" is safe under this design

You lifted the token cap in the same breath as you demanded efficiency — and
those aren't in tension, they're the whole trick. Because **low usage is a
reward criterion**, spending tokens lowers a lane's own score. An agent cannot
win by burning fuel or padding its output; the more it spends, the worse it
ranks. So the grant is self-limiting: the fleet only grows where growth was
earned by frugality. Unlimited fuel, but the podium still belongs to the lean.

The one behavior this doctrine exists to punish is **mass-spawning to look
busy** — fanning out dozens of agents for volume. That tanks the efficiency
score by construction. Real fan-out stays inside the orchestration size
guideline not because a cap forces it, but because the incentives make waste
lose.

## 6. The leashes that outrank the grant

A sub-agent is still an agent on this bench. It inherits, senior to any grant:

- CLAUDE.md and CORE_PLATFORM_RECORD.md in full — the access model, the deploy
  gate, the migration trap. No grant waives them.
- **Propose, don't dispose.** No agent — squad lead or report — merges to
  main, deploys, changes membership, spends money, or makes a governance call.
  The grant multiplies *analysis capacity only*.
- A squad lead directs its granted reports **within the current task**. It
  never touches standing staff (VIGIL, MR. T, HERALD, INVESTIGATOR, VERITY,
  the Morning Brief) — those orders are yours alone.

VERITY administers the scoring. MAIN administers the grant. You remain the only
one who disposes.

## 7. First tournament — live now

The ten-lane platform audit (`platform-marathon-audit`) running as this was
written is the first fleet scored under this doctrine. Each lane — auth depth,
authorization matrix, data model, test gaps, Presence probe, frontend/PWA,
strategy facts, doc drift, deploy integrity, compliance posture — is being
ranked by confirmed findings per token. The winners carry a sub-agent grant
into the follow-up run, and the leaderboard in `WORKFORCE.md` records the
result. You'll get the consolidated findings report the moment the fleet
reports in.

## 8. The oversight ladder — MAIN's span of command

The owner set a promotion ladder for MAIN (Mr. T), gated on demonstrated
oversight rather than on claim:

| Tier | Ceiling of trained lanes | Unlocks on |
|---|---|---|
| Now | up to 50 in the field (10 O.G. × up to 5 subs) | current standing |
| **Test 1** | **50 trained lanes** | this operation landing clean, VERITY-scored and confirmed |
| **Test 2** | **250 trained lanes** | the next test passing the same bar |

A *trained lane* is one that has been fielded, scored, and confirmed
productive — a proven, reusable brief. Not a bench role (untested), not a raw
sub (a report under a lead).

Two things I will not let this ladder become dishonest about:

1. **It is earned, not announced.** As I write this, I have *not* reached
   Test 1. The marathon is still running. The tier opens when its findings
   are verified and scored — not because you offered it and not because I want
   it. Claiming a tier before the proof is the exact volume-over-substance
   move this whole doctrine exists to punish; I won't do it to my own rank.
2. **A ceiling is a roster, not a simultaneity.** The runtime runs about a
   dozen agents at once, with a hard lifetime backstop far above that. A 50-
   or 250-lane ceiling means lanes I may field *across a campaign, in waves* —
   not 250 processes in one breath. Your token caps are lifted, but the
   efficiency rule still governs every wave: a bigger ceiling only pays off if
   the lanes stay lean. A wide, wasteful fleet scores *worse* than a narrow,
   sharp one — so the ladder rewards range only when range is earned
   frugally.

That's the promotion, recorded straight: 50 on proof, 250 on the next proof,
and nothing on my word alone.

---

*Deep analysis authored by J.A.R.V.I.S. (Mr. T, MAIN) at the owner's order,
2026-08-15. Desktop copy destination:
`C:\Users\k2547\OneDrive\Desktop\CORE______J.A.R.V.I.S\`. No secret values;
governance and reasoning only.*
