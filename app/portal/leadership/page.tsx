import Link from "next/link";
import { LeadershipPlaybook } from "./playbook";
import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { dialerTransfers } from "../../../db/schema";
import { requireCapability } from "../access";
import {
  EmptyState,
  PortalCardHeader,
  PortalPageIntro,
  PortalShell,
  PrototypeNotice,
} from "../components";
import { readFaultCopy, readRows } from "../read-guard";

export const dynamic = "force-dynamic";

const SAMPLE = 200;

/**
 * Leadership — company oversight for `leadership.view.all` holders
 * (owner / admin / manager; pinned by test).
 *
 * This page reports only from sources that are actually connected. Today
 * exactly one is: the dialer transfer feed (`dialer_transfers`), the same
 * table the Call Lab reads. Leadership sees it as AGGREGATES — counts and
 * rates, never individual caller numbers or recordings — so an oversight
 * role gets the shape of operations without inheriting call-review PII.
 *
 * The other five sources named in the readiness matrix (CRM, policy,
 * retention, financial, quality) are not connected. The page says so
 * plainly rather than rendering an invented number. When the LeadTech
 * ingest socket posts its first transfer, the call-operations tile and the
 * source banner light up here on their own — no code change required.
 */
export default async function LeadershipPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  /**
   * Manager and above. `leadership.view.all` is held by owner, admin and
   * manager and by nobody else — reviewer, agent and support are refused —
   * so the founder's "Only Manager or Above" is already exactly this
   * capability. No new capability was added for the Playbook tab, because
   * adding one is a governance decision and this needed none: the tab lives
   * behind the guard the page already had.
   */
  const session = await requireCapability("leadership.view.all", "/portal/leadership");
  const params = await searchParams;
  const view = params.view === "playbook" ? "playbook" : "oversight";

  const { rows: calls, fault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        status: dialerTransfers.status,
        consentStatus: dialerTransfers.consentStatus,
        sourceSystem: dialerTransfers.sourceSystem,
        durationSeconds: dialerTransfers.durationSeconds,
      })
      .from(dialerTransfers)
      .orderBy(desc(dialerTransfers.receivedAt), desc(dialerTransfers.id))
      .limit(SAMPLE),
  );

  // A failed read looks identical to an empty table, so never render a
  // confident number over data nobody could read. Em dash = "not known".
  const metric = (value: number | string) => (fault ? "—" : value);

  const total = calls.length;
  const consentVerified = calls.filter((c) => c.consentStatus === "verified").length;
  const needsAttention = calls.filter(
    (c) => c.status === "needs_review" || c.status === "failed" || c.consentStatus !== "verified",
  ).length;
  const totalSeconds = calls.reduce((sum, c) => sum + (c.durationSeconds ?? 0), 0);
  const sources = new Set(calls.map((c) => c.sourceSystem).filter(Boolean));

  const consentRate = total > 0 ? `${Math.round((consentVerified / total) * 100)}%` : "—";
  const talkMinutes = Math.round(totalSeconds / 60);

  // The one live source is connected only once it has actually delivered.
  const callSourceConnected = !fault && total > 0;
  const sourceLabel = callSourceConnected
    ? sources.size === 1
      ? `Connected · ${[...sources][0]}`
      : `Connected · ${sources.size} sources`
    : "Source not connected";

  return (
    <PortalShell session={session} current="/portal/leadership" section="Leadership">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Company oversight"
          title={<>Leadership</>}
          subtitle="Company-wide operating evidence for authorized decision-makers — aggregates only, drawn from connected and reconciled sources."
        />

        <nav className="training-tabs" aria-label="Leadership views">
          <Link
            aria-current={view === "oversight" ? "page" : undefined}
            className={`training-tab${view === "oversight" ? " is-active" : ""}`}
            href="/portal/leadership"
          >
            <span className="training-tab-label">Oversight</span>
          </Link>
          <Link
            aria-current={view === "playbook" ? "page" : undefined}
            className={`training-tab${view === "playbook" ? " is-active" : ""}`}
            href="/portal/leadership?view=playbook"
          >
            <span className="training-tab-label">Playbook</span>
          </Link>
        </nav>

        {view === "playbook" ? (
          <LeadershipPlaybook session={session} />
        ) : (
          <>
        <section className="portal-card">
          <div className="portal-card-title-row">
            <PortalCardHeader
              icon="⌁"
              title="Leadership intelligence"
              description="Verified company metrics, exceptions, and mission priorities."
            />
            <span className={`portal-state portal-state-${callSourceConnected ? "live" : "pending"}`}>
              {sourceLabel}
            </span>
          </div>

          {fault ? (
            <EmptyState {...readFaultCopy(fault, "Leadership intelligence")} />
          ) : total === 0 ? (
            <EmptyState
              title="No company data connected"
              body="Leadership metrics will populate only after CRM, lead, policy, retention, financial, and quality sources are approved, connected, and reconciled. The call-operations feed lights up here automatically once the first authorized transfer arrives."
            />
          ) : (
            <>
              <section className="portal-dialer-metrics" aria-label="Call operations overview">
                <article className="portal-metric">
                  <span className="portal-metric-label">Transferred calls</span>
                  <strong className="portal-metric-value">{metric(total)}</strong>
                  <span className="portal-metric-detail">Newest {SAMPLE} across connected sources</span>
                </article>
                <article className="portal-metric">
                  <span className="portal-metric-label">Consent verified</span>
                  <strong className="portal-metric-value">{metric(consentRate)}</strong>
                  <span className="portal-metric-detail">Share cleared for review under the consent gate</span>
                </article>
                <article className="portal-metric">
                  <span className="portal-metric-label">Needs attention</span>
                  <strong className="portal-metric-value">{metric(needsAttention)}</strong>
                  <span className="portal-metric-detail">Pending consent, review, processing, or recovery</span>
                </article>
                <article className="portal-metric">
                  <span className="portal-metric-label">Talk time</span>
                  <strong className="portal-metric-value">{metric(`${talkMinutes}m`)}</strong>
                  <span className="portal-metric-detail">Aggregate across the sampled transfers</span>
                </article>
              </section>
              <p className="portal-fine">
                Call operations is the only connected source. These are aggregates — leadership sees
                the shape of the floor, never individual caller records or recordings. Production,
                margin, persistency, and recruiting tiles remain blank until their sources connect.
              </p>
            </>
          )}
        </section>

        <section className="portal-card">
          <PortalCardHeader
            icon="R"
            title="Data source readiness"
            description="Leadership intelligence is only as true as the sources feeding it."
          />
          <div className="portal-readiness-list">
            <SourceRow
              label="Call operations (dialer)"
              detail="Transferred-call feed into CORE — the LeadTech ingest socket."
              connected={callSourceConnected}
              connectedLabel={callSourceConnected ? sourceLabel : "Awaiting first transfer"}
            />
            <SourceRow label="CRM / lead" detail="Lead, campaign, and cost-per-lead data." connected={false} />
            <SourceRow label="Policy / production" detail="Applications, issued policies, and AP." connected={false} />
            <SourceRow label="Retention / persistency" detail="Lapse, chargeback, and persistency by vintage." connected={false} />
            <SourceRow label="Financial" detail="Commission, cash, and office P&L." connected={false} />
            <SourceRow label="Quality" detail="Conversation scoring and compliance flags." connected={false} />
          </div>
        </section>

        <PrototypeNotice>
          Leadership reports only from connected, reconciled sources and shows aggregates only.
          A blank tile means a source is not yet connected — never that a value is zero.
        </PrototypeNotice>
          </>
        )}
      </main>
    </PortalShell>
  );
}

function SourceRow({
  label,
  detail,
  connected,
  connectedLabel,
}: {
  label: string;
  detail: string;
  connected: boolean;
  connectedLabel?: string;
}) {
  return (
    <div className="portal-readiness-item">
      <span
        className={`portal-system-dot${connected ? "" : " portal-system-dot-pending"}`}
        aria-hidden="true"
      />
      <span className="portal-readiness-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className={`portal-readiness-status portal-state portal-state-${connected ? "live" : "pending"}`}>
        {connected ? (connectedLabel ?? "Connected") : "Not connected"}
      </span>
    </div>
  );
}
