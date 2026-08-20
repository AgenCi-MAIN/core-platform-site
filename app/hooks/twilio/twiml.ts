/**
 * TwiML builders and helpers for the Twilio inbound voice webhook.
 *
 * Pure functions, no I/O, so the whole content contract can be unit-tested
 * without a runtime. The one invariant that outranks everything here:
 *
 *   NO RECORDING. No `record` attribute on <Dial>, no <Record> verb, ever.
 *
 * Recording is OFF until counsel clears the announcement wording (A29 / E7b).
 * A recorded call before that wording is approved is a consent/legality harm
 * that cannot be un-made, so the harm is designed out of this file rather than
 * left to configuration: there is simply no code path here that emits `record`.
 * A test greps the output for it.
 */

/** Escape the five XML metacharacters. Applied to every value placed in TwiML. */
export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** E.164: a leading + and 8–15 digits, first digit non-zero. */
const E164 = /^\+[1-9]\d{7,14}$/;

export function isE164(value: string): boolean {
  return E164.test(value);
}

/**
 * Parse the comma/space-separated dial roster from its plain env var into a
 * validated, de-duplicated, order-preserving list of E.164 numbers. Anything
 * that is not a well-formed E.164 number is dropped rather than dialed — a
 * malformed entry must never become a call to an unintended number.
 */
export function parseDialTargets(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const piece of raw.split(/[\s,]+/)) {
    const n = piece.trim();
    if (n && isE164(n) && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

/**
 * Mask a caller's number for storage. The house precedent is
 * `caller_number_masked` — the full consumer number never rests in D1. Keep a
 * short head (country hint) and the last four; mask the middle. Returns null
 * for an empty input so the column stays honestly empty.
 */
export function maskNumber(raw: string | undefined | null): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (s.length <= 4) return "•".repeat(s.length);
  const head = s.startsWith("+") ? s.slice(0, 2) : s.slice(0, 1);
  const last4 = s.slice(-4);
  const maskedLen = Math.max(1, s.length - head.length - last4.length);
  return head + "•".repeat(maskedLen) + last4;
}

/**
 * The neutral connect greeting. Deliberately carries NO recording sentence:
 * saying "this call may be recorded" on a line that does not record is its own
 * counsel question, and recording is OFF (A29). No coverage promises, no rate
 * claims, no pressure — receiving-first, and nothing a compliance reviewer
 * would flag if it were read back aloud.
 */
export const CONNECT_GREETING =
  "Thank you for calling THRIVE. Please hold while we connect you to a licensed representative.";

/**
 * The fail-safe greeting when there is no one to ring (roster unconfigured or
 * empty). Fail to a courtesy message and a clean hang-up — never to silence,
 * never to voicemail (voicemail captures caller audio, the exact thing A29
 * defers), and never to recording.
 */
export const UNAVAILABLE_GREETING =
  "Thank you for calling THRIVE. We are not able to take your call right now. Please try again shortly.";

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const VOICE = "Polly.Joanna";

/**
 * Ring the roster. All numbers ring at once (`<Number>` siblings inside one
 * `<Dial>`); the first to answer takes the call and the rest stop ringing.
 * `answerOnBridge` bills the outbound leg only from the moment a human answers.
 * There is no `record` attribute — see the file header.
 */
export function buildDialTwiml(
  targets: readonly string[],
  greeting: string = CONNECT_GREETING,
): string {
  const numbers = targets
    .map((t) => `    <Number>${escapeXml(t)}</Number>`)
    .join("\n");
  return [
    XML_HEADER,
    "<Response>",
    `  <Say voice="${VOICE}">${escapeXml(greeting)}</Say>`,
    '  <Dial answerOnBridge="true" timeout="20">',
    numbers,
    "  </Dial>",
    "</Response>",
    "",
  ].join("\n");
}

/** Courtesy message, then hang up. No dial, no voicemail, no recording. */
export function buildCourtesyTwiml(greeting: string = UNAVAILABLE_GREETING): string {
  return [
    XML_HEADER,
    "<Response>",
    `  <Say voice="${VOICE}">${escapeXml(greeting)}</Say>`,
    "  <Hangup/>",
    "</Response>",
    "",
  ].join("\n");
}
