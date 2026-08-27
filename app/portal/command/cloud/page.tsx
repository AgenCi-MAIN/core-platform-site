import Link from "next/link";
import type { ReactNode } from "react";
import { requireCommandCenter, isCommandCenterUnlocked } from "../../access";
import { PortalShell } from "../../components";
import { JarvisCommandPrompt } from "../../command-prompt";

export const dynamic = "force-dynamic";

type AgentTone = "active" | "idle" | "scheduled" | "offline";

type CloudEnvironment = {
  id: string;
  /** Where this card goes when clicked. See LINKS below. */
  href?: string;
  name: string;
  network: "full" | "restricted" | "none";
  tone: AgentTone;
  state: string;
  agents: number;
  routines: number;
  detail: string;
};

type AgentSession = {
  id: string;
  href?: string;
  label: string;
  environment: string;
  model: string;
  task: string;
  tone: AgentTone;
  state: string;
  started: string;
  tokens: string;
};

type Routine = {
  id: string;
  href?: string;
  name: string;
  schedule: string;
  environment: string;
  tone: AgentTone;
  state: string;
  lastFired: string;
  nextFire: string;
  detail: string;
};

type Pipeline = {
  id: string;
  href?: string;
  name: string;
  stages: number;
  active: number;
  completed: number;
  failed: number;
  tone: AgentTone;
  state: string;
};

/**
 * Every destination this page can send you to, in one place.
 *
 * The rows on this page describe things that live somewhere ELSE — sessions
 * and environments on claude.ai, routines, the Inkbox desk, the repo. A card
 * that names one of those and cannot open it is a screenshot, so each card
 * carries an href.
 *
 * Two rules kept these honest:
 *
 *   1. NO FABRICATED DEEP LINKS. Several rows here carry placeholder ids
 *      (AGT-001, ENV-02) rather than real session ids, so there is no
 *      per-item URL to build. Those link to the surface that lists the real
 *      ones instead of to a guessed URL that would 404 — a link that lands
 *      somewhere true and general beats one that looks specific and is wrong.
 *   2. NOTHING ADDED TO THE ALLOWLIST. tel: and sms: are the phone's own
 *      handlers, /go/* are the founder's existing gated redirects, and the
 *      two external hosts are the ones this page already linked at its foot.
 */
const LINKS = {
  /** The cloud surface that lists real environments and sessions. */
  cloud: "https://claude.ai/code",
  /** Founder-gated redirect that already exists. */
  routines: "/go/routines",
  /** Founder-gated Gmail compose to the desk. Already exists. */
  desk: "/go/desk",
  /** This session. Already linked at the foot of the page. */
  hq: "/go/hq",
  repo: "https://github.com/AgenCi-MAIN/core-platform-site",
  pulls: "https://github.com/AgenCi-MAIN/core-platform-site/pulls",
  security: "https://github.com/AgenCi-MAIN/core-platform-site/security",
  /** The portal's own call records — where a call row actually resolves. */
  calls: "/portal/calls",
  audit: "/portal/audit",
  /** The desk line. tel:/sms: hand off to the device, which is the point on a phone. */
  deskTel: "tel:+16896891349",
  deskSms: "sms:+16896891349",
} as const;

const ENVIRONMENTS: readonly CloudEnvironment[] = [
  {
    id: "ENV-01",
    href: LINKS.cloud,
    name: "CORE Operations",
    network: "full",
    tone: "active",
    state: "Active",
    agents: 0,
    routines: 0,
    detail:
      "Primary environment for the IMO operating platform. Full network access, setup script runs npm install on session start.",
  },
  {
    id: "ENV-02",
    href: LINKS.cloud,
    name: "Agent Workforce",
    network: "full",
    tone: "idle",
    state: "Ready",
    agents: 0,
    routines: 0,
    detail:
      "Dedicated environment for multi-agent task orchestration. Isolated from production portal code. Workflows, reviews, and research agents deploy here.",
  },
  {
    id: "ENV-03",
    href: LINKS.cloud,
    name: "CI / Verification",
    network: "restricted",
    tone: "idle",
    state: "Ready",
    agents: 0,
    routines: 0,
    detail:
      "Restricted-network environment for running test suites, security reviews, and build verification without external egress.",
  },
  {
    id: "ENV-04",
    href: LINKS.cloud,
    name: "Research & Analysis",
    network: "full",
    tone: "idle",
    state: "Ready",
    agents: 0,
    routines: 0,
    detail:
      "Full-access environment for web research, API exploration, and data analysis tasks. Agents here can fetch external sources.",
  },
];

const AGENT_SESSIONS: readonly AgentSession[] = [
  {
    id: "AGT-001",
    href: LINKS.cloud,
    label: "Portal Feature Builder",
    environment: "CORE Operations",
    model: "claude-opus-4-6",
    task: "Building Cloud AI Agent Command Center",
    tone: "active",
    state: "Working",
    started: "2026-08-19T14:00:00Z",
    tokens: "~2.1M used",
  },
  {
    id: "AGT-002",
    href: LINKS.cloud,
    label: "PR Steward",
    environment: "Agent Workforce",
    model: "claude-sonnet-5",
    task: "Watching open pull requests, auto-fixing CI failures",
    tone: "idle",
    state: "Waiting for events",
    started: "—",
    tokens: "—",
  },
  {
    id: "AGT-003",
    href: LINKS.cloud,
    label: "Security Reviewer",
    environment: "CI / Verification",
    model: "claude-opus-4-6",
    task: "Scheduled diff review on push to main",
    tone: "scheduled",
    state: "Scheduled",
    started: "—",
    tokens: "—",
  },
  {
    id: "AGT-004",
    href: LINKS.cloud,
    label: "Morning Brief",
    environment: "Research & Analysis",
    model: "claude-sonnet-5",
    task: "Compile daily operations brief from connected sources",
    tone: "scheduled",
    state: "Cron: weekdays 07:00 UTC",
    started: "—",
    tokens: "—",
  },
];

const ROUTINES: readonly Routine[] = [
  {
    id: "RTN-01",
    href: LINKS.routines,
    name: "presence-probe",
    schedule: "0 */4 * * *",
    environment: "CORE Operations",
    tone: "scheduled",
    state: "Every 4 hours",
    lastFired: "Captured 2026-08-17",
    nextFire: "Pending activation",
    detail: "Crowned SEAT 1 in Tournament 3. Probes system presence and health.",
  },
  {
    id: "RTN-02",
    href: LINKS.routines,
    name: "test-gaps",
    schedule: "0 6 * * 1-5",
    environment: "CI / Verification",
    tone: "scheduled",
    state: "Weekdays 06:00 UTC",
    lastFired: "Captured 2026-08-17",
    nextFire: "Pending activation",
    detail: "Crowned SEAT 2 in Tournament 3. Scans for untested code paths.",
  },
  {
    id: "RTN-03",
    href: LINKS.routines,
    name: "herald-outreach",
    schedule: "0 14 * * 1-5",
    environment: "Research & Analysis",
    tone: "offline",
    state: "Not activated",
    lastFired: "—",
    nextFire: "—",
    detail: "Outreach coordination routine. Mandate recorded but activation requires founder word.",
  },
  {
    id: "RTN-04",
    href: LINKS.routines,
    name: "deploy-watchdog",
    schedule: "*/30 * * * *",
    environment: "CI / Verification",
    tone: "idle",
    state: "Every 30 min",
    lastFired: "—",
    nextFire: "Ready",
    detail: "Verifies last deploy matches HEAD of main. Catches stale-dist drift.",
  },
  {
    id: "RTN-05",
    href: LINKS.routines,
    name: "pr-babysitter",
    schedule: "event-driven",
    environment: "Agent Workforce",
    tone: "idle",
    state: "Event-driven",
    lastFired: "—",
    nextFire: "On PR activity",
    detail: "Subscribes to PR events. Fixes CI failures and responds to review comments.",
  },
];

const PIPELINES: readonly Pipeline[] = [
  {
    id: "PL-01",
    href: LINKS.pulls,
    name: "Feature → Review → Merge",
    stages: 4,
    active: 0,
    completed: 0,
    failed: 0,
    tone: "idle",
    state: "Ready",
  },
  {
    id: "PL-02",
    href: LINKS.security,
    name: "Security Audit Sweep",
    stages: 3,
    active: 0,
    completed: 0,
    failed: 0,
    tone: "idle",
    state: "Ready",
  },
  {
    id: "PL-03",
    href: LINKS.repo,
    name: "Multi-Repo Sync",
    stages: 2,
    active: 0,
    completed: 0,
    failed: 0,
    tone: "idle",
    state: "Ready",
  },
];

type CommChannel = {
  type: string;
  href?: string;
  status: "active" | "ready" | "disabled";
  address: string;
};

type CommActivity = {
  id: string;
  href?: string;
  channel: "email" | "sms" | "call";
  direction: "inbound" | "outbound";
  from: string;
  subject: string;
  when: string;
  tone: AgentTone;
  actionItem?: string;
};

const INKBOX_IDENTITY = {
  handle: "out-reach",
  displayName: "Policy Holder Services of Florida",
  status: "active",
  email: "out-reach@inkboxmail.com",
  phone: "+1 (689) 689-1349",
};

const INKBOX_CHANNELS: readonly CommChannel[] = [
  { type: "Email", status: "active", address: "out-reach@inkboxmail.com", href: LINKS.desk },
  { type: "Phone", status: "active", address: "+1 (689) 689-1349", href: LINKS.deskTel },
  { type: "SMS", status: "ready", address: "+1 (689) 689-1349", href: LINKS.deskSms },
  { type: "Calling", status: "active", address: "Hosted agent", href: LINKS.deskTel },
  // Deliberately no href. The channel is disabled, and a link that opens
  // something which does not work is worse than a row that plainly says so.
  { type: "iMessage", status: "disabled", address: "Not enabled" },
];

const INKBOX_STATS = {
  unreadEmails: 3,
  mailboxes: 1,
  smsThreads: 2,
  unreadSms: 3,
  recentCalls: 5,
  openActions: 1,
  contacts: 4,
};

const COMM_ACTIVITY: readonly CommActivity[] = [
  {
    id: "ACT-01",
    href: LINKS.calls,
    channel: "call",
    direction: "outbound",
    from: "+1 (409) 549-2092",
    subject: "Outbound call — completed (33s)",
    when: "2026-08-19 03:34 UTC",
    tone: "active",
  },
  {
    id: "ACT-02",
    href: LINKS.calls,
    channel: "call",
    direction: "outbound",
    from: "+1 (941) 210-1411",
    subject: "Call and introduce — completed (42s)",
    when: "2026-08-19 02:46 UTC",
    tone: "active",
  },
  {
    id: "ACT-03",
    href: LINKS.deskSms,
    channel: "sms",
    direction: "outbound",
    from: "+1 (941) 210-1411",
    subject: "SMS sent — 8 messages in thread",
    when: "2026-08-19 02:05 UTC",
    tone: "active",
  },
  {
    id: "ACT-04",
    href: LINKS.calls,
    channel: "call",
    direction: "inbound",
    from: "+1 (941) 210-1411",
    subject: "Inbound call — beneficiary update request (68s)",
    when: "2026-08-19 01:53 UTC",
    tone: "active",
    actionItem:
      "Assist beneficiary update — send required form, collect new beneficiary details",
  },
  {
    id: "ACT-05",
    href: LINKS.desk,
    channel: "email",
    direction: "inbound",
    from: "Anthropic",
    subject: "Secure link to log in to Claude.ai",
    when: "2026-08-18 19:00 UTC",
    tone: "idle",
  },
  {
    id: "ACT-06",
    href: LINKS.desk,
    channel: "email",
    direction: "inbound",
    from: "Yuxiang Mao",
    subject: "yooo",
    when: "2026-08-17 15:48 UTC",
    tone: "idle",
  },
  {
    id: "ACT-07",
    href: LINKS.desk,
    channel: "email",
    direction: "inbound",
    from: "Yuxiang Mao",
    subject: "Re: Welcome to the CORE / IMO platform",
    when: "2026-08-17 12:23 UTC",
    tone: "idle",
  },
];

function ToneChip({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`cacc-chip cacc-chip-${tone}`}>{children}</span>;
}

function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: string;
}) {
  return (
    <article className={`cacc-metric cacc-metric-${tone}`}>
      <span className="cacc-metric-label">{label}</span>
      <strong className="cacc-metric-value">{value}</strong>
      <span className="cacc-metric-detail">{detail}</span>
    </article>
  );
}

/**
 * Makes a whole card clickable without wrecking its accessible name.
 *
 * The obvious approach — wrap the entire <article> in an <a> — gives the link
 * an accessible name built from every word inside it, so a screen reader
 * announces the heading, the body, the four meta fields and the id as one
 * enormous link. Instead the anchor sits on the heading, where the name is
 * just the title, and a transparent ::after overlay stretches it across the
 * card. Pointer users get the big target, keyboard and screen reader users get
 * a sensible link, and there is exactly one tab stop per card either way.
 *
 * External hrefs open in a new tab with rel="noopener" — an unrelated host
 * must never get a handle on this window. tel: and sms: are handed to the
 * device rather than navigated, so they are plain anchors with no target.
 */
function CardLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) return <>{children}</>;

  const isDeviceHandler = href.startsWith("tel:") || href.startsWith("sms:");
  const isExternal = href.startsWith("http");

  if (isDeviceHandler) {
    return (
      <a className="cacc-stretch" href={href}>
        {children}
      </a>
    );
  }
  if (isExternal) {
    return (
      <a className="cacc-stretch" href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <span className="cacc-external" aria-hidden="true">&#8599;</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link className="cacc-stretch" href={href}>
      {children}
    </Link>
  );
}

function EnvironmentCard({ env }: { env: CloudEnvironment }) {
  return (
    <article className={`cacc-env-card${env.href ? " cacc-linked" : ""}`} id={env.id.toLowerCase()}>
      <div className="cacc-env-head">
        <div className="cacc-env-icon">
          <span className={`cacc-env-dot cacc-env-dot-${env.tone}`} aria-hidden="true" />
        </div>
        <div className="cacc-env-title">
          <h3>
            <CardLink href={env.href}>{env.name}</CardLink>
          </h3>
          <ToneChip tone={env.tone}>{env.state}</ToneChip>
        </div>
      </div>
      <p className="cacc-env-detail">{env.detail}</p>
      <div className="cacc-env-meta">
        <span>
          <b>Network</b> {env.network}
        </span>
        <span>
          <b>Agents</b> {env.agents}
        </span>
        <span>
          <b>Routines</b> {env.routines}
        </span>
        <span className="cacc-env-id">{env.id}</span>
      </div>
    </article>
  );
}

function AgentRow({ agent }: { agent: AgentSession }) {
  return (
    <article className={`cacc-agent-row${agent.href ? " cacc-linked" : ""}`} id={agent.id.toLowerCase()}>
      <div className="cacc-agent-dot-col">
        <span className={`cacc-env-dot cacc-env-dot-${agent.tone}`} aria-hidden="true" />
      </div>
      <div className="cacc-agent-copy">
        <div className="cacc-agent-title">
          <h3>
            <CardLink href={agent.href}>{agent.label}</CardLink>
          </h3>
          <ToneChip tone={agent.tone}>{agent.state}</ToneChip>
        </div>
        <p>{agent.task}</p>
        <div className="cacc-agent-meta">
          <span>
            <b>Env</b> {agent.environment}
          </span>
          <span>
            <b>Model</b> <code>{agent.model}</code>
          </span>
          <span>
            <b>Tokens</b> {agent.tokens}
          </span>
          <span className="cacc-env-id">{agent.id}</span>
        </div>
      </div>
    </article>
  );
}

function RoutineRow({ routine }: { routine: Routine }) {
  return (
    <article className={`cacc-routine-row${routine.href ? " cacc-linked" : ""}`} id={routine.id.toLowerCase()}>
      <div className="cacc-routine-id">{routine.id}</div>
      <div className="cacc-routine-copy">
        <div className="cacc-routine-title">
          <h3>
            <CardLink href={routine.href}>{routine.name}</CardLink>
          </h3>
          <ToneChip tone={routine.tone}>{routine.state}</ToneChip>
        </div>
        <p>{routine.detail}</p>
        <div className="cacc-routine-meta">
          <span>
            <b>Schedule</b> <code>{routine.schedule}</code>
          </span>
          <span>
            <b>Last</b> {routine.lastFired}
          </span>
          <span>
            <b>Next</b> {routine.nextFire}
          </span>
          <span>
            <b>Env</b> {routine.environment}
          </span>
        </div>
      </div>
    </article>
  );
}

function PipelineCard({ pipeline }: { pipeline: Pipeline }) {
  const total = pipeline.stages;
  const pct = total > 0 ? Math.round((pipeline.completed / total) * 100) : 0;

  return (
    <article className={`cacc-pipeline-card${pipeline.href ? " cacc-linked" : ""}`}>
      <div className="cacc-pipeline-head">
        <h3>
          <CardLink href={pipeline.href}>{pipeline.name}</CardLink>
        </h3>
        <ToneChip tone={pipeline.tone}>{pipeline.state}</ToneChip>
      </div>
      <div className="cacc-pipeline-bar">
        <div className="cacc-pipeline-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="cacc-pipeline-stats">
        <span>{pipeline.stages} stages</span>
        <span>{pipeline.active} active</span>
        <span>{pipeline.completed} done</span>
        <span>{pipeline.failed} failed</span>
      </div>
      <span className="cacc-env-id">{pipeline.id}</span>
    </article>
  );
}

function ChannelStatusRow({ channels }: { channels: readonly CommChannel[] }) {
  return (
    <div className="cacc-channel-grid">
      {channels.map((ch) => (
        <div
          className={`cacc-channel cacc-channel-${ch.status}${ch.href ? " cacc-linked" : ""}`}
          key={ch.type}
        >
          <span className="cacc-channel-dot" aria-hidden="true" />
          <div className="cacc-channel-info">
            <strong>
              <CardLink href={ch.href}>{ch.type}</CardLink>
            </strong>
            <small>{ch.address}</small>
          </div>
          <ToneChip tone={ch.status === "disabled" ? "offline" : "active"}>
            {ch.status}
          </ToneChip>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({ activity }: { activity: CommActivity }) {
  const icon =
    activity.channel === "email"
      ? "EM"
      : activity.channel === "sms"
        ? "TX"
        : "PH";
  return (
    <article className={`cacc-activity-row${activity.href ? " cacc-linked" : ""}`}>
      <span
        className={`cacc-activity-icon cacc-activity-${activity.channel}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="cacc-activity-copy">
        <div className="cacc-activity-title">
          <h3>
            <CardLink href={activity.href}>{activity.subject}</CardLink>
          </h3>
          <ToneChip tone={activity.tone}>{activity.direction}</ToneChip>
        </div>
        <div className="cacc-activity-meta">
          <span>
            <b>{activity.channel}</b>
          </span>
          <span>{activity.from}</span>
          <span>{activity.when}</span>
        </div>
        {activity.actionItem && (
          <p className="cacc-action-item">
            <strong>Action:</strong> {activity.actionItem}
          </p>
        )}
      </div>
    </article>
  );
}

export default async function CloudAgentCommandCenter() {
  const session = await requireCommandCenter(
    "/portal/command/cloud",
    "command.cloud",
  );
  const isFounder = isCommandCenterUnlocked(session);

  const activeEnvs = ENVIRONMENTS.filter((e) => e.tone === "active").length;
  const totalAgents = AGENT_SESSIONS.length;
  const activeAgents = AGENT_SESSIONS.filter((a) => a.tone === "active").length;
  const totalRoutines = ROUTINES.length;
  const activeRoutines = ROUTINES.filter((r) => r.tone === "active" || r.tone === "scheduled").length;
  const totalPipelines = PIPELINES.length;

  return (
    <PortalShell
      session={session}
      current="/portal/command/cloud"
      section="Cloud AI Command"
    >
      <main className="portal-main cacc" id="cloud-command-top">
        <section className="cacc-hero" aria-labelledby="cacc-title">
          <div className="cacc-hero-topline">
            <span>Cloud AI Agent Command Center</span>
            <span className="cacc-live-mark">
              <i aria-hidden="true" /> Multi-task orchestration
            </span>
          </div>
          <div className="cacc-hero-copy">
            <p className="cacc-kicker">
              Deploy · Orchestrate · Monitor · Iterate
            </p>
            <h1 id="cacc-title">Your agent fleet.</h1>
            <p>
              Manage cloud environments, spawn agent sessions, schedule routines,
              and monitor multi-task pipelines from one protected surface.
              Every action is audited. No agent holds a capability this portal
              does not grant.
            </p>
          </div>
          <div className="cacc-prompt" aria-label="J.A.R.V.I.S. command prompt">
            <div className="cacc-prompt-head">
              <span>
                <i aria-hidden="true">J</i> Command prompt
              </span>
              <ToneChip tone="active">Cloud control active</ToneChip>
            </div>
            <JarvisCommandPrompt />
          </div>
          <div className="cacc-hero-foot">
            <span>Signed in as {session.displayName}</span>
            <span>{isFounder ? "Founder · permanent access" : "Pass-gated session"}</span>
          </div>
        </section>

        <section className="cacc-metrics" aria-label="Fleet overview">
          <MetricCard
            label="Cloud environments"
            value={ENVIRONMENTS.length}
            detail={`${activeEnvs} active, ${ENVIRONMENTS.length - activeEnvs} standby`}
            tone="good"
          />
          <MetricCard
            label="Agent sessions"
            value={totalAgents}
            detail={`${activeAgents} working now`}
            tone={activeAgents > 0 ? "active" : "neutral"}
          />
          <MetricCard
            label="Routines"
            value={totalRoutines}
            detail={`${activeRoutines} armed`}
            tone={activeRoutines > 0 ? "good" : "warn"}
          />
          <MetricCard
            label="Pipelines"
            value={totalPipelines}
            detail="Orchestration templates ready"
            tone="neutral"
          />
          <MetricCard
            label="Inkbox channels"
            value={INKBOX_CHANNELS.filter((c) => c.status !== "disabled").length}
            detail={`${INKBOX_STATS.unreadEmails + INKBOX_STATS.unreadSms} unread across channels`}
            tone="active"
          />
        </section>

        <section className="cacc-layout cacc-layout-primary">
          <article className="cacc-panel" aria-labelledby="cacc-envs-title">
            <header className="cacc-panel-head">
              <div>
                <p>01 / Environments</p>
                <h2 id="cacc-envs-title">Cloud fleet</h2>
              </div>
              <ToneChip tone="active">{activeEnvs} active</ToneChip>
            </header>
            <p className="cacc-panel-note">
              Each environment is an isolated execution context with its own
              network policy, setup script, and agent capacity. Create
              environments from the Claude Code web UI or the API.
            </p>
            <div className="cacc-env-grid">
              {ENVIRONMENTS.map((env) => (
                <EnvironmentCard env={env} key={env.id} />
              ))}
            </div>
          </article>

          <article className="cacc-panel" aria-labelledby="cacc-agents-title">
            <header className="cacc-panel-head">
              <div>
                <p>02 / Agent Sessions</p>
                <h2 id="cacc-agents-title">Active workforce</h2>
              </div>
              <span className="cacc-count" aria-label={`${totalAgents} agents`}>
                {totalAgents}
              </span>
            </header>
            <p className="cacc-panel-note">
              Each session is an independent Claude Code agent running in a
              cloud environment. Sessions can be spawned, interrupted,
              messaged, and archived from this surface.
            </p>
            <div className="cacc-agent-list">
              {AGENT_SESSIONS.map((agent) => (
                <AgentRow agent={agent} key={agent.id} />
              ))}
            </div>
          </article>
        </section>

        <section className="cacc-layout">
          <article className="cacc-panel" aria-labelledby="cacc-routines-title">
            <header className="cacc-panel-head">
              <div>
                <p>03 / Routines</p>
                <h2 id="cacc-routines-title">Scheduled automation</h2>
              </div>
              <ToneChip tone="scheduled">
                {activeRoutines} armed
              </ToneChip>
            </header>
            <p className="cacc-panel-note">
              Routines fire on cron schedules or event triggers. Each can
              resume an existing session, wake a named session, or spawn a
              fresh one. Managed via the Routines API.
            </p>
            <div className="cacc-routine-list">
              {ROUTINES.map((routine) => (
                <RoutineRow routine={routine} key={routine.id} />
              ))}
            </div>
          </article>

          <article className="cacc-panel" aria-labelledby="cacc-pipelines-title">
            <header className="cacc-panel-head">
              <div>
                <p>04 / Pipelines</p>
                <h2 id="cacc-pipelines-title">Multi-task orchestration</h2>
              </div>
              <ToneChip tone="idle">{totalPipelines} templates</ToneChip>
            </header>
            <p className="cacc-panel-note">
              Pipelines chain multiple agent stages — research, build, review,
              verify — into deterministic workflows. Each stage can fan out to
              parallel agents.
            </p>
            <div className="cacc-pipeline-grid">
              {PIPELINES.map((pipeline) => (
                <PipelineCard pipeline={pipeline} key={pipeline.id} />
              ))}
            </div>
          </article>
        </section>

        <section className="cacc-layout">
          <article className="cacc-panel cacc-panel-comms" aria-labelledby="cacc-comms-title">
            <header className="cacc-panel-head">
              <div>
                <p>05 / Communications</p>
                <h2 id="cacc-comms-title">Inkbox channels</h2>
              </div>
              <ToneChip tone="active">Connected</ToneChip>
            </header>
            <div className="cacc-identity-banner">
              <div className="cacc-identity-info">
                <h3>{INKBOX_IDENTITY.displayName}</h3>
                <span className="cacc-env-id">@{INKBOX_IDENTITY.handle}</span>
              </div>
              <ToneChip tone="active">{INKBOX_IDENTITY.status}</ToneChip>
            </div>
            <ChannelStatusRow channels={INKBOX_CHANNELS} />
            <div className="cacc-comms-metrics">
              <div className="cacc-comms-stat">
                <strong>{INKBOX_STATS.unreadEmails}</strong>
                <small>unread emails</small>
              </div>
              <div className="cacc-comms-stat">
                <strong>{INKBOX_STATS.unreadSms}</strong>
                <small>unread SMS</small>
              </div>
              <div className="cacc-comms-stat">
                <strong>{INKBOX_STATS.recentCalls}</strong>
                <small>recent calls</small>
              </div>
              <div className="cacc-comms-stat">
                <strong>{INKBOX_STATS.contacts}</strong>
                <small>contacts</small>
              </div>
              <div className="cacc-comms-stat cacc-comms-stat-warn">
                <strong>{INKBOX_STATS.openActions}</strong>
                <small>action items</small>
              </div>
            </div>
          </article>

          <article className="cacc-panel" aria-labelledby="cacc-activity-title">
            <header className="cacc-panel-head">
              <div>
                <p>05 / Activity</p>
                <h2 id="cacc-activity-title">Recent communications</h2>
              </div>
              <span className="cacc-count" aria-label={`${COMM_ACTIVITY.length} items`}>
                {COMM_ACTIVITY.length}
              </span>
            </header>
            <p className="cacc-panel-note">
              Cross-channel activity feed from the connected Inkbox identity.
              Calls, SMS, and email ordered by most recent activity.
            </p>
            <div className="cacc-activity-list">
              {COMM_ACTIVITY.map((activity) => (
                <ActivityRow activity={activity} key={activity.id} />
              ))}
            </div>
          </article>
        </section>

        <section className="cacc-quicklaunch" aria-labelledby="cacc-launch-title">
          <header className="cacc-panel-head">
            <div>
              <p>06 / Quick Launch</p>
              <h2 id="cacc-launch-title">Spawn an agent</h2>
            </div>
            <ToneChip tone="active">One-click deploy</ToneChip>
          </header>
          <div className="cacc-launch-grid">
            <Link className="cacc-launch" href="/portal/command">
              <span className="cacc-launch-icon">FC</span>
              <strong>Field Console</strong>
              <small>Founder command surface</small>
              <i aria-hidden="true">→</i>
            </Link>
            <a
              className="cacc-launch"
              href="https://claude.ai/code"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="cacc-launch-icon">CC</span>
              <strong>Claude Code Web</strong>
              <small>New cloud session</small>
              <i aria-hidden="true">↗</i>
            </a>
            <a
              className="cacc-launch"
              href="https://github.com/AgenCi-MAIN/core-platform-site"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="cacc-launch-icon">GH</span>
              <strong>Repository</strong>
              <small>Source control</small>
              <i aria-hidden="true">↗</i>
            </a>
            <Link className="cacc-launch" href="/portal/audit">
              <span className="cacc-launch-icon">AU</span>
              <strong>Audit Log</strong>
              <small>Access record</small>
              <i aria-hidden="true">→</i>
            </Link>
            <Link className="cacc-launch" href="/portal">
              <span className="cacc-launch-icon">PT</span>
              <strong>Portal Home</strong>
              <small>Member dashboard</small>
              <i aria-hidden="true">→</i>
            </Link>
            <Link className="cacc-launch" href="/go/hq">
              <span className="cacc-launch-icon">HQ</span>
              <strong>Talk to HQ</strong>
              <small>Real Claude session</small>
              <i aria-hidden="true">↗</i>
            </Link>
          </div>
        </section>

        <section className="cacc-architecture" aria-labelledby="cacc-arch-title">
          <header className="cacc-panel-head">
            <div>
              <p>Reference</p>
              <h2 id="cacc-arch-title">Architecture</h2>
            </div>
          </header>
          <div className="cacc-arch-grid">
            <article className="cacc-arch-card">
              <h3>Environments</h3>
              <p>
                Isolated containers with configurable network policies (full,
                restricted, none), environment variables, and setup scripts.
                Each session gets a fresh clone, and the container is reclaimed
                on idle.
              </p>
            </article>
            <article className="cacc-arch-card">
              <h3>Sessions</h3>
              <p>
                Each agent session is a Claude Code instance with full tool
                access running in a cloud environment. Sessions can be spawned,
                messaged, interrupted, and archived. Changes are committed and
                pushed.
              </p>
            </article>
            <article className="cacc-arch-card">
              <h3>Routines</h3>
              <p>
                Cron-scheduled or event-driven triggers that fire messages into
                sessions. Three modes: self-bind (resume this session), target
                a named session, or spawn fresh on each firing.
              </p>
            </article>
            <article className="cacc-arch-card">
              <h3>Workflows</h3>
              <p>
                Deterministic multi-agent orchestration scripts using
                agent(), parallel(), and pipeline() primitives. Fan out
                across dimensions, verify adversarially, synthesize results.
              </p>
            </article>
            <article className="cacc-arch-card">
              <h3>Inkbox</h3>
              <p>
                Connected communications platform providing email, SMS, phone,
                and calling channels under a managed identity. AI agents handle
                inbound calls and route by intent. Activity feeds into this
                command surface.
              </p>
            </article>
          </div>
        </section>

        <p className="cacc-boundary" role="note">
          <strong>Boundary:</strong> this surface displays configuration and
          recorded state. Agent sessions, routines, environments, and
          communications data are managed through their respective APIs.
          Inkbox channel data is a point-in-time snapshot refreshed on deploy.
          No agent spawned from here holds a portal capability it was not
          granted through the membership model.
        </p>

        <nav className="cacc-thumb-dock" aria-label="Cloud command quick nav">
          <Link href="/portal/command">
            <span>FC</span>
            <small>Console</small>
          </Link>
          <a href="https://claude.ai/code" target="_blank" rel="noopener noreferrer">
            <span>CC</span>
            <small>Code</small>
          </a>
          <a
            href="https://github.com/AgenCi-MAIN/core-platform-site"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>GH</span>
            <small>Repo</small>
          </a>
          <Link href="#cloud-command-top">
            <span>↑</span>
            <small>Top</small>
          </Link>
        </nav>
      </main>
    </PortalShell>
  );
}
