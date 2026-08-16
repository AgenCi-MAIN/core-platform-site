/// <reference types="@cloudflare/workers-types" />

// Ambient Cloudflare Workers runtime types.
//
// This project builds with Vite, which strips TypeScript via esbuild without
// checking it. `tsc --noEmit` is therefore the only thing that type-checks the
// repository, and without this reference it fails on three counts:
//
//   db/index.ts      cannot find module 'cloudflare:workers'
//   worker/index.ts  cannot find name 'Fetcher'
//   worker/index.ts  cannot find name 'D1Database'
//
// `@cloudflare/workers-types` is not under node_modules/@types, so TypeScript
// does not load it automatically. Referencing it here rather than through the
// tsconfig `types` array is deliberate: setting `types` disables automatic
// inclusion of every other @types package, which would drop the React and Node
// typings the rest of the project depends on.
//
// The version is pinned to the v4 line because both wrangler and drizzle-orm
// declare an optional peer dependency on `@cloudflare/workers-types@^4`.

declare namespace Cloudflare {
  /**
   * Bindings reachable through `import { env } from "cloudflare:workers"`.
   * `@cloudflare/workers-types` ships `Cloudflare.Env` empty and expects each
   * project to redeclare it; TypeScript merges the declarations.
   *
   * `DB` is optional on purpose. `.openai/hosting.json` declares the binding,
   * but a deployment where D1 has not been provisioned genuinely has no `DB`
   * at runtime. Typing it as always-present would make the guard in
   * db/index.ts look like dead code, when in fact it is what makes the portal
   * fail closed rather than crash.
   */
  interface Env {
    DB?: D1Database;

    /**
     * Sign in with Google. All three are optional for the same reason `DB`
     * is: a deployment where they are not yet set genuinely lacks them at
     * runtime, and app/google-auth.ts refuses sign-in rather than crashing.
     * Set with `wrangler secret put`, or `.dev.vars` locally.
     */
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    SESSION_SECRET?: string;

    /**
     * Optional second factor for the Pay Rates Studio page. When set, the
     * page requires the supplied value as a query-string key in addition to
     * the `leadership.view.all` capability. Lives in the deployment
     * environment (never committed). See app/portal/pay-rates/page.tsx.
     */
    PAY_RATES_KEY?: string;
  }
}
