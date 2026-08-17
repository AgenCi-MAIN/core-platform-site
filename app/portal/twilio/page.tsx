import { recordAudit, requireCapability } from "../access";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "../components";
import { fetchTwilio, type TwilioData } from "./client";

export const dynamic = "force-dynamic";

const PATH = "/portal/twilio";

/** Render an ISO-ish timestamp as its date part; anything odd passes through. */
function shortDate(value: string | null): string {
  if (!value) return "—";
  const t = value.indexOf("T");
  if (t > 0) return value.slice(0, t);
  // Twilio's classic API returns RFC 2822 dates ("Sat, 16 Aug 2026 21:04:07
  // +0000") — keep the readable middle, defensively.
  const parts = value.split(" ");
  return parts.length >= 4 ? parts.slice(0, 4).join(" ") : value;
}

function shortDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default async function TwilioPage() {
  // Leadership-level surface: the org's telephony spend and traffic. Same
  // deny-by-default capability as LeadTech — no new capability introduced.
  const session = await requireCapability("leadership.view.all", "/portal/twilio");

  await recordAudit({
    action: "leadership.view.all",
    decision: "allow",
    reason: "twilio_view",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: "twilio",
    requestPath: PATH,
  });

  const result = await fetchTwilio();

  return (
    <PortalShell session={session} current={PATH} section="Twilio">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Phone lines"
          title={<>Twilio <em>inbound</em></>}
          subtitle="The central numbers and their inbound call log, read-only inside CORE. Leadership access only — nothing here can place a call."
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
          Twilio data is read live and is never cached, invented, or completed.
          Caller numbers are masked before they reach this page; the numbers
          shown in full are the organization&rsquo;s own. CORE holds read access
          only — no code path can place a call, send a message, or change the
          Twilio account. The API contract is written to Twilio&rsquo;s REST API as
          of this build and is verified against the live account only once the
          credentials are set.
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
        icon="T"
        title="Connect Twilio"
        description="CORE is wired to Twilio but has no credentials on this deployment yet."
      />
      <EmptyState
        title="Connect Twilio to see the inbound call log"
        body={
          <>
            One-time setup, owner only: set both credentials as secrets with{" "}
            <code>wrangler secret put TWILIO_ACCOUNT_SID</code> and{" "}
            <code>wrangler secret put TWILIO_AUTH_TOKEN</code>, then redeploy.
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
        icon="T"
        title="Couldn't reach Twilio"
        description="Credentials are set, but the last read did not succeed."
      />
      <EmptyState
        title="Twilio did not answer"
        body={
          <>
            CORE could not load the call log just now ({reason}) No rows are
            shown rather than guessed. This is often a transient network issue
            or rejected credentials — retry shortly, and if it persists the
            owner may need to reset TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.
          </>
        }
      />
    </section>
  );
}

function Connected({ data }: { data: TwilioData }) {
  const { numbers, calls } = data;
  const totalSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds ?? 0), 0);
  const completed = calls.filter((c) => c.status === "completed");

  return (
    <>
      <section className="portal-dialer-metrics" aria-label="Twilio overview">
        <article className="portal-metric">
          <span className="portal-metric-label">Inbound calls</span>
          <strong className="portal-metric-value">{calls.length}</strong>
          <span className="portal-metric-detail">Most recent in the log</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Completed</span>
          <strong className="portal-metric-value">{completed.length}</strong>
          <span className="portal-metric-detail">Of the calls shown</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Talk time</span>
          <strong className="portal-metric-value">{Math.round(totalSeconds / 60)}m</strong>
          <span className="portal-metric-detail">Across those calls</span>
        </article>
        <article className="portal-metric">
          <span className="portal-metric-label">Numbers</span>
          <strong className="portal-metric-value">{numbers.length}</strong>
          <span className="portal-metric-detail">Central numbers owned</span>
        </article>
      </section>

      <article className="portal-card">
        <div className="portal-card-title-row">
          <PortalCardHeader
            icon="T"
            title="Central numbers"
            description="The organization's own Twilio numbers — the front doors calls arrive through."
          />
          <span className={`portal-state portal-state-${numbers.length > 0 ? "live" : "pending"}`}>
            {numbers.length > 0 ? "Owned" : "None"}
          </span>
        </div>
        {numbers.length === 0 ? (
          <EmptyState
            title="No numbers in Twilio"
            body="Twilio returned no phone numbers for this account. This is the real count, not a placeholder."
          />
        ) : (
          <div className="portal-table-scroll">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">Number</th>
                  <th scope="col">Label</th>
                </tr>
              </thead>
              <tbody>
                {numbers.map((n) => (
                  <tr key={n.id}>
                    <td className="portal-cell-mono">{n.phoneNumber ?? "—"}</td>
                    <td><strong>{n.friendlyName ?? "—"}</strong></td>
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
            icon="T"
            title="Inbound call log"
            description="Callers are masked; the number called is the organization's own."
          />
          <span className={`portal-state portal-state-${calls.length > 0 ? "live" : "pending"}`}>
            {calls.length > 0 ? "Log live" : "No calls"}
          </span>
        </div>
        {calls.length === 0 ? (
          <EmptyState
            title="No inbound calls in Twilio"
            body="Twilio returned no inbound calls for this account. This is the real count, not a placeholder."
          />
        ) : (
          <div className="portal-table-scroll">
            <table className="portal-table">
              <thead>
                <tr>
                  <th scope="col">Caller</th>
                  <th scope="col">Number called</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Status</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.id}>
                    <td className="portal-cell-mono">{c.fromMasked ?? "—"}</td>
                    <td className="portal-cell-mono">{c.to ?? "—"}</td>
                    <td>{shortDuration(c.durationSeconds)}</td>
                    <td>
                      <span className={`portal-state portal-state-${c.status === "completed" ? "live" : "pending"}`}>
                        {c.status ?? "unknown"}
                      </span>
                    </td>
                    <td>{shortDate(c.startedAt)}</td>
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
