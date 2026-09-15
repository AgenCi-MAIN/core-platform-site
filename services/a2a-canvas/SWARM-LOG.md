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

(appended by the integrator as each worker starts and finishes)

## Milestones

(appended by the integrator)
