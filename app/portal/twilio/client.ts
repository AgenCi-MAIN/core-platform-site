import { env } from "cloudflare:workers";

/**
 * SERVER-ONLY Twilio REST API client — INBOUND calls and number inventory,
 * READ-ONLY by construction. No code path here (or anywhere in CORE) can
 * place a call, send a message, or change anything in the Twilio account.
 *
 * Mirrors app/portal/leadtech/client.ts's fail-closed-and-honest pattern:
 *
 *   - TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are read from `env` in a
 *     server module. Neither ever crosses to a client bundle, a rendered
 *     attribute, a log line, or an error echoed to the browser. Auth rides in
 *     the Authorization HEADER (HTTP Basic, per Twilio's contract).
 *   - Either binding absent -> { state: "not_connected" }; the surface
 *     renders an honest empty state, NEVER sample call data.
 *   - Any failure -> { state: "error", reason } carrying a status number at
 *     most. Bodies are never echoed.
 *
 * The account SID is an identifier, not the secret, but it is treated with
 * the same discipline: it appears only in the request URL Twilio's API shape
 * requires (their contract) and is never rendered or logged.
 *
 * Do NOT import this file from a "use client" file. These functions NEVER
 * throw to the caller and NEVER log credentials or fetched bodies.
 */

// ===========================================================================
// API CONTRACT CONSTANTS — Twilio REST API 2010-04-01 shapes as of this build
// (2026-08). VERIFY vs current Twilio docs. Unexpected shapes degrade to
// honest empty lists via the defensive parsers — never a crash, never an
// invented row.
// ===========================================================================

/**
 * The ONE hardcoded host. A module constant, NEVER built from request input —
 * SSRF is impossible here by construction.
 */
const BASE = "https://api.twilio.com";

/** Inbound-only call log — Direction=inbound is the read this surface makes. */
const CALLS_QUERY = "Calls.json?Direction=inbound&PageSize=50";
const NUMBERS_QUERY = "IncomingPhoneNumbers.json?PageSize=50";

// ===========================================================================
// Public result types
// ===========================================================================

export type TwilioNumber = {
  id: string;
  /** The org's own central number — the company owns it, safe to render. */
  phoneNumber: string | null;
  friendlyName: string | null;
};

export type TwilioInboundCall = {
  id: string;
  /** Caller — masked to last 4, the Call Lab's standard. */
  fromMasked: string | null;
  /** The org's own number that was called; the org owns it, safe to render. */
  to: string | null;
  durationSeconds: number | null;
  status: string | null;
  startedAt: string | null;
};

export type TwilioData = {
  numbers: TwilioNumber[];
  calls: TwilioInboundCall[];
};

export type TwilioResult =
  | { state: "not_connected" }
  | { state: "error"; reason: string }
  | { state: "ok"; data: TwilioData };

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

async function twilioGet(query: string, sid: string, token: string): Promise<unknown> {
  // Host is the BASE constant; `query` is one of the module constants above.
  // The SID in the path is Twilio's required URL shape — nothing external
  // ever contributes to this URL.
  const response = await fetch(`${BASE}/2010-04-01/Accounts/${sid}/${query}`, {
    method: "GET",
    headers: {
      // HTTP Basic per Twilio's contract — credentials in the header only.
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      Accept: "application/json",
    },
    // Never follow a redirect to another host — a 3xx becomes an honest error.
    redirect: "manual",
  });

  if (response.status < 200 || response.status >= 300) {
    // Do NOT read or echo the body. A bare status number is safe and can
    // never contain a credential.
    throw new UpstreamError(`Twilio responded ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch the inbound call log and the number inventory. Never throws; missing
 * bindings mean an honest not_connected, any failure an honest error state.
 */
export async function fetchTwilio(): Promise<TwilioResult> {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return { state: "not_connected" };
  }

  try {
    const [callsRaw, numbersRaw] = await Promise.all([
      twilioGet(CALLS_QUERY, sid, token),
      twilioGet(NUMBERS_QUERY, sid, token),
    ]);
    return {
      state: "ok",
      data: {
        calls: parseCalls(callsRaw),
        numbers: parseNumbers(numbersRaw),
      },
    };
  } catch (error) {
    return { state: "error", reason: safeReason(error) };
  }
}

function safeReason(error: unknown): string {
  if (error instanceof UpstreamError) return error.message;
  return "Could not reach Twilio.";
}

// ===========================================================================
// Defensive parsers — honest zeros on any unexpected shape.
// ===========================================================================

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
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

function parseCalls(raw: unknown): TwilioInboundCall[] {
  const root = record(raw);
  return asArray(root.calls)
    .slice(0, 100)
    .map((entry) => {
      const c = record(entry);
      return {
        id: str(c.sid) ?? "",
        fromMasked: maskPhone(c.from),
        to: str(c.to),
        durationSeconds: numOrNull(c.duration),
        status: str(c.status),
        startedAt: str(c.start_time),
      };
    })
    .filter((c) => c.id);
}

function parseNumbers(raw: unknown): TwilioNumber[] {
  const root = record(raw);
  return asArray(root.incoming_phone_numbers)
    .slice(0, 50)
    .map((entry) => {
      const n = record(entry);
      return {
        id: str(n.sid) ?? "",
        phoneNumber: str(n.phone_number),
        friendlyName: str(n.friendly_name),
      };
    })
    .filter((n) => n.id);
}
