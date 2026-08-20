/**
 * The one place a SignalWire call becomes a CORE transfer id, and the one
 * place a caller's number is reduced to something safe to store.
 *
 * `dialer_transfers.transfer_id` carries a UNIQUE index, and that constraint is
 * the only thing that makes the webhook idempotent — a redelivered event is
 * supposed to collide with the row it already wrote. Nothing else in the
 * pipeline notices a duplicate: the id is a key, not derived data, so no later
 * write can merge two rows that were keyed apart, and the Call Lab inbox shows
 * the same call twice forever.
 *
 * That is why the derivation lives here rather than inline at the call site. It
 * takes almost nothing to drift — one caller trimming the id and another not,
 * one prefixing and another not — and each variant produces a key the other can
 * never collide with. A second call site that builds the string by hand is the
 * bug, however obvious the string looks.
 *
 * Pure and framework-free, so a webhook route and a rendered page derive the
 * same value without either dragging the other's imports in.
 */

/**
 * `source_system` for every row this pipeline writes, and the id namespace.
 *
 * The unique index is on `transfer_id` alone — `source_system` is a separate
 * column and is not part of it — so the prefix is the only thing keeping a
 * Retreaver or Twilio call id from taking the row of a SignalWire call that
 * happens to carry the same string.
 */
export const SIGNALWIRE_SOURCE_SYSTEM = "signalwire";

/**
 * Derive the transfer id for a SignalWire call.
 *
 * Whitespace is trimmed because `"abc"` and `" abc "` are the same call and
 * must not become two rows. The case is deliberately left alone: lowercasing
 * would merge two genuinely distinct ids in a case-sensitive id space, and
 * wrongly treating two calls as one is worse than the duplicate it prevents.
 *
 * This does not validate. An empty id yields a bare prefix — a real key that
 * every id-less event would then share, collapsing unrelated calls into one
 * row. `normalizeSignalwireEvent` refuses a payload with no call id before it
 * ever gets here, and any other caller must do the same.
 */
export function signalwireTransferId(parentCallId: string): string {
  return `${SIGNALWIRE_SOURCE_SYSTEM}:${parentCallId.trim()}`;
}

/**
 * Below this, the mask would show nearly the whole number. A real caller ID is
 * at least seven digits, so nothing legitimate is refused by the floor.
 */
const MIN_MASKABLE_DIGITS = 7;

/**
 * Reduce a caller's number to the four digits an agent needs to recognise a
 * call back.
 *
 * The unmasked number must never reach `caller_number_masked`. That column is
 * read by every Call Lab page and carried into anything exported from them, so
 * a full number stored once is a lead's phone number in a dozen places that
 * were never meant to hold one — and the column cannot be un-leaked later.
 *
 * The output shape is fixed rather than mirroring the input. A mask that kept
 * the original's length and grouping would restate how many digits it had and
 * which numbering plan it came from, which is exactly the information the
 * column exists to drop.
 *
 * Returns null when there is nothing maskable. The column is nullable, and a
 * blank is the honest answer where a partial number would not be.
 */
export function maskCallerNumber(e164: string | null | undefined): string | null {
  if (typeof e164 !== "string") return null;

  const digits = e164.replace(/\D/g, "");
  if (digits.length < MIN_MASKABLE_DIGITS) return null;

  return `(***) ***-${digits.slice(-4)}`;
}
