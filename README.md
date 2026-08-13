# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Email and name are intended for display or contact purposes.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## CORE Portal (Phase 2)

The authenticated CORE application lives under `app/portal/`, separate from the
public presentation page at `app/page.tsx`.

- `app/portal/access.ts` — server-side authorization. Two checks run on every
  request: Sign in with ChatGPT establishes identity, and an active
  `portal_members` row establishes CORE membership and role. Identity alone
  grants nothing.
- `db/schema.ts` — `portal_members` (the allowlist) and `audit_events`
  (append-only allow/deny record).
- `db/sql/0001_portal_init.sql` — the same schema as hand-written DDL, for
  applying manually with `wrangler d1 execute`.
- `db/sql/0002_portal_seed_owner.sql` — first-owner bootstrap. **Read its header
  comments before applying.**

### How the schema actually reaches a deployed database

`build/sites-vite-plugin.ts` copies `.openai/hosting.json` and the whole
`drizzle/` directory into `dist/.openai/` at build time. The Sites platform
provisions the `DB` binding declared in `hosting.json` and applies the packaged
**drizzle** migrations — `db/sql/` is not part of the deployment package.

Two consequences worth knowing before deploying:

1. `drizzle/` is the migration path that ships. Run `npm run db:generate` after
   any change to `db/schema.ts`, and make sure `drizzle/meta/_journal.json` is
   not empty — an empty journal means no migration is applied.
2. **The owner seed does not ship.** A fresh deployment therefore has the schema
   but zero members, and the portal fails closed, so nobody can sign in —
   including the owners. Seeding the first owner is a deliberate manual step
   after the database exists.

Applying `db/sql/0001_portal_init.sql` by hand *and* letting the platform apply
the drizzle migration will collide: `0001` uses `CREATE TABLE IF NOT EXISTS`,
the generated migration does not. Pick one path per database.

Capabilities are deny-by-default; roles are `owner`, `admin`, `manager`,
`reviewer`, `agent`, `support`. Guard a page with `requireCapability(...)` and a
write with `assertCapability(...)`. Never import `app/portal/access.ts` from a
`"use client"` file.

The portal fails closed: if the `DB` binding is unreachable, access is refused
rather than assumed. Full design notes, provisioning steps, verification state,
and open decisions are in `CORE_JARVIS_PORTAL_ARCHITECTURE.md` in the workspace
root.
