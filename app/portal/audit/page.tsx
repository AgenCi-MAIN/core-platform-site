import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEvents } from "../../../db/schema";
import { requireFounder } from "../access";
import { EmptyState, PortalCardHeader, PortalPageIntro, PortalShell } from "../components";
import { readFaultCopy, readRows } from "../read-guard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

/**
 * Render the JSON `detail` field for a human. This is where a Presence
 * (`pet.chat`) row carries the question the member asked, so the owner can
 * read what the pet is being asked without leaving the portal. The field is
 * plain JSON and never holds a secret (the schema forbids it); we still
 * render it as a text node — React escapes it — and cap the length so one
 * long row can't blow out the table.
 */
function summarizeDetail(detail: string | null): string {
  if (!detail) return "—";
  let parsed: unknown;
  try {
    parsed = JSON.parse(detail);
  } catch {
    return detail.slice(0, 200);
  }
  if (parsed && typeof parsed === "object") {
    const d = parsed as Record<string, unknown>;
    // A Presence question reads best as the question itself, with the token
    // cost trailing quietly for the owner watching spend.
    if (typeof d.q === "string") {
      const cost =
        typeof d.out === "number" ? ` · ${d.out} out-tokens` : "";
      return `“${d.q}”${cost}`;
    }
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" · ")
      .slice(0, 200);
  }
  return String(parsed).slice(0, 200);
}

/**
 * Append-only access record. Every allow and every deny reaches this table,
 * including the request that rendered this page.
 */
export default async function AuditPage() {
  // Founder-only, by the owner's order (2026-08-15): the audit log answers
  // exactly one identity — the seeded founder — regardless of role. Any
  // other email, including a second owner, is refused and the refusal is
  // itself audited. Identity comes from the HMAC-signed session, never a
  // header.
  const session = await requireFounder("/portal/audit");

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
                    <th scope="col">Detail</th>
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
                      <td className="portal-cell-detail">{summarizeDetail(event.detail)}</td>
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
