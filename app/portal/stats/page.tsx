import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { dialerTransfers } from "../../../db/schema";
import { requireCapability } from "../access";
import { EmptyState, PortalCardHeader, PortalPageIntro, PortalShell } from "../components";
import { readFaultCopy, readRows } from "../read-guard";

export const dynamic = "force-dynamic";

const PATH = "/portal/stats";

function talk(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m ${seconds % 60}s`;
}

/**
 * The signed-in member's OWN statistics — dashboard.view.self in the most
 * literal sense: the query is filtered to the session's email server-side,
 * so no member can read another's numbers here (the leaderboard shows the
 * comparative view, by name, without per-call detail). Numbers come only
 * from real dialer_transfers rows; before production flows the page says
 * zero and says why.
 */
export default async function StatsPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/stats");

  const { rows: calls, fault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        durationSeconds: dialerTransfers.durationSeconds,
        status: dialerTransfers.status,
        startedAt: dialerTransfers.startedAt,
      })
      .from(dialerTransfers)
      .where(eq(dialerTransfers.agentEmail, session.email)),
  );

  const totalSeconds = calls.reduce((sum, row) => sum + (row.durationSeconds ?? 0), 0);
  const ready = calls.filter((row) => row.status === "ready").length;
  const average = calls.length > 0 ? Math.round(totalSeconds / calls.length) : 0;

  return (
    <PortalShell session={session} current={PATH} section="My Stats">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Your production"
          title={<>My <em>statistics</em></>}
          subtitle="Your own call production, computed from the platform's records. Nobody else's numbers appear here; the leaderboard carries the comparison."
          compact
        />

        {fault ? (
          <article className="portal-card">
            <EmptyState {...readFaultCopy(fault, "Your statistics")} />
          </article>
        ) : (
          <>
            <section className="portal-dialer-metrics" aria-label="Your production overview">
              <article className="portal-metric">
                <span className="portal-metric-label">Calls handled</span>
                <strong className="portal-metric-value">{calls.length}</strong>
                <span className="portal-metric-detail">Transferred calls attributed to you</span>
              </article>
              <article className="portal-metric">
                <span className="portal-metric-label">Ready in Call Lab</span>
                <strong className="portal-metric-value">{ready}</strong>
                <span className="portal-metric-detail">Of your calls, reviewable</span>
              </article>
              <article className="portal-metric">
                <span className="portal-metric-label">Talk time</span>
                <strong className="portal-metric-value">{totalSeconds > 0 ? talk(totalSeconds) : "0m"}</strong>
                <span className="portal-metric-detail">Total on attributed calls</span>
              </article>
              <article className="portal-metric">
                <span className="portal-metric-label">Average call</span>
                <strong className="portal-metric-value">{average > 0 ? talk(average) : "—"}</strong>
                <span className="portal-metric-detail">Per attributed call</span>
              </article>
            </section>

            {calls.length === 0 ? (
              <article className="portal-card">
                <PortalCardHeader
                  icon="S"
                  title="No production attributed yet"
                  description="These numbers come only from real transferred calls carrying your email."
                />
                <EmptyState
                  title="Zeros, honestly"
                  body="No transferred calls have been attributed to you yet. The moment the dialer routes you a call, it lands here — nothing on this page is ever entered by hand or estimated."
                />
              </article>
            ) : null}
          </>
        )}
      </main>
    </PortalShell>
  );
}
