import Link from "next/link";
import type { ReactNode } from "react";
import { JarvisCommandPrompt } from "../command-prompt";
import { requireFounder } from "../access";
import { PortalShell } from "../components";

export const dynamic = "force-dynamic";

type FactTone = "recorded" | "attention" | "unavailable" | "complete";

type QueueItem = {
  id: `T3-S02-${string}`;
  title: string;
  detail: string;
  owner: string;
  since: string;
  source: string;
  tone: FactTone;
  state: string;
};

/**
 * Repository-backed facts only. These values deliberately describe the
 * records that ship with this Worker; they are not presented as live reads of
 * Claude, Inkbox, GitHub, or the owner's phone.
 *
 * Keep this module server-rendered. Founder operations data must never migrate
 * into a client constant or an unauthenticated asset chunk.
 */
const ROUTINE_DEFINITION_COUNT = 10;
const LAST_RECORDED_SUITE = "55 / 55";

const WORKFORCE_ITEMS: readonly QueueItem[] = [
  {
    id: "T3-S02-W01",
    title: "Routine roster",
    detail:
      "Ten exact routine definitions are captured from the old account. This portal has no authenticated path to the current account's registry or run history.",
    owner: "Founder",
    since: "Captured 2026-08-17",
    source: "strategy/2026-08-17-routines-export.md",
    tone: "unavailable",
    state: "Last runs unavailable",
  },
  {
    id: "T3-S02-W02",
    title: "SEAT 1 · presence-probe",
    detail:
      "Crowned first with combined rank score 4. No activation record or seat report exists in the repository, so the console does not imply a run occurred.",
    owner: "Founder",
    since: "Crowned 2026-08-17",
    source: "SCOREBOARD/VERDICTS-2026-RERUNS.md",
    tone: "attention",
    state: "Not activated in record",
  },
  {
    id: "T3-S02-W03",
    title: "SEAT 2 · test-gaps",
    detail:
      "Crowned second with combined rank score 6. No activation record or seat report exists in the repository, so the console does not imply a run occurred.",
    owner: "Founder",
    since: "Crowned 2026-08-17",
    source: "SCOREBOARD/VERDICTS-2026-RERUNS.md",
    tone: "attention",
    state: "Not activated in record",
  },
  {
    id: "T3-S02-W04",
    title: "Tournament 3 · Field Console",
    detail:
      "The isolated S02 package was prepared on 2026-08-17 under the tournament hold. It records that no branch could enter main until the founder judged and said mi.",
    owner: "S02 Field Console",
    since: "Launched 2026-08-17",
    source: "Owner order + COMMAND CENTER BUILD charter",
    tone: "recorded",
    state: "Dated branch package",
  },
];

const DECISION_ITEMS: readonly QueueItem[] = [
  {
    id: "T3-S02-D01",
    title: "Old-HQ plan cancellation",
    detail:
      "Cancel by September 11 to avoid the old account's September 12 renewal. This console records the deadline; it cannot perform the cancellation.",
    owner: "Founder",
    since: "Due 2026-09-11",
    source: "OWNER-DECISIONS.md · G1",
    tone: "attention",
    state: "Upcoming deadline",
  },
  {
    id: "T3-S02-D02",
    title: "Cloudflare Access → Google",
    detail:
      "The cutover is decided and awaits founder execution using the lockout-safe runbook. The portal's own identity and membership model remain unchanged.",
    owner: "Founder",
    since: "Decided 2026-08-17",
    source: "OWNER-DECISIONS.md · A11",
    tone: "attention",
    state: "Awaiting execution",
  },
  {
    id: "T3-S02-D03",
    title: "Presence model",
    detail:
      "Choose the current Opus setting or the recorded lower-cost Haiku option. No model setting is changed from this surface.",
    owner: "Founder",
    since: "Open in ledger",
    source: "OWNER-DECISIONS.md · C4",
    tone: "recorded",
    state: "Open decision",
  },
  {
    id: "T3-S02-D04",
    title: "Mr.T line is off-spec",
    detail:
      "The recorded line answers with Inkbox Voice AI and uses a 689 number, while the approved decision specified auto-reject and a Utah local. Intent remains unresolved.",
    owner: "Founder",
    since: "Flagged 2026-08-17",
    source: "OWNER-DECISIONS.md · D4",
    tone: "attention",
    state: "Needs owner word",
  },
  {
    id: "T3-S02-D05",
    title: "CORE central system",
    detail:
      "Choose CORE, RetentionOS, or consolidation before partner integrations are treated as centered. LeadTech remains held behind the separate consent gate.",
    owner: "Founder",
    since: "Open 2026-08-17",
    source: "OWNER-DECISIONS.md · E6 / E7",
    tone: "recorded",
    state: "Open decision",
  },
  {
    id: "T3-S02-D06",
    title: "YouTube Music trial",
    detail:
      "The recorded reminder is September 13, ahead of the September 15 charge. Cancellation remains the founder's click.",
    owner: "Founder",
    since: "Due 2026-09-13",
    source: "OWNER-DECISIONS.md · D7",
    tone: "recorded",
    state: "Reminder armed in export",
  },
  {
    id: "T3-S02-D07",
    title: "Oscar's founder-approved seat",
    detail:
      "Oscar Valencia is approved as an owner, but no membership grant may happen until the founder confirms his exact Google sign-in address.",
    owner: "Founder",
    since: "Open in ledger",
    source: "OWNER-DECISIONS.md · A8",
    tone: "recorded",
    state: "Exact address needed",
  },
  {
    id: "T3-S02-D08",
    title: "Duplicate Copilot plan",
    detail:
      "Keep Pro+ and cancel the duplicate Pro plan. The ledger records the action but no due date, so this console does not invent one.",
    owner: "Founder",
    since: "Pending in ledger",
    source: "OWNER-DECISIONS.md · D6",
    tone: "attention",
    state: "Owner click pending",
  },
  {
    id: "T3-S02-D09",
    title: "Slack Pro trials",
    detail:
      "Two trial conversions still need a decision. OWNER-DECISIONS records no conversion date; check the real billing surface before acting.",
    owner: "Founder",
    since: "Open in ledger",
    source: "OWNER-DECISIONS.md · D8",
    tone: "unavailable",
    state: "Deadline unavailable",
  },
  {
    id: "T3-S02-D10",
    title: "Carrier statements + LeadTech CPL data",
    detail:
      "The pilot's entry inputs are still named on the owner's short list. This repository does not record them as delivered, so the E3 socket remains held.",
    owner: "Founder",
    since: "Needed in owner short list",
    source: "OWNER-DECISIONS.md · short list #4 / E3",
    tone: "attention",
    state: "Inputs required",
  },
  {
    id: "T3-S02-D11",
    title: "Counsel answer → socket greenlight",
    detail:
      "Counsel must clear the consent line before the LeadTech ingest socket receives its build greenlight. No counsel answer is recorded in this checkout.",
    owner: "Founder",
    since: "Awaiting counsel in owner short list",
    source: "OWNER-DECISIONS.md · short list #3 / E7",
    tone: "unavailable",
    state: "Counsel answer pending",
  },
];

const SIGNAL_ITEMS: readonly QueueItem[] = [
  {
    id: "T3-S02-S01",
    title: "Ryan / Andrew partner thread",
    detail:
      "The A/B/C centralization call remains open. The repository records the dependency, but not a verified latest message or proof that either partner is presently waiting.",
    owner: "Founder",
    since: "Recorded 2026-08-17",
    source: "OWNER-DECISIONS.md · E6",
    tone: "unavailable",
    state: "Waiting status unverified",
  },
  {
    id: "T3-S02-S02",
    title: "WARDEN reply drafts",
    detail:
      "WARDEN is recorded as draft-only. No draft ledger is present in this checkout, so names, counts, and age are unavailable here.",
    owner: "Founder",
    since: "Mandate recorded 2026-08-17",
    source: "OWNER-DECISIONS.md · B19",
    tone: "unavailable",
    state: "Current queue unavailable",
  },
  {
    id: "T3-S02-S03",
    title: "Mr.T desk backlog",
    detail:
      "The desk identity is recorded, but this portal has no Inkbox connector. It cannot claim the inbox is clear or name a waiting sender.",
    owner: "Founder",
    since: "Desk recorded 2026-08-17",
    source: "OWNER-DECISIONS.md · B19",
    tone: "unavailable",
    state: "Live check unavailable",
  },
  {
    id: "T3-S02-S04",
    title: "HERALD outreach log",
    detail:
      "The routine mandate is recorded, but HERALD_LOG.md is absent from this branch. Latest outreach deltas cannot be reconstructed safely.",
    owner: "Founder",
    since: "Routine captured 2026-08-17",
    source: "strategy/2026-08-17-routines-export.md",
    tone: "unavailable",
    state: "Latest entries unavailable",
  },
];

const TIMELINE = [
  {
    id: "T3-S02-T01",
    when: "2026-08-17",
    title: "T1 + T2 verdicts complete",
    detail: "presence-probe and test-gaps crowned for the Commission.",
    owner: "Commissioner",
    source: "SCOREBOARD/VERDICTS-2026-RERUNS.md",
    tone: "complete" as const,
  },
  {
    id: "T3-S02-T02",
    when: "2026-08-17",
    title: "Founder-gate deploy recorded",
    detail: "The repository says the deploy succeeded, but its version ID was not captured.",
    owner: "Founder",
    source: "DEPLOYMENT.md · addendum",
    tone: "recorded" as const,
  },
  {
    id: "T3-S02-T03",
    when: "2026-08-17",
    title: "Tournament 3 package snapshot",
    detail: "Two isolated squads built under a no-merge, no-deploy judgment hold.",
    owner: "S02 Field Console",
    source: "COMMAND CENTER BUILD charter + owner order",
    tone: "recorded" as const,
  },
  {
    id: "T3-S02-T04",
    when: "SEP 11",
    title: "Old-HQ cancellation deadline",
    detail: "Founder action required before the September 12 renewal.",
    owner: "Founder",
    source: "OWNER-DECISIONS.md · G1",
    tone: "attention" as const,
  },
  {
    id: "T3-S02-T05",
    when: "SEP 13",
    title: "YouTube Music reminder",
    detail: "Recorded reminder ahead of the September 15 charge.",
    owner: "Founder",
    source: "OWNER-DECISIONS.md · D7",
    tone: "recorded" as const,
  },
] as const;

const HANDOFFS = [
  {
    id: "T3-S02-H01",
    anchor: "handoff-hq",
    route: "/go/hq",
    code: "HQ",
    label: "Talk to HQ",
    detail:
      "Opens the real new-HQ Claude session recorded repeatedly in repository history. It never embeds, proxies, or simulates that conversation.",
    state: "Verified destination",
    owner: "Founder",
    source: "Repository history · fd038241",
    configured: true,
  },
  {
    id: "T3-S02-H02",
    anchor: "handoff-routines",
    route: "/go/routines",
    code: "RT",
    label: "Routines",
    detail:
      "A canonical account-specific Scheduled/Routines URL is not stored in the repository. Open Scheduled from the real account UI; this console will not invent a path.",
    state: "Configured unavailable",
    owner: "Founder",
    source: "Repository URL inventory · 2026-08-17",
    configured: false,
  },
  {
    id: "T3-S02-H03",
    anchor: "handoff-desk",
    route: "/go/desk",
    code: "MT",
    label: "Mr.T desk",
    detail:
      "Opens a Gmail compose handoff addressed to the recorded Mr.T desk. It does not claim to open the inbox, send a message, or expose a mailbox connector.",
    state: "Verified Gmail compose",
    owner: "Founder",
    source: "Commissioner charter · Founder Channel",
    configured: true,
  },
] as const;

function FactChip({ tone, children }: { tone: FactTone; children: ReactNode }) {
  return <span className={`fcc-chip fcc-chip-${tone}`}>{children}</span>;
}

function SourceStamp({ children }: { children: ReactNode }) {
  return (
    <span className="fcc-source">
      <span aria-hidden="true">◇</span>
      {children}
    </span>
  );
}

function QueueRow({ item }: { item: QueueItem }) {
  return (
    <article className="fcc-queue-row" id={item.id.toLowerCase()}>
      <div className="fcc-queue-id" aria-label={`Item ${item.id}`}>
        {item.id}
      </div>
      <div className="fcc-queue-copy">
        <div className="fcc-queue-title">
          <h3>{item.title}</h3>
          <FactChip tone={item.tone}>{item.state}</FactChip>
        </div>
        <p>{item.detail}</p>
        <div className="fcc-queue-meta">
          <span><b>Owner</b> {item.owner}</span>
          <span><b>Since</b> {item.since}</span>
          <SourceStamp>{item.source}</SourceStamp>
        </div>
      </div>
    </article>
  );
}

export default async function FounderCommandCenter() {
  const session = await requireFounder("/portal/command", "command.view");
  const unavailableSignals = SIGNAL_ITEMS.filter(
    (item) => item.tone === "unavailable",
  ).length;
  const activationRecords = WORKFORCE_ITEMS.filter(
    (item) => item.id === "T3-S02-W02" || item.id === "T3-S02-W03",
  ).filter((item) => !item.state.startsWith("Not activated")).length;

  return (
    <PortalShell session={session} current="/portal/command" section="Field Console">
      <main className="portal-main fcc" id="field-console-top">
        <section className="fcc-hero" aria-labelledby="fcc-title">
          <div className="fcc-hero-topline">
            <span>Founder Command Center / S02</span>
            <span className="fcc-live-mark"><i aria-hidden="true" /> Repository snapshot</span>
          </div>
          <div className="fcc-hero-copy">
            <p className="fcc-kicker">Scan first · decide once · move deliberately</p>
            <h1 id="fcc-title">Your field console.</h1>
            <p>
              One protected phone surface for workforce state, owner decisions,
              waiting signals, and accountable handoffs. Live sources that this
              Worker cannot read stay visibly unavailable.
            </p>
          </div>
          <div className="fcc-prompt" aria-label="J.A.R.V.I.S. command prompt">
            <div className="fcc-prompt-head">
              <span><i aria-hidden="true">J</i> Command prompt</span>
              <FactChip tone="recorded">Existing protected console</FactChip>
            </div>
            <JarvisCommandPrompt />
          </div>
          <div className="fcc-hero-foot">
            <SourceStamp>Repository records captured 2026-08-17</SourceStamp>
            <span>Signed in as {session.displayName}</span>
          </div>
        </section>

        <section className="fcc-panel fcc-launcher" aria-labelledby="launcher-title">
          <header className="fcc-panel-head">
            <div>
              <p>01 / Launcher</p>
              <h2 id="launcher-title">One-thumb handoffs</h2>
            </div>
            <FactChip tone="attention">No simulated HQ</FactChip>
          </header>
          <div className="fcc-launch-grid">
            {HANDOFFS.map((handoff) => (
              <a
                className={`fcc-launch${handoff.configured ? "" : " fcc-launch-unavailable"}`}
                href={handoff.route}
                key={handoff.id}
              >
                <span>{handoff.code}</span>
                <strong>{handoff.label}</strong>
                <small>{handoff.id} · {handoff.state}</small>
                <i aria-hidden="true">{handoff.configured ? "↗" : "↓"}</i>
              </a>
            ))}
            <a
              className="fcc-launch"
              href="https://github.com/bankerrunners/core-platform-site"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>GH</span>
              <strong>Repository</strong>
              <small>Real external surface</small>
              <i aria-hidden="true">↗</i>
            </a>
            <Link className="fcc-launch" href="/portal">
              <span>PT</span>
              <strong>Portal</strong>
              <small>Member command surface</small>
              <i aria-hidden="true">→</i>
            </Link>
            <Link className="fcc-launch" href="/portal/audit">
              <span>AU</span>
              <strong>Audit</strong>
              <small>Founder-only live portal record</small>
              <i aria-hidden="true">→</i>
            </Link>
          </div>

          <div className="fcc-handoffs" aria-label="External handoff configuration state">
            {HANDOFFS.map((handoff) => (
              <article id={handoff.anchor} key={handoff.id}>
                <div>
                  <span>{handoff.code}</span>
                  <strong>{handoff.label}</strong>
                </div>
                <p>{handoff.detail}</p>
                <div>
                  <FactChip tone={handoff.configured ? "complete" : "unavailable"}>
                    {handoff.state}
                  </FactChip>
                  <span className="fcc-handoff-owner"><b>Owner</b> {handoff.owner}</span>
                  <SourceStamp>{handoff.source}</SourceStamp>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="fcc-status-rail" aria-label="Fast operations status">
          <article className="fcc-status-card fcc-status-card-primary">
            <span>Fleet state</span>
            <strong>T3</strong>
            <small>Package snapshot · recorded 2026-08-17</small>
          </article>
          <article className="fcc-status-card">
            <span>Shipped foundation</span>
            <strong className="fcc-status-hash">5c9ed9eb</strong>
            <small>Owner-supplied version · no independent live comparison</small>
          </article>
          <article className="fcc-status-card">
            <span>Routine definitions</span>
            <strong>{ROUTINE_DEFINITION_COUNT}</strong>
            <small>Recorded export · not a live registry</small>
          </article>
          <article className="fcc-status-card">
            <span>Commission activation records</span>
            <strong>{activationRecords} / 2</strong>
            <small>Both seats crowned; no run reports</small>
          </article>
          <article className="fcc-status-card">
            <span>Last suite on main</span>
            <strong>{LAST_RECORDED_SUITE}</strong>
            <small>Migration card · 2026-08-17</small>
          </article>
          <article className="fcc-status-card fcc-status-card-muted">
            <span>Current account last runs</span>
            <strong>—</strong>
            <small>Unavailable to this portal</small>
          </article>
        </section>

        <section className="fcc-layout fcc-layout-primary">
          <article className="fcc-panel" aria-labelledby="workforce-title">
            <header className="fcc-panel-head">
              <div>
                <p>01 / Workforce</p>
                <h2 id="workforce-title">Operations roster</h2>
              </div>
              <FactChip tone="recorded">Recorded state</FactChip>
            </header>
            <div className="fcc-queue">
              {WORKFORCE_ITEMS.map((item) => <QueueRow item={item} key={item.id} />)}
            </div>
          </article>

          <article className="fcc-panel" aria-labelledby="decisions-title">
            <header className="fcc-panel-head">
              <div>
                <p>02 / Founder queue</p>
                <h2 id="decisions-title">Decisions & deadlines</h2>
              </div>
              <span className="fcc-count" aria-label={`${DECISION_ITEMS.length} recorded items`}>
                {DECISION_ITEMS.length}
              </span>
            </header>
            <div className="fcc-queue fcc-queue-compact">
              {DECISION_ITEMS.map((item) => <QueueRow item={item} key={item.id} />)}
            </div>
          </article>
        </section>

        <section className="fcc-layout">
          <article className="fcc-panel" aria-labelledby="signals-title">
            <header className="fcc-panel-head">
              <div>
                <p>03 / Signals</p>
                <h2 id="signals-title">Who is waiting</h2>
              </div>
              <FactChip tone="unavailable">{unavailableSignals} live checks unavailable</FactChip>
            </header>
            <p className="fcc-panel-note">
              The record can name dependencies; it cannot prove a person is
              presently waiting without the live message sources. Every gap is
              named instead of rendered as an empty inbox.
            </p>
            <div className="fcc-queue fcc-queue-compact">
              {SIGNAL_ITEMS.map((item) => <QueueRow item={item} key={item.id} />)}
            </div>
          </article>

          <article className="fcc-panel" aria-labelledby="timeline-title">
            <header className="fcc-panel-head">
              <div>
                <p>04 / Sequence</p>
                <h2 id="timeline-title">Operations timeline</h2>
              </div>
              <FactChip tone="recorded">Repo clock</FactChip>
            </header>
            <ol className="fcc-timeline">
              {TIMELINE.map((event) => (
                <li key={event.id}>
                  <div className="fcc-timeline-mark" aria-hidden="true"><span /></div>
                  <div className="fcc-timeline-when">{event.when}</div>
                  <div className="fcc-timeline-copy">
                    <div>
                      <strong>{event.title}</strong>
                      <FactChip tone={event.tone}>{event.id}</FactChip>
                    </div>
                    <p>{event.detail}</p>
                    <div className="fcc-timeline-meta">
                      <span><b>Owner</b> {event.owner}</span>
                      <SourceStamp>{event.source}</SourceStamp>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </section>


        <section className="fcc-flagged" aria-labelledby="flagged-title">
          <div>
            <p>FLAGGED-ACROSS / VERITY queue</p>
            <h2 id="flagged-title">Two cross-lane truths stay visible.</h2>
          </div>
          <article>
            <span>T3-S02-X01</span>
            <strong>Canonical Routines URL absent</strong>
            <small>Owner: Founder · VERITY state in this package: pending</small>
          </article>
          <article>
            <span>T3-S02-X02</span>
            <strong>Current-account run history unavailable</strong>
            <small>Owner: Founder · VERITY state in this package: pending</small>
          </article>
        </section>

        <p className="fcc-boundary" role="note">
          <strong>Boundary:</strong> repository and portal records only. No new
          connector, capability, data source, embedded chat, Presence tool, or
          write path was added. The launcher never sends, merges, deploys,
          changes membership, or spends.
        </p>

        <nav className="fcc-thumb-dock" aria-label="Founder quick launcher">
          <a href="/go/hq"><span>HQ</span><small>Talk</small></a>
          <a href="/go/routines"><span>RT</span><small>Runs</small></a>
          <a href="/go/desk"><span>MT</span><small>Desk</small></a>
          <a
            href="https://github.com/bankerrunners/core-platform-site"
            target="_blank"
            rel="noopener noreferrer"
          ><span>GH</span><small>Repo</small></a>
          <Link href="#field-console-top"><span>↑</span><small>Top</small></Link>
        </nav>
      </main>
    </PortalShell>
  );
}
