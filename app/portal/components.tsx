import { chatGPTSignOutPath } from "../chatgpt-auth";
import { ROLE_LABELS, can, type Capability, type PortalSession } from "./access";

type NavItem = {
  href: string;
  label: string;
  capability: Capability;
};

const NAV: readonly NavItem[] = [
  { href: "/portal", label: "Dashboard", capability: "dashboard.view.self" },
  { href: "/portal/members", label: "Members", capability: "members.view" },
  { href: "/portal/audit", label: "Audit", capability: "audit.view" },
];

export function PortalHeader({
  session,
  current,
}: {
  session: PortalSession;
  current: string;
}) {
  const visible = NAV.filter((item) => can(session, item.capability));

  return (
    <header className="portal-header">
      <div className="portal-brand">
        <span className="brand-mark">C</span>
        <span className="brand-wordmark">
          CORE <i>Portal</i>
        </span>
      </div>

      <nav className="portal-nav" aria-label="Portal navigation">
        {visible.map((item) => (
          <a
            key={item.href}
            href={item.href}
            aria-current={item.href === current ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="portal-identity">
        <div>
          <strong>{session.displayName}</strong>
          <span>{ROLE_LABELS[session.role]}</span>
        </div>
        <a className="portal-signout" href={chatGPTSignOutPath("/")}>
          Sign out
        </a>
      </div>
    </header>
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
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
