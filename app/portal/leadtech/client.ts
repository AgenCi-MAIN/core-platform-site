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
 *
 * The surface is TABBED (pipeline / contacts / engagement) and each tab has
 * its own fetcher so one tab's upstream failure never blanks the others, and
 * opening one tab never spends the other tabs' requests.
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

/**
 * Required Version headers for GHL API v2 — PER ENDPOINT FAMILY, because GHL
 * rejects a wrong Version with a 400 rather than ignoring it. Contacts,
 * opportunities, and pipelines take 2021-07-28; calendars and conversations
 * take 2021-04-15. VERIFY both vs current GHL API docs.
 */
const CORE_VERSION = "2021-07-28";
const SCHEDULING_VERSION = "2021-04-15";

/**
 * The owner's LeadTech location id, taken from the owner's own dashboard URL.
 * A CONSTANT — never user input, never from a request. VERIFY vs current GHL
 * API docs (and that this is still the owner's location).
 */
const LOCATION_ID = "ousHLoknBNJ0uEw8IUGu";

/**
 * Location-scoped, read-only endpoints. Query params are built ONLY from the
 * constants above — no external value ever enters a URL. VERIFY each vs
 * current GHL API docs: path, param naming (contacts uses `locationId`,
 * opportunity search uses `location_id` in the v2 docs as of this build), and
 * response shape.
 */
type Endpoint = { path: string; version: string };

const CONTACTS: Endpoint = {
  path: `/contacts/?locationId=${LOCATION_ID}&limit=100`,
  version: CORE_VERSION,
};
const OPPORTUNITIES: Endpoint = {
  path: `/opportunities/search?location_id=${LOCATION_ID}&limit=100`,
  version: CORE_VERSION,
};
const PIPELINES: Endpoint = {
  path: `/opportunities/pipelines?locationId=${LOCATION_ID}`,
  version: CORE_VERSION,
};
const CONVERSATIONS: Endpoint = {
  path: `/conversations/search?locationId=${LOCATION_ID}&limit=50`,
  version: SCHEDULING_VERSION,
};
const CALENDARS: Endpoint = {
  path: `/calendars/?locationId=${LOCATION_ID}`,
  version: SCHEDULING_VERSION,
};

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
  /** LeadTech tags on the contact — plain labels, safe to render. */
  tags: string[];
  /** Where LeadTech says the contact came from (form, import, integration…). */
  source: string | null;
  /** Do-not-disturb flag as recorded in LeadTech. */
  dnd: boolean;
};

export type LeadOpportunity = {
  id: string;
  name: string | null;
  /** open | won | lost | abandoned (as returned by GHL). VERIFY. */
  status: string | null;
  monetaryValue: number | null;
  /** Resolved via the pipelines endpoint; null when unresolvable. */
  pipelineId: string | null;
  stageId: string | null;
  createdAt: string | null;
};

export type LeadPipelineStage = { id: string; name: string | null };

export type LeadPipeline = {
  id: string;
  name: string | null;
  stages: LeadPipelineStage[];
};

export type LeadConversation = {
  id: string;
  /** Contact display name as LeadTech returns it. Bodies are NEVER carried. */
  contactName: string | null;
  /** Channel: SMS, Email, Call… (as returned). VERIFY. */
  type: string | null;
  lastMessageAt: string | null;
  /** Last message CHANNEL/type only — message BODIES never leave this module. */
  lastMessageType: string | null;
  unreadCount: number | null;
};

export type LeadCalendar = {
  id: string;
  name: string | null;
  isActive: boolean | null;
};

export type PipelineTabData = {
  pipelines: LeadPipeline[];
  opportunities: LeadOpportunity[];
};

export type ContactsTabData = { contacts: LeadContact[] };

export type EngagementTabData = {
  conversations: LeadConversation[];
  calendars: LeadCalendar[];
};

export type LeadTechResult<T> =
  | { state: "not_connected" }
  | { state: "error"; reason: string }
  | { state: "ok"; data: T };

// ===========================================================================
// PII masking — done HERE, server-side, so raw phone/email never even reach
// the page or the rendered HTML. Mirrors the Call Lab, which stores/shows a
// masked caller number. Message BODIES are never fetched into a rendered
// field at all — a conversation carries channel, date, unread count, and a
// contact display name that passes through scrubLabel below (for a nameless
// inbound lead that "name" is the raw number, so it gets the same mask).
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

/**
 * GHL display names, tags, and sources are free text that commonly IS contact
 * data: an inbound SMS from an unknown number creates a contact whose display
 * name is the phone number itself, and form-fed `source` values can carry a
 * prefill URL with the lead's email in its query string. Any such label that
 * looks like contact data gets the same mask as contact data — otherwise the
 * masked phone/email columns would sit right next to an unmasked copy.
 */
function scrubLabel(value: string | null): string | null {
  if (value === null) return null;
  // A URL-ish source keeps only its path — query strings can carry prefill PII.
  const q = value.indexOf("?");
  const base = q >= 0 ? value.slice(0, q) : value;
  if (base.includes("@")) return maskEmail(base) ?? "•••";
  if (base.replace(/\D/g, "").length >= 7) return maskPhone(base);
  return base.length > 60 ? `${base.slice(0, 60)}…` : base;
}

// ===========================================================================
// Fetch
// ===========================================================================

/** A non-2xx upstream response. Its message carries ONLY a status number. */
class UpstreamError extends Error {}

async function ghlGet(endpoint: Endpoint, apiKey: string): Promise<unknown> {
  // The host is the BASE constant; `endpoint` is one of the module constants
  // above. Nothing external ever contributes to this URL.
  const response = await fetch(`${BASE}${endpoint.path}`, {
    method: "GET",
    headers: {
      // The secret rides here, in the header — never in the URL, never logged.
      Authorization: `Bearer ${apiKey}`,
      Version: endpoint.version,
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

function safeReason(error: unknown): string {
  if (error instanceof UpstreamError) return error.message;
  return "Could not reach LeadTech.";
}

/**
 * Shared shell for every tab fetcher: key check -> parallel GETs -> parse,
 * with the never-throw / honest-error contract in one place.
 */
async function fetchTab<T>(
  endpoints: Endpoint[],
  parse: (bodies: unknown[]) => T,
): Promise<LeadTechResult<T>> {
  const apiKey = env.LEADTECH_API_KEY;
  if (!apiKey) {
    // Honest "not connected" — exactly like the Presence's 503. Never fake data.
    return { state: "not_connected" };
  }

  try {
    const bodies = await Promise.all(endpoints.map((endpoint) => ghlGet(endpoint, apiKey)));
    return { state: "ok", data: parse(bodies) };
  } catch (error) {
    // Never surface the key or the body. A short, safe reason only. A raw
    // network failure (TypeError) gets a generic message; a non-2xx keeps its
    // status number, which is safe.
    return { state: "error", reason: safeReason(error) };
  }
}

/** Pipeline tab: stage definitions + the opportunities that sit in them. */
export function fetchPipelineTab(): Promise<LeadTechResult<PipelineTabData>> {
  return fetchTab([PIPELINES, OPPORTUNITIES], ([pipelinesRaw, opportunitiesRaw]) => ({
    pipelines: parsePipelines(pipelinesRaw),
    opportunities: parseOpportunities(opportunitiesRaw),
  }));
}

/** Contacts tab: the newest contacts with tags, source, and masked reachability. */
export function fetchContactsTab(): Promise<LeadTechResult<ContactsTabData>> {
  return fetchTab([CONTACTS], ([contactsRaw]) => ({
    contacts: parseContacts(contactsRaw),
  }));
}

/** Engagement tab: recent conversations (no bodies) + configured calendars. */
export function fetchEngagementTab(): Promise<LeadTechResult<EngagementTabData>> {
  return fetchTab([CONVERSATIONS, CALENDARS], ([conversationsRaw, calendarsRaw]) => ({
    conversations: parseConversations(conversationsRaw),
    calendars: parseCalendars(calendarsRaw),
  }));
}

// ===========================================================================
// Defensive parsers. The API contract above is ASSUMED, not verified live, so
// every field is read defensively: an unexpected shape yields empty lists or
// null fields (honest zeros), never a crash and never an invented row.
// ===========================================================================

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Timestamp field: an ISO string passes through; unix-millis become ISO. */
function tsStr(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value).toISOString();
  }
  return str(value);
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
    .slice(0, 100)
    .map((entry) => {
      const c = record(entry);
      const composed = [str(c.firstName), str(c.lastName)].filter(Boolean).join(" ");
      return {
        id: str(c.id) ?? "",
        // Scrubbed: for a nameless inbound lead GHL's display name IS the
        // raw phone/email, which would defeat the masked columns beside it.
        name: scrubLabel(str(c.contactName) ?? str(c.name) ?? (composed || null)),
        phoneMasked: maskPhone(c.phone),
        emailMasked: maskEmail(c.email),
        addedAt: str(c.dateAdded) ?? str(c.createdAt),
        tags: asArray(c.tags)
          .map((tag) => scrubLabel(str(tag)))
          .filter((tag): tag is string => tag !== null)
          .slice(0, 8),
        source: scrubLabel(str(c.source)),
        dnd: c.dnd === true,
      };
    })
    .filter((c) => c.id);
}

function parseOpportunities(raw: unknown): LeadOpportunity[] {
  const root = record(raw);
  return asArray(root.opportunities)
    .slice(0, 100)
    .map((entry) => {
      const o = record(entry);
      return {
        id: str(o.id) ?? "",
        name: str(o.name),
        status: str(o.status),
        monetaryValue: numOrNull(o.monetaryValue),
        pipelineId: str(o.pipelineId),
        stageId: str(o.pipelineStageId) ?? str(o.stageId),
        createdAt: str(o.createdAt) ?? str(o.dateAdded),
      };
    })
    .filter((o) => o.id);
}

function parsePipelines(raw: unknown): LeadPipeline[] {
  const root = record(raw);
  return asArray(root.pipelines)
    .slice(0, 20)
    .map((entry) => {
      const p = record(entry);
      return {
        id: str(p.id) ?? "",
        name: str(p.name),
        stages: asArray(p.stages)
          .slice(0, 30)
          .map((stageEntry) => {
            const s = record(stageEntry);
            return { id: str(s.id) ?? "", name: str(s.name) };
          })
          .filter((s) => s.id),
      };
    })
    .filter((p) => p.id);
}

function parseConversations(raw: unknown): LeadConversation[] {
  const root = record(raw);
  return asArray(root.conversations)
    .slice(0, 50)
    .map((entry) => {
      const c = record(entry);
      return {
        id: str(c.id) ?? "",
        // Scrubbed for the same reason as contact names: an unknown inbound
        // number's conversation is titled with the raw number itself.
        contactName: scrubLabel(str(c.contactName) ?? str(c.fullName)),
        type: str(c.type),
        // GHL timestamps arrive as ISO strings on some shapes and unix-millis
        // numbers on others — accept both, render neither wrongly.
        lastMessageAt: tsStr(c.lastMessageDate),
        // Channel of the last message ONLY — the body field is deliberately
        // never read, so a message text can never reach the rendered page.
        lastMessageType: str(c.lastMessageType),
        unreadCount: numOrNull(c.unreadCount),
      };
    })
    .filter((c) => c.id);
}

function parseCalendars(raw: unknown): LeadCalendar[] {
  const root = record(raw);
  return asArray(root.calendars)
    .slice(0, 30)
    .map((entry) => {
      const c = record(entry);
      return {
        id: str(c.id) ?? "",
        name: str(c.name),
        isActive: typeof c.isActive === "boolean" ? c.isActive : null,
      };
    })
    .filter((c) => c.id);
}
