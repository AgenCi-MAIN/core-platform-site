import { ROLE_LABELS, can, requireCapability } from "./access";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "./components";

export const dynamic = "force-dynamic";

/**
 * Personal portal dashboard. Everything rendered here is either a verified fact
 * about the caller's own session or an explicitly labelled placeholder. No
 * production figures are shown, because no production system is connected yet.
 */
export default async function PortalDashboard() {
  const session = await requireCapability("dashboard.view.self", "/portal");

  return (
    <PortalShell session={session} current="/portal" section="Dashboard">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Authenticated operating portal"
          title={<>Welcome back, <em>{session.displayName}</em></>}
          subtitle={
            <>
              Your CORE workspace is active under the <strong>{ROLE_LABELS[session.role]}</strong>{" "}
              role. Every protected request is checked against your real membership and capability set.
            </>
          }
        />

        <section className="portal-panels">
          <article className="portal-card portal-card-wide">
            <PortalCardHeader
              icon="◇"
              title="Your access"
              description="Verified identity, membership, and current permission scope."
            />
            <dl className="portal-facts">
              <div>
                <dt><span aria-hidden="true">@</span> Account</dt>
                <dd>{session.email}</dd>
              </div>
              <div>
                <dt><span aria-hidden="true">◇</span> Role</dt>
                <dd>{ROLE_LABELS[session.role]}</dd>
              </div>
              <div>
                <dt><span aria-hidden="true">●</span> Status</dt>
                <dd><span className="portal-status portal-status-active">{session.status}</span></dd>
              </div>
              <div>
                <dt><span aria-hidden="true">#</span> Member ID</dt>
                <dd>#{session.memberId}</dd>
              </div>
            </dl>

            <h3>Capabilities held</h3>
            <ul className="portal-caps">
              {session.capabilities.map((capability) => (
                <li key={capability}><code>{capability}</code></li>
              ))}
            </ul>
            <p className="portal-fine">
              Capabilities are deny-by-default. Anything not listed above is refused on the server
              and the refusal is written to the audit log.
            </p>
          </article>

          <article className="portal-card">
            <PortalCardHeader
              icon="◫"
              title="Your book"
              description="Personal production, placement, and retention intelligence."
            />
            {can(session, "book.view.self") ? (
              <EmptyState
                title="No policy data connected"
                body="Placed premium, persistence, chargebacks, and rank evidence will appear after an approved carrier or CRM integration is connected."
              />
            ) : (
              <EmptyState title="Not available for your role" body="Your role does not include personal book access." />
            )}
          </article>

          <article className="portal-card">
            <PortalCardHeader
              icon="◉"
              title="Call reviews"
              description="Permissioned call evidence, coaching moments, and disposition learning."
            />
            {can(session, "calls.review") ? (
              <EmptyState
                title="Ingestion not started"
                body="Authorized call ingestion begins only after CORE confirms consent, access authority, permitted processing, retention, and disclosure rules."
              />
            ) : (
              <EmptyState
                title="Not available for your role"
                body="Call review access is granted to reviewers, managers, administrators, and owners."
              />
            )}
          </article>

          {can(session, "leadership.view.all") ? (
            <article className="portal-card portal-card-wide">
              <PortalCardHeader
                icon="⌁"
                title="Leadership view"
                description="Company-level performance evidence, once approved systems are connected."
              />
              <EmptyState
                title="No company data connected"
                body="Lead cost, response speed, placement, persistence, chargebacks, complaints, and profit per placed policy remain empty until sourced from verified operating systems."
              />
            </article>
          ) : null}
        </section>

        <PrototypeNotice>
          This portal enforces real authentication and real server-side authorization. It does not
          yet contain production business data. The public presentation remains illustrative and is
          not a source of record.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}
