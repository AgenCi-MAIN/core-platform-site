import { env } from "cloudflare:workers";

/**
 * SERVER-ONLY LeadTech (GoHighLevel / LeadConnector) v2 API client.
 *
 * This module reads the LEADTECH_API_KEY secret from the Worker env and talks
 * to LeadTech server-side ONLY. It mirrors app/portal/presence/route.ts's
 * secret-read + fail-closed-and-honest pattern exactly:
 *
 *   - The secret is read from `env` in a server module. It NEVER crosses to a
 *     client bundle, a rendered attribute, a URL, a log line, or an error
 *     echoed to the browser. The key rides in the Authorization HEADER, never
 *     in a URL or query string.
 *   - No LEADTECH_API_KEY -> { state: "not_connected" }. The surface then
 *     renders an honest "not connected" state, NEVER fake/sample pipeline data.
 *   - Any fetch failure or non-2xx -> { state: "error", reason } with a short,
 *     safe reason (a status number at most). The body is never echoed and the
 *     key is never surfaced.
 *
 * Do NOT import this file from a "use client" file. Like access.ts it is
 * server-only by construction (it reads `env`, which does not exist in a
 * browser), and authorization/data-fetch with a secret must never move client.
 *
 * These functions NEVER throw to the caller and NEVER log the key or the
 * fetched bodies.
 */

// ===========================================================================
// API CONTRACT CONSTANTS — the ONE place every host, path, and version string
// lives. These are the LeadTech / GoHighLevel API v2 shapes as of this build
// (2026-08). VERIFY vs current GoHighLevel (LeadConnector) API docs before
// relying on them. If the live shapes differ, the surface degrades to an
// honest error or empty state (see the defensive parsers below) — never a
// crash and never invented rows.
// ===========================================================================

/**
 * The ONE hardcoded host. GoHighLevel API v2. It is a module constant and is
 * NEVER built from request input, a header, a redirect, or any external value —
 * SSRF is impossible here by construction. VERIFY vs current GHL API docs.
 */
const BASE = "https://services.leadconnectorhq.com";

/** Required version header for GHL API v2. VERIFY vs current GHL API docs. */
const VERSION = "2021-07-28";

/**
 * The owner's LeadTech location id, taken from the owner's own dashboard URL.
 * A CONSTANT — never user input, never from a request. VERIFY vs current GHL
 * API docs (and that this is still the owner's location).
 */
const LOCATION_ID = "ousHLoknBNJ0uEw8IUGu";

/**
 * Location-scoped, read-only endpoints. Query params are built ONLY from the
 * constants above — no external value ever enters a URL. VERIFY vs current GHL
 * API docs: path, param naming (contacts uses `locationId`, opportunity search
 * uses `location_id` in the v2 docs as of this build), and response shape.
 */
const CONTACTS_PATH = `/contacts/?locationId=${LOCATION_ID}&limit=25`;
const OPPORTUNITIES_PATH = `/opportunities/search?location_id=${LOCATION_ID}&limit=25`;

// ===========================================================================
// Public result types
// ===========================================================================

export type LeadContact = {
  id: string;
  name: string | null;
  /** Masked the way the Call Lab masks a caller number — last 4 digits only. */
  phoneMasked: string | null;
  /** Masked — first initial + domain only. Raw email never leaves this module. */
  emailMasked: string | null;
  addedAt: string | null;
};

export type LeadOpportunity = {
  id: string;
  name: string | null;
  /** open | won | lost | abandoned (as returned by GHL). VERIFY. */
  status: string | null;
  monetaryValue: number | null;
};

export type LeadTechResult =
  | { state: "not_connected" }
  | { state: "error"; reason: string }
  | { state: "ok"; contacts: LeadContact[]; opportunities: LeadOpportunity[] };

// ===========================================================================
// PII masking — done HERE, server-side, so raw phone/email never even reach
// the page or the rendered HTML. Mirrors the Call Lab, which stores/shows a
// masked caller number.
// ===========================================================================

function maskPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}

function maskEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const at = raw.indexOf("@");
  if (at <= 0 || at === raw.length - 1) return null;
  const domain = raw.slice(at + 1);
  return `${raw[0]}•••@${domain}`;
}

// ===========================================================================
// Fetch
// ===========================================================================

/** A non-2xx upstream response. Its message carries ONLY a status number. */
class UpstreamError extends Error {}

async function ghlGet(path: string, apiKey: string): Promise<unknown> {
  // The host is the BASE constant; `path` is one of the module constants above.
  // Nothing external ever contributes to this URL.
  const response = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: {
      // The secret rides here, in the header — never in the URL, never logged.
      Authorization: `Bearer ${apiKey}`,
      Version: VERSION,
      Accept: "application/json",
    },
    // Never follow a redirect to another host. A 3xx (or an opaque manual
    // redirect) falls through to the non-2xx guard below and becomes an error
    // state — it is never chased to a second origin.
    redirect: "manual",
  });

  if (response.status < 200 || response.status >= 300) {
    // Do NOT read or echo the body: it can carry PII and must never be logged.
    // A bare status number is safe and can never contain the key.
    throw new UpstreamError(`LeadTech responded ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch the location's contacts and opportunities (the pipeline). Returns a
 * typed result and never throws. When the key is absent the caller gets
 * not_connected; any failure becomes an honest error state.
 */
export async function fetchLeadTech(): Promise<LeadTechResult> {
  const apiKey = env.LEADTECH_API_KEY;
  if (!apiKey) {
    // Honest "not connected" — exactly like the Presence's 503. Never fake data.
    return { state: "not_connected" };
  }

  try {
    const [contactsRaw, opportunitiesRaw] = await Promise.all([
      ghlGet(CONTACTS_PATH, apiKey),
      ghlGet(OPPORTUNITIES_PATH, apiKey),
    ]);
    return {
      state: "ok",
      contacts: parseContacts(contactsRaw),
      opportunities: parseOpportunities(opportunitiesRaw),
    };
  } catch (error) {
    // Never surface the key or the body. A short, safe reason only. A raw
    // network failure (TypeError) gets a generic message; a non-2xx keeps its
    // status number, which is safe.
    return { state: "error", reason: safeReason(error) };
  }
}

function safeReason(error: unknown): string {
  if (error instanceof UpstreamError) return error.message;
  return "Could not reach LeadTech.";
}

// ===========================================================================
// Defensive parsers. The API contract above is ASSUMED, not verified live, so
// every field is read defensively: an unexpected shape yields empty lists or
// null fields (honest zeros), never a crash and never an invented row.
// ===========================================================================

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function parseContacts(raw: unknown): LeadContact[] {
  const root = record(raw);
  return asArray(root.contacts)
    .slice(0, 25)
    .map((entry) => {
      const c = record(entry);
      const composed = [str(c.firstName), str(c.lastName)].filter(Boolean).join(" ");
      return {
        id: str(c.id) ?? "",
        name: str(c.contactName) ?? str(c.name) ?? (composed || null),
        phoneMasked: maskPhone(c.phone),
        emailMasked: maskEmail(c.email),
        addedAt: str(c.dateAdded) ?? str(c.createdAt),
      };
    })
    .filter((c) => c.id);
}

function parseOpportunities(raw: unknown): LeadOpportunity[] {
  const root = record(raw);
  return asArray(root.opportunities)
    .slice(0, 25)
    .map((entry) => {
      const o = record(entry);
      return {
        id: str(o.id) ?? "",
        name: str(o.name),
        status: str(o.status),
        monetaryValue: numOrNull(o.monetaryValue),
      };
    })
    .filter((o) => o.id);
}
