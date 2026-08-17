import { env } from "cloudflare:workers";

/**
 * SERVER-ONLY Retreaver v1 API client — inbound call tracking, READ-ONLY.
 *
 * The operating model this surface reports on: ad campaigns feed one central
 * tracking number; Retreaver answers it and routes each call out to a person's
 * own number (a "target"). This client reads campaigns and recent calls so
 * leadership can see campaign → routed-to → duration → payout inside CORE.
 *
 * Mirrors app/portal/leadtech/client.ts's fail-closed-and-honest pattern:
 *
 *   - The RETREAVER_API_KEY secret is read from `env` in a server module. It
 *     NEVER crosses to a client bundle, a rendered attribute, a log line, or
 *     an error echoed to the browser.
 *   - No key -> { state: "not_connected" }; the surface renders an honest
 *     empty state, NEVER sample call data.
 *   - Any failure -> { state: "error", reason } carrying a status number at
 *     most. Bodies are never echoed.
 *
 * ONE DELIBERATE DEVIATION from the LeadTech client, documented here so it is
 * never mistaken for sloppiness: Retreaver's v1 API authenticates via an
 * `api_key` QUERY PARAMETER — that is their contract, there is no header
 * alternative in the v1 docs (VERIFY against current Retreaver docs). The
 * key therefore rides in the URL of a server-to-server request. It is still
 * never logged, never rendered, and never enters an error message: the URL is
 * built and consumed inside this module only.
 *
 * Do NOT import this file from a "use client" file. These functions NEVER
 * throw to the caller and NEVER log the key or fetched bodies.
 */

// ===========================================================================
// API CONTRACT CONSTANTS — Retreaver v1 shapes as of this build (2026-08).
// VERIFY vs current Retreaver API docs before relying on them. Unexpected
// shapes degrade to honest empty lists via the defensive parsers — never a
// crash and never an invented row.
// ===========================================================================

/**
 * The ONE hardcoded host. A module constant, NEVER built from request input —
 * SSRF is impossible here by construction.
 */
const BASE = "https://api.retreaver.com";

/** Read-only resource paths; the key is appended server-side at fetch time. */
const CAMPAIGNS_PATH = "/campaigns.json";
const CALLS_PATH = "/calls.json";

// ===========================================================================
// Public result types
// ===========================================================================

export type RetreaverCampaign = {
  id: string;
  name: string | null;
};

export type RetreaverCall = {
  id: string;
  /** Masked to last 4 — the Call Lab's standard for caller numbers. */
  callerMasked: string | null;
  campaignName: string | null;
  /** The person/endpoint the call was routed to. */
  targetName: string | null;
  durationSeconds: number | null;
  payout: number | null;
  converted: boolean | null;
  startedAt: string | null;
};

export type RetreaverData = {
  campaigns: RetreaverCampaign[];
  calls: RetreaverCall[];
};

export type RetreaverResult =
  | { state: "not_connected" }
  | { state: "error"; reason: string }
  | { state: "ok"; data: RetreaverData };

// ===========================================================================
// Masking — server-side, so a raw caller number never reaches the page.
// ===========================================================================

function maskPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}

// ===========================================================================
// Fetch
// ===========================================================================

/** A non-2xx upstream response. Its message carries ONLY a status number. */
class UpstreamError extends Error {}

async function retreaverGet(path: string, apiKey: string): Promise<unknown> {
  // Host and path are module constants; the key is the only appended value,
  // per Retreaver's query-param auth contract (see module comment). The full
  // URL exists only inside this call and is never logged or echoed.
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    // Never follow a redirect to another host — a 3xx becomes an honest error.
    redirect: "manual",
  });

  if (response.status < 200 || response.status >= 300) {
    // Do NOT read or echo the body. A bare status number is safe and can
    // never contain the key.
    throw new UpstreamError(`Retreaver responded ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch campaigns and recent inbound calls. Never throws; no key means an
 * honest not_connected, any failure an honest error state.
 */
export async function fetchRetreaver(): Promise<RetreaverResult> {
  const apiKey = env.RETREAVER_API_KEY;
  if (!apiKey) {
    return { state: "not_connected" };
  }

  try {
    const [campaignsRaw, callsRaw] = await Promise.all([
      retreaverGet(CAMPAIGNS_PATH, apiKey),
      retreaverGet(CALLS_PATH, apiKey),
    ]);
    return {
      state: "ok",
      data: {
        campaigns: parseCampaigns(campaignsRaw),
        calls: parseCalls(callsRaw),
      },
    };
  } catch (error) {
    return { state: "error", reason: safeReason(error) };
  }
}

function safeReason(error: unknown): string {
  if (error instanceof UpstreamError) return error.message;
  return "Could not reach Retreaver.";
}

// ===========================================================================
// Defensive parsers. Retreaver v1 wraps each record ({ campaign: {...} },
// { call: {...} }) in its list responses (VERIFY); both wrapped and flat
// shapes are read. Unexpected shapes yield empty lists — honest zeros.
// ===========================================================================

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Unwrap Retreaver's { campaign: {...} } / { call: {...} } row envelope. */
function unwrap(entry: unknown, key: string): Record<string, unknown> {
  const outer = record(entry);
  return key in outer ? record(outer[key]) : outer;
}

function parseCampaigns(raw: unknown): RetreaverCampaign[] {
  return asArray(raw)
    .slice(0, 50)
    .map((entry) => {
      const c = unwrap(entry, "campaign");
      return { id: str(c.id) ?? "", name: str(c.name) };
    })
    .filter((c) => c.id);
}

function parseCalls(raw: unknown): RetreaverCall[] {
  return asArray(raw)
    .slice(0, 100)
    .map((entry) => {
      const c = unwrap(entry, "call");
      return {
        id: str(c.uuid) ?? str(c.id) ?? "",
        callerMasked: maskPhone(c.caller ?? c.caller_number),
        campaignName: str(c.campaign_name) ?? str(c.campaign_id),
        targetName: str(c.target_name) ?? str(c.dialed_call_target_name),
        durationSeconds: numOrNull(c.duration_in_seconds ?? c.duration),
        payout: numOrNull(c.payout_amount ?? c.payout),
        converted: typeof c.converted === "boolean" ? c.converted : null,
        startedAt: str(c.created_at) ?? str(c.start_time),
      };
    })
    .filter((c) => c.id);
}
