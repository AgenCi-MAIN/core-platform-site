# LEARNING TRACK — machine learning, one concept at a time

The founder asked to be taught the ML material he had been collecting
(neural-network zoo poster, fundamentals sheet, a diffusion-sampling paper),
**"one concept at a time"** — 2026-08-18. This file is the record of that
track so a later session can pick it up mid-stream instead of restarting.

## How it runs

One concept per sitting. Each gets a short grounded explanation in chat and,
where manipulation teaches better than prose, an interactive artifact built
around THRIVE's own data rather than textbook examples. The founder says
`next` when a concept has landed.

## The scoping note that governs all of this

**THRIVE does not need machine learning yet, and adding it now would be a
mistake.** `dialer_transfers` is empty — the Leaderboard honestly shows every
member at zero. A model fitted to no data produces confident noise, which is
exactly what this platform's fail-closed, never-invent-a-number posture
exists to prevent. The order that works:

1. Get Retreaver / Twilio / LeadTech flowing (their keys are the gate — see
   PLATFORM-MAP.md).
2. Accumulate real call outcomes.
3. Plain arithmetic first — conversion rate by campaign, by hour, by agent.
   On a book this size that beats any neural network, and it is auditable,
   which matters more here than accuracy.
4. Only then is there a question ML could answer.

This note is guidance, not a decision — it becomes an OWNER-DECISIONS row
only if the founder chooses to build a model.

## Concepts covered

### 01 — The artificial neuron ✅ 2026-08-18

The atom every architecture on that poster is built from. Taught as: a neuron
takes facts, decides how much each one counts, and outputs a judgment —
*weights* (what matters and in which direction), *bias* (the baseline lean
before evidence), *activation* (raw score → decision).

Worked in THRIVE terms: an inbound call's duration, lead age, and whether the
caller asked a carrier question, producing a conversion probability.

**Artifact:** `https://claude.ai/code/artifact/ea6028cb-536f-4e54-b59c-dae4278d9135`
("The Neuron Bench") — a live single neuron with draggable weights, the
arithmetic rewriting itself, and three guided experiments: zeroing a weight
(the input ceases to exist), flipping a sign (the belief inverts, just as
confidently), and moving the bias (every prediction inherits the assumption).
The page carries no THRIVE data, no secret, and grants nothing; it is a
teaching aid, not a platform surface.

**Takeaway carried forward:** a neuron is multiply-add-squash — arithmetic a
calculator does. The intelligence is entirely in the weights, and the weights
are the only part that is learned.

## Queue

- **02 — Backpropagation and gradient descent.** Where the weights come from:
  random start, guess, measure the error, nudge every weight in the direction
  that reduces it, repeat. The one idea that makes the field work. Planned as
  a second artifact where a neuron trains itself on call data and the weights
  crawl from random to right.
- **03 — Layers and depth.** Why stacking neurons buys anything, and what
  "hidden layer" actually hides.
- **04 — Overfitting, and why it is the failure mode that matters here.**
  A model that memorizes 200 calls and predicts nothing new — the exact trap
  a small book invites.
- Later, if wanted: convolution, embeddings, attention/transformers, and only
  then the diffusion-sampling paper, which sits several floors above the
  fundamentals sheet.
