import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEvents } from "../../../db/schema";
import { requireCapability } from "../access";
import { EmptyState, PortalCardHeader, PortalPageIntro, PortalShell } from "../components";
import { readFaultCopy, readRows } from "../read-guard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

/**
 * Append-only access record. Every allow and every deny reaches this table,
 * including the request that rendered this page.
 */
export default async function AuditPage() {
  const session = await requireCapability("audit.view", "/portal/audit");

  const { rows: events, fault } = await readRows("audit_events", () =>
    getDb()
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.occurredAt), desc(auditEvents.id))
      .limit(PAGE_SIZE),
  );

  return (
    <PortalShell session={session} current="/portal/audit" section="Audit">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Accountability"
          title={<>Audit <em>log</em></>}
          subtitle={
            <>
            The {PAGE_SIZE} most recent authorization decisions. Rows are
            append-only — the portal never updates or deletes them. Retention,
            export, and legal-hold procedures are still pending an authorized
            human decision.
            </>
          }
        />

        <section className="portal-card">
          <PortalCardHeader
            icon="◷"
            title="Authorization events"
            description="Newest decisions first; access outcomes are append-only."
          />
          {fault ? (
            // Never "no events recorded" here. This is the page people consult
            // to find out whether something happened; an unread table rendered
            // as an empty one is the single most misleading thing it could say.
            <EmptyState {...readFaultCopy(fault, "The audit log")} />
          ) : events.length === 0 ? (
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
    </PortalShell>
  );
}
