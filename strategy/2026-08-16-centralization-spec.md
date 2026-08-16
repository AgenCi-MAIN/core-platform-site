# The centralization problem — enter once, fan out (owner spec, 2026-08-16)

## The pain, as the owner described it

When an agent closes a deal today, they enter the SAME data in THREE places:

1. **The inbound portal (LeadTech)** — where the calls come from; they
   "lock the cells" (mark the call closed).
2. **RetentionOS** — retype every field again into the agent portal
   (scoreboard, book of business).
3. **Discord** — post the win in their server.

And it's worse than triple entry: **many sub-agencies operate underneath**,
each with its own Discord, so the posting is fragmented — no shared
scoreboard, no shared urgency, no single number anyone can trust.

This is the classic **no-single-source-of-truth** failure. Data entered
three times drifts three ways; the leaderboard, the retention system, and
the Discord never agree, and leadership can never trust one figure. It is
the same "one version of reality" rule Ryan named in his Data Graph email,
hit at the data-ENTRY layer instead of the reporting layer.

## The ideal outcome (owner's words, structured)

ONE centralized platform that holds:
- the inbound portal (call source),
- the leader portal (leadership metrics),
- all agent metrics (the scoreboard),
- a Discord bot that pushes each win to a centralized Discord AND to each
  sub-agency's channel,
- sub-agents ranked by how they are closing,

so that when a deal closes the agent **fills it out ONCE** (or AI pastes it),
and it propagates everywhere. Enter once; the system fans out.

## The principle

**ENTER ONCE → FAN OUT.** One deal-entry point writes to: CORE's own
leaderboard, RetentionOS (via its API/socket), and Discord (via a bot).
The human stops being the integration glue.

## The honest strategic flag (owner + partner decision, not MAIN's)

There are now THREE overlapping systems: LeadTech (inbound), RetentionOS
(a mature agent portal — scoreboard, book of business, analytics, training,
contracting), and CORE. "Which is the one spot?" is a real decision:

- **A. CORE is the single entry** → fans out to RetentionOS + Discord + its
  own leaderboard.
- **B. RetentionOS stays the leaderboard**, CORE is the AI/orchestration +
  Discord + reconciliation layer on top.
- **C. Consolidate** onto one — a large partnership/equity decision, not a
  build.

This is owner + Ryan + Andrew's call, tied to the equity conversation. It
should not be assumed. MAIN's job is to build the piece valuable under ANY
of the three.

## What is unambiguously buildable (valuable regardless of A/B/C)

1. **Single deal-entry + fan-out engine.** One form (or AI paste). CORE
   validates once, writes its leaderboard, and emits to the other systems.
   Reuses the Test-3 ingest-socket pattern, now bidirectional: ingest deals,
   egress to Discord/RetentionOS through gated, audited outbound calls.
2. **The Discord bot.** On a confirmed deal, post a formatted win to a
   centralized Discord and route to the closing sub-agency's channel. Kills
   manual posting; centralizes the urgency/culture. Buildable via Discord
   webhook or bot token (secret by NAME). **Guardrail: deal announcements
   carry agent + production + policy count only — NEVER the insured's PII.**
3. **Sub-agency hierarchy.** parent agency → sub-agencies → agents. The
   leaderboard rolls up; the Discord bot fans to each sub-agency channel plus
   a centralized one. A data-model addition (org tree), flagged for the
   db/sql path.

## Compliance / guardrails

- No consumer/insured PII to Discord — internal celebration data only.
- Outbound to RetentionOS and Discord runs through the same doctrine as
  ingest: secret by NAME, deny-by-default, every emit audited, fail-closed,
  and idempotent (a deal entered once emits once — no double-posts).
- The single-entry form is the reconciliation point: one validated write,
  so the three systems finally agree.

Recorded as owner-supplied direction; the A/B/C architecture decision is
open and belongs to the owner and the Davidson brothers.
