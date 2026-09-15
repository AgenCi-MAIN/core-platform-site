# a2a-canvas — A2A theme maker + multi-lane workflow canvas

A self-contained package inside `services/` (excluded from the portal's root
`tsconfig.json` and `eslint.config.mjs`, so the Cloudflare Worker build never
sees it). Built by a lane swarm coordinated in `SWARM-LOG.md`.

## What it is

- **Live canvas** (`apps/live-canvas`): a full-bleed SVG canvas with one glass
  rail. Each product lane is an independent, draggable workflow made of
  editable shape nodes (rect, rounded, circle, diamond, pentagon, hexagon)
  joined by curved connectors. Runs execute in the browser; the inspector
  shows each node's output; the theme maker applies tokens live and saves on
  explicit Apply.
- **Shared contract** (`packages/shared`): theme tokens, the A2A protocol
  shapes, the workflow model, the lane-runtime model, ids, clock, Result.
- Further packages (theme engine, theme packs, a2a protocol runtime, agents,
  React canvas, workflow model, lane runtime, docs, fixtures, preview
  renderer) are lane deliverables; see `SWARM-LOG.md` for what exists and
  what is only planned.

## Rules for lanes

- Import only from your own package/module and from `packages/shared`
  (or `apps/live-canvas/src/contracts.ts` for app modules).
- Node 22 runs `.ts` directly (type stripping): erasable syntax only — no
  enums, parameter properties, namespaces or decorators; relative imports
  carry the `.ts` extension; `import type` for types.
- No new npm dependencies. React, TypeScript, Vite and the type packages
  come from the repository root's `node_modules`.

## Commands (from this directory)

```bash
npm run typecheck      # ../../node_modules/.bin/tsc -p tsconfig.json --noEmit
npm test               # node --test over packages/**/*.test.ts and apps/**/tests/**/*.test.ts
npm run build:canvas   # vite build + fold into apps/live-canvas/dist/{index,artifact}.html
```
