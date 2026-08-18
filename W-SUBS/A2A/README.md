# ELITE_8 — the A2A standing bench

Eight seats, promoted to standing agents on 2026-08-18 by the founder's word
("Promote all 8 to STANDING AGENTS for A2A persona x 8"; named **ELITE_8** the
same day). Owner decision A17.

Each seat owns one question that agent-to-agent communication has to answer.
Between them they cover the whole surface, and no two overlap — a seat that
overlaps another is a seat that can blame it.

| Seat | Name | Owns | The question it answers |
| --- | --- | --- | --- |
| A1 | **CARDWRIGHT** | Agent cards | What can this agent do, and what will it refuse? |
| A2 | **SEAL** | Identity between machines | Why should I believe you are who you say? |
| A3 | **LEASH** | Authority and attenuation | What are you allowed to do, and who enforces it? |
| A4 | **COURIER** | Message contracts | How is work handed over, tracked, and finished? |
| A5 | **LATTICE** | Topology | Who may hand work to whom, and why that shape? |
| A6 | **CAVEAT** | Confused deputy, injection | Whose instruction is this really? |
| A7 | **DEADMAN** | Failure and silence | Did anything actually happen? |
| A8 | **LEDGER** | Observability and audit | Can we prove what happened afterwards? |

## The three gaps these seats exist to close

The bench was not assembled for symmetry. Each seat is aimed at something
currently broken in this operation, stated plainly in the strategy paper:

1. **Leashes live in prose, not in the running system.** Nine of ten routines
   carry a one-line caption where their standing order should be. An agent
   woken with a caption has a name and no constraints. — **LEASH**, with
   **CARDWRIGHT** keeping the advertisement matched to the brief.
2. **The fleet cannot talk to itself.** Every handoff routes through the
   founder or a git repository, so throughput is bounded by one person's
   attention. — **LATTICE** and **COURIER**, with **SEAL** and **CAVEAT**
   making a new path safe before it is opened.
3. **Silence is indistinguishable from health.** Two routines fire and produce
   nothing; the daily founder brief has likely never sent, and nothing
   reported an error. — **DEADMAN**, with **LEDGER** making the record
   provable afterwards.

## The sub bench — 40 under the 8 (A18)

Each seat holds five subs, one per slice of its domain, in `W-SUBS/A2A/SUBS/`.
Forty in total, none overlapping another — a sub that overlaps its sibling is
a sub that can blame it.

| Seat | Subs |
| --- | --- |
| CARDWRIGHT | CARD-SMITH · DRIFT-EYE · REFUSAL-CLERK · VERSION-KEEP · BUDGET-ASSAY |
| SEAL | KEYLESS · REPLAY-WATCH · SPOOF-PROBE · TTL-WARDEN · SPLIT-CHECK |
| LEASH | ALLOWLIST-AUDITOR · ATTENUATOR · CAPTION-HUNTER · ESCALATION-TRACE · BOUNDARY-TEST |
| COURIER | ENVELOPE · IDEMPOTENCE · LIFECYCLE · SCHEMA-GATE · DEADLETTER |
| LATTICE | MAPWRIGHT · EDGE-REVIEW · BOTTLENECK · FANOUT-GUARD · PATH-TRACE |
| CAVEAT | QUARANTINE · LAUNDER-WATCH · DEPUTY-PROBE · PROVENANCE · REDTEAM |
| DEADMAN | HEARTBEAT · SILENCE-ALARM · STALL-FINDER · DUPLICATE-EYE · CONFIDENCE-AUDIT |
| LEDGER | ROWWRIGHT · DENY-KEEPER · CORRELATE · COST-METER · GAP-FINDER |

**On "training".** There is no separate training step in this architecture, and
it would be dishonest to imply one. A sub is trained by its brief: the text it
is woken with is the whole of what it knows about its job. That is precisely
why a caption is not a brief, and why forty subs with real briefs is a
different thing from forty names on a list.

Three of these are pointed at defects that exist right now, which is the
fastest way to find out whether the bench is real: **ALLOWLIST-AUDITOR** would
have caught the two routines firing into the void, **CAPTION-HUNTER** finds the
nine caption-only routines, and **GAP-FINDER** finds the three roster decisions
that are live in the database and absent from the log.

## Status, stated honestly

These eight are **declared**, not armed. Each has a written brief that is
complete enough to be its own standing order. None is scheduled, none holds a
credential, and none can act until the founder arms it.

That is deliberate. Arming a seat is the founder's decision, and the fleet
already carries the scar of routines armed with captions instead of briefs —
which is exactly the failure these eight are meant to prevent, and would be an
absurd way to introduce them.

**When a seat is armed, its brief file's full text is the prompt.** Not a
summary. Not its name. The file.
