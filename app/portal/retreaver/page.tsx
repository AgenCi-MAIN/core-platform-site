import { recordAudit, requireCapability } from "../access";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "../components";
import { fetchRetreaver, type RetreaverData } from "./client";

export const dynamic = "force-dynamic";

const PATH = "/portal/retreaver";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/** Render an ISO-ish timestamp as its date part; anything odd passes through. */
function shortDate(value: string | null): string {
  if (!value) return "—";
  const t = value.indexOf("T");
  return t > 0 ? value.slice(0, t) : value;
}

function shortDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function RetreaverPage() {
  // Leadership-level surface: campaign spend and routing data. Same
  // deny-by-default capability as LeadTech — no new capability introduced.
  const session = await requireCapability("leadership.view.all", "/portal/retreaver");

  await recordAudit({
    action: "leadership.view.all",
    decision: "allow",
    reason: "retreaver_view",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "retreaver",
    requestPath: PATH,
  });

  const result = await fetchRetreaver();

  return (
    <PortalShell session={session} current={PATH} section="Retreaver">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Inbound call tracking"
          title={<>Retreaver <em>routing</em></>}
          subtitle="Ad campaign to central number to the person who answered — Retreaver's inbound calls and campaigns, read-only inside CORE. Leadership access only."
          compact
        />

        {result.state === "not_connected" ? (
          <NotConnected />
        ) : result.state === "error" ? (
          <ErrorCard reason={result.reason} />
        ) : (
          <Connected data={result.data} />
        )}

        <PrototypeNotice>
          Retreaver data is read live and is never cached, invented, or
          completed. Caller numbers are masked before they reach this page; the
          full call records stay in Retreaver. CORE holds read access only — no
          code path can change routing, campaigns, or anything else in the
          Retreaver account. The API contract is written to Retreaver v1 as of
          this build and is verified against the live account only once the key
          is set.
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
        icon="R"
        title="Connect Retreaver"
        description="CORE is wired to Retreaver but has no API key on this deployment yet."
      />
      <EmptyState
        title="Connect Retreaver to see inbound call routing"
        body={
          <>
            One-time setup, owner only: set the Retreaver API key as a secret
            with <code>wrangler secret put RETREAVER_API_KEY</code> and redeploy.
            Until then this surface stays honestly empty and shows no sample or
            placeholder call data.
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
        icon="R"
        title="Couldn't reach Retreaver"
        description="The key is set, but the last read did not succeed."
      />
      <EmptyState
        title="Retreaver did not answer"
        body={
          <>
            CORE could not load call data just now ({reason}) No rows are shown
            rather than guessed. This is often a transient network issue or a
            rejected key — retry shortly, and if it persists the owner may need
            to reset RETREAVER_API_KEY.
          </>
        }
      />
    </section>
  );
}

function Connected({ data }: { data: RetreaverData }) {
  const { campaigns, calls } = data;
  const converted = calls.filter((c) => c.converted === true);
  const payoutTotal = calls.reduce((sum, c) => sum + (c.payout ?? 0), 0);
  const totalSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds ?? 0), 0);

  return (
    <>
      <section className="portal-dialer-metrics" aria-label="Retreaver overview">
        <article className="portal-metric">
          <span className="portal-metric-label">Inbound calls</span>
          <strong className="portal-metric-value">{calls.length}</strong>
          <span className="portal-metric-detail">Most recent in Retreaver</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Converted</span>
          <strong className="portal-metric-value">{converted.length}</strong>
          <span className="portal-metric-detail">Marked converted by Retreaver</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Payout</span>
          <strong className="portal-metric-value">{usd.format(payoutTotal)}</strong>
          <span className="portal-metric-detail">Across those calls</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Talk time</span>
          <strong className="portal-metric-value">{Math.round(totalSeconds / 60)}m</strong>
          <span className="portal-metric-detail">{campaigns.length} campaigns configured</span>
        </article>
      </section>

      <article className="portal-card">
        <div className="portal-card-title-row">
          <PortalCardHeader
            icon="R"
            title="Recent inbound calls"
            description="Campaign → routed to → outcome. Caller numbers are masked."
          />
          <span className={`portal-state portal-state-${calls.length > 0 ? "live" : "pending"}`}>
            {calls.length > 0 ? "Calls live" : "No calls"}
          </span>
        </div>
        {calls.length === 0 ? (
          <EmptyState
            title="No calls in Retreaver"
            body="Retreaver returned no recent calls. This is the real count, not a placeholder."
          />
        ) : (
          <div className="portal-table-scroll">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">Caller</th>
                  <th scope="col">Campaign</th>
                  <th scope="col">Routed to</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Payout</th>
                  <th scope="col">Converted</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.id}>
                    <td className="portal-cell-mono">{c.callerMasked ?? "—"}</td>
                    <td>{c.campaignName ?? "—"}</td>
                    <td><strong>{c.targetName ?? "—"}</strong></td>
                    <td>{shortDuration(c.durationSeconds)}</td>
                    <td>{c.payout === null ? "—" : usd.format(c.payout)}</td>
                    <td>
                      {c.converted === null ? (
                        "—"
                      ) : (
                        <span className={`portal-state portal-state-${c.converted ? "live" : "pending"}`}>
                          {c.converted ? "Converted" : "No"}
                        </span>
                      )}
                    </td>
                    <td>{shortDate(c.startedAt)}</td>
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
            icon="R"
            title="Campaigns"
            description="The ad campaigns configured to feed the central numbers."
          />
          <span className={`portal-state portal-state-${campaigns.length > 0 ? "live" : "pending"}`}>
            {campaigns.length > 0 ? "Configured" : "None"}
          </span>
        </div>
        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns in Retreaver"
            body="Retreaver returned no campaigns. This is the real count, not a placeholder."
          />
        ) : (
          <div className="portal-table-scroll">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">Campaign</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.name ?? "Unnamed campaign"}</strong></td>
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
