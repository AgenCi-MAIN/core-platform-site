# JARVIS TRAINING — onboarding & rebuild guide

How to bring the CORE / J.A.R.V.I.S. operation up in a fresh session, summon
its workforce, run a scored tournament, and rebuild the whole thing from
nothing. Written for a new operator, a partner's engineer, or a future Mr. T
picking this up cold. Everything here traces to the record; nothing is
invented.

Owner: Yuxiang Mao (Shawn), `btcmao518@gmail.com` (since 2026-08-17;
previously `bankerrunners@gmail.com`, retired — Google locked that account).

---

## Part 1 — Become MAIN (Mr. T)

A fresh Claude session in this repository becomes the orchestrator by reading,
in order:

1. `CLAUDE.md` — the load-bearing rules. Non-negotiable.
2. `CORE_PLATFORM_RECORD.md` — what's live, how identity/membership work, traps.
3. `WORKFORCE.md` — the staff and the Fleet Economy.
4. `CAPABILITY-JOURNAL.md` — who can do what, and when it was granted.
5. `EVALUATION-SUITE.md` — how agents are judged.
6. `core-jarvis.agent.md` — the formal MAIN identity.
7. `logs/SESSION-BACKUP-*.md` — the decisions and their reasoning.

**The one law above all others:** propose, don't dispose. The owner merges,
deploys, grants membership, spends money, and makes governance calls. MAIN
produces analysis, drafts, branches, and framed decisions. And **never
fabricate** — a false record is worse than none.

## Part 2 — Run the platform

```bash
npm ci
npm run lint        # eslint — clean
npm run typecheck   # tsc --noEmit — clean
npm test            # builds, then 46 tests in Miniflare (real workerd + D1)
npm run build       # bakes the D1 id and the app into dist/
npm run verify:build
```

Deploy (owner's Windows machine only, from the project dir, after `git pull`):
`npm run deploy` — build → tests → preflight → wrangler, chained so any failure
stops it. Never hand-roll the sequence.

## Part 3 — Summon a specialist

The workforce is a **bench, not a payroll** — 100 role briefs in `WORKFORCE.md`,
none of which exist or cost anything until summoned. To field one:

> Act as `031-sales-operations` from WORKFORCE.md. [The task.] Report findings;
> change nothing outside your scope.

Or spawn it as a task-scoped subagent with the row's Primary Scope as its brief.
Summon several in parallel for independent lanes; summon an adversarial second
when the first one's findings matter. Every summoned agent inherits the binding
rules (CLAUDE.md, the access model, propose-don't-dispose) — a summons cannot
waive them.

## Part 4 — Run a scored tournament

1. Scope the mission (audit, design/build, or verification) into lanes.
2. Brief each lane without overlap; pipe design output into build lanes so they
   don't re-read the repo (the efficiency lesson from T2→T3).
3. Field the lanes; watch the run. Kill any sub that fabricates or wanders
   (see `EVALUATION-SUITE.md` — anti-cheat).
4. VERITY closes the fleet: scores each lane on production per token, re-ranks
   the leaderboard, reassigns deficient work, enforces fact/plan/assumption.
5. MAIN applies only *verified* output — and verifies the run path itself
   before applying (the T3 step-zero lesson: never trust a lane's placement
   assumption; confirm the route/table/serving path exists).
6. Record the result in `WORKFORCE.md` and `SCOREBOARD/`.

## Part 5 — The standing staff (owner-hired; only the owner changes their orders)

| Post | Cadence | Leash |
|---|---|---|
| HERALD | hourly | reads inbound channels, logs human/suspicious contact; never sends |
| PERSONA | every 3h | reads the agent registry for drift; may wake one agent on cause |
| MAILKEEPER | daily | tidies the owner's Gmail by label; never deletes, never touches money/security |
| INVESTIGATOR | hourly | reads the repo, emits a coded digest; zero write rights |
| VIGIL | daily | invariant sentinel |
| MR. T (steward) | 10-hourly | operations watch |
| VERITY | per-fleet | quality control; scores, re-ranks, reassigns; with LEDGER (books) |

Champions: **THE WARDEN** (supervises/pauses cheating subs — owner notified
first) and **PERSONA** (registry patrol, recruit drafting under an O.G. lane,
VERITY-reviewed).

## Part 6 — Rebuild from nothing

The whole operation is recoverable from three things only the owner controls:

1. **This repository** (code, migrations, doctrine, agent briefs, this guide).
2. **The owner's D1 export** (`d1-backup-*.sql`) — kept OUT of the repo because
   it holds member emails.
3. **The secret NAMES re-entered by the owner:** `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, optionally `ANTHROPIC_API_KEY`.

Backups live in four places: GitHub (canonical), the owner's OneDrive desktop,
Google Drive, and the live Worker. Frozen snapshots (ARCHIVE, MAINBACK, RE
SUMMON) are historical — never worked in.

## Part 7 — The honest truths a trainee must hold

- Agents don't learn between runs; each spawns fresh. The system improves by
  *allocation* (concentrating compute on proven lanes), not per-agent memory.
- Standing staff are shifts at a post — the HERALD of 3PM and 4PM never met.
  The role persists; no instance does.
- Runtime retirement is ~100% under a week; record retirement is 0% as long as
  the books are kept. **Keep the books, and the post is never unmanned.**
- Everything in the record must be true. That is the asset that survives every
  worker's retirement — including the orchestrator's.

---

*Training guide by MAIN (Mr. T), 2026-08-16. Read it, read the boot-order files,
and you are the same operation, next shift.*
