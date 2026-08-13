import { chatGPTSignOutPath } from "../chatgpt-auth";
import { ROLE_LABELS, can, type Capability, type PortalSession } from "./access";

type PortalIconName =
  | "dashboard"
  | "book"
  | "calls"
  | "scripts"
  | "team"
  | "leadership"
  | "members"
  | "audit"
  | "signout";

type NavItem = {
  href: string;
  label: string;
  capability: Capability;
  icon: PortalIconName;
  group: "Workspace" | "Operations" | "Administration";
  description: string;
  state: "live" | "pending";
  stateLabel: string;
};

const NAV: readonly NavItem[] = [
  {
    href: "/portal",
    label: "Dashboard",
    capability: "dashboard.view.self",
    icon: "dashboard",
    group: "Workspace",
    description: "Your authenticated CORE command surface.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/book",
    label: "Book of Business",
    capability: "book.view.self",
    icon: "book",
    group: "Operations",
    description: "Personal policy, placement, and retention intelligence.",
    state: "pending",
    stateLabel: "Source pending",
  },
  {
    href: "/portal/calls",
    label: "Call Lab",
    capability: "calls.review",
    icon: "calls",
    group: "Operations",
    description: "Permissioned call evidence and coaching review.",
    state: "pending",
    stateLabel: "Governance pending",
  },
  {
    href: "/portal/scripts",
    label: "Script Vault",
    capability: "scripts.manage",
    icon: "scripts",
    group: "Operations",
    description: "Governed, versioned conversation playbooks.",
    state: "pending",
    stateLabel: "Import pending",
  },
  {
    href: "/portal/team",
    label: "Team",
    capability: "team.view",
    icon: "team",
    group: "Operations",
    description: "Assignments, coaching, and progression evidence.",
    state: "pending",
    stateLabel: "Model pending",
  },
  {
    href: "/portal/leadership",
    label: "Leadership",
    capability: "leadership.view.all",
    icon: "leadership",
    group: "Operations",
    description: "Leadership view of company-wide operating evidence and exceptions.",
    state: "pending",
    stateLabel: "Sources pending",
  },
  {
    href: "/portal/members",
    label: "Members",
    capability: "members.view",
    icon: "members",
    group: "Administration",
    description: "The current authenticated membership roster.",
    state: "live",
    stateLabel: "Membership live",
  },
  {
    href: "/portal/audit",
    label: "Audit",
    capability: "audit.view",
    icon: "audit",
    group: "Administration",
    description: "Recorded portal access decisions and events.",
    state: "live",
    stateLabel: "Access log live",
  },
];

const NAV_GROUPS = ["Workspace", "Operations", "Administration"] as const;

export function PortalShell({
  session,
  current,
  section,
  children,
}: {
  session: PortalSession;
  current: string;
  section: string;
  children: React.ReactNode;
}) {
  const visible = NAV.filter((item) => can(session, item.capability));

  return (
    <div className="portal-shell">
      <input
        className="portal-sidebar-toggle"
        id="portal-sidebar-toggle"
        type="checkbox"
        aria-label="Toggle portal navigation"
      />

      <aside className="portal-sidebar portal-sidebar-desktop" aria-label="CORE portal sidebar">
        <PortalSidebarContent session={session} current={current} visible={visible} />
      </aside>

      <aside
        className="portal-sidebar portal-sidebar-mobile"
        id="portal-mobile-navigation"
        aria-label="CORE mobile navigation"
        popover="auto"
      >
        <button
          className="portal-drawer-close"
          type="button"
          popoverTarget="portal-mobile-navigation"
          popoverTargetAction="hide"
        >
          <span aria-hidden="true">×</span>
          <span className="sr-only">Close navigation</span>
        </button>
        <PortalSidebarContent session={session} current={current} visible={visible} />
      </aside>

      <div className="portal-workspace">
        <header className="portal-topbar">
          <div className="portal-topbar-start">
            <label className="portal-menu-button portal-menu-button-desktop" htmlFor="portal-sidebar-toggle" title="Collapse navigation">
              <span aria-hidden="true" />
              <span className="sr-only">Collapse or expand navigation</span>
            </label>
            <button
              className="portal-menu-button portal-menu-button-mobile"
              type="button"
              popoverTarget="portal-mobile-navigation"
              popoverTargetAction="toggle"
              aria-label="Open navigation"
            >
              <span aria-hidden="true" />
            </button>
            <span className="portal-topbar-copy">
              <strong className="portal-section-name">{section}</strong>
              <small className="portal-section-context">CORE operating portal</small>
            </span>
          </div>

          <div className="portal-topbar-end" aria-label={`Signed in as ${session.displayName}`}>
            <span className="portal-connection">
              <span aria-hidden="true" /> Secure session
            </span>
            <span className={`portal-status portal-status-${session.status}`}>
              {session.status}
            </span>
            <span className="portal-member-name">
              <strong>{session.displayName}</strong>
              <small>{ROLE_LABELS[session.role]}</small>
            </span>
            <span className="portal-topbar-avatar" aria-hidden="true">
              {initials(session.displayName)}
            </span>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

function PortalSidebarContent({
  session,
  current,
  visible,
}: {
  session: PortalSession;
  current: string;
  visible: readonly NavItem[];
}) {
  return (
    <>
      <div className="portal-sidebar-head">
        <a className="portal-brand" href="/portal" aria-label="CORE portal dashboard">
          <span className="portal-brand-mark" aria-hidden="true">C</span>
          <span className="portal-brand-copy">
            <strong>CORE</strong>
            <small>Operating portal</small>
          </span>
        </a>
        <span className="portal-brand-kicker">Protected workspace</span>
      </div>

      <nav className="portal-nav" aria-label="Portal navigation">
        {NAV_GROUPS.map((group) => {
          const groupItems = visible.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div className="portal-nav-group" key={group}>
              <p className="portal-nav-group-label">{group}</p>
              {groupItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={item.href === current ? "page" : undefined}
                  title={item.label}
                >
                  <span className="portal-nav-icon" aria-hidden="true">
                    <PortalNavMark name={item.icon} />
                  </span>
                  <span className="portal-nav-label">{item.label}</span>
                </a>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="portal-sidebar-system">
        <span className="portal-system-dot" aria-hidden="true" />
        <span className="portal-nav-label">Access controls active</span>
      </div>

      <div className="portal-sidebar-account">
        <span className="portal-account-avatar" aria-hidden="true">
          {initials(session.displayName)}
        </span>
        <span className="portal-account-copy">
          <strong>{session.displayName}</strong>
          <small>{ROLE_LABELS[session.role]}</small>
        </span>
        <a className="portal-signout" href={chatGPTSignOutPath("/")} title="Sign out">
          <span className="portal-nav-icon" aria-hidden="true">
            <PortalNavMark name="signout" />
          </span>
          <span className="portal-nav-label">Sign out</span>
        </a>
      </div>
    </>
  );
}

export function PortalCardHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <header className="portal-card-header">
      <span className="portal-card-icon" aria-hidden="true">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

export function PortalPageIntro({
  eyebrow,
  title,
  subtitle,
  compact = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`portal-intro${compact ? " portal-intro-compact" : ""}`}>
      <p className="portal-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="portal-lede">{subtitle}</p>
    </section>
  );
}

export function PortalPlaceholderPage({
  session,
  current,
  section,
  eyebrow,
  title,
  subtitle,
  cardTitle,
  cardDescription,
  emptyTitle,
  emptyBody,
  icon,
}: {
  session: PortalSession;
  current: string;
  section: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  emptyTitle: string;
  emptyBody: React.ReactNode;
  icon: string;
}) {
  return (
    <PortalShell session={session} current={current} section={section}>
      <main className="portal-main">
        <PortalPageIntro eyebrow={eyebrow} title={title} subtitle={subtitle} compact />
        <section className="portal-card portal-placeholder-card">
          <div className="portal-placeholder-state">
            <span className="portal-state portal-state-pending">Source not connected</span>
          </div>
          <PortalCardHeader icon={icon} title={cardTitle} description={cardDescription} />
          <EmptyState title={emptyTitle} body={emptyBody} />
        </section>
      </main>
    </PortalShell>
  );
}

export function PortalWorkspaceDirectory({ session }: { session: PortalSession }) {
  const visible = NAV.filter((item) => can(session, item.capability));

  return (
    <div className="portal-workspace-list">
      {visible.map((item) => (
        <a className="portal-workspace-item" href={item.href} key={item.href}>
          <span className="portal-workspace-symbol" aria-hidden="true">
            <PortalNavMark name={item.icon} />
          </span>
          <span className="portal-workspace-copy">
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </span>
          <span className="portal-workspace-meta">
            <span className={`portal-state portal-state-${item.state}`}>{item.stateLabel}</span>
            <span className="portal-workspace-action" aria-hidden="true">→</span>
          </span>
        </a>
      ))}
    </div>
  );
}

export function PrototypeNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="portal-notice" role="note">
      <span>System boundary</span>
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="portal-empty">
      <span className="portal-empty-icon" aria-hidden="true">○</span>
      <div className="portal-empty-copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}

function PortalNavMark({ name }: { name: PortalIconName }) {
  const marks: Record<PortalIconName, string> = {
    dashboard: "D",
    book: "B",
    calls: "C",
    scripts: "S",
    team: "T",
    leadership: "L",
    members: "M",
    audit: "A",
    signout: "↗",
  };

  return <span className={`portal-nav-symbol portal-nav-symbol-${name}`}>{marks[name]}</span>;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";
}
