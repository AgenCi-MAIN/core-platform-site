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

    /**
     * SignalWire — the carrier that POSTs call events to the ingest route
     * (OWNER-DECISIONS D10). All five optional for the same reason as the
     * rest: a deployment where telephony is not configured genuinely lacks
     * them, and the route refuses the POST rather than crashing. Unconfigured
     * must mean closed here, not open — this is the one path the edge does
     * not protect.
     *
     * `SIGNALWIRE_INGEST_SECRET` is the credential the caller presents.
     * `SIGNALWIRE_INGEST_SECRET_PREVIOUS` is the outgoing value during a
     * rotation, accepted alongside it so the secret can change without a
     * window where live calls are dropped; delete it once the carrier is
     * confirmed sending the new one.
     *
     * `SIGNALWIRE_SIGNING_KEY` verifies the request signature, and
     * `SIGNALWIRE_PUBLIC_ORIGIN` is the origin that signature was computed
     * over. The origin is stated rather than read off the request because a
     * proxied request can carry a host or scheme the signer never saw, and a
     * signature recomputed over the wrong URL fails for a legitimate caller.
     *
     * `SIGNALWIRE_AGENT_MAP` maps carrier-side agent numbers to member email
     * addresses. It is a secret rather than a D1 table on purpose: staff
     * mobile numbers are personal data, and the database is exported and
     * backed up (F2 already keeps those exports out of the repo because they
     * hold member emails). Set with `wrangler secret put`, or `.dev.vars`
     * locally. Never store any of these values in a file — only these names.
     */
    SIGNALWIRE_INGEST_SECRET?: string;
    SIGNALWIRE_INGEST_SECRET_PREVIOUS?: string;
    SIGNALWIRE_SIGNING_KEY?: string;
    SIGNALWIRE_PUBLIC_ORIGIN?: string;
    SIGNALWIRE_AGENT_MAP?: string;

    /**
     * Founder-only CORE click-to-call.
     *
     * These are separate from the ingest credentials above. The outbound
     * token must belong to the intended SignalWire Project and carry Voice
     * permission only. Missing any value keeps the originate route closed.
     *
     * The dial destination is read from `SIGNALWIRE_DIALER_AGENT_NUMBER` and
     * from nowhere else at runtime — no source file, no bundle, no browser
     * storage. That is the rule this code keeps, and it is narrower than
     * "the number exists only here": the founder's line is currently written
     * out in five tracked documents (the operating record and four strategy
     * files) from before this route existed. Removing it from those is a
     * separate decision and the founder's to make; until he makes it, do not
     * write a comment that says the secret is the only copy.
     */
    SIGNALWIRE_DIALER_SPACE_URL?: string;
    SIGNALWIRE_DIALER_PROJECT_ID?: string;
    SIGNALWIRE_DIALER_TOKEN?: string;
    SIGNALWIRE_DIALER_AGENT_NUMBER?: string;

    /**
     * Inbound browser voice. These values are all server-only. The API token
     * is a dedicated SignalWire Voice-scoped token; subscriber access tokens
     * minted from it are short-lived and are never persisted. The fallback
     * mobile and encryption key must never be rendered, logged, or bundled.
     */
    SIGNALWIRE_VOICE_SPACE_URL?: string;
    SIGNALWIRE_VOICE_PROJECT_ID?: string;
    SIGNALWIRE_VOICE_API_TOKEN?: string;
    SIGNALWIRE_PRIVATE_MOBILE_NUMBER?: string;
    SIGNALWIRE_TEAM_HUNT_ADDRESS?: string;
    SIGNALWIRE_MAIN_NUMBER?: string;
    SIGNALWIRE_CALLER_ENCRYPTION_KEY?: string;

    /**
     * Twilio inbound voice webhook (app/hooks/twilio/voice/route.ts) — the
     * Switchboard transfer system, Phase 1. Both optional for the same reason
     * as the rest: absent, the webhook fails closed (503) rather than
     * answering an unverifiable request.
     *
     * `TWILIO_WEBHOOK_VOICE_URL` is the EXACT public URL Twilio is configured
     * to call (e.g. `https://<host>/hooks/twilio/voice`). It is signed as-is
     * to verify `X-Twilio-Signature`, and is a stored setting rather than a
     * value rebuilt from request headers on purpose — the never-trust-headers
     * rule. Not a secret (it is a public URL), but set the same way.
     *
     * `TWILIO_DIAL_TARGETS` is the dial roster: comma/space-separated E.164
     * numbers (e.g. `+1XXXXXXXXXX,+1YYYYYYYYYY`). All ring at once; first to
     * answer takes the call. Deliberately NOT committed to the repo — personal
     * numbers are member-adjacent data (F2) — so it lives only in the Worker
     * config. Empty/unset makes the line fail-safe to a courtesy greeting.
     *
     * `TWILIO_AUTH_TOKEN` above is reused to verify the signature; it is the
     * one secret of the three. Never store its value in any file — only names.
     */
    TWILIO_WEBHOOK_VOICE_URL?: string;
    TWILIO_DIAL_TARGETS?: string;
  }
}
