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
     * Static asset binding (public/ directory). Optional like DB: the app
     * fails closed (503) where an asset genuinely isn't served rather than
     * assuming the binding exists — see app/portal/commission/route.ts.
     */
    ASSETS?: Fetcher;

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
     * The JARVIS Presence (member Q&A pet). Optional for the same reason as
     * the rest: a deployment without the key genuinely lacks it, and
     * app/portal/presence/route.ts answers 503 rather than crashing.
     * PRESENCE_MODEL optionally overrides the Claude model id.
     */
    ANTHROPIC_API_KEY?: string;
    PRESENCE_MODEL?: string;

    /**
     * LeadTech (GoHighLevel) read API key for the /portal/leadtech surface
     * (app/portal/leadtech/client.ts). Must be a v2-capable token — an OAuth
     * access token or a Private Integration token (starts with `pit-`); a
     * legacy v1 location key is rejected by the v2 API with a 401 on every
     * path. Optional for the same reason as the
     * rest: a deployment without it genuinely lacks the key at runtime, and the
     * client returns a not_connected state so the surface renders an honest
     * "not connected" card rather than crashing or faking pipeline data. Set
     * with `wrangler secret put`, or `.dev.vars` locally. Never store the value
     * in any file — only this name.
     */
    LEADTECH_API_KEY?: string;

    /**
     * Retreaver (inbound call tracking) read credentials for the
     * /portal/retreaver surface (app/portal/retreaver/client.ts). Retreaver's
     * v1 API scopes every read by company id alongside the key, so BOTH are
     * required — either absent means the surface renders an honest "not
     * connected" card. The company id is an identifier (visible in the
     * Retreaver dashboard URL), not a secret, but both are set the same way:
     * `wrangler secret put`, or `.dev.vars` locally. Never store the key's
     * value in any file — only this name.
     */
    RETREAVER_API_KEY?: string;
    RETREAVER_COMPANY_ID?: string;

    /**
     * Twilio read credentials for the /portal/twilio surface
     * (app/portal/twilio/client.ts) — inbound call log and number inventory,
     * read-only. Both optional for the same reason as the rest — either
     * absent means the surface renders an honest "not connected" card. Set
     * with `wrangler secret put`, or `.dev.vars` locally. Never store the
     * values in any file — only these names.
     */
    TWILIO_ACCOUNT_SID?: string;
    TWILIO_AUTH_TOKEN?: string;
  }
}
