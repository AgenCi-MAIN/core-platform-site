/**
 * Timestamps written by the app, in the one format the schema already uses.
 *
 * Every time column in `db/schema.ts` is TEXT, and the ones with defaults are
 * filled by SQLite's `CURRENT_TIMESTAMP`, which produces `'YYYY-MM-DD HH:MM:SS'`
 * in UTC. An app-written value must match that byte for byte, because those
 * columns are compared and ordered as strings: `'2026-08-19T04:00:00'` and
 * `'2026-08-19 04:00:00'` are the same instant, but `'T'` (0x54) sorts after
 * `' '` (0x20), so a table holding both formats orders every ISO row after
 * every default-written row regardless of when either happened. An index on
 * the column hides the damage rather than fixing it — the ordering is wrong,
 * not slow. `Date.toISOString()` is therefore never correct here.
 */

/** UTC now, in the same shape SQLite's `CURRENT_TIMESTAMP` writes. */
export function sqliteNow(): string {
  return format(new Date());
}

/**
 * Lower and upper bounds on a timestamp the app will accept from outside.
 *
 * A dialer payload is a foreign document: a missing field read as `0` becomes
 * 1970, a millisecond value read as seconds becomes the year 57000, and a
 * truncated string parses to something equally absurd. Any of those written
 * into `started_at` sorts to one end of the table and quietly drags every
 * range query with it, so an implausible value is rejected as unusable rather
 * than stored. The window is wide enough that no real call is ever refused.
 */
const MIN_EPOCH_SECONDS = Date.UTC(2000, 0, 1) / 1000;
const MAX_EPOCH_SECONDS = Date.UTC(2100, 0, 1) / 1000;

/**
 * Normalise an epoch-seconds or ISO-8601 value to `'YYYY-MM-DD HH:MM:SS'` UTC.
 *
 * Returns null when the input is absent, unparseable, or outside the plausible
 * window above. Null is the honest answer — the column is nullable, and a
 * guessed timestamp is worse than an admitted gap.
 */
export function toSqliteTime(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const milliseconds = toMilliseconds(value);
  if (milliseconds === null) return null;

  const seconds = milliseconds / 1000;
  if (seconds < MIN_EPOCH_SECONDS || seconds >= MAX_EPOCH_SECONDS) return null;

  return format(new Date(milliseconds));
}

function toMilliseconds(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value * 1000 : null;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  // A bare number arrives as a string often enough (JSON, form fields, query
  // params) that treating it as text and letting `Date.parse` guess would be
  // the bug — it reads "1755600000" as a year.
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }

  // A value carrying no zone — including one already in the stored format —
  // is UTC here, so the zone is stated rather than left to `Date.parse`, which
  // reads it as local time and silently shifts it by the host's offset. The
  // Worker runs in UTC and would never notice; a developer's machine would
  // write rows hours off from the ones `CURRENT_TIMESTAMP` filled in.
  const zoneless = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(trimmed);
  const parsed = Date.parse(zoneless ? `${trimmed.replace(" ", "T")}Z` : trimmed);

  return Number.isNaN(parsed) ? null : parsed;
}

function format(date: Date): string {
  // `toISOString` is the only formatter guaranteed to be UTC regardless of the
  // runtime's zone; the slice drops the milliseconds and the trailing "Z", and
  // the replace is what puts the separator back to a space.
  return date.toISOString().slice(0, 19).replace("T", " ");
}
