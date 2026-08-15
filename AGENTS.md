# Agent Instructions for core-platform-site

A full-stack Next.js application running as a single Cloudflare Worker with a
D1 database and R2 storage, via Vinext.

**Read [CLAUDE.md](CLAUDE.md) and [CORE_PLATFORM_RECORD.md](CORE_PLATFORM_RECORD.md)
before non-trivial work.** CLAUDE.md carries the load-bearing rules (identity,
caching, capabilities — each one written after a real failure); the record
carries what is live, the role matrix, the deploy sequence, and the traps that
already cost time once. This file is the quick orientation; those are the law.
[WORKFORCE.md](WORKFORCE.md) is the summoning catalog: 100 scoped specialist
roles available on demand as task subagents — a bench, not standing staff.

## Quick Start

```bash
npm install
npm run dev          # Start dev server (watches for changes)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Type-check with strict mode
npm run test         # Run test suite (builds first; Miniflare with real workerd + D1)
npm run verify:build # Preflight: is what is on disk actually deployable?
npm run deploy       # build -> tests -> preflight -> wrangler deploy, gated
npm run db:generate  # Generate Drizzle migrations
```

Deploy only via `npm run deploy` — never hand-roll build-then-wrangler. The
chain stops on any failure; a deploy without a fresh build silently ships
whatever `dist/` last held, and that failure once cost days.

**Node.js requirement:** `>=22.13.0`

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| **App** | Next.js 16 + React 19 | TypeScript, strict mode enabled |
| **Styling** | Tailwind CSS 4 | PostCSS config included |
| **Database** | Drizzle ORM + D1 | See `db/schema.ts` and `drizzle.config.ts` |
| **Infrastructure** | Cloudflare Workers + Pages | Via [Vinext](https://github.com/cloudflare/vinext) |
| **Code Quality** | ESLint + TypeScript | Next.js web vitals config; strict: true |
| **Build Tools** | Vite (worker), Next.js (app) | Configured in `vite.config.ts` and `next.config.ts` |

## Project Structure

```
app/              # Next.js app (edit site code here)
├── layout.tsx    # Root layout + PWA metadata (viewport quirk documented inline)
├── page.tsx      # Public presentation page
├── manifest.ts   # Web app manifest — the portal is installable
├── google-auth.ts# Identity: HMAC-signed core_session cookie
├── auth/         # Sign in with Google (signin / callback / signout)
├── portal/       # The authenticated application (access.ts = authorization)
├── tour/         # Public recruiting tour
└── access/       # Public sign-in intake — performs NO membership lookup, by design
db/               # Database
├── schema.ts     # Drizzle schema (members, audit, dialer transfers)
└── sql/          # Hand-written migrations — THE path applied to the live DB
drizzle/          # Generated migrations — do NOT also apply these (see gotchas)
public/           # Static assets incl. sw.js (service worker) and icons
worker/           # Cloudflare Worker entry point
tests/            # Node test runner suites — the access model's safety net
examples/         # Optional D1 example surface
scripts/          # verify-build.mjs (deploy gate), dev-signin.mjs, render-icons.py
.openai/          # D1/R2 binding declarations (+ self-host D1 database_id)
vite.config.ts    # Simulates D1/R2 bindings for local dev
```

## Important Conventions

### Authentication

Identity comes from Sign in with Google, implemented in this app (see
[README.md](README.md) "Sign in with Google" for the full picture):

- `app/google-auth.ts` — session cookie (`core_session`, HMAC-signed under the
  `SESSION_SECRET` secret) and the `getAuthUser()` / `signInPath()` /
  `signOutPath()` helpers.
- `app/auth/{signin,callback,signout}/route.ts` — the OAuth flow itself.
- Requests carrying the retired `oai-authenticated-user-*` headers are
  anonymous; nothing may ever trust identity asserted in a request header.

Example usage:
```tsx
import { getAuthUser } from "@/app/google-auth";

export default async function Home() {
  const user = await getAuthUser(); // null when anonymous
  // user: { userId, email, displayName, fullName }
}
```

### Path Aliases

TypeScript paths configured in `tsconfig.json`:
- `@/*` → root of project (e.g., `@/app/page.tsx`)

### TypeScript Settings

- **Strict mode:** Enabled (`strict: true`)
- **Target:** ES2017
- **Module resolution:** Bundler
- **JSX:** react-jsx

### Ignored in Linting

ESLint ignores these generated/third-party directories:
- `.next/` – Next.js build
- `dist/` – Vite build
- `.openai/` – Cloudflare config
- `.wrangler/` – Wrangler cache
- `build/` – Legacy builds

## Development Workflow

1. **Local Development:** `npm run dev` (Vinext runs Next.js + Wrangler together)
2. **Check Types:** `npm run typecheck` (catch issues before build)
3. **Lint Before Commit:** `npm run lint` (ESLint + Next.js rules)
4. **Build & Test:** `npm run build && npm run test` (production-like test)

### Working with D1 Database

- **Schema:** Edit `db/schema.ts` (Drizzle)
- **Migrations:** Run `npm run db:generate` after schema changes. Two migration
  trees exist: `db/sql/` (hand-written, `IF NOT EXISTS`, **applied to the live
  database**) and `drizzle/` (generated). Never apply both to one database —
  the generated ones are not idempotent.
- **Local Dev:** Vite config simulates D1 for local testing; tests run the real
  migrations from `db/sql/` in Miniflare
- **Bindings:** Declared in `.openai/hosting.json`

## Testing

Tests use Node's native test runner (no Jest):
```bash
npm run test
```

Runs:
- `tests/rendered-html.test.mjs` – HTML rendering tests
- `tests/portal-authorization.test.mjs` – Portal auth tests

## Common Tasks

### Add a New Page

1. Create file in `app/your-page/page.tsx`
2. Use async components and server-side auth headers as needed
3. Run `npm run typecheck` to verify types

### Add a Database Table

1. Edit `db/schema.ts`
2. Run `npm run db:generate`
3. Update code to use new schema
4. Test with `npm run build && npm run test`

### Debug Wrangler Issues

Check logs under `.wrangler/logs/` — the path is set in `vite.config.ts`, NOT
in package.json. It used to be inline env syntax in the npm scripts, which
cmd.exe cannot parse; that made `npm run build` fail silently on Windows while
deploys kept shipping stale output. Removed in `d9830f0`. Keep npm scripts free
of `FOO=bar cmd` syntax — development happens on Windows.

## Known Gotchas

- **No wrangler.jsonc:** This project doesn't use `wrangler.jsonc`; bindings are in `.openai/hosting.json`; the deployable config is generated at `dist/server/wrangler.json` by the build
- **Two migration trees:** apply `db/sql/` only — see "Working with D1" above
- **Never import `app/portal/access.ts` from a `"use client"` file** — authorization is server-only by construction, and data declared as constants in client files compiles into publicly served `/assets` chunks with no session check
- **The service worker (`public/sw.js`) must never cache `/portal` or `/auth`** — a test pins that branch character for character; read it before touching the file
- **Guard pages with `requireCapability`, writes with `assertCapability`** — capabilities are deny-by-default; adding one to a role is a governance decision
- **Monorepo setup:** Uses `pnpm-workspace.yaml` for potential workspaces (check if additional packages exist)
- **React Server Components:** Next.js App Router uses RSCs by default; understand async components

## Resources

- [Vinext Documentation](https://github.com/cloudflare/vinext)
- [README.md](README.md) – Full setup and workspace auth details
- [Next.js App Router](https://nextjs.org/docs/app)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
