# Agent Instructions for core-platform-site

A full-stack Next.js application running on Cloudflare Workers + Pages with Drizzle ORM database support.

## Quick Start

```bash
npm install
npm run dev          # Start dev server (watches for changes)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Type-check with strict mode
npm run test         # Run test suite
npm run db:generate  # Generate Drizzle migrations
```

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
├── layout.tsx
├── page.tsx
├── portal/       # Portal feature
├── tour/         # Tour feature
├── access/       # Access control
└── _sites-preview/
db/               # Database
├── schema.ts     # Drizzle schema (starts empty)
└── migrations/   # Auto-generated migrations
worker/           # Cloudflare Worker entry point (optional)
tests/            # Test files (Node test runner)
examples/         # Optional D1 example surface
scripts/          # Build/utility scripts
.openai/          # Cloudflare Sites config (D1/R2 bindings)
vite.config.ts    # Simulates D1/R2 bindings for local dev
```

## Important Conventions

### Authentication & Headers

Signed-in visitors receive these headers:
- `oai-authenticated-user-id` – stable user ID (same user, same Site; different across Sites)
- `oai-authenticated-user-email` – user email
- `oai-authenticated-user-full-name` – optional, percent-encoded UTF-8 (fall back to email if absent)
- `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`

Example usage (see [README.md](README.md) for full pattern):
```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  // Handle full name as optional
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
- **Migrations:** Run `npm run db:generate` to create migrations after schema changes
- **Local Dev:** Vite config simulates D1 for local testing
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

Check logs at `.wrangler/wrangler.log` (log path set in package.json scripts via `WRANGLER_LOG_PATH`).

## Known Gotchas

- **No wrangler.jsonc:** This project doesn't use `wrangler.jsonc`; bindings are in `.openai/hosting.json`
- **Monorepo setup:** Uses `pnpm-workspace.yaml` for potential workspaces (check if additional packages exist)
- **React Server Components:** Next.js App Router uses RSCs by default; understand async components

## Resources

- [Vinext Documentation](https://github.com/cloudflare/vinext)
- [README.md](README.md) – Full setup and workspace auth details
- [Next.js App Router](https://nextjs.org/docs/app)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
