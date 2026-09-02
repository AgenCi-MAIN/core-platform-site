/**
 * UTC week arithmetic for the dashboard and the weekly check-in.
 *
 * Pure and import-free on purpose: these are called from route handlers and
 * server components alike, and a date-prefix string ("YYYY-MM-DD") compares
 * lexically against BOTH stored timestamp shapes — SQLite's
 * "YYYY-MM-DD HH:MM:SS" and JavaScript's "…T…Z" — which is the established
 * idiom for windowed counts here.
 */

/** UTC ISO-8601 week key, Monday-start, e.g. "2026-W36". */
export function isoWeekKey(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;              // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day);      // the nearest Thursday fixes the ISO year
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" of the UTC Monday starting the week containing `now`. */
export function isoWeekStart(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" of the Monday seven days before isoWeekStart(now). */
export function isoPrevWeekStart(now: Date = new Date()): string {
  const start = new Date(`${isoWeekStart(now)}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 7);
  return start.toISOString().slice(0, 10);
}
