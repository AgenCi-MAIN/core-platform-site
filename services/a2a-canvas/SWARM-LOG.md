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
| W2 canvas (sonnet) | apps/live-canvas/src/canvas, tests/canvas | 13:48 | 14:06 | Verified by integrator: 19/19 tests pass, its files typecheck; integrator patched double-click (synthetic double-tap, geometric hit-test, robust SVG clear) after browser evidence showed the native dblclick never fired on rebuilt nodes |
| W3 runtime (sonnet) | apps/live-canvas/src/runtime, tests/runtime | 13:48 | still running at 14:25 (Observed); integrator landed its files at the deadline | Verified by integrator: 37/37 runtime tests pass as a suite (an earlier standalone hang of runner.test.ts is gone after W3's final port-ref fix; Verified 14:26Z), app typecheck clean; integrator patched the source executor to resolve `{ themeRef }` and the probe/apply executors to carry tokens through, so Theme Forge applies a real theme |
| W4 state (sonnet) | apps/live-canvas/src/state, tests/state | 13:48 | 14:01 | Verified by integrator: 19/19 tests pass, its files typecheck; no denied tool calls (worker report) |
| W6 theme-packs (sonnet) | packages/theme-packs | 13:51 | 14:09 | Verified by integrator: 39/39 tests pass, tsc clean; 27 themes (9 families × 3 variants), dedupe threshold 0.05; 1,988 source/test lines + 7,671 generated theme lines |
| W7 fixtures (sonnet) | packages/fixtures | 13:51 | 14:07 | Verified by integrator: 48/48 tests pass, tsc clean; 10 workflow fixtures + 3 A2A transcripts; 1,863 source/test lines + 2,955 generated sample lines |
| W8 theme-preview (sonnet) | packages/theme-preview | 13:51 | 14:04 | Verified by integrator: 26/26 tests pass, tsc clean; 1,271 source/test lines + 997 generated preview lines |
| W5 ui (sonnet) | apps/live-canvas/src/ui, tests/ui | 13:48 | 14:00 | Verified by integrator: 30/30 tests pass, its files typecheck; 1,244 lines; worker reported 152k tokens, 37 tool uses, 10.5 min |

## Milestones

- **14:27Z — Closing verification.** Whole package suite: 246 tests, all passing after fixing an integrator-authored regex in the shared contract test (it rejected 1970 timestamps). Package typecheck clean; root typecheck clean. W3 reported at 14:25Z with 323k tokens, 119 tool uses, 36.7 min; its final files were already in the 14:25 landing.

- **14:25Z — Runtime landed; all three product lanes produce correct output** (evidence refreshed under `apps/live-canvas/evidence/`): Theme Forge → `{applied: "obsidian-amethyst", probePassed: true}`; A2A Handoff → `{verified: true}` with three correlated pairs; Workflow Lab → `["HELLO LANES", 11]` after a recovered failure. Zero page errors. W3 had not reported by the 14:22Z decision point, so the integrator verified and landed its files directly.

- **14:08Z — Full vertical slice verified in Chromium, zero page errors** (`apps/live-canvas/evidence/log.txt` + four screenshots): double-click label edit now commits ("Edited node") and survives save + reload; everything from the 14:04Z run still holds. Root cause of the edit defect: the canvas rebuilds its SVG on every render, so the browser never saw the same target twice; the native dblclick then fired on the root and created a node instead. Known remaining defect: the Theme Forge lane's apply step reports `applied: null` because the source node carries a theme reference the runtime does not yet resolve (W3 still landing).

- **14:04Z — Vertical slice verified in Chromium** (Playwright against the built single-file page, evidence in the integrator's scratchpad, summarised in the PR): 4 lanes / 18 nodes / 16 connectors rendered; node dragged from Theme Forge into Workflow Lab and undone; three runs completed with run ids; A2A Handoff produced three request/response pairs sharing correlation ids and output `{verified:true}`; Workflow Lab emitted node.failed then recovered via retry, output `["HELLO LANES",11]`; theme apply changed --c-accent; save wrote 6,434 bytes; reload restored theme and layout. Defects found: inline label edit did not commit (under investigation); artifact fragment lacked its script (fixed).

- **13:46Z — Foundation landed** (`f680ff3`, Landed on the branch, not merged). Verified: package typecheck clean, root typecheck clean, root eslint config parses, shared contract test passes (5 tests).
- **13:48Z — Draft PR #164 opened**; five module workers dispatched with disjoint file ownership. Integrator wrote `apps/live-canvas/src/main.ts` (wiring) while they run.

## Visual pass — owner's new visual source of truth (2026-09-15, after 14:30Z)

Baseline for this pass: `6ee0396` (all lanes landed, 246 tests). Scope: visual and
interaction refinement only; every behaviour (drag between lanes, connect, inline
edit, keyboard, save/undo/redo, runs and their evidence, preview publishing) is
preserved and re-verified.

Source of truth (owner's words; replaces the earlier purple/amethyst glass treatment):
- Sparse full-bleed charcoal field `#1F1F1F`/`#202020` with generous open space.
- Cyan only: primary `#08B9D5`, active `#22CBE2`, subdued `rgba(8,185,213,.55)`;
  labels 13–15px semibold pale cyan, sparse.
- Nodes and connectors are transparent-fill SVG outlines at 7–9px, round caps
  and joins, slight deterministic hand-drawn irregularity; loose outlined
  geometry (loops, capsules, triangles, polygons, glyph-like forms), not cards.
- Connectors: visible cyan curved or angled routes with rounded ends and
  outlined rings or hooks.
- Removed: purple, gradients, translucent glass, opaque panels, drop shadows,
  label pills, dense chrome. Controls small and outlined. Inspector outside the
  board so it never covers a workflow object.
- Hover brightens/widens an outline by ~1px; selection = second cyan outline or
  quiet halo.

Work split:
- Integrator: `index.html` (board + control column, inspector and run log as
  collapsible drawers outside the board), `styles.css` (new tokens and outline
  classes), `contracts.ts` (`capsule` and `triangle` shape kinds; transform and
  branch defaults), browser verification, screenshots, publish.
- Workflow lane `canvas-outlines` (sonnet): shapes, connectors, renderer, canvas tests.
- Workflow lane `theme-and-libraries` (sonnet): `charcoal-cyan` reference theme,
  theme tests, seed themeRef, theme-packs reference family, theme-preview sample
  and stylesheet, regenerated packs and gallery.
- Independent verifier (sonnet): typecheck, full suite, remnant grep, build; one
  correction round if needed.

Results (Verified by the integrator, 15:0xZ):
- Workflow ran 5 agents (2 lanes, verifier, one correction round, re-verify; 700k tokens, 20.7 min). The verifier's only remaining findings were in files outside the lanes' ownership; the integrator fixed them: a fixture test expecting the old branch shape, four purple fallback hexes in the runtime/seeds, fixture sample accents, a doc comment.
- Screenshot review found three defects the automated checks could not see and the integrator fixed them: connector ring markers scaled by the 7px stroke (default marker units) into ~110px circles → `markerUnits="userSpaceOnUse"`; parallel Workflow Lab steps clamped onto one spot because seed positions are lane-relative while the canvas stores absolute positions → `absolutizePositions()` applied to fresh documents; duplicated lane titles → suppressed when equal to the workflow name. Seed column pitch widened to 264px for visible routes; fresh documents open fitted to the board width.
- Closing checks: package typecheck clean; root typecheck clean; full suite 255 tests, 255 pass; Vite build; scripted Chromium run with zero page errors: drag between lanes + undo, double-click edit, three runs (Theme Forge applies `charcoal-cyan` with probePassed, A2A Handoff `{verified:true}` with correlated pairs, Workflow Lab recovers via retry), theme apply, save, reload. Computed styles: node fill transparent, stroke #08B9D5 8px → 9px on hover, round caps/joins; connectors 7px; body #1F1F1F; ring markers present; halo + keyline on selection. Evidence: `apps/live-canvas/evidence/` (log + screenshots, including the pre-fix marker screenshot for the record).
- Known limitations: hover/selection verified by computed style and one screenshot, not by a human; `obsidian-amethyst` remains in the theme-packs library as a *proposed* family (not selectable in the canvas picker); the theme-preview package's gallery mirrors the outline language but is a static approximation, not the live renderer.
