# @core/a2a-canvas fixtures

Importable sample `CanvasDoc`s and A2A protocol transcripts for the live
canvas, built from this repository's own portal concepts (dialer transfers,
command passes, member requests, outbound dial requests, voice presence,
inbound calls, callbacks, weekly commitments, book of business) rather than
generic placeholder data.

## Layout

| Path | What it is |
|---|---|
| `src/builders.ts` | The `doc()` builder DSL every fixture is built with. Pure — no `Date.now()`, `Math.random()`, or I/O; ids come from a seeded `createIdFactory`, timestamps from a `fixedClock`. Auto-positions nodes `NODE_GAP` (24px) apart along their lane. |
| `src/samples.ts` | The 10 workflow fixtures (below), each `{ id, title, description, doc }`, plus the aggregate `SAMPLES` array. |
| `src/a2a-transcripts.ts` | 3 deterministic A2A transcripts (`Message[]` + `Task` snapshots under a shared `correlationId`), built from `packages/shared/src/a2a.ts`. |
| `src/validate.ts` | `validateDoc(unknown) => Result<CanvasDoc, string[]>` — structural validation any importer should run before trusting a doc. |
| `src/index.ts` | Public exports, plus `loadSample(readFile, id)` — reads, parses and validates `samples/<id>.json` through an injected file reader. |
| `scripts/write-samples.ts` | Writes `samples/*.json` + `samples/index.json` from `src/samples.ts`. Deterministic — run it, nothing should move in a diff unless a fixture changed. |
| `samples/*.json` | The written-out fixtures, one file per id, plus `index.json` (the manifest: `id`, `title`, `description`, `file`). |
| `tests/*.test.ts` | `node --test` coverage for all of the above. |

## Workflow fixtures (`src/samples.ts`)

Ten fixtures, each a meaningfully different graph shape so the canvas and its
layout code get real variety to render and run:

1. **`dialer-transfer-handoff`** — *linear chain.* An inbound carrier transfer
   is checked against a redeemed command pass, handed to an A2A verifier
   agent, and turned into an outbound dial confirmation. One lane, one path,
   no branching.
2. **`member-request-review`** — *branch/join, then retry.* A role-change
   request fans out to two independent checks (tenure, standing), joins, then
   retries the approval hand-off up to 3 times before recording a decision.
3. **`weekly-commitments-rollup`** — *long single-lane chain.* A member's
   weekly check-in (lead budget + call target) is range-checked, turned into
   a pace figure, compared against actual dialer activity, and rendered onto
   the dashboard's dashed PLAN panel. Longer and purely sequential — no
   branching, unlike the linear example.
4. **`book-of-business-entry`** — *diamond.* A new customer + policy entry
   splits into two independent validations that reconverge before the row is
   written. The minimal branch-then-join diamond, distinct from the larger
   branch/join/retry fixture above.
5. **`voice-presence-monitor`** — *star.* One presence heartbeat radiates out
   to four independent, terminal probes (available / busy / offline /
   expiry) — a hub-and-spoke shape, not a chain.
6. **`callback-task-retry`** — *retry-centred chain.* A due callback task is
   dialed by an A2A agent, retried on no-answer up to 4 times with backoff,
   then confirmed reached and closed. The retry is one node carrying
   `maxAttempts`/`backoffMs` — looping-on-failure without a literal graph
   cycle (`validateDoc` forbids those).
7. **`theme-forge-variants`** — *multi-lane A2A handoff (3 lanes).* A
   base-proposal lane probes contrast and hands off — one A2A message, two
   recipients — into two sibling lanes that each preview their own variant.
8. **`cross-lane-drag-scenario`** — *2 lanes, one misplaced node.*
   "Escalate To Command" is drawn in the Frontline lane but both its edges
   point into Command Center (`config.suggestedLaneTitle` names the intended
   target) — it's meant to be dragged across the lane boundary.
9. **`command-pass-escalation`** — *fan-in.* Three independent command-pass
   signals (near expiry, too many failed attempts, revoked early) join into
   one founder review before a single reconciliation sink — the mirror image
   of the star fixture.
10. **`layout-stress-4-lane`** — *stress.* 44 nodes across 4 lanes (a
    per-lane chain plus one bridging edge lane-to-lane) for exercising
    auto-layout, drag performance and viewport panning at scale — not a
    meaningful pipeline.

## A2A transcripts (`src/a2a-transcripts.ts`)

1. **`two-agent-handoff-success`** — a dispatcher agent asks a verifier agent
   to confirm a command-pass redemption; the verifier replies "verified" and
   the task completes. One request, one reply, one `correlationId`.
2. **`dial-request-timeout-then-retry`** — an outbound dial request times out
   on its first attempt (`Task.state` moves to `'input-required'` with no
   reply, not `'failed'`) and succeeds on a second attempt sent under the
   *same* `correlationId`.
3. **`theme-proposal-declined-vote`** — a cyan-focus-ring theme proposal is
   critiqued for low contrast, voted on by three reviewers (1 approve / 2
   reject), and declined by the chair's decision. Built entirely from
   `packages/shared/src/a2a.ts`'s theme-domain payloads (`ThemeCritique`,
   `ThemeVote`, `ThemeDecision`) via `themeEventPart`. The task still reaches
   `'completed'` — a "no" is a finished result, not a protocol failure.

Each transcript's `taskSnapshots` carries a human-readable `note` alongside
the raw `Task` snapshot, narrating what changed since the previous snapshot.

## `validateDoc`

Checks, in order: input is an object; `version === 1`; `workflows` is an
array; every `id` in the doc is unique; every lane's `workflowId` matches its
parent workflow; every card's `kind` is a key of `NODE_KIND_META` and its
`shape` is one of `SHAPE_KINDS`; every edge's `from`/`to` names a card that
exists in that workflow; and no workflow's edges contain a cycle (3-colour
DFS, self-loops included). Returns every failure at once as `string[]`, never
throws.

## `loadSample`

```ts
import { loadSample } from '@core/a2a-canvas-fixtures' // or a relative path
import { readFile } from 'node:fs/promises'

const result = await loadSample((p) => readFile(p, 'utf8'), 'dialer-transfer-handoff')
if (result.ok) {
  // result.value: CanvasDoc
} else {
  // result.error: string[]
}
```

The reader is injected (not hard-coded to `node:fs`) so this also works from
a browser-hosted build of the live canvas.

## Regenerating `samples/*.json`

```bash
node packages/fixtures/scripts/write-samples.ts
```

Deterministic: fixtures carry no wall-clock time or randomness by the time
they reach this script (see `src/builders.ts` / `src/samples.ts`), so running
it twice produces byte-identical files — a diff after running it should be
empty unless a fixture's source actually changed.
