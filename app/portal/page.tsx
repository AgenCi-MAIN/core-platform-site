import { Fragment } from "react";
import Link from "next/link";
import { ROLE_LABELS, requireCapability } from "./access";
import { ANNOUNCEMENTS } from "./announcements/content";
import { JarvisCommandPrompt } from "./command-prompt";
import { readFaultCopy, type ReadFault } from "./read-guard";
import { EmptyState, PortalShell, PrototypeNotice } from "./components";
import {
  loadCallbacks,
  loadCommitment,
  loadProduction,
  type MetricSource,
} from "./dashboard-data";

export const dynamic = "force-dynamic";

/** The newest announcement, surfaced on the signed-in home. In-file content —
 *  zero per-request cost, computed once at module load. */
const LATEST_ANNOUNCEMENT = [...ANNOUNCEMENTS]
  .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;

/** Integer cents → "$1,234.56". Money renders with cents, always. */
function fmt$(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Integer cents → the plain shape the check-in form accepts back
 * ("600" or "600.50" — no commas, no symbol), so Edit Week reopens onto a
 * value that passes its own input pattern unchanged.
 */
function fmtPlain$(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/**
 * Stored timestamps come in two shapes ("YYYY-MM-DD HH:MM:SS" and "…T…Z"),
 * both UTC; normalize before display. Short date only — a callback row needs
 * "due Sep 2", not a full timestamp.
 */
function dueLabel(dueAt: string): string {
  const iso = dueAt.includes("T") ? dueAt : `${dueAt.replace(" ", "T")}Z`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return dueAt.slice(0, 10);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

/** First sentence of the fault copy — the tile has one line of room. */
function faultClause(fault: ReadFault, subject: string): string {
  const { body } = readFaultCopy(fault, subject);
  const stop = body.indexOf(".");
  return stop === -1 ? body : body.slice(0, stop + 1);
}

type DeltaDir = "up" | "down" | "flat";

/**
 * Week-over-week movement, computed only from a live metric — prevWeek then
 * holds real data, where a true zero counts as real. Down is grey on purpose:
 * a slow week is not a failure.
 */
function weekDelta(metric: Extract<MetricSource, { kind: "live" }>): {
  dir: DeltaDir;
  glyph: string;
  text: string;
} {
  const moved = metric.week - metric.prevWeek;
  if (moved > 0) return { dir: "up", glyph: "▲", text: `${moved} vs last week` };
  if (moved < 0) return { dir: "down", glyph: "▼", text: `${-moved} vs last week` };
  return { dir: "flat", glyph: "—", text: "even with last week" };
}

const RANGES = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

/**
 * One production tile. CSS-only disclosure and range switch: a hidden
 * checkbox opens the detail, hidden radios pick the window — no client JS.
 * Pending and fault tiles keep the identical layout so real numbers drop in
 * without a redesign, but they never show a fabricated zero.
 */
function ProdTile({
  id,
  label,
  metric,
  liveNoun,
  pendingSentence,
}: {
  id: string;
  label: string;
  metric: MetricSource;
  /** Verb for live figures, e.g. "answered" → "12 answered this week". */
  liveNoun: string;
  /** The honest no-source sentence, shown in every window of a pending tile. */
  pendingSentence: string;
}) {
  const live = metric.kind === "live";
  const delta = metric.kind === "live" ? weekDelta(metric) : null;
  const rangeWord: Record<RangeKey, string> = {
    day: "today",
    week: "this week",
    month: "this month",
  };

  const figure = (range: RangeKey) => {
    if (metric.kind === "live") {
      return (
        <>
          <strong>{metric[range]}</strong> {liveNoun} {rangeWord[range]}
        </>
      );
    }
    if (metric.kind === "fault") return faultClause(metric.fault, label);
    return pendingSentence;
  };

  return (
    <article className={`portal-prod-tile${live ? "" : " portal-prod-tile-pending"}`}>
      <input
        className="portal-prod-expand"
        id={`prod-expand-${id}`}
        type="checkbox"
        aria-label={`Show day, week and month views for ${label.toLowerCase()}`}
      />
      <label className="portal-prod-face" htmlFor={`prod-expand-${id}`}>
        <span className="portal-prod-label">{label}</span>
        {metric.kind === "live" ? (
          <strong className="portal-prod-value">{metric.week}</strong>
        ) : (
          <strong
            className="portal-prod-value portal-prod-value-pending"
            aria-label={
              metric.kind === "fault" ? "Could not be read just now" : "No source connected"
            }
          >
            &mdash;
          </strong>
        )}
        {delta ? (
          <span className={`portal-prod-delta portal-prod-delta-${delta.dir}`}>
            {delta.glyph} {delta.text}
          </span>
        ) : (
          <span className="portal-prod-pending">
            {metric.kind === "fault" ? "could not be read just now" : "source pending"}
          </span>
        )}
        <span className="portal-prod-caret" aria-hidden="true" />
      </label>
      <div className="portal-prod-detail">
        <div className="portal-prod-views" role="group" aria-label="Time range">
          {RANGES.map((range) => (
            <Fragment key={range.key}>
              <input
                type="radio"
                name={`prod-range-${id}`}
                id={`prod-range-${id}-${range.key}`}
                className={`portal-prod-range portal-prod-range-${range.key}`}
                defaultChecked={range.key === "week"}
              />
              <label htmlFor={`prod-range-${id}-${range.key}`}>{range.label}</label>
            </Fragment>
          ))}
        </div>
        {RANGES.map((range) => (
          <p key={range.key} className={`portal-prod-figure portal-prod-figure-${range.key}`}>
            {figure(range.key)}
          </p>
        ))}
      </div>
    </article>
  );
}

/**
 * The founder's three-block dashboard: production tiles, this week's
 * commitment, and the Book of Business. Every rendered number is computed
 * from records the platform holds for THIS session's member; a metric with
 * no source system says "source pending", and a table that could not be read
 * says so — never a zero, never an invented value.
 */
export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ checkin?: string }>;
}) {
  const session = await requireCapability("dashboard.view.self", "/portal");
  const roleLabel = ROLE_LABELS[session.role];

  const params = await searchParams;
  const checkinFlag =
    params.checkin === "invalid" || params.checkin === "unavailable" ? params.checkin : null;

  const production = await loadProduction(session);
  const commitment = await loadCommitment(
    session,
    production.callsAnswered.kind === "live" ? production.callsAnswered.week : null,
  );
  const callbacks = await loadCallbacks(session);

  const row = commitment.state === "set" ? commitment.row : null;
  const callsAnsweredWeek = commitment.state === "set" ? commitment.callsAnsweredWeek : null;
  const callsRemaining =
    row && callsAnsweredWeek !== null ? Math.max(row.callTarget - callsAnsweredWeek, 0) : null;
  const pace =
    row && (row.leadBudgetCents > 0 || row.callTarget > 0)
      ? `Pace: about ${fmt$(Math.round(row.leadBudgetCents / 5))} and ${Math.ceil(
          row.callTarget / 5,
        )} calls a day across the five weekdays.`
      : null;

  return (
    <PortalShell session={session} current="/portal" section="Command">
      <main className="portal-main portal-dashboard">
        <section className="portal-command-arrival" aria-labelledby="command-arrival-title">
          <div className="portal-command-copy">
            <div className="portal-dashboard-meta" aria-label="Workspace state">
              <span className="portal-state portal-state-live">Access controls active</span>
              <span className="portal-state portal-state-pending">Business sources pending</span>
            </div>
            <p className="portal-eyebrow">J.A.R.V.I.S. / Command arrival</p>
            <h1 id="command-arrival-title">
              Welcome back, <span>{session.displayName}</span>.
            </h1>
            <p className="portal-command-lede">
              Signed in as <strong>{roleLabel}</strong> · every surface below is filtered by your
              server-enforced capabilities.
            </p>
            <JarvisCommandPrompt />
          </div>
        </section>

        {LATEST_ANNOUNCEMENT ? (
          <Link
            className="portal-dash-announcement"
            href={`/portal/announcements#${LATEST_ANNOUNCEMENT.id}`}
          >
            <span>Latest announcement</span>
            <strong>{LATEST_ANNOUNCEMENT.title}</strong>
          </Link>
        ) : null}

        <section className="portal-prod-grid" aria-label="This week's production">
          <ProdTile
            id="policies"
            label="Policies sold"
            metric={production.policiesSold}
            liveNoun="sold"
            pendingSentence="Source pending — connects with the Book of Business."
          />
          <ProdTile
            id="calls"
            label="Calls answered"
            metric={production.callsAnswered}
            liveNoun="answered"
            pendingSentence="Source pending."
          />
          <ProdTile
            id="clients"
            label="Active clients"
            metric={production.activeClients}
            liveNoun="active"
            pendingSentence="Source pending — connects with the Book of Business."
          />
          <ProdTile
            id="cost"
            label="Cost per policy"
            metric={production.costPerPolicy}
            liveNoun="per policy"
            pendingSentence="Lead spend ÷ policies sold — pending until both sources connect."
          />
        </section>

        <section className="portal-week-panel" aria-label="This week's commitment">
          <header className="portal-week-head">
            <p className="portal-week-kicker">The plan &mdash; not the score</p>
            <h2 className="portal-week-title">This week&rsquo;s commitment</h2>
          </header>

          {commitment.state === "fault" ? (
            /* The table could not be read: honest copy, and no form whose
               POST must fail is offered. */
            <EmptyState {...readFaultCopy(commitment.fault, "This week's commitment")} />
          ) : (
            <>
              {row ? (
                <div className="portal-week-goals">
                  <div className="portal-week-goal">
                    <span className="portal-week-goal-label">Lead spend remaining</span>
                    {/* Spend actuals have no source: an empty track states
                        exactly nothing. A full bar would assert $0 spent. */}
                    <div
                      className="portal-week-bar portal-week-bar-pending"
                      role="img"
                      aria-label={`${fmt$(row.leadBudgetCents)} budgeted; spend tracking pending`}
                    />
                    <span className="portal-week-goal-detail">
                      {fmt$(row.leadBudgetCents)} budgeted
                      <em className="portal-week-goal-note"> &middot; spend tracking pending &mdash; remaining unavailable</em>
                    </span>
                  </div>
                  <div className="portal-week-goal">
                    <span className="portal-week-goal-label">Calls remaining</span>
                    {callsRemaining === null ? (
                      /* Block 1's calls read faulted, so "remaining" cannot be
                         computed — the bar degrades to the pending shape
                         rather than asserting a number nobody read. */
                      <>
                        <div
                          className="portal-week-bar portal-week-bar-pending"
                          role="img"
                          aria-label={`${row.callTarget} calls planned; calls count unavailable just now`}
                        />
                        <span className="portal-week-goal-detail">
                          {row.callTarget} calls planned
                          <em className="portal-week-goal-note"> &middot; calls count unavailable just now</em>
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          className="portal-week-bar"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={row.callTarget}
                          aria-valuenow={callsRemaining}
                          aria-label={`${callsRemaining} of ${row.callTarget} calls remaining`}
                        >
                          <span
                            className="portal-week-bar-fill"
                            style={{
                              width: `${row.callTarget > 0 ? (callsRemaining / row.callTarget) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="portal-week-goal-detail">
                          {callsRemaining} of {row.callTarget} calls remaining
                        </span>
                      </>
                    )}
                  </div>
                  {pace ? <p className="portal-week-pace">{pace}</p> : null}
                </div>
              ) : (
                <p className="portal-week-invite">
                  No commitment set for this week yet &mdash; set your lead budget and call target
                  below.
                </p>
              )}

              <input
                className="portal-week-edit-toggle"
                id="portal-week-edit"
                type="checkbox"
                defaultChecked={commitment.state === "unset" || checkinFlag !== null}
                aria-label="Edit this week's commitment"
              />
              <label
                className="portal-week-edit portal-button portal-button-quiet"
                htmlFor="portal-week-edit"
              >
                Edit Week
              </label>
              <form className="portal-week-form" method="post" action="/portal/checkin">
                {checkinFlag === "invalid" ? (
                  <p className="portal-week-error">
                    Those numbers were refused &mdash; budget up to $20,000, calls up to 2,000,
                    nothing negative.
                  </p>
                ) : null}
                {checkinFlag === "unavailable" ? (
                  <p className="portal-week-error">
                    The commitment could not be stored just now. Nothing was saved &mdash; try
                    again in a moment.
                  </p>
                ) : null}
                <label className="portal-week-field">
                  <span>Lead budget for the week ($)</span>
                  <input
                    name="lead_budget"
                    inputMode="decimal"
                    required
                    pattern="\d{1,5}(\.\d{1,2})?"
                    defaultValue={row ? fmtPlain$(row.leadBudgetCents) : ""}
                  />
                </label>
                <label className="portal-week-field">
                  <span>Calls to answer this week</span>
                  <input
                    name="call_target"
                    inputMode="numeric"
                    required
                    pattern="\d{1,4}"
                    defaultValue={row ? String(row.callTarget) : ""}
                  />
                </label>
                <button className="portal-button portal-button-primary" type="submit">
                  Save the week
                </button>
              </form>
            </>
          )}
        </section>

        {callbacks.kind === "hidden" ? null : callbacks.kind === "fault" ? (
          <article className="portal-bob-tile portal-bob-tile-fault" aria-label="Book of Business">
            <p className="portal-bob-kicker">Master Book of Business</p>
            <EmptyState {...readFaultCopy(callbacks.fault, "Callback tasks")} />
          </article>
        ) : (
          <Link className="portal-bob-tile" href="/portal/calls" aria-label="Open the callback list">
            <p className="portal-bob-kicker">Master Book of Business</p>
            <strong className="portal-bob-headline">
              {callbacks.count === 0
                ? "No callbacks waiting"
                : `${callbacks.count} customer${callbacks.count === 1 ? "" : "s"} need${
                    callbacks.count === 1 ? "s" : ""
                  } a callback`}
            </strong>
            {callbacks.count === 0 ? (
              <span className="portal-bob-empty">
                Every voicemail has been answered or claimed.
              </span>
            ) : (
              <ul className="portal-bob-list">
                {callbacks.top.map((task) => (
                  <li
                    key={task.id}
                    className={`portal-bob-row${task.overdue ? " portal-bob-overdue" : ""}`}
                  >
                    {/* No caller-name field exists anywhere: the masked number
                        IS the identity the platform holds. Becomes a
                        per-customer link when the Book of Business record
                        route lands; until then, plain text. */}
                    <span className="portal-bob-name">{task.callerNumberMasked}</span>
                    <span className="portal-bob-due">due {dueLabel(task.dueAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <span className="portal-bob-open">Open the callback list &rarr;</span>
          </Link>
        )}

        <PrototypeNotice>
          This portal uses real authentication, membership, and server-side authorization. It
          does not yet contain production business data; disconnected areas remain clearly marked
          until approved systems of record are connected.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}
