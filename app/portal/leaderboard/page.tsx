import { asc, eq, isNotNull, sql } from "drizzle-orm";
import type { CSSProperties } from "react";
import { getDb } from "../../../db";
import { dialerTransfers, portalMembers } from "../../../db/schema";
import { ROLE_LABELS, requireCapability } from "../access";
import { EmptyState, PortalPageIntro, PortalShell } from "../components";
import { readFaultCopy, readRows } from "../read-guard";

export const dynamic = "force-dynamic";

const PATH = "/portal/leaderboard";

function talk(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";
}

const STYLES = `
.leader-source{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:18px;padding:17px 19px;border:1px solid color-mix(in srgb,var(--invert-warning) 26%,transparent);border-radius:16px;background:linear-gradient(135deg,rgba(58,38,10,.18),rgba(10,16,28,.78));color:var(--invert-muted);font-size:.78rem;line-height:1.55}.leader-source strong{color:var(--invert-text)}.leader-source-badge{white-space:nowrap;border:1px solid color-mix(in srgb,var(--invert-warning) 26%,transparent);border-radius:999px;padding:5px 9px;color:var(--invert-warning);background:color-mix(in srgb,var(--invert-warning) 26%,transparent);font-size:.64rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.leader-accessible-table{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.leader-podium{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:18px;align-items:stretch}.leader-card{position:relative;overflow:hidden;min-height:285px;border:1px solid var(--invert-line);border-radius:19px;padding:18px;background:linear-gradient(155deg,var(--invert-bg),rgba(8,13,24,.93));box-shadow:0 18px 45px rgba(2,6,23,.22);animation:leader-arrive .5s ease both;animation-delay:calc(var(--leader-index) * 70ms)}.leader-card:before{content:"";position:absolute;width:170px;height:170px;border-radius:50%;right:-72px;top:-75px;background:radial-gradient(circle,rgba(56,189,248,.15),transparent 65%);pointer-events:none}.leader-card.rank-1{border-color:color-mix(in srgb,var(--invert-warning) 30%,transparent);transform:translateY(-7px);box-shadow:0 22px 55px rgba(120,78,8,.13),0 18px 45px rgba(2,6,23,.25)}.leader-card.rank-1:before{background:radial-gradient(circle,color-mix(in srgb,var(--invert-warning) 30%,transparent),transparent 65%)}.leader-card.rank-2:before{background:radial-gradient(circle,rgba(203,213,225,.16),transparent 65%)}.leader-card.rank-3:before{background:radial-gradient(circle,rgba(251,146,60,.15),transparent 65%)}@keyframes leader-arrive{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}.leader-rank-row{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center}.leader-rank{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;border:1px solid var(--invert-line);background:var(--invert-raised);color:var(--invert-text);font-size:.8rem;font-weight:900}.rank-1 .leader-rank{color:var(--invert-warning);border-color:color-mix(in srgb,var(--invert-warning) 30%,transparent);background:color-mix(in srgb,var(--invert-warning) 18%,transparent)}.leader-signal{display:flex;align-items:center;gap:6px;color:var(--invert-subtle);font-size:.62rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.leader-signal:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--invert-accent);box-shadow:0 0 12px rgba(34,197,94,.75)}.leader-avatar{position:relative;z-index:1;display:grid;place-items:center;width:54px;height:54px;margin:22px 0 13px;border-radius:17px;border:1px solid rgba(94,234,212,.2);background:linear-gradient(145deg,color-mix(in srgb,var(--invert-accent) 12%,transparent),rgba(30,41,59,.7));color:var(--invert-accent);font-size:1.05rem;font-weight:900}.leader-card h2{position:relative;z-index:1;margin:0;color:var(--invert-text);font-size:1rem;letter-spacing:-.02em}.leader-role{position:relative;z-index:1;display:block;margin-top:4px;color:var(--invert-muted);font-size:.7rem}.leader-card-metrics{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:20px}.leader-metric{border-top:1px solid var(--invert-line);padding-top:10px}.leader-metric span{display:block;color:var(--invert-subtle);font-size:.61rem;font-weight:850;letter-spacing:.07em;text-transform:uppercase}.leader-metric strong{display:block;margin-top:4px;color:var(--invert-text);font-size:.95rem}.leader-metric small{display:block;margin-top:3px;color:var(--invert-subtle);font-size:.6rem}.leader-next{overflow:hidden}.leader-next-head{display:flex;justify-content:space-between;gap:14px;align-items:end;margin-bottom:14px}.leader-next-head h2{margin:0;color:var(--invert-text);font-size:1.08rem}.leader-next-head p{margin:5px 0 0;color:var(--invert-muted);font-size:.75rem}.leader-next-grid{display:grid;gap:7px}.leader-row{display:grid;grid-template-columns:52px minmax(150px,1.3fr) minmax(100px,.8fr) minmax(90px,.7fr) minmax(115px,.8fr) minmax(85px,.65fr);gap:12px;align-items:center;padding:13px 14px;border:1px solid var(--invert-line);border-radius:13px;background:var(--invert-bg)}.leader-row.header{border:0;background:transparent;padding-top:0;padding-bottom:5px;color:var(--invert-subtle);font-size:.61rem;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.leader-row strong{color:var(--invert-text);font-size:.82rem}.leader-row span{color:var(--invert-muted);font-size:.74rem}.leader-pending{color:var(--invert-warning)!important;font-size:.68rem!important}.leader-row-rank{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--invert-raised);color:var(--invert-text)!important;font-weight:900}.leader-empty-next{padding:20px;border:1px dashed var(--invert-line);border-radius:14px;color:var(--invert-muted);font-size:.8rem}@media(max-width:1120px){.leader-podium{grid-template-columns:repeat(3,1fr)}.leader-card.rank-1{transform:none}}@media(max-width:760px){.leader-podium{grid-template-columns:1fr 1fr}.leader-row{grid-template-columns:44px 1fr 80px}.leader-row>*:nth-child(3),.leader-row>*:nth-child(4),.leader-row>*:nth-child(5){display:none}.leader-source{flex-direction:column}}@media(max-width:520px){.leader-podium{grid-template-columns:1fr}}
`;

/**
 * Top-15 production board. CORE currently owns call-transfer evidence, not the
 * carrier/CRM policy ledger. Therefore calls and talk time are live metrics;
 * deals closed and annual premium are first-class columns that remain blank
 * until a real policy source is connected. No synthetic premium is derived
 * from calls and no agent is given an invented close count.
 */
export default async function LeaderboardPage() {
  const session = await requireCapability("dashboard.view.self", "/portal/leaderboard");

  const { rows: members, fault: membersFault } = await readRows("portal_members", () =>
    getDb()
      .select({
        email: portalMembers.email,
        displayName: portalMembers.displayName,
        role: portalMembers.role,
      })
      .from(portalMembers)
      .where(eq(portalMembers.status, "active"))
      .orderBy(asc(portalMembers.email)),
  );

  const { rows: totals, fault: transfersFault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        agentKey: sql<string>`lower(${dialerTransfers.agentEmail})`,
        calls: sql<number>`count(*)`,
        seconds: sql<number>`coalesce(sum(${dialerTransfers.durationSeconds}), 0)`,
      })
      .from(dialerTransfers)
      .where(isNotNull(dialerTransfers.agentEmail))
      .groupBy(sql`lower(${dialerTransfers.agentEmail})`),
  );

  const fault = membersFault ?? transfersFault;
  const byAgent = new Map(totals.map((row) => [row.agentKey, row]));
  const board = members
    .map((member) => {
      const entry = byAgent.get(member.email.toLowerCase());
      return {
        name: member.displayName ?? "Pending first sign-in",
        role: member.role,
        calls: entry?.calls ?? 0,
        seconds: entry?.seconds ?? 0,
      };
    })
    .sort((a, b) => b.calls - a.calls || b.seconds - a.seconds || a.name.localeCompare(b.name))
    .slice(0, 15);

  const anyProduction = board.some((row) => row.calls > 0);
  const topFive = board.slice(0, 5);
  const nextTen = board.slice(5, 15);

  return (
    <PortalShell session={session} current={PATH} section="Leaderboard">
      <style>{STYLES}</style>
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Production"
          title={<>The THRIVE <em>top 15</em>.</>}
          subtitle="The first five get the spotlight; positions 6–15 stay in the chase grid. Calls and talk time are computed from CORE records now, while deals closed and annual premium wait for the policy system of record."
          compact
        />

        <div className="leader-source" role="note">
          <div>
            <strong>Premium and close data are not connected yet.</strong> The leaderboard has the exact life-brokerage fields you asked for, but it refuses to fabricate them from call activity. Connect the CRM/carrier policy feed and those two metrics can become the primary production sort.
          </div>
          <span className="leader-source-badge">Policy source pending</span>
        </div>

        {fault ? (
          <article className="portal-card"><EmptyState {...readFaultCopy(fault, "The leaderboard")} /></article>
        ) : board.length === 0 ? (
          <article className="portal-card">
            <EmptyState title="No active members to rank" body="The roster returned no active members. No placeholder agents are shown." />
          </article>
        ) : (
          <>
            {/* Retain a semantic table for assistive technology and for the
                existing privacy regression test. It contains the same top-15
                data as the visual cards and never includes member emails. */}
            <table className="leader-accessible-table">
              <caption>THRIVE top 15 production standings</caption>
              <thead>
                <tr><th>Rank</th><th>Member</th><th>Role</th><th>Deals closed</th><th>Annual premium</th><th>Calls</th><th>Talk time</th></tr>
              </thead>
              <tbody>
                {board.map((row, index) => (
                  <tr key={`semantic-${row.name}-${index}`}>
                    <td>{anyProduction ? index + 1 : "—"}</td>
                    <td>{row.name}</td>
                    <td>{ROLE_LABELS[row.role]}</td>
                    <td>Source pending</td>
                    <td>Source pending</td>
                    <td>{row.calls}</td>
                    <td>{row.seconds ? talk(row.seconds) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="leader-podium" aria-label="Top five agents">
              {topFive.map((row, index) => {
                const rank = anyProduction ? index + 1 : null;
                return (
                  <article
                    className={`leader-card rank-${rank ?? "pending"}`}
                    style={{ "--leader-index": index } as CSSProperties}
                    key={`${row.name}-${index}`}
                  >
                    <div className="leader-rank-row">
                      <span className="leader-rank">{rank ? `#${rank}` : "—"}</span>
                      <span className="leader-signal">{row.calls > 0 ? "Producing" : "Awaiting data"}</span>
                    </div>
                    <div className="leader-avatar" aria-hidden="true">{initials(row.name)}</div>
                    <h2>{row.name}</h2>
                    <span className="leader-role">{ROLE_LABELS[row.role]}</span>
                    <div className="leader-card-metrics">
                      <div className="leader-metric"><span>Deals closed</span><strong>—</strong><small>CRM pending</small></div>
                      <div className="leader-metric"><span>Annual premium</span><strong>—</strong><small>policy feed pending</small></div>
                      <div className="leader-metric"><span>Calls handled</span><strong>{row.calls}</strong><small>CORE call records</small></div>
                      <div className="leader-metric"><span>Talk time</span><strong>{row.seconds ? talk(row.seconds) : "—"}</strong><small>CORE call records</small></div>
                    </div>
                  </article>
                );
              })}
            </section>

            <article className="portal-card leader-next">
              <div className="leader-next-head">
                <div><h2>Positions 6–15</h2><p>The next ten agents, with the same production fields.</p></div>
                <span className={`portal-state portal-state-${anyProduction ? "live" : "pending"}`}>{anyProduction ? "Call ranking live" : "Awaiting production"}</span>
              </div>

              {nextTen.length ? (
                <div className="leader-next-grid">
                  <div className="leader-row header" aria-hidden="true">
                    <span>Rank</span><span>Agent</span><span>Deals</span><span>Annual premium</span><span>Calls</span><span>Talk</span>
                  </div>
                  {nextTen.map((row, index) => {
                    const rank = anyProduction ? index + 6 : null;
                    return (
                      <div className="leader-row" key={`${row.name}-${index + 5}`}>
                        <span className="leader-row-rank">{rank ? `#${rank}` : "—"}</span>
                        <div><strong>{row.name}</strong><span style={{ display: "block", marginTop: 3 }}>{ROLE_LABELS[row.role]}</span></div>
                        <span className="leader-pending">Source pending</span>
                        <span className="leader-pending">Source pending</span>
                        <strong>{row.calls}</strong>
                        <span>{row.seconds ? talk(row.seconds) : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="leader-empty-next">There are fewer than six active members, so the chase grid has no rows yet.</div>
              )}
            </article>

            {!anyProduction ? (
              <article className="portal-card" style={{ marginTop: 18 }}>
                <EmptyState title="No production rank yet" body="Every displayed member currently has zero attributed calls. The cards are roster positions only until real production enters CORE; no one is being called #1 on zero data." />
              </article>
            ) : null}
          </>
        )}
      </main>
    </PortalShell>
  );
}
