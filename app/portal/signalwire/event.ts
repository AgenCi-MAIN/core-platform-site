import {
  DIALER_TRANSFER_DIRECTIONS,
  type DialerTransferDirection,
  type DialerTransferStatus,
} from "../../../db/schema";
import { toSqliteTime } from "../../../db/time";
import {
  SIGNALWIRE_SOURCE_SYSTEM,
  maskCallerNumber,
  signalwireTransferId,
} from "../calls/transfer-id";

/**
 * Turning a posted SignalWire event into something the database may be shown.
 *
 * The payload is a foreign document. Whatever posts it is unattended, its shape
 * is the vendor's to change, and anyone who learns the endpoint can post their
 * own. So nothing here trusts the payload's structure: every field this module
 * reads is named in `FIELDS` below and read by name. The payload is never
 * spread into a row — a spread writes whatever keys happen to be present,
 * which turns "the vendor added a field" and "someone set a column we guard"
 * into the same silent write.
 *
 * Enum-bound columns are checked in code against the schema's own arrays rather
 * than left to D1. `direction` and `status` both carry CHECK constraints, and a
 * value that fails one surfaces as a driver error the route can only answer
 * with a 500 — a server fault reported for what is really a bad request. Doing
 * it here makes it our 400, with the payload named as the thing at fault.
 *
 * Pure: no database, no bindings, no logging. It decides whether a payload is
 * usable; the caller decides what to do about it.
 */

/**
 * FIELDS NOT READ, AND WHY.
 *
 * - `transfer_id` — derived from the call id, never accepted. A payload that
 *   chose its own key could aim at an existing row and overwrite the call
 *   already sitting in someone's review queue.
 * - `consent_status` — the recording is playable only where consent is
 *   verified. A payload that could set it could mark its own call verified,
 *   which is a consent bypass with a recording at the end of it.
 * - `recording_object_key` and `recording_mime_type` — these point the player
 *   at bytes in R2. Together with the field above, a payload that could set
 *   them could make an arbitrary object in the bucket playable through the
 *   portal. Both are written by the recording pipeline, after it has stored
 *   the object it is naming.
 *
 * All four are set by CORE, from what CORE did — never from what it was told.
 */
const FIELDS = {
  /**
   * The transfer is keyed on the parent leg: one customer call that rings two
   * agents produces two child legs, and keying on the child would file the same
   * call twice. The plain call id is the fallback only because the first leg
   * has no parent — which is stable per call, so it is not a second key for a
   * call that already has one.
   */
  parentCallId: ["parent_call_id", "ParentCallSid"],
  callId: ["call_id", "CallSid"],
  direction: ["direction", "Direction"],
  /**
   * No vendor alias, deliberately. SignalWire's `CallStatus` is a different
   * vocabulary — ringing, completed, no-answer — describing the telephony leg,
   * while this column is the Call Lab's review lifecycle. Reading one into the
   * other would write values our own CHECK rejects and mean something else
   * where it did not.
   */
  status: ["status"],
  callerNumber: ["from", "From"],
  connectedNumber: ["to", "To"],
  queueName: ["queue", "queue_name"],
  startedAt: ["started_at", "StartTime"],
  endedAt: ["ended_at", "EndTime"],
  durationSeconds: ["duration_seconds", "CallDuration"],
} as const;

/**
 * Vendor spellings of `direction` that map onto ours. An allowlist, not a
 * prefix test: `outbound-anything` should be a rejected payload rather than a
 * guess about what SignalWire meant by a word we have not seen.
 */
const VENDOR_DIRECTIONS: Record<string, DialerTransferDirection> = {
  "outbound-api": "outbound",
  "outbound-dial": "outbound",
};

/**
 * The statuses a payload is allowed to assert. Narrower than the schema's set
 * on purpose: `ready` is what makes a call reviewable and `needs_review` is
 * what puts it in front of a person, and both are decisions CORE makes after
 * the recording has landed. An arriving call does not get to declare either.
 */
const INTAKE_STATUSES: readonly DialerTransferStatus[] = ["received", "processing", "failed"];

/** Column default, restated because the normalised event is complete. */
const DEFAULT_STATUS: DialerTransferStatus = "received";

/**
 * Longest free-text value accepted into a TEXT column. Every string here comes
 * from outside, and D1 will happily store a megabyte of queue name.
 */
const MAX_TEXT_LENGTH = 200;

/** A call longer than a day is a units mistake, not a call. */
const MAX_DURATION_SECONDS = 24 * 60 * 60;

export type SignalwireTransferEvent = {
  transferId: string;
  sourceSystem: typeof SIGNALWIRE_SOURCE_SYSTEM;
  externalCallId: string;
  direction: DialerTransferDirection;
  status: DialerTransferStatus;
  callerNumberMasked: string | null;
  /**
   * Not a column. The connected leg is the agent's own line, kept out of the
   * returned row and passed to `resolveAgentEmail` to name them. The raw caller
   * number never leaves this module at all — only its mask does.
   */
  connectedNumber: string | null;
  queueName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
};

type Payload = Record<string, unknown>;

/**
 * Normalise a posted payload, or refuse it.
 *
 * Null means the payload is unusable and the caller should answer 400 without
 * writing anything. Only four things refuse it: a payload that is not an
 * object, no call id, a missing or unrecognised direction, and a status the
 * payload was not entitled to set. Everything else is nullable in the schema,
 * so a value that cannot be trusted becomes null rather than sinking the whole
 * event — an admitted gap in one column, against losing the call record.
 */
export function normalizeSignalwireEvent(payload: unknown): SignalwireTransferEvent | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const record = payload as Payload;

  const callId = readText(record, FIELDS.parentCallId) ?? readText(record, FIELDS.callId);
  if (callId === null) return null;

  const direction = readDirection(record);
  if (direction === null) return null;

  const status = readStatus(record);
  if (status === null) return null;

  return {
    transferId: signalwireTransferId(callId),
    sourceSystem: SIGNALWIRE_SOURCE_SYSTEM,
    externalCallId: callId,
    direction,
    status,
    callerNumberMasked: maskCallerNumber(readText(record, FIELDS.callerNumber)),
    connectedNumber: readText(record, FIELDS.connectedNumber),
    queueName: readText(record, FIELDS.queueName),
    startedAt: toSqliteTime(pick(record, FIELDS.startedAt)),
    endedAt: toSqliteTime(pick(record, FIELDS.endedAt)),
    durationSeconds: readDuration(record),
  };
}

/** First present value among the allowlisted spellings of one field. */
function pick(payload: Payload, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

function readText(payload: Payload, keys: readonly string[]): string | null {
  const value = pick(payload, keys);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed === "" || trimmed.length > MAX_TEXT_LENGTH) return null;

  return trimmed;
}

function readDirection(payload: Payload): DialerTransferDirection | null {
  const raw = readText(payload, FIELDS.direction)?.toLowerCase();
  if (raw === undefined) return null;

  // Matched against the schema's own array first, so adding a direction there
  // is enough — this stays in step without a second list to remember.
  return DIALER_TRANSFER_DIRECTIONS.find((value) => value === raw) ?? VENDOR_DIRECTIONS[raw] ?? null;
}

/**
 * Returns null for a status the payload may not set — which the caller treats
 * as a refusal, not as "absent". An absent status is the column default; a
 * stated one we do not honour is a payload asserting something it should not,
 * and quietly downgrading it to the default would hide that.
 */
function readStatus(payload: Payload): DialerTransferStatus | null {
  const raw = readText(payload, FIELDS.status)?.toLowerCase();
  if (raw === undefined) return DEFAULT_STATUS;

  return INTAKE_STATUSES.find((value) => value === raw) ?? null;
}

function readDuration(payload: Payload): number | null {
  const value = pick(payload, FIELDS.durationSeconds);

  // A duration arrives as a JSON number or as a form field's digits; anything
  // else is not a duration. The column is an integer with a `>= 0` CHECK, so a
  // fractional or negative value is rounded or dropped rather than offered.
  const seconds =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value.trim())
        : null;

  if (seconds === null || !Number.isFinite(seconds)) return null;
  if (seconds < 0 || seconds > MAX_DURATION_SECONDS) return null;

  return Math.round(seconds);
}
