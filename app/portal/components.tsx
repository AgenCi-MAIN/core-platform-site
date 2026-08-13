import { chatGPTSignOutPath } from "../chatgpt-auth";
import { ROLE_LABELS, can, type Capability, type PortalSession } from "./access";

type NavItem = {
  href: string;
  label: string;
  capability: Capability;
  icon: string;
};

const NAV: readonly NavItem[] = [
  { href: "/portal", label: "Dashboard", capability: "dashboard.view.self", icon: "⌂" },
  { href: "/portal/book", label: "Book of Business", capability: "book.view.self", icon: "◫" },
  { href: "/portal/calls", label: "Call Lab", capability: "calls.review", icon: "◉" },
  { href: "/portal/scripts", label: "Script Vault", capability: "scripts.manage", icon: "✦" },
  { href: "/portal/team", label: "Team", capability: "team.view", icon: "◎" },
  { href: "/portal/leadership", label: "Leadership", capability: "leadership.view.all", icon: "⌁" },
  { href: "/portal/members", label: "Members", capability: "members.view", icon: "◇" },
  { href: "/portal/audit", label: "Audit", capability: "audit.view", icon: "◷" },
];

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

      <aside className="portal-sidebar" aria-label="CORE portal sidebar">
        <div className="portal-brand">
          <span className="portal-brand-mark" aria-hidden="true">C</span>
          <span className="portal-brand-copy">
            <strong>CORE</strong>
            <small>Portal</small>
          </span>
        </div>

        <nav className="portal-nav" aria-label="Portal navigation">
          {visible.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.href === current ? "page" : undefined}
              title={item.label}
            >
              <span className="portal-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="portal-nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="portal-sidebar-account">
          <span className="portal-account-avatar" aria-hidden="true">
            {initials(session.displayName)}
          </span>
          <span className="portal-account-copy">
            <strong>{ROLE_LABELS[session.role]}</strong>
            <small>{session.email}</small>
          </span>
          <a className="portal-signout" href={chatGPTSignOutPath("/")} title="Sign out">
            <span aria-hidden="true">↗</span>
            <span className="portal-nav-label">Sign out</span>
          </a>
        </div>
      </aside>

      <label className="portal-drawer-scrim" htmlFor="portal-sidebar-toggle" aria-hidden="true" />

      <div className="portal-workspace">
        <header className="portal-topbar">
          <div className="portal-topbar-start">
            <label className="portal-menu-button" htmlFor="portal-sidebar-toggle" title="Toggle navigation">
              <span aria-hidden="true" />
              <span className="sr-only">Toggle navigation</span>
            </label>
            <span className="portal-section-name">{section}</span>
          </div>

          <div className="portal-topbar-end">
            <span className="portal-connection">
              <span aria-hidden="true" /> Connected
            </span>
            <span className={`portal-status portal-status-${session.status}`}>
              {session.status}
            </span>
            <span className="portal-member-name">
              <strong>{session.displayName}</strong>
              <small>{ROLE_LABELS[session.role]}</small>
            </span>
          </div>
        </header>

        {children}
      </div>
    </div>
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
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
}) {
  return (
    <section className="portal-intro">
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
        <PortalPageIntro eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <section className="portal-card">
          <PortalCardHeader icon={icon} title={cardTitle} description={cardDescription} />
          <EmptyState title={emptyTitle} body={emptyBody} />
        </section>
      </main>
    </PortalShell>
  );
}

export function PrototypeNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="portal-notice" role="note">
      <span>Illustrative</span>
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
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "C";
}
