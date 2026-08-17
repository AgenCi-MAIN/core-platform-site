import { recordAudit, requireCapability } from "../access";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "../components";
import { fetchLeadTech, type LeadTechResult } from "./client";

export const dynamic = "force-dynamic";

const PATH = "/portal/leadtech";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function LeadTechPage() {
  // Leadership-level surface: company pipeline data. leadership.view.all is
  // already deny-by-default and held only by owner/admin/manager. No new
  // capability is introduced.
  const session = await requireCapability("leadership.view.all", "/portal/leadtech");

  // Audit the surface access, mirroring the route handlers' recordAudit shape.
  // A page component has no Request, so request_path is the page's own literal
  // path — the same honest value requireCapability itself records (see the note
  // above the removed currentPath helper in access.ts).
  await recordAudit({
    action: "leadership.view.all",
    decision: "allow",
    reason: "leadtech_view",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "leadtech",
    requestPath: PATH,
  });

  const result = await fetchLeadTech();

  return (
    <PortalShell session={session} current={PATH} section="LeadTech">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Company pipeline"
          title={<>LeadTech <em>pipeline</em></>}
          subtitle="LeadTech's contacts and opportunities, rendered natively inside CORE under CORE's own auth. Leadership access only."
          compact
        />

        {result.state === "not_connected" ? (
          <NotConnected />
        ) : result.state === "error" ? (
          <ErrorCard reason={result.reason} />
        ) : (
          <Connected result={result} />
        )}

        <PrototypeNotice>
          LeadTech data is read live from the owner&rsquo;s GoHighLevel account and is
          never cached, invented, or completed. Phone and email are masked; the
          full contact record stays in LeadTech. The API contract is written to
          GoHighLevel v2 as of this build and is verified against the live
          account only once the key is set.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}

function NotConnected() {
  return (
    <section className="portal-card portal-placeholder-card">
      <div className="portal-placeholder-state">
        <span className="portal-state portal-state-pending">Not connected</span>
      </div>
      <PortalCardHeader
        icon="L"
        title="Connect LeadTech"
        description="CORE is wired to LeadTech but has no API key on this deployment yet."
      />
      <EmptyState
        title="Connect LeadTech to see the live pipeline"
        body={
          <>
            One-time setup, owner only: set the LeadTech API key as a secret with{" "}
            <code>wrangler secret put LEADTECH_API_KEY</code> and redeploy. Nothing
            else needs pointing — the LeadTech location is already wired into the
            server client. Until then this surface stays honestly empty and shows
            no sample or placeholder pipeline data.
          </>
        }
      />
    </section>
  );
}

function ErrorCard({ reason }: { reason: string }) {
  return (
    <section className="portal-card portal-placeholder-card">
      <div className="portal-placeholder-state">
        <span className="portal-state portal-state-pending">Unavailable</span>
      </div>
      <PortalCardHeader
        icon="L"
        title="Couldn't reach LeadTech"
        description="The key is set, but the last read did not succeed."
      />
      <EmptyState
        title="LeadTech did not answer"
        body={
          <>
            CORE could not load the pipeline just now ({reason}) No rows are shown
            rather than guessed. This is often a transient network issue or a
            rejected key — retry shortly, and if it persists the owner may need to
            reset LEADTECH_API_KEY.
          </>
        }
      />
    </section>
  );
}

function Connected({ result }: { result: Extract<LeadTechResult, { state: "ok" }> }) {
  const { contacts, opportunities } = result;
  const open = opportunities.filter((o) => o.status === "open");
  const won = opportunities.filter((o) => o.status === "won");
  const openValue = open.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);

  return (
    <>
      <section className="portal-dialer-metrics" aria-label="LeadTech pipeline overview">
        <article className="portal-metric">
          <span className="portal-metric-label">Opportunities</span>
          <strong className="portal-metric-value">{opportunities.length}</strong>
          <span className="portal-metric-detail">Newest {opportunities.length} in the pipeline</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Open pipeline value</span>
          <strong className="portal-metric-value">{usd.format(openValue)}</strong>
          <span className="portal-metric-detail">{open.length} open · {won.length} won</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Contacts</span>
          <strong className="portal-metric-value">{contacts.length}</strong>
          <span className="portal-metric-detail">Most recent contacts in LeadTech</span>
        </article>
      </section>

      <section className="portal-dialer-grid">
        <article className="portal-card">
          <div className="portal-card-title-row">
            <PortalCardHeader
              icon="P"
              title="Opportunities"
              description="Live from LeadTech. Values as recorded on each opportunity."
            />
            <span className={`portal-state portal-state-${opportunities.length > 0 ? "live" : "pending"}`}>
              {opportunities.length > 0 ? "Pipeline live" : "No opportunities"}
            </span>
          </div>
          {opportunities.length === 0 ? (
            <EmptyState
              title="No opportunities in LeadTech"
              body="LeadTech returned no opportunities for this location. This is the real count, not a placeholder."
            />
          ) : (
            <div className="portal-table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">Opportunity</th>
                    <th scope="col">Status</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.name ?? "Unnamed opportunity"}</strong></td>
                      <td>
                        <span className="portal-state portal-state-pending">
                          {o.status ?? "unknown"}
                        </span>
                      </td>
                      <td>{o.monetaryValue === null ? "—" : usd.format(o.monetaryValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="portal-card">
          <div className="portal-card-title-row">
            <PortalCardHeader
              icon="C"
              title="Contacts"
              description="Phone and email are masked — the full record stays in LeadTech."
            />
            <span className={`portal-state portal-state-${contacts.length > 0 ? "live" : "pending"}`}>
              {contacts.length > 0 ? "Contacts live" : "No contacts"}
            </span>
          </div>
          {contacts.length === 0 ? (
            <EmptyState
              title="No contacts in LeadTech"
              body="LeadTech returned no contacts for this location. This is the real count, not a placeholder."
            />
          ) : (
            <div className="portal-table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">Contact</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Email</th>
                    <th scope="col">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name ?? "Unnamed contact"}</strong></td>
                      <td className="portal-cell-mono">{c.phoneMasked ?? "—"}</td>
                      <td className="portal-cell-mono">{c.emailMasked ?? "—"}</td>
                      <td>{c.addedAt ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
