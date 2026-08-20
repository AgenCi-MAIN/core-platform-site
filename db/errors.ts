/**
 * Database error classification, with no framework attached.
 *
 * This lives beside the schema rather than in `app/portal` because a machine
 * endpoint and a rendered page have to agree on what "the table is missing"
 * looks like. Importing it from `app/portal/access.ts` would drag the whole
 * server-only access model — and its `cloudflare:workers` binding — into a
 * caller that only needs to read one error message.
 */

/**
 * True when a query failed because the table does not exist — a bound database
 * whose migration has not been applied.
 *
 * Matched on the message because D1 and SQLite surface this as a plain error
 * with no stable code. The match is deliberately narrow: only a missing table
 * is treated as "not provisioned". A missing column, a constraint violation, or
 * a connection fault must not be swallowed by this.
 */
export function isMissingTableError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}`
      : String(error);

  return /no such table|does not exist|D1_ERROR.*no such table/i.test(message);
}
