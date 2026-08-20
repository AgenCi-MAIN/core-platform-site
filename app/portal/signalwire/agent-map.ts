import { env } from "cloudflare:workers";

/**
 * Which member took the call — resolved from the line SignalWire connected.
 *
 * SERVER-ONLY. It reads a Worker secret, so it must never be imported from a
 * `"use client"` file.
 *
 * The mapping lives in the `SIGNALWIRE_AGENT_MAP` secret rather than in a
 * table, and that is a deliberate trade:
 *
 *   - Three staff mobile numbers in D1 would be three personal phone numbers
 *     sitting next to the roster: joined into member reads, copied into audit
 *     detail, and present in every database export and console browse from then
 *     on. In a secret they are readable only by this function, and only inside
 *     the Worker.
 *   - Changing it needs no migration. CORE_PLATFORM_RECORD.md § 9 records two
 *     migration paths that must not both be applied to the live database, so a
 *     new table is a real cost for a three-row lookup that changes when someone
 *     gets a new phone.
 *
 * What it gives up is per-change history: a table would record who edited the
 * mapping and when, and the secret does not. That is the right way round while
 * the set is this small and this static. It stops being the right way round if
 * it grows into a roster.
 *
 * Only the secret's NAME appears here, as everywhere else. The value is set
 * with `wrangler secret put`, or `.dev.vars` locally, and holds JSON like
 * `{"+1...": "person@example.com"}`.
 */

const SECRET_NAME = "SIGNALWIRE_AGENT_MAP";

/**
 * Same floor the caller mask uses: below this a value is not a phone number,
 * and comparing on it would match far too much.
 */
const MIN_DIGITS = 7;

/** RFC 5321's limit. A longer value is not an address. */
const MAX_EMAIL_LENGTH = 254;

/**
 * Name the member whose line SignalWire connected, or nobody.
 *
 * Null is returned for no match, an unset or malformed secret, and an ambiguous
 * one — two entries for the same number naming different people. Guessing
 * between them would put one member's address on another's call, and the
 * `agent_email` column is what the Call Lab uses to decide whose review queue
 * a call belongs in.
 *
 * The address this returns is a LABEL on a transfer row. It grants nothing and
 * must never be used to create a `portal_members` row: the person may have no
 * membership, or a revoked one, and membership is granted by a human running
 * the SQL in the operating record — never as a side effect of a call arriving.
 */
export function resolveAgentEmail(connectedNumber: string | null | undefined): string | null {
  const wanted = toDigits(connectedNumber);
  if (wanted === null) return null;

  const runtime = env as unknown as { SIGNALWIRE_AGENT_MAP?: string };
  const raw = runtime.SIGNALWIRE_AGENT_MAP;
  if (typeof raw !== "string" || raw.trim() === "") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // The fault is logged; the content never is. Neither the map nor the
    // number reaches the console, and the parse error is dropped rather than
    // reported because its message can quote the document it choked on.
    console.error(`[signalwire] ${SECRET_NAME} is not valid JSON`);
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.error(`[signalwire] ${SECRET_NAME} is not a JSON object`);
    return null;
  }

  let match: string | null = null;

  for (const [key, value] of Object.entries(parsed)) {
    if (toDigits(key) !== wanted) continue;

    const email = normalizeEmail(value);
    // A matching entry we cannot read is not the same as no entry: something
    // was meant to be here, so the honest answer is that we cannot say who.
    if (email === null) return null;
    if (match !== null && match !== email) return null;

    match = email;
  }

  return match;
}

/**
 * Strip punctuation and nothing else. Formatting varies between the map and
 * whatever SignalWire sends — `+1 205 555 0134` against `+12055550134` — but
 * length never does: matching on trailing digits would let an unrelated foreign
 * number resolve to a member, so a number missing its country code simply does
 * not match, and the map is expected to hold the same E.164 form the dialer
 * sends.
 */
function toDigits(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const digits = value.replace(/\D/g, "");
  return digits.length >= MIN_DIGITS ? digits : null;
}

/**
 * Lowercased, because `portal_members.email` is the lowercased allowlist key —
 * a mixed-case entry here would never line up with the member row it names.
 *
 * The shape check is deliberately shallow. It is not an attempt at RFC
 * validation; it exists so a typo or a stray JSON value cannot be written into
 * `agent_email` as though it were an address.
 */
function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  return email;
}
