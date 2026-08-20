import { isMissingTableError } from "../../db/errors";

/**
 * Touching a table after authorization has already succeeded — reading one
 * here, and writing one in `writeRow` below.
 *
 * `resolvePortalAccess` goes to real trouble to fail closed when the database
 * is unreachable or unmigrated — but that protection covers `portal_members`
 * during sign-in and nothing else. Every page that queries a second table
 * afterwards was reading it bare, so a database missing `dialer_transfers` or
 * `audit_events` produced an unhandled throw and an HTTP 500 with a stack
 * trace, on a route the member was entitled to see.
 *
 * That is not a hypothetical here: CORE_PLATFORM_RECORD.md § 9 records two
 * migration paths that must not both be applied, and the live database took
 * only one of them. A table can genuinely be absent.
 *
 * The rule this enforces is the one the portal already follows everywhere
 * else: **never state something you could not read.** An empty array and a
 * failed read look identical to a renderer, and rendering "0 records" after a
 * failed read is a false claim about the data, not a neutral default. So the
 * fault is returned alongside the rows and the page is expected to say which
 * of the two happened.
 *
 * Server-only, like everything else in this directory.
 */

export type ReadFault =
  /** The table does not exist — the database is bound but not migrated. */
  | "not_provisioned"
  /** Anything else: connection fault, timeout, malformed query. */
  | "unavailable";

export type ReadResult<Row> = {
  rows: Row[];
  /** Null when the read succeeded. An empty `rows` then genuinely means empty. */
  fault: ReadFault | null;
};

/**
 * Runs a query and classifies any failure rather than letting it escape.
 *
 * `label` names the table for the server-side log line. It is never shown to
 * the member: a page that printed the underlying database error would leak
 * schema detail to whoever could trigger it.
 */
export async function readRows<Row>(
  label: string,
  run: () => Promise<Row[]>,
): Promise<ReadResult<Row>> {
  try {
    return { rows: await run(), fault: null };
  } catch (error) {
    const fault: ReadFault = isMissingTableError(error) ? "not_provisioned" : "unavailable";
    // Server-side only, and deliberately so — the member sees the plain-English
    // copy below, never the driver's message.
    console.error(`[portal] could not read ${label} (${fault}):`, error);
    return { rows: [], fault };
  }
}

export type WriteResult<Value> =
  | { ok: true; value: Value }
  | { ok: false; fault: ReadFault };

/**
 * The same classification for a write, and a separate function on purpose.
 *
 * `readRows` answers a failed query with an empty array. That is right for a
 * read — the page still renders, and the fault beside it stops the emptiness
 * being read as "no records". It is ruinous for a write: there is no empty
 * equivalent of an insert that did not happen, and a caller handed back a
 * plausible-looking result has no way left to tell that nothing was stored.
 *
 * The caller that matters is the dialer webhook. A vendor retries on a failure
 * response and stops retrying on a success one, so a handler that reports 200
 * after a failed insert is not merely wrong for one request — it tells the only
 * system holding a second copy of that transfer to discard it. The call record
 * is then gone permanently, and the audit log shows a clean receipt for it.
 *
 * So the outcome is returned as a discriminated union the caller cannot read
 * past: there is no `value` on the failing branch to reach for by accident.
 * `ReadFault` is reused rather than duplicated because the two causes are the
 * same two — an unmigrated table, or a database that did not answer — and the
 * copy in `readFaultCopy` already explains both truthfully.
 *
 * `label` names the table for the server log and is never returned to the
 * caller, for the reason it is never shown to a member: the driver's message
 * describes the schema to whoever can trigger the failure.
 */
export async function writeRow<Value>(
  label: string,
  run: () => Promise<Value>,
): Promise<WriteResult<Value>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    const fault: ReadFault = isMissingTableError(error) ? "not_provisioned" : "unavailable";
    console.error(`[portal] could not write ${label} (${fault}):`, error);
    return { ok: false, fault };
  }
}

/**
 * The copy shown in place of a table that could not be read.
 *
 * Both variants say plainly that nothing was read. Neither implies the table is
 * empty, and neither shows the underlying error.
 */
export function readFaultCopy(fault: ReadFault, subject: string): {
  title: string;
  body: string;
} {
  if (fault === "not_provisioned") {
    return {
      title: `${subject} is not provisioned`,
      body: "The database is connected but this table has not been created yet. Apply the portal migration in db/sql/ and reload. Nothing is missing from your account — this is a deployment step, not an access decision.",
    };
  }
  return {
    title: `${subject} could not be read`,
    body: "The database did not answer. This is not a permissions problem and nothing has been lost; the records are simply unavailable right now. Reload in a moment, and tell an administrator if it persists.",
  };
}
