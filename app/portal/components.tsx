import { signOutPath } from "../google-auth";
import Link from "next/link";
import { ROLE_LABELS, can, type Capability, type PortalSession } from "./access";
import { PortalBackControl } from "./back-control";
import { PortalPerformanceControl } from "../performance-control";
import { PortalThemeControl } from "../theme-control";

type PortalIconName =
  | "dashboard"
  | "library"
  | "announcements"
  | "quoter"
  | "radio"
  | "shop"
  | "payrates"
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
  /** Set for third-party tools opened outside the portal. */
  external?: boolean;
  stateLabel: string;
};

const NAV: readonly NavItem[] = [
  {
    href: "/portal",
    label: "Dashboard",
    capability: "dashboard.view.self",
    icon: "dashboard",
    group: "Workspace",
    description: "Your authenticated THRIVE command surface.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/announcements",
    label: "Announcements",
    capability: "dashboard.view.self",
    icon: "announcements",
    group: "Workspace",
    description: "Releases, roadmap, and operating notes from the agency.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/library",
    label: "Library",
    capability: "dashboard.view.self",
    icon: "library",
    group: "Workspace",
    description: "Who THRIVE is, what we believe, training, and the incentive plan.",
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
    description: "Transferred call access and permissioned coaching review.",
    state: "live",
    stateLabel: "Beta ready",
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
    href: "/portal/music",
    label: "Radio",
    capability: "dashboard.view.self",
    icon: "radio",
    group: "Workspace",
    description: "Music for the floor. Owner-uploaded tracks only.",
    state: "live",
    stateLabel: "Available",
  },
  {
    href: "/portal/shop",
    label: "Exchange",
    capability: "dashboard.view.self",
    icon: "shop",
    group: "Operations",
    description: "Trade contract points for transferred calls and AI capacity.",
    state: "live",
    stateLabel: "Priced menu",
  },
  {
    href: "https://app.insurancetoolkits.com/fex/quoter",
    label: "Quoter",
    capability: "book.view.self",
    icon: "quoter",
    group: "Operations",
    description: "Final expense quoting via InsuranceToolkits. Opens in a new tab; sign in there separately.",
    state: "live",
    stateLabel: "External tool",
    external: true,
  },
  {
    href: "/portal/pay-rates",
    label: "Pay Rates",
    capability: "leadership.view.all",
    icon: "payrates",
    group: "Administration",
    description: "Restricted. Model contract levels, grants, and cost.",
    state: "live",
    stateLabel: "Restricted",
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

      {/* Nav links are client-side now, so tapping one no longer reloads the
          page — which also means the mobile drawer no longer closes itself.
          One delegated listener closes it on any link tap inside it. Inline
          for the same reason as PortalThemeBoot: no props, no state, no
          hydration boundary worth shipping. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            '(function(){if(window.__thriveDrawerClose)return;window.__thriveDrawerClose=1;document.addEventListener("click",function(e){var t=e.target instanceof Element?e.target:null;if(!t)return;var p=t.closest("#portal-mobile-navigation");if(p&&t.closest("a")&&typeof p.hidePopover==="function"){p.hidePopover()}})})();',
        }}
      />

      <aside className="portal-sidebar portal-sidebar-desktop" aria-label="THRIVE portal sidebar">
        <PortalSidebarContent session={session} current={current} visible={visible} />
      </aside>

      <aside
        className="portal-sidebar portal-sidebar-mobile"
        id="portal-mobile-navigation"
        aria-label="THRIVE mobile navigation"
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
            <PortalBackControl />
            <span className="portal-topbar-copy">
              <strong className="portal-section-name">{section}</strong>
              <small className="portal-section-context">THRIVE operating portal</small>
            </span>
          </div>

          <div className="portal-topbar-end" aria-label={`Signed in as ${session.displayName}`}>
            <PortalThemeControl />
            <PortalPerformanceControl />
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
        <Link className="portal-brand" href="/portal" aria-label="THRIVE portal dashboard">
          <span className="portal-brand-mark" aria-hidden="true">T</span>
          <span className="portal-brand-copy">
            <strong>THRIVE</strong>
            <small>Operating portal</small>
          </span>
        </Link>
        <span className="portal-brand-kicker">Protected workspace</span>
      </div>

      <nav className="portal-nav" aria-label="Portal navigation">
        {NAV_GROUPS.map((group) => {
          const groupItems = visible.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div className="portal-nav-group" key={group}>
              <p className="portal-nav-group-label">{group}</p>
              {/* Internal links navigate client-side ON PURPOSE. A plain
                  <a> is a full page load, which tears down the portal layout
                  — and the audio deck inside it, killing the radio on every
                  page switch. <Link> keeps the layout (and the playing
                  <audio> element) alive across navigations. */}
              {groupItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    title={`${item.label} — opens in a new tab`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="portal-nav-icon" aria-hidden="true">
                      <PortalNavMark name={item.icon} />
                    </span>
                    <span className="portal-nav-label">{item.label}</span>
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.href === current ? "page" : undefined}
                    title={item.label}
                  >
                    <span className="portal-nav-icon" aria-hidden="true">
                      <PortalNavMark name={item.icon} />
                    </span>
                    <span className="portal-nav-label">{item.label}</span>
                  </Link>
                ),
              )}
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
        {/* Deliberately a plain <a>, never <Link>: Link may prefetch its
            target, and prefetching /auth/signout would sign the member out
            for merely rendering the sidebar. */}
        <a className="portal-signout" href={signOutPath("/")} title="Sign out">
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
      {visible.map((item) => {
        const body = (
          <>
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
          </>
        );
        // Same client-side rule as the sidebar, for the same reason: the
        // radio must survive the navigation.
        return item.external ? (
          <a
            className="portal-workspace-item"
            href={item.href}
            key={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {body}
          </a>
        ) : (
          <Link className="portal-workspace-item" href={item.href} key={item.href}>
            {body}
          </Link>
        );
      })}
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
    library: "R",
    announcements: "!",
    quoter: "Q",
    radio: "♪",
    shop: "X",
    payrates: "$",
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
    .join("") || "T";
}
