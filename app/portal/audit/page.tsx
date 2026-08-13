import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEvents } from "../../../db/schema";
import { requireCapability } from "../access";
import { EmptyState, PortalHeader } from "../components";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

/**
 * Append-only access record. Every allow and every deny reaches this table,
 * including the request that rendered this page.
 */
export default async function AuditPage() {
  const session = await requireCapability("audit.view", "/portal/audit");

  const events = await getDb()
    .select()
    .from(auditEvents)
    .orderBy(desc(auditEvents.occurredAt), desc(auditEvents.id))
    .limit(PAGE_SIZE);

  return (
    <>
      <PortalHeader session={session} current="/portal/audit" />

      <main className="portal-main">
        <section className="portal-intro">
          <p className="eyebrow">
            <span /> Accountability
          </p>
          <h1>
            Audit <em>log</em>
          </h1>
          <p className="portal-lede">
            The {PAGE_SIZE} most recent authorization decisions. Rows are
            append-only — the portal never updates or deletes them. Retention,
            export, and legal-hold procedures are still pending an authorized
            human decision.
          </p>
        </section>

        <section className="portal-card">
          {events.length === 0 ? (
            <EmptyState
              title="No events recorded"
              body="This is expected on a freshly provisioned database. The request that rendered this page will appear once the page is reloaded."
            />
          ) : (
            <div className="portal-table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Actor</th>
                    <th scope="col">Action</th>
                    <th scope="col">Decision</th>
                    <th scope="col">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td className="portal-cell-mono">{event.occurredAt}</td>
                      <td>
                        <strong>{event.actorEmail ?? "anonymous"}</strong>
                        {event.actorRole ? (
                          <span className="portal-cell-sub">
                            {event.actorRole}
                          </span>
                        ) : null}
                      </td>
                      <td className="portal-cell-mono">{event.action}</td>
                      <td>
                        <span
                          className={`portal-decision portal-decision-${event.decision}`}
                        >
                          {event.decision}
                        </span>
                      </td>
                      <td className="portal-cell-mono">{event.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="portal-fine">
          This log records that access was attempted and how it was decided. It
          must never contain passwords, API keys, session cookies, OAuth tokens,
          or private keys.
        </p>
      </main>
    </>
  );
}
