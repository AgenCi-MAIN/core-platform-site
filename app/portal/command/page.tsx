import Link from "next/link";
import { JarvisCommandPrompt } from "../command-prompt";
import { requireFounder } from "../access";
import { PortalShell } from "../components";

export const dynamic = "force-dynamic";

type OwnerItem = {
  id: string;
  record: string;
  title: string;
  action: string;
  owner: "Founder";
  state: "open" | "pending" | "watch";
  due?: string;
  dueLabel?: string;
};

/**
 * Server-rendered, founder-only record extracts. These are intentionally kept
 * out of a client module: founder operating context must never compile into a
 * publicly served JavaScript asset. Each row names its authoritative record
 * so stale data is visible as stale data instead of masquerading as a feed.
 */
const OWNER_ITEMS: readonly OwnerItem[] = [
  {
    id: "S01-D01",
    record: "G1",
    title: "Retire the old HQ plan",
    action: "Cancel the old account by Sep 11, before its Sep 12 renewal.",
    owner: "Founder",
    state: "pending",
    due: "2026-09-11",
    dueLabel: "Sep 11",
  },
  {
    id: "S01-D02",
    record: "D7",
    title: "Cancel YouTube Music",
    action: "Use the armed Sep 13 reminder; the recorded charge date is Sep 15.",
    owner: "Founder",
    state: "pending",
    due: "2026-09-13",
    dueLabel: "Sep 13",
  },
  {
    id: "S01-D03",
    record: "D4",
    title: "Resolve the live Inkbox mismatch",
    action: "Decide whether the Orlando-area number and unbriefed Voice AI are deliberate or must return to the receiving-first order.",
    owner: "Founder",
    state: "watch",
  },
  {
    id: "S01-D04",
    record: "A11",
    title: "Restore reliable phone entry",
    action: "Execute the documented Cloudflare Access move from one-time codes to Google identity.",
    owner: "Founder",
    state: "open",
  },
  {
    id: "S01-D05",
    record: "E7",
    title: "Clear or keep holding LeadTech",
    action: "Record counsel's consent-line answer before giving the ingest socket a build or go-live word.",
    owner: "Founder",
    state: "open",
  },
  {
    id: "S01-D06",
    record: "E3 · short list item 4",
    title: "Carrier statements + LeadTech CPL data",
    action: "Provide the pilot's recorded entry ticket before any build or go-live word.",
    owner: "Founder",
    state: "open",
  },
  {
    id: "S01-D07",
    record: "A8",
    title: "Confirm Oscar's portal identity",
    action: "Obtain the exact Google sign-in address before any member row is granted.",
    owner: "Founder",
    state: "open",
  },
  {
    id: "S01-D08",
    record: "C4",
    title: "Choose the Presence model",
    action: "Keep Opus 5 or choose the recorded Haiku 4.5 budget option.",
    owner: "Founder",
    state: "open",
  },
  {
    id: "S01-D09",
    record: "D6 · D8",
    title: "Close duplicate software decisions",
    action: "Cancel duplicate Copilot Pro and decide the two Slack Pro trials before conversion.",
    owner: "Founder",
    state: "open",
  },
  {
    id: "S01-D10",
    record: "E6",
    title: "Name the operating center",
    action: "Choose CORE, RetentionOS, or consolidation after partner input is in hand.",
    owner: "Founder",
    state: "open",
  },
] as const;

const LAUNCHERS = [
  {
    id: "S01-L01",
    href: "/go/hq",
    eyebrow: "Real service",
    label: "Talk to HQ",
    detail: "Open the exact new-HQ session recorded by repository commit fd038241.",
    mark: "HQ",
    external: true,
  },
  {
    id: "S01-L02",
    href: "/go/routines",
    eyebrow: "Account surface",
    label: "Routines",
    detail: "Open Claude, then choose Scheduled. No account-specific URL is asserted.",
    mark: "24/6",
    external: true,
  },
  {
    id: "S01-L03",
    href: "/go/desk",
    eyebrow: "Compose handoff",
    label: "Mr.T desk",
    detail: "Prepare mail to out-reach@inkboxmail.com. Nothing sends automatically.",
    mark: "M.T",
    external: true,
  },
  {
    id: "S01-L04",
    href: "https://github.com/bankerrunners/core-platform-site",
    eyebrow: "Canonical record",
    label: "Repository",
    detail: "Open bankerrunners/core-platform-site in GitHub.",
    mark: "GIT",
    external: true,
  },
] as const;

const PORTAL_LAUNCHERS = [
  { id: "S01-P01", href: "/portal/audit", label: "Audit log", detail: "Live portal authorization evidence", external: false },
  { id: "S01-P02", href: "/portal/investigator", label: "Investigator", detail: "Read-only oversight boundary", external: false },
  { id: "S01-P03", href: "/portal/members", label: "Members", detail: "Authenticated roster", external: false },
  { id: "S01-P04", href: "https://dash.cloudflare.com/e6f9d0a344a0a7b317601ffbe23f871e", label: "Cloudflare", detail: "Worker and D1 account", external: true },
] as const;

const WORKFORCE = [
  {
    id: "S01-W01",
    label: "Routine roster",
    value: "10 recorded",
    tone: "recorded",
    status: "recorded",
    detail: "Definitions captured 2026-08-17 from the old account. Activation and last-run results are unavailable to this Worker.",
  },
  {
    id: "S01-W02",
    label: "Commission SEAT 1",
    value: "presence-probe",
    tone: "unavailable",
    status: "not created",
    detail: "Crowned at combined rank score 4. SCOREBOARD says no routine exists and nothing is running.",
  },
  {
    id: "S01-W03",
    label: "Commission SEAT 2",
    value: "test-gaps",
    tone: "unavailable",
    status: "not activated",
    detail: "Crowned at combined rank score 6. No activated report or prior run is recorded.",
  },
  {
    id: "S01-W04",
    label: "Permanent workforce",
    value: "8 seats · 35 slots",
    tone: "recorded",
    status: "recorded",
    detail: "A seat or sub-slot is capacity, not a running process. Current execution state is not available in the portal.",
  },
  {
    id: "S01-W05",
    label: "Tournament package snapshot",
    value: "Recorded · 2026-08-17",
    tone: "recorded",
    status: "recorded",
    detail: "S01 tournament package snapshot from 2026-08-17. This record does not claim a current build, merge, or deployment state.",
  },
  {
    id: "S01-W06",
    label: "Shipped foundation",
    value: "5c9ed9eb",
    tone: "recorded",
    status: "recorded",
    detail: "Owner-designated deployed foundation for this build. Live-version comparison is not queryable from the repository.",
  },
] as const;

const SIGNALS = [
  {
    id: "S01-S01",
    who: "Ryan + Andrew",
    since: "Partner record · 2026-08-15",
    need: "Centralization, consent, and source-data decisions remain open.",
    boundary: "The repository does not establish that either person is currently awaiting a reply or when a last inbound arrived.",
  },
  {
    id: "S01-S02",
    who: "Mr.T desk",
    since: "Desk recorded active · 2026-08-17",
    need: "Backlog state needs a live Inkbox read.",
    boundary: "No Inkbox data path is attached to this portal route, so unread and waiting counts are unavailable.",
  },
  {
    id: "S01-S03",
    who: "HERALD + WARDEN",
    since: "Standing orders · 2026-08-15",
    need: "Unactioned outreach and reply-draft state would come from their run records.",
    boundary: "HERALD_LOG.md and WARDEN draft output are absent from this checkout; no wait state is inferred.",
  },
  {
    id: "S01-S04",
    who: "Oscar Valencia",
    since: "Identity decision open · 2026-08-15",
    need: "Exact Google sign-in address before portal access can be granted.",
    boundary: "The record names the missing input, not a verified message or reply deadline.",
  },
] as const;

function urgency(item: OwnerItem): { label: string; className: string } {
  if (item.due) {
    // OWNER-DECISIONS records dates, not cutoff times or time zones. Keep the
    // priority styling without manufacturing a countdown from an invented
    // midnight boundary.
    return { label: "Recorded deadline", className: "founder-command-flag-deadline" };
  }

  return item.state === "watch"
    ? { label: "Resolve now", className: "founder-command-flag-watch" }
    : { label: item.state, className: "founder-command-flag-open" };
}

export default async function FounderCommandPage() {
  const session = await requireFounder("/portal/command");
  const datedItems = OWNER_ITEMS.filter((item) => item.due);

  return (
    <PortalShell session={session} current="/portal/command" section="Founder Command">
      <main className="portal-main founder-command">
        <section className="founder-command-hero" aria-labelledby="founder-command-title">
          <div className="founder-command-hero-head">
            <div>
              <p className="portal-eyebrow">Founder only · Action deck</p>
              <h1 id="founder-command-title">Command what matters <em>next.</em></h1>
              <p className="founder-command-lede">
                One thumb-reachable surface for the real controls, the owner queue,
                and the boundaries the portal cannot read.
              </p>
            </div>
            <div className="founder-command-proof" aria-label="Command Center boundaries">
              <span className="portal-state portal-state-live">Founder gate active</span>
              <span className="portal-state portal-state-pending">Records, not live feeds</span>
            </div>
          </div>

          <div className="founder-command-console">
            <div className="founder-command-console-copy">
              <span className="founder-command-index">S01-C01</span>
              <p>Protected Presence prompt</p>
              <h2>Your command prompt stays front and center.</h2>
              <p>
                This is the shipped text-only Presence handoff. It prepares a
                question; it does not execute work or simulate HQ.
              </p>
            </div>
            <JarvisCommandPrompt />
            <a className="founder-command-hq" href="/go/hq" target="_blank" rel="noopener noreferrer">
              <span aria-hidden="true">↗</span>
              <span>
                <small>Leave the portal</small>
                <strong>Talk to the real HQ</strong>
              </span>
            </a>
          </div>
        </section>

        <nav className="founder-command-launchers" aria-label="Founder launchers">
          {LAUNCHERS.map((launcher) => (
            <a
              className="founder-command-launcher"
              href={launcher.href}
              key={launcher.id}
              target={launcher.external ? "_blank" : undefined}
              rel={launcher.external ? "noopener noreferrer" : undefined}
            >
              <span className="founder-command-launcher-mark" aria-hidden="true">{launcher.mark}</span>
              <span className="founder-command-launcher-copy">
                <small>{launcher.eyebrow} · {launcher.id}</small>
                <strong>{launcher.label}</strong>
                <span>{launcher.detail}</span>
              </span>
              <span className="founder-command-launcher-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>

        <section className="founder-command-priority" aria-labelledby="owner-queue-title">
          <header className="founder-command-section-head">
            <div>
              <p className="portal-section-kicker">Owner queue · OWNER-DECISIONS</p>
              <h2 id="owner-queue-title">Decisions and dated commitments</h2>
            </div>
            <span>{OWNER_ITEMS.length} recorded actions</span>
          </header>

          <div className="founder-command-deadlines" aria-label="Recorded deadlines">
            {datedItems.map((item) => {
              const flag = urgency(item);
              return (
                <article key={item.id}>
                  <span className="founder-command-index">{item.id}</span>
                  <span className={`founder-command-flag ${flag.className}`}>{flag.label}</span>
                  <time dateTime={item.due}>{item.dueLabel}</time>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.action}</p>
                    <small>Owner: {item.owner} · Record {item.record} · exact cutoff time and time zone not recorded</small>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="founder-command-queue">
            {OWNER_ITEMS.filter((item) => !item.due).map((item) => {
              const flag = urgency(item);
              return (
                <article key={item.id}>
                  <span className="founder-command-index">{item.id}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.action}</p>
                    <small>Owner: {item.owner} · OWNER-DECISIONS {item.record}</small>
                  </div>
                  <span className={`founder-command-flag ${flag.className}`}>{flag.label}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="founder-command-workforce" aria-labelledby="workforce-title">
          <header className="founder-command-section-head">
            <div>
              <p className="portal-section-kicker">Workforce state</p>
              <h2 id="workforce-title">Recorded truth, with the gaps left visible</h2>
            </div>
            <span>Last-run feed unavailable</span>
          </header>

          <div className="founder-command-workforce-grid">
            {WORKFORCE.map((item) => (
              <article key={item.id}>
                <span className={`founder-command-status founder-command-status-${item.tone}`}>
                  {item.status}
                </span>
                <small>{item.id} · {item.label}</small>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="founder-command-signals" aria-labelledby="signals-title">
          <header className="founder-command-section-head">
            <div>
              <p className="portal-section-kicker">Signals view</p>
              <h2 id="signals-title">Who may be waiting—and what is actually known</h2>
            </div>
            <span>0 verified reply waits</span>
          </header>

          <p className="founder-command-boundary" role="note">
            Zero verified is not zero actual. This Worker has no live HERALD,
            WARDEN, Inkbox, routine, or partner-thread feed; it cannot determine
            who is presently waiting on the founder.
          </p>

          <div className="founder-command-signal-list">
            {SIGNALS.map((signal) => (
              <article key={signal.id}>
                <span className="founder-command-index">{signal.id}</span>
                <div>
                  <strong>{signal.who}</strong>
                  <small>{signal.since}</small>
                </div>
                <p>{signal.need}</p>
                <p className="founder-command-unavailable">{signal.boundary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="founder-command-surfaces" aria-labelledby="surfaces-title">
          <header className="founder-command-section-head">
            <div>
              <p className="portal-section-kicker">Portal and infrastructure</p>
              <h2 id="surfaces-title">Open the source, not a replica</h2>
            </div>
          </header>
          <div>
            {PORTAL_LAUNCHERS.map((launcher) =>
              launcher.external ? (
                <a href={launcher.href} target="_blank" rel="noopener noreferrer" key={launcher.id}>
                  <span>{launcher.id}</span>
                  <strong>{launcher.label}</strong>
                  <small>{launcher.detail}</small>
                  <b aria-hidden="true">↗</b>
                </a>
              ) : (
                <Link href={launcher.href} key={launcher.id}>
                  <span>{launcher.id}</span>
                  <strong>{launcher.label}</strong>
                  <small>{launcher.detail}</small>
                  <b aria-hidden="true">→</b>
                </Link>
              ),
            )}
          </div>
        </section>

        <p className="founder-command-footnote">
          Source frame: OWNER-DECISIONS.md, SCOREBOARD/SCOREBOARD.md,
          SCOREBOARD/VERDICTS-2026-RERUNS.md, WORKFORCE.md, and the captured
          routine export, all dated 2026-08-17. Repository content is recorded
          context—not a substitute for live provider state.
        </p>
      </main>
    </PortalShell>
  );
}
