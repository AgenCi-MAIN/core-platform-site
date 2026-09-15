# Swarm log — A2A theme maker + workflow canvas

Control-plane record for the multi-lane build of `services/a2a-canvas`.
Evidence labels follow the CORE master-control vocabulary: Observed,
Attested, Verified, Landed, Deployed, Healthy, Unresolved, Prohibited.

## Baseline (Observed 2026-09-15T13:39Z)

| Item | Value |
|---|---|
| Repository | AgenCi-MAIN/core-platform-site |
| Branch (authorized for commits) | `claude/ios-terminal-access-wefmw1` |
| Baseline commit | `8a59d2e` (merge of `origin/main` @ `a4401ff`; tree identical to main) |
| Existing changes at baseline | none (clean tree) |
| Owner order | build an A2A theme maker + multi-lane draggable workflow canvas with a Sonnet swarm; commit everything to this branch; measurable goal net +200,000 lines within one hour |
| Time window | 2026-09-15 13:30Z → 14:30Z (owner's "next hour") |
| Standing restrictions | commits to this branch only; no merge; no deploy; no membership or secret changes |
| Visual reference | owner's Freeform board `PromptinDevs-freeroam draft` (link in session; not fetchable from this container — Apple redirects unauthenticated requests to a support page). Reference details were relayed by the owner's prompt engineer and are marked *reference* below; everything else is *proposed*. |

## Reference details (relayed; treated as the design contract)

- Full-bleed canvas, one quiet glass rail, actions live inside cards, spacing 8/16/24/32px.
- Canvas `#11121A`; surface `rgba(36,25,58,.82)`; accent `#A78BFA`; focus `#67E8F9`; text `#F5F3FF`; muted `#C4B5FD`.
- Obsidian/amethyst glass at 78–86% opacity; apply surface opacity once and verify the final composited contrast.
- Hover lift 2px; selected state = violet ring + cyan keyline; disabled labels stay readable.
- Theme switching preserves the active card and scroll position; the choice is saved only after an explicit Apply; visible save/error status; reduced-motion behaviour; keyboard access; readable at 200% zoom; 44px touch targets.
- Board contains editable shapes, a pentagon, curved and angled connectors, and a `shawn-runtime` label.

## Lanes

Product lanes (what the canvas shows) are distinct from worker lanes (who builds it).

Product lanes (proposed, adapted from portal concepts):
1. **Theme Forge** — tokens → contrast probe → preview → apply.
2. **A2A Handoff** — task → agent A → agent B → verified output (in-page MessageChannel transport; no network, no model calls, no credentials).
3. **Workflow Lab** — branch → parallel steps → join, with a retry step that recovers a deliberate failure.

Worker lanes: see the Worker roster section, appended as work is dispatched.

## Worker roster

Coordinator/integrator: this session (configured model `claude-fable-5-1`; the
serving model can differ). Workers are Agent-tool subagents launched with the
`sonnet` model alias (the harness resolves the alias; requested: Sonnet 5).

| Worker | Owns | Started (UTC) | Finished | Result |
|---|---|---|---|---|
| Foundation (default model) | packages/shared, app shell | 13:37 | stopped by the interruption at ~13:42 with no files written (Observed) | taken over by the integrator; landed as `f680ff3` |
| W1 theme (sonnet) | apps/live-canvas/src/theme, tests/theme | 13:48 | 14:02 | Verified by integrator: 23/23 tests pass, its files typecheck; reference hex values present verbatim in the obsidian theme |
| W2 canvas (sonnet) | apps/live-canvas/src/canvas, tests/canvas | 13:48 | | |
| W3 runtime (sonnet) | apps/live-canvas/src/runtime, tests/runtime | 13:48 | | |
| W4 state (sonnet) | apps/live-canvas/src/state, tests/state | 13:48 | 14:01 | Verified by integrator: 19/19 tests pass, its files typecheck; no denied tool calls (worker report) |
| W6 theme-packs (sonnet) | packages/theme-packs | 13:51 | | |
| W7 fixtures (sonnet) | packages/fixtures | 13:51 | | |
| W8 theme-preview (sonnet) | packages/theme-preview | 13:51 | 14:04 | Verified by integrator: 26/26 tests pass, tsc clean; 1,271 source/test lines + 997 generated preview lines |
| W5 ui (sonnet) | apps/live-canvas/src/ui, tests/ui | 13:48 | 14:00 | Verified by integrator: 30/30 tests pass, its files typecheck; 1,244 lines; worker reported 152k tokens, 37 tool uses, 10.5 min |

## Milestones

- **14:04Z — Vertical slice verified in Chromium** (Playwright against the built single-file page, evidence in the integrator's scratchpad, summarised in the PR): 4 lanes / 18 nodes / 16 connectors rendered; node dragged from Theme Forge into Workflow Lab and undone; three runs completed with run ids; A2A Handoff produced three request/response pairs sharing correlation ids and output `{verified:true}`; Workflow Lab emitted node.failed then recovered via retry, output `["HELLO LANES",11]`; theme apply changed --c-accent; save wrote 6,434 bytes; reload restored theme and layout. Defects found: inline label edit did not commit (under investigation); artifact fragment lacked its script (fixed).

- **13:46Z — Foundation landed** (`f680ff3`, Landed on the branch, not merged). Verified: package typecheck clean, root typecheck clean, root eslint config parses, shared contract test passes (5 tests).
- **13:48Z — Draft PR #164 opened**; five module workers dispatched with disjoint file ownership. Integrator wrote `apps/live-canvas/src/main.ts` (wiring) while they run.
