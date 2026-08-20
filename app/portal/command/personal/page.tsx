import Link from "next/link";
import type { ReactNode } from "react";
import { JarvisCommandPrompt } from "../../command-prompt";
import { requireFounder } from "../../access";
import { PortalShell } from "../../components";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StatusTone = "verified" | "available" | "controlled" | "unavailable";

type CommandAction = {
  code: string;
  label: string;
  detail: string;
  href: string;
  state: string;
  tone: StatusTone;
};

type OperatingLane = {
  code: string;
  label: string;
  detail: string;
  href: string;
  state: string;
  tone: StatusTone;
  routes: readonly string[];
};

type FleetSeat = {
  id: string;
  name: string;
  role: string;
  lane: string;
  tone: "violet" | "coral" | "mint" | "gold" | "blue";
};

const COMMAND_ACTIONS: readonly CommandAction[] = [
  {
    code: "FC",
    label: "Field Console",
    detail: "Decisions, deadlines, handoffs, and named source gaps.",
    href: "/portal/command",
    state: "Repository-backed",
    tone: "verified",
  },
  {
    code: "AI",
    label: "Cloud AI Command",
    detail: "Inspect the recorded orchestration and communications surface.",
    href: "/portal/command/cloud",
    state: "Protected snapshot",
    tone: "controlled",
  },
  {
    code: "OD",
    label: "Operations Deck",
    detail: "Open the ten-role visual registry and builder workspace.",
    href: "/portal/gallery",
    state: "10 defined profiles",
    tone: "available",
  },
  {
    code: "CL",
    label: "Call Lab",
    detail: "Review authorized calls, evidence, and coaching records.",
    href: "/portal/calls",
    state: "Capability gated",
    tone: "controlled",
  },
  {
    code: "DL",
    label: "Collab Dialer",
    detail: "Enter the separate founder-only originate surface.",
    href: "/portal/dialer",
    state: "Founder gated",
    tone: "controlled",
  },
  {
    code: "CM",
    label: "Commission Center",
    detail: "Open carrier grids, contract levels, and planning math.",
    href: "/portal/commission",
    state: "Planning surface",
    tone: "available",
  },
  {
    code: "LD",
    label: "Leadership",
    detail: "See team operating guidance and approved leadership views.",
    href: "/portal/leadership",
    state: "Role gated",
    tone: "controlled",
  },
  {
    code: "AU",
    label: "Audit",
    detail: "Inspect the founder-only append-only access record.",
    href: "/portal/audit",
    state: "Founder gated",
    tone: "verified",
  },
];

const OPERATING_LANES: readonly OperatingLane[] = [
  {
    code: "01",
    label: "Command",
    detail:
      "Turn the operating record into a short decision queue without pretending that an unavailable source is live.",
    href: "/portal/command",
    state: "Protected",
    tone: "verified",
    routes: ["Field Console", "Cloud AI", "J.A.R.V.I.S."],
  },
  {
    code: "02",
    label: "Communications",
    detail:
      "Move between inbound, review, and dialing surfaces while every read and billable action keeps its own server gate.",
    href: "/portal/inbound",
    state: "Controlled",
    tone: "controlled",
    routes: ["Inbound", "Call Lab", "Dialer"],
  },
  {
    code: "03",
    label: "Production",
    detail:
      "Keep book, performance, and commission planning together without presenting modeled income as a guarantee.",
    href: "/portal/commission",
    state: "Available",
    tone: "available",
    routes: ["Book", "Commissions", "My Stats"],
  },
  {
    code: "04",
    label: "Governance",
    detail:
      "Keep membership, leadership, and audit evidence visible while human authority remains the final control.",
    href: "/portal/audit",
    state: "Founder review",
    tone: "verified",
    routes: ["Members", "Leadership", "Audit"],
  },
];

const FLEET_SEATS: readonly FleetSeat[] = [
  { id: "01", name: "Vestal", role: "Mission Keeper", lane: "Mission continuity", tone: "violet" },
  { id: "02", name: "Recon", role: "Originality Scout", lane: "Research signal", tone: "coral" },
  { id: "03", name: "Terraform", role: "World Builder", lane: "Product systems", tone: "mint" },
  { id: "04", name: "Meridian", role: "Art Director", lane: "Visual direction", tone: "gold" },
  { id: "05", name: "Lattice", role: "Trait Architect", lane: "Decision structure", tone: "blue" },
  { id: "06", name: "Cipher", role: "Prompt Engineer", lane: "Instruction design", tone: "violet" },
  { id: "07", name: "Lumen", role: "Image Maker", lane: "Visual concepts", tone: "gold" },
  { id: "08", name: "Index", role: "Collection Curator", lane: "Knowledge order", tone: "blue" },
  { id: "09", name: "Assay", role: "Quality Guardian", lane: "Evidence quality", tone: "coral" },
  { id: "10", name: "Ledger", role: "Release Archivist", lane: "Release record", tone: "mint" },
];

function StatusPill({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return <span className={`pcc-status pcc-status-${tone}`}>{children}</span>;
}

function SectionHeading({
  index,
  title,
  description,
  action,
}: {
  index: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="pcc-section-head">
      <div className="pcc-section-index" aria-hidden="true">{index}</div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className="pcc-section-action">{action}</div> : null}
    </header>
  );
}

export default async function PersonalCommandPage() {
  const session = await requireFounder(
    "/portal/command/personal",
    "command.personal.view",
  );

  return (
    <PortalShell
      session={session}
      current="/portal/command/personal"
      section="Personal Command"
    >
      <main
        className="portal-main pcc"
        data-private-surface="command-personal-v1"
        id="personal-command-top"
      >
        <section className="pcc-hero" aria-labelledby="personal-command-title">
          <div className="pcc-hero-topline">
            <span>CORE / Personal Operations</span>
            <span className="pcc-seat-lock"><i aria-hidden="true" /> Founder seat verified</span>
          </div>

          <div className="pcc-hero-grid">
            <div className="pcc-hero-copy">
              <p className="pcc-kicker">One seat. The whole operating field.</p>
              <h1 id="personal-command-title">
                Your command,<br /><em>distilled.</em>
              </h1>
              <p className="pcc-hero-lede">
                A private founder view across command, communications,
                production, and governance. It connects the useful surfaces
                without flattening their security boundaries or inventing live
                data that this Worker cannot read.
              </p>
              <div className="pcc-hero-actions">
                <Link className="pcc-primary-action" href="/portal/command">
                  Open field console <span aria-hidden="true">-&gt;</span>
                </Link>
                <Link className="pcc-secondary-action" href="#command-launches">
                  See every launch
                </Link>
              </div>
            </div>

            <div className="pcc-radar-card" aria-label="Four-lane command map">
              <div className="pcc-radar-head">
                <span>CONTROL MAP</span>
                <small>Read-only overview</small>
              </div>
              <div className="pcc-radar" aria-hidden="true">
                <span className="pcc-radar-ring pcc-radar-ring-one" />
                <span className="pcc-radar-ring pcc-radar-ring-two" />
                <span className="pcc-radar-axis pcc-radar-axis-x" />
                <span className="pcc-radar-axis pcc-radar-axis-y" />
                <span className="pcc-radar-node pcc-radar-node-one">01</span>
                <span className="pcc-radar-node pcc-radar-node-two">02</span>
                <span className="pcc-radar-node pcc-radar-node-three">03</span>
                <span className="pcc-radar-node pcc-radar-node-four">04</span>
                <div className="pcc-radar-core">
                  <strong>CORE</strong>
                  <small>{session.displayName}</small>
                </div>
              </div>
              <div className="pcc-radar-legend">
                {OPERATING_LANES.map((lane) => (
                  <span key={lane.code}><b>{lane.code}</b>{lane.label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="pcc-command-box" aria-label="Protected J.A.R.V.I.S. text handoff">
            <div className="pcc-command-box-head">
              <span><i aria-hidden="true">J</i> Ask the workspace</span>
              <StatusPill tone="controlled">Draft first</StatusPill>
            </div>
            <JarvisCommandPrompt />
          </div>

          <div className="pcc-hero-foot">
            <span>Signed in as {session.displayName}</span>
            <span>Identity gate + active membership + server authorization</span>
          </div>
        </section>

        <section className="pcc-truthbar" aria-label="Personal Command truth model">
          <span><i className="pcc-dot pcc-dot-verified" aria-hidden="true" /> Founder-only route</span>
          <span><i className="pcc-dot pcc-dot-available" aria-hidden="true" /> Repository-backed structure</span>
          <span><i className="pcc-dot pcc-dot-controlled" aria-hidden="true" /> Destination guards remain active</span>
          <span><i className="pcc-dot pcc-dot-unavailable" aria-hidden="true" /> No personal inbox connector claimed</span>
        </section>

        <section className="pcc-metrics" aria-label="Personal command structure">
          <article className="pcc-metric pcc-metric-primary">
            <span>Founder command seats</span>
            <strong>01</strong>
            <small>This route answers one verified identity.</small>
          </article>
          <article className="pcc-metric">
            <span>Defined fleet profiles</span>
            <strong>10</strong>
            <small>Roles recorded; continuous runtime is not implied.</small>
          </article>
          <article className="pcc-metric">
            <span>Operating lanes</span>
            <strong>04</strong>
            <small>Command, communications, production, governance.</small>
          </article>
          <article className="pcc-metric pcc-metric-zero">
            <span>Autonomous actions here</span>
            <strong>00</strong>
            <small>This page does not send, dial, deploy, spend, or approve.</small>
          </article>
        </section>

        <div className="pcc-two-column">
          <section className="pcc-panel" aria-labelledby="pcc-focus-title">
            <SectionHeading
              index="01"
              title="Founder focus"
              description="The four truths worth seeing before choosing a tool."
            />
            <div className="pcc-focus-list">
              <article>
                <div>
                  <span>Source truth</span>
                  <StatusPill tone="unavailable">Needs connector</StatusPill>
                </div>
                <h3>Private inbox counts stay out until the server can prove them.</h3>
                <p>
                  The supplied dashboard is a useful visual reference, not a
                  live data adapter. No mailbox, security, or billing snapshot
                  is hardcoded into this page.
                </p>
              </article>
              <article>
                <div>
                  <span>Calls</span>
                  <StatusPill tone="controlled">Separate gate</StatusPill>
                </div>
                <h3>The dialer remains its own deliberate action room.</h3>
                <p>
                  Personal Command links to the existing founder-only dialer;
                  it never originates a call or weakens the dialer&apos;s server
                  authorization.
                </p>
              </article>
              <article>
                <div>
                  <span>Fleet</span>
                  <StatusPill tone="verified">Profiles recorded</StatusPill>
                </div>
                <h3>Ten roles are visible without pretending they are people.</h3>
                <p>
                  Each seat is a defined AI role and handoff boundary. Runtime
                  health must come from a connected source, not a decorative
                  green dot.
                </p>
              </article>
              <article>
                <div>
                  <span>Economics</span>
                  <StatusPill tone="available">Planning only</StatusPill>
                </div>
                <h3>Commission math is available without becoming an income promise.</h3>
                <p>
                  Contract rates, placement, advance mix, chargebacks, and
                  upline spread remain distinct inputs on the commission
                  surfaces.
                </p>
              </article>
            </div>
          </section>

          <section className="pcc-panel" aria-labelledby="pcc-lanes-title">
            <SectionHeading
              index="02"
              title="Operating lanes"
              description="Four clean entrances, each with its own authority ceiling."
            />
            <div className="pcc-lane-list">
              {OPERATING_LANES.map((lane) => (
                <Link className="pcc-lane" href={lane.href} key={lane.code}>
                  <span className="pcc-lane-code">{lane.code}</span>
                  <div className="pcc-lane-copy">
                    <div>
                      <h3>{lane.label}</h3>
                      <StatusPill tone={lane.tone}>{lane.state}</StatusPill>
                    </div>
                    <p>{lane.detail}</p>
                    <small>{lane.routes.join("  /  ")}</small>
                  </div>
                  <i aria-hidden="true">-&gt;</i>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="pcc-panel" id="command-launches" aria-labelledby="pcc-launch-title">
          <SectionHeading
            index="03"
            title="Command launches"
            description="The shortest safe route to the work. Every destination rechecks your session and authority."
            action={<StatusPill tone="controlled">No bypasses</StatusPill>}
          />
          <nav className="pcc-launch-grid" aria-label="Personal command destinations">
            {COMMAND_ACTIONS.map((action) => (
              <Link className="pcc-launch" href={action.href} key={action.href}>
                <span className="pcc-launch-code">{action.code}</span>
                <div>
                  <strong>{action.label}</strong>
                  <small>{action.detail}</small>
                </div>
                <StatusPill tone={action.tone}>{action.state}</StatusPill>
                <i aria-hidden="true">-&gt;</i>
              </Link>
            ))}
          </nav>
        </section>

        <section className="pcc-panel" id="personal-fleet" aria-labelledby="pcc-fleet-title">
          <SectionHeading
            index="04"
            title="Ten-seat fleet"
            description="A role map for coordinated work, not a claim of ten continuously running employees."
            action={
              <Link className="pcc-inline-link" href="/portal/gallery">
                Open Operations Deck <span aria-hidden="true">-&gt;</span>
              </Link>
            }
          />
          <div className="pcc-fleet-grid">
            {FLEET_SEATS.map((seat) => (
              <article className={`pcc-seat pcc-seat-${seat.tone}`} key={seat.id}>
                <span className="pcc-seat-number">{seat.id}</span>
                <div className="pcc-seat-copy">
                  <div>
                    <h3>{seat.name}</h3>
                    <StatusPill tone="verified">Defined</StatusPill>
                  </div>
                  <strong>{seat.role}</strong>
                  <small>{seat.lane}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pcc-boundary" aria-labelledby="pcc-boundary-title">
          <div className="pcc-boundary-mark" aria-hidden="true">0A</div>
          <div>
            <p>Authority boundary</p>
            <h2 id="pcc-boundary-title">Private view does not mean unlimited authority.</h2>
            <span>
              J.A.R.V.I.S. is CORE&apos;s AI operating identity, not a human,
              licensed producer, owner, or independent decision-maker. This
              surface can organize and route; regulated, financial,
              contractual, deployment, membership, and outbound actions keep
              their existing human approvals and server controls.
            </span>
          </div>
        </section>

        <nav className="pcc-mobile-dock" aria-label="Personal Command quick navigation">
          <Link href="/portal/command"><span>FC</span><small>Console</small></Link>
          <Link href="#command-launches"><span>GO</span><small>Launch</small></Link>
          <Link href="/portal/gallery"><span>10</span><small>Fleet</small></Link>
          <Link href="/portal/dialer"><span>DL</span><small>Dialer</small></Link>
          <Link href="#personal-command-top"><span aria-hidden="true">^</span><small>Top</small></Link>
        </nav>
      </main>
    </PortalShell>
  );
}
