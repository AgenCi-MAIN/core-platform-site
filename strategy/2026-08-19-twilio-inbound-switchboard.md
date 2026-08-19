# Switchboard — Twilio live inbound calls for life insurance

Owner's order, 2026-08-19 (rebuild sitting): *"let's start our live
artifact to the point that we got to figure out how to use Twilio to take
live inbound calls for this life insurance."*

**The living plan of record is published as the artifact "Switchboard"**
(claude.ai/code/artifact/e16654e2-918c-4bff-bc39-e4fc6613c845), v0.1,
updated as decisions land. This file is the repo's durable skeleton of it;
if the two ever disagree, this repository wins.

Nothing in this plan is built, deployed, or paid for. It proposes; the
owner disposes.

## The call path (PLAN)

Caller dials the THRIVE Twilio number → Twilio POSTs a signed webhook →
new Worker route verifies the signature (constant-time) and plays the
recorded-line announcement → `<Dial>` to a licensed agent → dual-channel
recording → recording pulled into R2 `calls/` and deleted from Twilio →
honest row in `dialer_transfers` (consent set server-side, never
client-asserted) → the existing Call Lab review flow takes over.
Transcription later via Workers AI Deepgram nova-3 in-account (A25).

Seam the code must respect: Twilio webhooks must reach the Worker from
outside — if/when the Cloudflare Access wall fronts the domain again, the
webhook path needs an explicit Access bypass/service policy.

## The gates (FACT, from the ledger)

A25 (audio never rests outside the account — Twilio's transient hold plus
pull-and-delete needs the owner's sign-off as an interpretation), the E7
adversary conditions on any socket, all-party-consent recording law with
the announcement before any human joins (E7b counsel still open), A24
retention (2yr; clock/purge/legal-hold get built in Phase 2, before
volume), licensed-agent routing, receiving-first (inbound only), secrets
by name only (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`).

## Phases (PLAN)

0. Owner: Twilio account under btcmao518, one local number, cut the
   Twilio-vs-Inkbox seam, book counsel, approve announcement wording.
1. Ring-through: webhook route + announcement + Dial; every call logged
   and audited; pinned refusal tests; no recording.
2. Recording: pull-to-R2 + delete-from-Twilio + honest consent status;
   pay the A24 debt (retain_until, purge, legal hold) in the same phase.
3. Scale: state-aware IVR, queues, transcription, dashboard metrics.

Every phase ships the house way: suite green, verify:build, deploy from
the owner's Windows machine, version id recovered by deployments list.

## Decisions still the owner's

(1) the seam — Twilio (MAIN's counsel: yes, Inkbox stays the staff desk)
or wait on Inkbox #100; (2) E7b counsel + announcement wording; (3) A25
sign-off on the transient hold; (4) who answers, which hours; (5) number
strategy; (6) budget ceiling. Each lands in OWNER-DECISIONS.md as its own
dated row when spoken.

Costs in the artifact are ESTIMATES to verify at twilio.com/pricing —
order of magnitude: a hundred 10-minute calls ≈ $20–30/month of
telephony. The Twilio connector currently on the account is read-only
(search/retrieve) and is not call infrastructure.

## Status updates, same day

- **Artifact v0.2:** trial-activation step rail + monthly-cost cards added.
- **Owners' brief published** as its own artifact, "The Next Step Plan"
  (separate private link for Shawn / Ryan / Andrew; the founder shares it).
- **A25 custody amendment signed off** by the founder: pull-and-delete is
  the policy (recordings pulled to R2, deleted from Twilio).
- **A29 ordered:** recording on/off, answer roster + hours, one-line vs
  per-state, and budget ceiling become owner-adjustable, audited controls —
  console spec'd in the artifact first, portal build to follow. Recording
  defaults OFF until E7b wording clears counsel.
- **Fleet fielded** (founder's order, ≥20 lanes) to draft the console spec,
  the consent-law direction, the pull-and-delete runbook, and an
  execution-grade "go live today" trial runbook — scored run, results
  integrate into artifact v0.3.

*Seeded by: Yuxiang Mao (Shawn), founder. Drafted and recorded by the
rebuilt old-HQ session, 2026-08-19.*
