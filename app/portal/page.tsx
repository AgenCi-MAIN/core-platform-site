import { ROLE_LABELS, can, requireCapability } from "./access";
import { EmptyState, PortalHeader, PrototypeNotice } from "./components";

export const dynamic = "force-dynamic";

/**
 * Personal portal dashboard. Everything rendered here is either a verified fact
 * about the caller's own session or an explicitly labelled placeholder. No
 * production figures are shown, because no production system is connected yet.
 */
export default async function PortalDashboard() {
  const session = await requireCapability("dashboard.view.self", "/portal");

  return (
    <>
      <PortalHeader session={session} current="/portal" />

      <main className="portal-main">
        <section className="portal-intro">
          <p className="eyebrow">
            <span /> Authenticated operating portal
          </p>
          <h1>
            Welcome, <em>{session.displayName}</em>
          </h1>
          <p className="portal-lede">
            You are signed in to the CORE portal as{" "}
            <strong>{ROLE_LABELS[session.role]}</strong>. This is the Phase 2
            authenticated application, separate from the public presentation
            page. Access is granted per person by an owner or administrator and
            checked on the server for every request.
          </p>
        </section>

        <section className="portal-panels">
          <article className="portal-card">
            <h2>Your access</h2>
            <dl className="portal-facts">
              <div>
                <dt>Account</dt>
                <dd>{session.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{ROLE_LABELS[session.role]}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd className="portal-status portal-status-active">
                  {session.status}
                </dd>
              </div>
              <div>
                <dt>Member ID</dt>
                <dd>#{session.memberId}</dd>
              </div>
            </dl>

            <h3>Capabilities held</h3>
            <ul className="portal-caps">
              {session.capabilities.map((capability) => (
                <li key={capability}>
                  <code>{capability}</code>
                </li>
              ))}
            </ul>
            <p className="portal-fine">
              Capabilities are deny-by-default. Anything not listed above is
              refused on the server and the refusal is written to the audit log.
            </p>
          </article>

          <article className="portal-card">
            <h2>Your book</h2>
            {can(session, "book.view.self") ? (
              <EmptyState
                title="No policy data connected"
                body={
                  <>
                    Placed premium, persistence, chargebacks, and rank evidence
                    will appear here once a carrier or CRM integration is
                    approved and connected. Nothing is displayed until it can be
                    sourced from a real system.
                  </>
                }
              />
            ) : (
              <EmptyState
                title="Not available for your role"
                body="Your role does not include personal book access."
              />
            )}
          </article>

          <article className="portal-card">
            <h2>Call reviews</h2>
            {can(session, "calls.review") ? (
              <EmptyState
                title="Ingestion not started"
                body={
                  <>
                    Authorized call ingestion is Phase 3 work. Before any
                    recording enters this portal, CORE must confirm recording
                    consent, access authority, permitted processing, retention,
                    and disclosure rules.
                  </>
                }
              />
            ) : (
              <EmptyState
                title="Not available for your role"
                body="Call review access is granted to reviewers, managers, administrators, and owners."
              />
            )}
          </article>

          {can(session, "leadership.view.all") ? (
            <article className="portal-card">
              <h2>Leadership view</h2>
              <EmptyState
                title="No company data connected"
                body={
                  <>
                    Lead cost, response speed, application rate, placed annual
                    premium, persistence, chargebacks, complaint rate, and profit
                    per placed policy are defined in the blueprint but not yet
                    sourced. This panel stays empty rather than showing modelled
                    numbers as if they were results.
                  </>
                }
              />
            </article>
          ) : null}
        </section>

        <PrototypeNotice>
          This portal enforces real authentication and real server-side
          authorization. It does not yet contain production business data. The
          public prototype at the marketing site remains illustrative planning
          content and is not a source of record.
        </PrototypeNotice>
      </main>
    </>
  );
}
