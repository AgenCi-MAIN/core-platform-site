import Link from "next/link";
import { recordAudit, requireCapability } from "../access";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "../components";
import {
  fetchContactsTab,
  fetchEngagementTab,
  fetchPipelineTab,
  type ContactsTabData,
  type EngagementTabData,
  type LeadTechResult,
  type PipelineTabData,
} from "./client";

export const dynamic = "force-dynamic";

const PATH = "/portal/leadtech";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The tab set. Server-rendered links (?tab=…) — no client JS, no state, and
 * the guarded page re-runs requireCapability on every tab switch. Each tab
 * fetches ONLY its own upstream data, so one tab's failure or slowness never
 * touches the others.
 */
const TABS = [
  { id: "pipeline", label: "Pipeline", blurb: "Opportunities by stage & value" },
  { id: "contacts", label: "Contacts", blurb: "Newest leads, tags & sources" },
  { id: "engagement", label: "Engagement", blurb: "Conversations & booking calendars" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function resolveTab(raw: string | undefined): TabId {
  return TABS.some((tab) => tab.id === raw) ? (raw as TabId) : "pipeline";
}

/** Render an ISO-ish timestamp as its date part; anything odd passes through. */
function shortDate(value: string | null): string {
  if (!value) return "—";
  const t = value.indexOf("T");
  return t > 0 ? value.slice(0, t) : value;
}

export default async function LeadTechPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Leadership-level surface: company pipeline data. leadership.view.all is
  // already deny-by-default and held only by owner/admin/manager. No new
  // capability is introduced.
  const session = await requireCapability("leadership.view.all", "/portal/leadtech");
  const tab = resolveTab((await searchParams).tab);

  // Audit the surface access, mirroring the route handlers' recordAudit shape.
  // A page component has no Request, so request_path is the page's own literal
  // path — the same honest value requireCapability itself records (see the note
  // above the removed currentPath helper in access.ts).
  await recordAudit({
    action: "leadership.view.all",
    decision: "allow",
    reason: `leadtech_view_${tab}`,
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "leadtech",
    requestPath: PATH,
  });

  const result =
    tab === "contacts"
      ? await fetchContactsTab()
      : tab === "engagement"
        ? await fetchEngagementTab()
        : await fetchPipelineTab();

  return (
    <PortalShell session={session} current={PATH} section="LeadTech">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Company pipeline"
          title={<>LeadTech <em>pipeline</em></>}
          subtitle="LeadTech's contacts, opportunities, and engagement, rendered natively inside CORE under CORE's own auth. Leadership access only."
          compact
        />

        <nav className="portal-leadtab-row" aria-label="LeadTech sections">
          {TABS.map((entry) => (
            <Link
              key={entry.id}
              href={entry.id === "pipeline" ? PATH : `${PATH}?tab=${entry.id}`}
              className="portal-leadtab"
              aria-current={entry.id === tab ? "page" : undefined}
            >
              <strong>{entry.label}</strong>
              <span>{entry.blurb}</span>
            </Link>
          ))}
        </nav>

        {result.state === "not_connected" ? (
          <NotConnected />
        ) : result.state === "error" ? (
          <ErrorCard reason={result.reason} />
        ) : tab === "contacts" ? (
          <ContactsTab data={(result as Extract<LeadTechResult<ContactsTabData>, { state: "ok" }>).data} />
        ) : tab === "engagement" ? (
          <EngagementTab data={(result as Extract<LeadTechResult<EngagementTabData>, { state: "ok" }>).data} />
        ) : (
          <PipelineTab data={(result as Extract<LeadTechResult<PipelineTabData>, { state: "ok" }>).data} />
        )}

        <PrototypeNotice>
          LeadTech data is read live from the owner&rsquo;s GoHighLevel account and is
          never cached, invented, or completed. Phone and email are masked and
          message bodies are never fetched; the full records stay in LeadTech.
          The API contract is written to GoHighLevel v2 as of this build and is
          verified against the live account only once the key is set.
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
            server client. Until then every tab on this surface stays honestly
            empty and shows no sample or placeholder pipeline data.
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
            CORE could not load this tab just now ({reason}) No rows are shown
            rather than guessed. This is often a transient network issue or a
            rejected key — retry shortly, and if it persists the owner may need to
            reset LEADTECH_API_KEY.
          </>
        }
      />
    </section>
  );
}

// ===========================================================================
// Pipeline tab — opportunities resolved against the pipeline/stage definitions
// ===========================================================================

function PipelineTab({ data }: { data: PipelineTabData }) {
  const { pipelines, opportunities } = data;
  const open = opportunities.filter((o) => o.status === "open");
  const won = opportunities.filter((o) => o.status === "won");
  const openValue = open.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);
  const wonValue = won.reduce((sum, o) => sum + (o.monetaryValue ?? 0), 0);

  const stageName = new Map<string, string>();
  for (const pipeline of pipelines) {
    for (const stage of pipeline.stages) {
      if (stage.name) stageName.set(stage.id, stage.name);
    }
  }

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
          <span className="portal-metric-detail">{open.length} open opportunities</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Won value</span>
          <strong className="portal-metric-value">{usd.format(wonValue)}</strong>
          <span className="portal-metric-detail">{won.length} marked won</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Pipelines</span>
          <strong className="portal-metric-value">{pipelines.length}</strong>
          <span className="portal-metric-detail">Configured in LeadTech</span>
        </article>
      </section>

      {pipelines.map((pipeline) => {
        const rows = opportunities.filter((o) => o.pipelineId === pipeline.id);
        return (
          <article className="portal-card" key={pipeline.id}>
            <div className="portal-card-title-row">
              <PortalCardHeader
                icon="P"
                title={pipeline.name ?? "Unnamed pipeline"}
                description={`${pipeline.stages.length} stages · ${rows.length} of the newest opportunities`}
              />
              <span className={`portal-state portal-state-${rows.length > 0 ? "live" : "pending"}`}>
                {rows.length > 0 ? "Live" : "Empty"}
              </span>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title="No opportunities in this pipeline"
                body="LeadTech returned none of the newest opportunities in this pipeline. This is the real count, not a placeholder."
              />
            ) : (
              <div className="portal-table-scroll">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th scope="col">Opportunity</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Status</th>
                      <th scope="col">Value</th>
                      <th scope="col">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((o) => (
                      <tr key={o.id}>
                        <td><strong>{o.name ?? "Unnamed opportunity"}</strong></td>
                        <td>{(o.stageId && stageName.get(o.stageId)) ?? "—"}</td>
                        <td>
                          <span className={`portal-state portal-state-${o.status === "won" ? "live" : "pending"}`}>
                            {o.status ?? "unknown"}
                          </span>
                        </td>
                        <td>{o.monetaryValue === null ? "—" : usd.format(o.monetaryValue)}</td>
                        <td>{shortDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        );
      })}

      {(() => {
        const known = new Set(pipelines.map((p) => p.id));
        const orphans = opportunities.filter((o) => !o.pipelineId || !known.has(o.pipelineId));
        if (orphans.length === 0) return null;
        return (
          <article className="portal-card">
            <PortalCardHeader
              icon="P"
              title="Not in a listed pipeline"
              description="Opportunities whose pipeline id did not match a configured pipeline."
            />
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
                  {orphans.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.name ?? "Unnamed opportunity"}</strong></td>
                      <td>{o.status ?? "unknown"}</td>
                      <td>{o.monetaryValue === null ? "—" : usd.format(o.monetaryValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        );
      })()}

      {pipelines.length === 0 && opportunities.length === 0 ? (
        <EmptyState
          title="No pipeline data in LeadTech"
          body="LeadTech returned no pipelines and no opportunities for this location. This is the real state, not a placeholder."
        />
      ) : null}
    </>
  );
}

// ===========================================================================
// Contacts tab — newest contacts with tags, source, masked reachability
// ===========================================================================

function ContactsTab({ data }: { data: ContactsTabData }) {
  const { contacts } = data;
  const tagged = contacts.filter((c) => c.tags.length > 0);
  const dnd = contacts.filter((c) => c.dnd);

  return (
    <>
      <section className="portal-dialer-metrics" aria-label="LeadTech contacts overview">
        <article className="portal-metric">
          <span className="portal-metric-label">Contacts</span>
          <strong className="portal-metric-value">{contacts.length}</strong>
          <span className="portal-metric-detail">Most recent contacts in LeadTech</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Tagged</span>
          <strong className="portal-metric-value">{tagged.length}</strong>
          <span className="portal-metric-detail">Carry at least one tag</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Do not disturb</span>
          <strong className="portal-metric-value">{dnd.length}</strong>
          <span className="portal-metric-detail">Flagged DND in LeadTech</span>
        </article>
      </section>

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
                  <th scope="col">Tags</th>
                  <th scope="col">Source</th>
                  <th scope="col">Added</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name ?? "Unnamed contact"}</strong>
                      {c.dnd ? (
                        <>
                          {" "}
                          <span className="portal-state portal-state-pending">DND</span>
                        </>
                      ) : null}
                    </td>
                    <td className="portal-cell-mono">{c.phoneMasked ?? "—"}</td>
                    <td className="portal-cell-mono">{c.emailMasked ?? "—"}</td>
                    <td>{c.tags.length === 0 ? "—" : c.tags.join(", ")}</td>
                    <td>{c.source ?? "—"}</td>
                    <td>{shortDate(c.addedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </>
  );
}

// ===========================================================================
// Engagement tab — conversations (channel + recency only) and calendars
// ===========================================================================

function EngagementTab({ data }: { data: EngagementTabData }) {
  const { conversations, calendars } = data;
  const unread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const activeCalendars = calendars.filter((c) => c.isActive !== false);

  return (
    <>
      <section className="portal-dialer-metrics" aria-label="LeadTech engagement overview">
        <article className="portal-metric">
          <span className="portal-metric-label">Conversations</span>
          <strong className="portal-metric-value">{conversations.length}</strong>
          <span className="portal-metric-detail">Most recent in LeadTech</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Unread</span>
          <strong className="portal-metric-value">{unread}</strong>
          <span className="portal-metric-detail">Across those conversations</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Booking calendars</span>
          <strong className="portal-metric-value">{activeCalendars.length}</strong>
          <span className="portal-metric-detail">Active of {calendars.length} configured</span>
        </article>
      </section>

      <section className="portal-dialer-grid">
        <article className="portal-card">
          <div className="portal-card-title-row">
            <PortalCardHeader
              icon="E"
              title="Conversations"
              description="Channel and recency only — message bodies are never fetched into CORE."
            />
            <span className={`portal-state portal-state-${conversations.length > 0 ? "live" : "pending"}`}>
              {conversations.length > 0 ? "Live" : "None"}
            </span>
          </div>
          {conversations.length === 0 ? (
            <EmptyState
              title="No conversations in LeadTech"
              body="LeadTech returned no conversations for this location. This is the real count, not a placeholder."
            />
          ) : (
            <div className="portal-table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">Contact</th>
                    <th scope="col">Channel</th>
                    <th scope="col">Last activity</th>
                    <th scope="col">Unread</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.contactName ?? "Unnamed contact"}</strong></td>
                      <td>{c.lastMessageType ?? c.type ?? "—"}</td>
                      <td>{shortDate(c.lastMessageAt)}</td>
                      <td>{c.unreadCount === null ? "—" : c.unreadCount}</td>
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
              icon="B"
              title="Booking calendars"
              description="The appointment calendars configured in LeadTech."
            />
            <span className={`portal-state portal-state-${calendars.length > 0 ? "live" : "pending"}`}>
              {calendars.length > 0 ? "Configured" : "None"}
            </span>
          </div>
          {calendars.length === 0 ? (
            <EmptyState
              title="No calendars in LeadTech"
              body="LeadTech returned no booking calendars for this location. This is the real count, not a placeholder."
            />
          ) : (
            <div className="portal-table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">Calendar</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {calendars.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name ?? "Unnamed calendar"}</strong></td>
                      <td>
                        <span className={`portal-state portal-state-${c.isActive === false ? "pending" : "live"}`}>
                          {c.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </td>
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
