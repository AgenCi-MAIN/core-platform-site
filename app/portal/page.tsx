import { ROLE_LABELS, requireCapability } from "./access";
import {
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PortalWorkspaceDirectory,
  PrototypeNotice,
} from "./components";

export const dynamic = "force-dynamic";

/**
 * Personal portal dashboard. Every value is derived from the authenticated
 * session or describes a known system boundary. Production metrics stay absent
 * until an approved source system is connected.
 */
export default async function PortalDashboard() {
  const session = await requireCapability("dashboard.view.self", "/portal");
  const roleLabel = ROLE_LABELS[session.role];

  return (
    <PortalShell session={session} current="/portal" section="Dashboard">
      <main className="portal-main portal-dashboard">
        <div className="portal-dashboard-header">
          <PortalPageIntro
            eyebrow="Authenticated command surface"
            title={<>Welcome, {session.displayName}</>}
            subtitle={
              <>
                Your <strong>{roleLabel}</strong> workspace is ready. Access below reflects your
                current membership and server-enforced capability set.
              </>
            }
            compact
          />
          <div className="portal-dashboard-meta" aria-label="Workspace state">
            <span className="portal-state portal-state-live">Access controls active</span>
            <span className="portal-state portal-state-pending">Business sources pending</span>
          </div>
        </div>

        <section className="portal-metric-grid" aria-label="Session overview">
          <article className="portal-metric">
            <span className="portal-metric-label">Membership</span>
            <strong className="portal-metric-value">{session.status}</strong>
            <span className="portal-metric-detail">Verified against your CORE member record</span>
          </article>
          <article className="portal-metric">
            <span className="portal-metric-label">Operating role</span>
            <strong className="portal-metric-value">{roleLabel}</strong>
            <span className="portal-metric-detail">Controls which portal routes you can open</span>
          </article>
          <article className="portal-metric">
            <span className="portal-metric-label">Capability grants</span>
            <strong className="portal-metric-value">{session.capabilities.length}</strong>
            <span className="portal-metric-detail">Deny-by-default permissions held now</span>
          </article>
          <article className="portal-metric">
            <span className="portal-metric-label">Business sources</span>
            <strong className="portal-metric-value">Not connected</strong>
            <span className="portal-metric-detail">CRM, carrier, dialer feeds, and financial data stay absent</span>
          </article>
        </section>

        <section className="portal-dashboard-grid" aria-label="Dashboard details">
          <article className="portal-card portal-dashboard-primary">
            <PortalCardHeader
              icon="C"
              title="Your operating surface"
              description="Capability-filtered routes available to this account, with honest connection states."
            />
            <PortalWorkspaceDirectory session={session} />
          </article>

          <div className="portal-dashboard-side">
            <article className="portal-card">
              <header className="portal-section-heading">
                <div>
                  <p className="portal-section-kicker">System readiness</p>
                  <h2>What is operational</h2>
                </div>
              </header>
              <div className="portal-readiness-list">
                <div className="portal-readiness-item">
                  <span className="portal-system-dot" aria-hidden="true" />
                  <span className="portal-readiness-copy">
                    <strong>Identity and access</strong>
                    <small>Authentication, membership, and route authorization are active.</small>
                  </span>
                  <span className="portal-readiness-status portal-state portal-state-live">Operational</span>
                </div>
                <div className="portal-readiness-item">
                  <span className="portal-system-dot portal-system-dot-pending" aria-hidden="true" />
                  <span className="portal-readiness-copy">
                    <strong>Operating intelligence</strong>
                    <small>Dialer Beta storage is ready; external business sources await connection.</small>
                  </span>
                  <span className="portal-readiness-status portal-state portal-state-pending">Pending</span>
                </div>
                <div className="portal-readiness-item">
                  <span className="portal-system-dot portal-system-dot-neutral" aria-hidden="true" />
                  <span className="portal-readiness-copy">
                    <strong>Human authority</strong>
                    <small>Licensed, compliance, financial, and executive decisions remain human-controlled.</small>
                  </span>
                  <span className="portal-readiness-status portal-state portal-state-restricted">Required</span>
                </div>
              </div>
            </article>

            <article className="portal-card">
              <header className="portal-section-heading">
                <div>
                  <p className="portal-section-kicker">Account scope</p>
                  <h2>Your access record</h2>
                </div>
              </header>
              <dl className="portal-identity-list">
                <div className="portal-identity-row">
                  <dt className="portal-identity-key">Account</dt>
                  <dd className="portal-identity-value">{session.email}</dd>
                </div>
                <div className="portal-identity-row">
                  <dt className="portal-identity-key">Role</dt>
                  <dd className="portal-identity-value">{roleLabel}</dd>
                </div>
                <div className="portal-identity-row">
                  <dt className="portal-identity-key">Member ID</dt>
                  <dd className="portal-identity-value">#{session.memberId}</dd>
                </div>
              </dl>
              <details className="portal-capability-summary">
                <summary>Capabilities held · {session.capabilities.length} grants</summary>
                <ul className="portal-caps">
                  {session.capabilities.map((capability) => (
                    <li key={capability}><code>{capability}</code></li>
                  ))}
                </ul>
              </details>
            </article>
          </div>
        </section>

        <PrototypeNotice>
          This portal uses real authentication, membership, and server-side authorization. It
          does not yet contain production business data; disconnected areas remain clearly marked
          until approved systems of record are connected.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}
