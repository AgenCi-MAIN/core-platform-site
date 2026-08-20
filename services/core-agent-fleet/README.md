# CORE Operations Deck — Cloudflare fleet + Vercel console

This is the isolated runtime required by the `nextjs-sky` safety boundary. It does not add write paths to SKY and does not alter the existing CORE portal Worker.

## What is real

- One Cloudflare `CoreAgent` Durable Object class.
- Ten named instances: Vestal, Recon, Terraform, Meridian, Lattice, Cipher, Lumen, Index, Assay, and Ledger.
- Each instance has isolated SQLite-backed state and a distinct bounded system prompt.
- A 15-minute Cloudflare cron probes all ten instances and writes structured observability logs.
- A private Vercel console reaches the Worker only through a server-side bearer token.
- Ten existing Inkbox identity handles are mapped one-to-one. Mapping is not permission for autonomous mail or channel actions.

## What is deliberately absent

- No tools, MCP connectors, Inkbox API key, CRM access, customer records, call recordings, payments, deployments, or account mutation.
- No autonomous email or external communication authority.
- No claim that an agent is a human, licensed producer, owner, or decision-maker.

## Cloudflare setup

```powershell
cd worker
npm ci
npm run verify
npx wrangler secret put FLEET_API_TOKEN
npm run deploy
```

After deploy, call `POST /v1/fleet/bootstrap` with the bearer token once to materialize all ten named instances. `GET /health` is public and intentionally reveals only the service version, tool count, and expected agent count. Every `/v1/*` route fails closed without the secret.

## Vercel setup

Set `CORE_AGENT_FLEET_URL` and `CORE_AGENT_FLEET_TOKEN` as server-only project environment variables. Never prefix either with `NEXT_PUBLIC_`. Keep Vercel Deployment Protection enabled.

```powershell
npm ci
npm run verify
npx vercel deploy
```

## Verification

The Worker gate runs generated binding types, strict TypeScript, unit tests, and a Wrangler dry run. The console gate runs strict TypeScript, lint, and the production Next build.
