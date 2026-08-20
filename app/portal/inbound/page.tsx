import { env } from "cloudflare:workers";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditEvents, dialerTransfers } from "../../../db/schema";
import { requireCapability } from "../access";
import { SIGNALWIRE_SOURCE_SYSTEM } from "../calls/transfer-id";
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
.inbound-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.85fr);gap:18px;margin-bottom:18px}.inbound-availability-card{position:relative;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:center;overflow:hidden;border:1px solid var(--invert-line);border-radius:20px;padding:24px;background:var(--invert-bg);box-shadow:0 22px 55px rgba(2,6,23,.26)}.inbound-availability-card:before{content:"";position:absolute;inset:-40% auto auto 55%;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--invert-accent) 16%,transparent),transparent 66%);pointer-events:none}.inbound-availability-card.is-offline:before{background:radial-gradient(circle,var(--invert-line),transparent 66%)}.inbound-availability-kicker{display:flex;align-items:center;gap:8px;color:var(--invert-muted);font-size:.72rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.inbound-live-dot{width:8px;height:8px;border-radius:50%;background:var(--invert-accent);box-shadow:0 0 0 5px rgba(34,197,94,.09),0 0 18px rgba(34,197,94,.72)}.is-offline .inbound-live-dot{background:var(--invert-subtle);box-shadow:0 0 0 5px rgba(100,116,139,.1)}.inbound-availability-copy>strong{display:block;margin-top:12px;color:var(--invert-text);font-size:clamp(1.45rem,2.5vw,2.2rem);letter-spacing:-.04em}.inbound-availability-copy p{max-width:700px;margin:7px 0 10px;color:var(--invert-muted);line-height:1.55}.inbound-availability-copy small{color:var(--invert-subtle)}.inbound-availability-actions{position:relative;z-index:1;display:grid;gap:10px;min-width:170px}.inbound-availability-actions button{border:1px solid color-mix(in srgb,var(--invert-accent) 16%,transparent);border-radius:12px;padding:12px 16px;background:linear-gradient(135deg,color-mix(in srgb,var(--invert-accent) 78%,var(--invert-deep)),color-mix(in srgb,var(--invert-accent) 46%,var(--invert-deep)));color:white;font:inherit;font-weight:850;cursor:pointer;box-shadow:0 10px 28px rgba(22,163,74,.2)}.is-available .inbound-availability-actions button{border-color:var(--invert-line);background:var(--invert-raised);color:var(--invert-text);box-shadow:none}.inbound-availability-actions button:disabled{cursor:wait;opacity:.62}.inbound-routing-caveat{font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-align:center;color:var(--invert-warning)}.inbound-save-message{grid-column:1/-1;margin:0;padding-top:12px;border-top:1px solid var(--invert-line);color:var(--invert-muted);font-size:.82rem}.inbound-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.inbound-stat{border:1px solid var(--invert-line);border-radius:16px;padding:18px;background:linear-gradient(160deg,var(--invert-bg),var(--invert-bg));min-height:128px}.inbound-stat span{display:block;color:var(--invert-muted);font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.inbound-stat strong{display:block;margin-top:14px;color:var(--invert-text);font-size:1.8rem;letter-spacing:-.04em}.inbound-stat small{display:block;margin-top:7px;color:var(--invert-muted);line-height:1.4}.inbound-bridge{border:1px solid color-mix(in srgb,var(--invert-warning) 26%,transparent);border-radius:18px;padding:22px;background:linear-gradient(145deg,color-mix(in srgb,var(--invert-warning) 14%,transparent),transparent 62%),var(--invert-bg)}.inbound-bridge-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.inbound-bridge h2{margin:0;color:var(--invert-text);font-size:1.05rem}.inbound-bridge p{margin:8px 0 0;color:var(--invert-muted);line-height:1.55;font-size:.87rem}.inbound-bridge-badge{white-space:nowrap;border:1px solid color-mix(in srgb,var(--invert-warning) 26%,transparent);border-radius:999px;padding:6px 9px;color:var(--invert-warning);background:color-mix(in srgb,var(--invert-warning) 26%,transparent);font-size:.68rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em}.inbound-flow{display:grid;gap:9px;margin-top:18px}.inbound-flow-row{display:grid;grid-template-columns:26px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--invert-line)}.inbound-flow-row b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--invert-raised);color:var(--invert-accent);font-size:.72rem}.inbound-flow-row strong{color:var(--invert-text);font-size:.83rem}.inbound-flow-row small{color:var(--invert-subtle);font-size:.72rem}.inbound-feed{overflow:hidden}.inbound-feed-head{display:flex;align-items:end;justify-content:space-between;gap:18px;margin-bottom:16px}.inbound-feed-head h2{margin:0;color:var(--invert-text);font-size:1.15rem}.inbound-feed-head p{margin:5px 0 0;color:var(--invert-muted);font-size:.82rem}.inbound-feed-list{display:grid;gap:8px}.inbound-call{display:grid;grid-template-columns:minmax(130px,1.1fr) minmax(130px,.85fr) minmax(110px,.75fr) minmax(130px,.9fr);gap:14px;align-items:center;padding:14px 16px;border:1px solid var(--invert-line);border-radius:14px;background:var(--invert-raised)}.inbound-call strong{color:var(--invert-text);font-size:.9rem}.inbound-call span,.inbound-call small{color:var(--invert-muted);font-size:.76rem}.inbound-call-status{justify-self:end;border:1px solid color-mix(in srgb,var(--invert-accent) 28%,transparent);border-radius:999px;padding:5px 9px;color:var(--invert-accent)!important;background:color-mix(in srgb,var(--invert-accent) 12%,transparent);font-size:.67rem!important;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.inbound-source-note{margin-top:14px;color:var(--invert-subtle);font-size:.75rem;line-height:1.5}.inbound-source-note strong{color:var(--invert-muted)}@media(max-width:980px){.inbound-grid{grid-template-columns:1fr}.inbound-stat-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){.inbound-availability-card{grid-template-columns:1fr}.inbound-availability-actions{min-width:0}.inbound-stat-grid{grid-template-columns:1fr}.inbound-call{grid-template-columns:1fr 1fr}.inbound-call-status{justify-self:start}.inbound-feed-head{align-items:flex-start;flex-direction:column}}
`;

export default async function InboundPage() {
  // Direct anonymous visits return to the main portal after sign-in; normal
  // use reaches this page from the authenticated portal navigation.
  const session = await requireCapability("dashboard.view.self", "/portal");
  const email = session.email.toLowerCase();

  const { rows: availabilityRows, fault: availabilityFault } = await readRows("audit_events", () =>
    getDb()
      .select({
        reason: auditEvents.reason,
        decision: auditEvents.decision,
        occurredAt: auditEvents.occurredAt,
      })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.action, "inbound.availability"),
          // Compared case-insensitively, like the transfer reads below. The
          // audit row holds the address as the session presented it, so an
          // event written under a differently-cased spelling of the same
          // account is invisible to an exact match — and an invisible "went
          // offline" row leaves this page showing the member as available.
          sql`lower(${auditEvents.actorEmail}) = ${email}`,
        ),
      )
      // Refusals are read too. A denied availability change is part of this
      // member's history, and filtering the row out would leave the older
      // "available" event on top as though the refusal never happened.
      // `id` breaks the tie: `occurred_at` has no sub-second resolution, so
      // two toggles in the same second are otherwise ordered arbitrarily.
      .orderBy(desc(auditEvents.occurredAt), desc(auditEvents.id))
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

  // Evidence that the carrier is actually writing into CORE. Nothing on this
  // page can interrogate the ingest route — it authenticates a carrier, not a
  // member — so the table is the only witness available: a row proves an event
  // arrived, and no rows proves nothing on its own.
  const { rows: ingestRows, fault: ingestFault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        records: sql<number>`count(*)`,
        latest: sql<string | null>`max(${dialerTransfers.receivedAt})`,
      })
      .from(dialerTransfers)
      .where(eq(dialerTransfers.sourceSystem, SIGNALWIRE_SOURCE_SYSTEM)),
  );

  // The newest row decides, and only then is its reason read. Selecting the
  // newest row that *said* "available" would report a member as ready long
  // after they went offline, because that older row still exists. A refusal on
  // top means the last change did not take, so the page declines to claim the
  // member is available rather than showing whatever preceded it.
  const latestAvailability = availabilityRows[0];
  const availabilityRefused = latestAvailability?.decision === "deny";
  const availability =
    !availabilityRefused && latestAvailability?.reason === "available" ? "available" : "offline";
  const availabilityLabel = availabilityFault
    ? "Availability history could not be read"
    : !latestAvailability
      ? "No saved availability preference yet"
      : availabilityRefused
        ? `Last change was refused ${when(latestAvailability.occurredAt)} — shown offline rather than assumed ready`
        : `Last changed ${when(latestAvailability.occurredAt)}`;
  const calls = ownTotals[0]?.calls ?? 0;
  const talkSeconds = ownTotals[0]?.seconds ?? 0;
  const waiting = queueTotals[0]?.calls ?? 0;
  const feedFault = recentFault ?? ownTotalsFault;

  // Only the presence of the ingest credential is read, never its value: a
  // secret must not reach a rendered page. Absent, the route has nothing to
  // authenticate a carrier POST with, so no record can arrive through it —
  // which is a different statement from "no calls came in", and the copy below
  // keeps the two apart instead of collapsing them into one reassuring line.
  const ingestCredentialed = Boolean(env.SIGNALWIRE_INGEST_SECRET);
  const ingestRecords = ingestFault ? 0 : (ingestRows[0]?.records ?? 0);
  const ingestSummary = ingestFault
    ? "Whether any call record has reached CORE could not be read just now, so this page makes no claim either way."
    : ingestRecords > 0
      ? `Call records are arriving from SignalWire: ${ingestRecords} held in CORE, most recent ${when(ingestRows[0]?.latest ?? null)}.`
      : ingestCredentialed
        ? "The SignalWire ingest credential is set on this deployment and no call record has come through it yet."
        : "The SignalWire ingest credential is not set on this deployment, so no call record can reach CORE until it is.";
  const ingestStep = ingestFault
    ? "could not be read"
    : ingestRecords > 0
      ? "receiving"
      : ingestCredentialed
        ? "awaiting the first call"
        : "not configured";

  return (
    <PortalShell session={session} current={PATH} section="Inbound Calls">
      <style>{STYLES}</style>
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Inbound operations"
          title={<>Take the next <em>live call</em>.</>}
          subtitle={`One agent-facing surface for readiness, queue visibility, and the inbound calls already attributed to you. ${ingestSummary} Routing is decided in the SignalWire console and not here: marking yourself available records your intent in CORE, and does not change which agent the carrier rings.`}
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
                <small>{ownTotalsFault ? "Call totals could not be read" : "Computed from inbound transfer records only"}</small>
              </article>
            </div>
          </div>

          <aside className="inbound-bridge">
            <div className="inbound-bridge-head">
              <div>
                <h2>Where routing is decided</h2>
                <p>
                  CORE holds the record of a call; SignalWire decides who takes it. Which number answers, which agent rings, and in what order are all set in the SignalWire console, and nothing in this portal writes back to it.
                </p>
              </div>
              <span className="inbound-bridge-badge">Records only</span>
            </div>
            <div className="inbound-flow" aria-label="Inbound routing path">
              <div className="inbound-flow-row"><b>1</b><strong>Campaign / central number</strong><small>caller dials</small></div>
              <div className="inbound-flow-row"><b>2</b><strong>SignalWire</strong><small>chooses the agent</small></div>
              <div className="inbound-flow-row"><b>3</b><strong>Agent phone</strong><small>carrier rings</small></div>
              <div className="inbound-flow-row"><b>4</b><strong>CORE record</strong><small>{ingestStep}</small></div>
              <div className="inbound-flow-row"><b>—</b><strong>Your CORE availability</strong><small>not consulted</small></div>
            </div>
          </aside>
        </div>

        <article className="portal-card inbound-feed">
          <div className="inbound-feed-head">
            <div>
              <h2>Your inbound activity</h2>
              <p>Latest transfers attributed to your authenticated member record.</p>
            </div>
            {/* A failed read returns no rows, so the pill has to name the fault
                itself — "Awaiting calls" over an unread table is a claim about
                data nobody looked at. */}
            <span className={`portal-state portal-state-${!feedFault && recentCalls.length ? "live" : "pending"}`}>
              {feedFault ? "Feed unavailable" : recentCalls.length ? "Feed active" : "Awaiting calls"}
            </span>
          </div>

          {feedFault ? (
            <EmptyState {...readFaultCopy(feedFault, "Your inbound call feed")} />
          ) : recentCalls.length === 0 ? (
            <EmptyState
              title="No inbound calls routed to you yet"
              body={`This feed reads CORE's own transfer records, filtered to your member email, and fills in when the carrier attributes a call to you. ${ingestSummary} No sample calls are shown.`}
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
            <strong>Routing boundary:</strong> your availability is written to CORE&rsquo;s audit log and read back by this page. Nothing else reads it — SignalWire picks the agent from its own console and never asks CORE — so going available here does not put you in the rotation. Records flow the other way, from the carrier into CORE; sending availability back to it needs a ring-group write, each agent&rsquo;s number held as personal data, and an approved routing policy before it can be turned on.
          </p>
        </article>
      </main>
    </PortalShell>
  );
}
