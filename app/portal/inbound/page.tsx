import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEvents, dialerTransfers } from "../../../db/schema";
import { requireCapability } from "../access";
import { EmptyState, PortalPageIntro, PortalShell } from "../components";
import { readFaultCopy, readRows } from "../read-guard";
import { InboundAvailabilityControl } from "./availability-control";

export const dynamic = "force-dynamic";

const PATH = "/portal/inbound";

function duration(seconds: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toString().padStart(2, "0")}s`;
}

function when(value: string | null): string {
  if (!value) return "Time pending";
  const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

const STYLES = `
.inbound-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.85fr);gap:18px;margin-bottom:18px}.inbound-availability-card{position:relative;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;overflow:hidden;border:1px solid rgba(148,163,184,.16);border-radius:20px;padding:24px;background:linear-gradient(145deg,rgba(11,17,32,.96),rgba(9,14,26,.86));box-shadow:0 22px 55px rgba(2,6,23,.26)}.inbound-availability-card:before{content:"";position:absolute;inset:-40% auto auto 55%;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,.16),transparent 66%);pointer-events:none}.inbound-availability-card.is-offline:before{background:radial-gradient(circle,rgba(148,163,184,.12),transparent 66%)}.inbound-availability-kicker{display:flex;align-items:center;gap:8px;color:#a7b4c7;font-size:.72rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.inbound-live-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 5px rgba(34,197,94,.09),0 0 18px rgba(34,197,94,.72)}.is-offline .inbound-live-dot{background:#64748b;box-shadow:0 0 0 5px rgba(100,116,139,.1)}.inbound-availability-copy>strong{display:block;margin-top:12px;color:#f8fafc;font-size:clamp(1.45rem,2.5vw,2.2rem);letter-spacing:-.04em}.inbound-availability-copy p{max-width:700px;margin:7px 0 10px;color:#9caabd;line-height:1.55}.inbound-availability-copy small{color:#6f819a}.inbound-availability-actions{position:relative;z-index:1;display:grid;gap:10px;min-width:170px}.inbound-availability-actions button{border:1px solid rgba(52,211,153,.34);border-radius:12px;padding:12px 16px;background:linear-gradient(135deg,#16a34a,#0f766e);color:white;font:inherit;font-weight:850;cursor:pointer;box-shadow:0 10px 28px rgba(22,163,74,.2)}.is-available .inbound-availability-actions button{border-color:rgba(148,163,184,.26);background:#151d2d;color:#dbe4f0;box-shadow:none}.inbound-availability-actions button:disabled{cursor:wait;opacity:.62}.inbound-routing-caveat{font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-align:center;color:#f59e0b}.inbound-save-message{grid-column:1/-1;margin:0;padding-top:12px;border-top:1px solid rgba(148,163,184,.12);color:#b7c4d7;font-size:.82rem}.inbound-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.inbound-stat{border:1px solid rgba(148,163,184,.14);border-radius:16px;padding:18px;background:linear-gradient(160deg,rgba(18,27,45,.88),rgba(9,14,25,.86));min-height:128px}.inbound-stat span{display:block;color:#7d8ca2;font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.inbound-stat strong{display:block;margin-top:14px;color:#f8fafc;font-size:1.8rem;letter-spacing:-.04em}.inbound-stat small{display:block;margin-top:7px;color:#8f9db1;line-height:1.4}.inbound-bridge{border:1px solid rgba(245,158,11,.2);border-radius:18px;padding:22px;background:linear-gradient(145deg,rgba(56,35,10,.18),rgba(12,17,29,.9))}.inbound-bridge-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.inbound-bridge h2{margin:0;color:#f8fafc;font-size:1.05rem}.inbound-bridge p{margin:8px 0 0;color:#9eabc0;line-height:1.55;font-size:.87rem}.inbound-bridge-badge{white-space:nowrap;border:1px solid rgba(245,158,11,.28);border-radius:999px;padding:6px 9px;color:#fbbf24;background:rgba(245,158,11,.07);font-size:.68rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em}.inbound-flow{display:grid;gap:9px;margin-top:18px}.inbound-flow-row{display:grid;grid-template-columns:26px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid rgba(148,163,184,.1)}.inbound-flow-row b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#121c2d;color:#5eead4;font-size:.72rem}.inbound-flow-row strong{color:#dbe5f1;font-size:.83rem}.inbound-flow-row small{color:#667892;font-size:.72rem}.inbound-feed{overflow:hidden}.inbound-feed-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:16px}.inbound-feed-head h2{margin:0;color:#f8fafc;font-size:1.15rem}.inbound-feed-head p{margin:5px 0 0;color:#8d9db2;font-size:.82rem}.inbound-feed-list{display:grid;gap:8px}.inbound-call{display:grid;grid-template-columns:minmax(130px,1.1fr) minmax(130px,.85fr) minmax(110px,.75fr) minmax(130px,.9fr);gap:14px;align-items:center;padding:14px 16px;border:1px solid rgba(148,163,184,.11);border-radius:14px;background:rgba(12,18,31,.72)}.inbound-call strong{color:#e8eef7;font-size:.9rem}.inbound-call span,.inbound-call small{color:#8494ab;font-size:.76rem}.inbound-call-status{justify-self:end;border:1px solid rgba(45,212,191,.2);border-radius:999px;padding:5px 9px;color:#5eead4!important;background:rgba(20,184,166,.06);font-size:.67rem!important;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.inbound-source-note{margin-top:14px;color:#697b94;font-size:.75rem;line-height:1.5}.inbound-source-note strong{color:#a8b5c7}@media(max-width:980px){.inbound-grid{grid-template-columns:1fr}.inbound-stat-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.inbound-availability-card{grid-template-columns:1fr}.inbound-availability-actions{min-width:0}.inbound-stat-grid{grid-template-columns:1fr}.inbound-call{grid-template-columns:1fr 1fr}.inbound-call-status{justify-self:start}.inbound-feed-head{align-items:flex-start;flex-direction:column}}
`;

export default async function InboundPage() {
  // The returnTo stays an inline literal (not PATH) so the route-coverage
  // scanner in tests/rendered-html.test.mjs can verify this guard.
  const session = await requireCapability("dashboard.view.self", "/portal/inbound");
  const email = session.email.toLowerCase();

  const { rows: availabilityRows, fault: availabilityFault } = await readRows("audit_events", () =>
    getDb()
      .select({ reason: auditEvents.reason, occurredAt: auditEvents.occurredAt })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.action, "inbound.availability"),
          eq(auditEvents.actorEmail, session.email),
          eq(auditEvents.decision, "allow"),
        ),
      )
      .orderBy(desc(auditEvents.occurredAt))
      .limit(1),
  );

  const { rows: ownTotals, fault: ownTotalsFault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        calls: sql<number>`count(*)`,
        seconds: sql<number>`coalesce(sum(${dialerTransfers.durationSeconds}), 0)`,
      })
      .from(dialerTransfers)
      .where(
        and(
          eq(dialerTransfers.direction, "inbound"),
          sql`lower(${dialerTransfers.agentEmail}) = ${email}`,
        ),
      ),
  );

  const { rows: queueTotals, fault: queueFault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({ calls: sql<number>`count(*)` })
      .from(dialerTransfers)
      .where(and(eq(dialerTransfers.direction, "inbound"), isNull(dialerTransfers.agentEmail))),
  );

  const { rows: recentCalls, fault: recentFault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        transferId: dialerTransfers.transferId,
        callerNumberMasked: dialerTransfers.callerNumberMasked,
        queueName: dialerTransfers.queueName,
        status: dialerTransfers.status,
        consentStatus: dialerTransfers.consentStatus,
        durationSeconds: dialerTransfers.durationSeconds,
        receivedAt: dialerTransfers.receivedAt,
      })
      .from(dialerTransfers)
      .where(
        and(
          eq(dialerTransfers.direction, "inbound"),
          sql`lower(${dialerTransfers.agentEmail}) = ${email}`,
        ),
      )
      .orderBy(desc(dialerTransfers.receivedAt))
      .limit(10),
  );

  const latestAvailability = availabilityRows[0];
  const availability = latestAvailability?.reason === "available" ? "available" : "offline";
  const availabilityLabel = availabilityFault
    ? "Availability history could not be read"
    : latestAvailability
      ? `Last changed ${when(latestAvailability.occurredAt)}`
      : "No saved availability preference yet";
  const calls = ownTotals[0]?.calls ?? 0;
  const talkSeconds = ownTotals[0]?.seconds ?? 0;
  const waiting = queueTotals[0]?.calls ?? 0;
  const feedFault = recentFault ?? ownTotalsFault;

  return (
    <PortalShell session={session} current={PATH} section="Inbound Calls">
      <style>{STYLES}</style>
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Inbound operations"
          title={<>Take the next <em>live call</em>.</>}
          subtitle="One agent-facing surface for readiness, queue visibility, and the inbound calls already attributed to you. The telephony feeds are real where data exists; write-side routing stays explicitly gated until the Retreaver/Twilio bridge is connected."
          compact
        />

        <div className="inbound-grid">
          <div>
            <InboundAvailabilityControl
              initialStatus={availability}
              updatedLabel={availabilityLabel}
            />

            <div className="inbound-stat-grid" style={{ marginTop: 12 }}>
              <article className="inbound-stat">
                <span>Unassigned queue</span>
                <strong>{queueFault ? "—" : waiting}</strong>
                <small>{queueFault ? "Queue could not be read" : "Inbound transfers not yet attributed to an agent"}</small>
              </article>
              <article className="inbound-stat">
                <span>Routed to you</span>
                <strong>{ownTotalsFault ? "—" : calls}</strong>
                <small>{ownTotalsFault ? "Call totals could not be read" : "All inbound transfers attributed to your member email"}</small>
              </article>
              <article className="inbound-stat">
                <span>Your talk time</span>
                <strong>{ownTotalsFault ? "—" : duration(talkSeconds)}</strong>
                <small>Computed from inbound transfer records only</small>
              </article>
            </div>
          </div>

          <aside className="inbound-bridge">
            <div className="inbound-bridge-head">
              <div>
                <h2>Routing bridge</h2>
                <p>
                  CORE can read inbound transfer evidence today. The control plane that actually tells Retreaver or Twilio which agent should ring is not connected yet.
                </p>
              </div>
              <span className="inbound-bridge-badge">Read-only</span>
            </div>
            <div className="inbound-flow" aria-label="Inbound routing path">
              <div className="inbound-flow-row"><b>1</b><strong>Campaign / central number</strong><small>source</small></div>
              <div className="inbound-flow-row"><b>2</b><strong>Retreaver / Twilio</strong><small>router</small></div>
              <div className="inbound-flow-row"><b>3</b><strong>CORE availability</strong><small>saved</small></div>
              <div className="inbound-flow-row"><b>4</b><strong>Agent delivery</strong><small>bridge pending</small></div>
            </div>
          </aside>
        </div>

        <article className="portal-card inbound-feed">
          <div className="inbound-feed-head">
            <div>
              <h2>Your inbound activity</h2>
              <p>Latest transfers attributed to your authenticated member record.</p>
            </div>
            <span className={`portal-state portal-state-${recentCalls.length ? "live" : "pending"}`}>
              {recentCalls.length ? "Feed active" : "Awaiting calls"}
            </span>
          </div>

          {feedFault ? (
            <EmptyState {...readFaultCopy(feedFault, "Your inbound call feed")} />
          ) : recentCalls.length === 0 ? (
            <EmptyState
              title="No inbound calls routed to you yet"
              body="The feed is connected to CORE's transfer records and will populate when an inbound transfer is attributed to your member email. No sample calls are shown."
            />
          ) : (
            <div className="inbound-feed-list">
              {recentCalls.map((call) => (
                <div className="inbound-call" key={call.transferId}>
                  <div>
                    <strong>{call.callerNumberMasked ?? "Masked caller"}</strong>
                    <span>{call.queueName ?? "Inbound queue"}</span>
                  </div>
                  <div>
                    <strong>{duration(call.durationSeconds)}</strong>
                    <span>talk time</span>
                  </div>
                  <div>
                    <strong>{call.consentStatus}</strong>
                    <span>{when(call.receivedAt)}</span>
                  </div>
                  <small className="inbound-call-status">{call.status.replaceAll("_", " ")}</small>
                </div>
              ))}
            </div>
          )}

          <p className="inbound-source-note">
            <strong>Routing boundary:</strong> marking yourself available is persisted in CORE, but it does not yet change carrier, Retreaver, or Twilio routing. That write-side integration needs credentials and an approved routing policy before it can be turned on.
          </p>
        </article>
      </main>
    </PortalShell>
  );
}
