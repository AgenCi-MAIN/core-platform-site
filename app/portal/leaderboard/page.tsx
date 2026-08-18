import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { dialerTransfers, portalMembers } from "../../../db/schema";
import { ROLE_LABELS, requireCapability } from "../access";
import { EmptyState, PortalCardHeader, PortalPageIntro, PortalShell } from "../components";
import { readFaultCopy, readRows } from "../read-guard";

export const dynamic = "force-dynamic";

const PATH = "/portal/leaderboard";

function talk(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

/**
 * Production leaderboard — every member sees it (that is the point of a
 * leaderboard). Ranks are computed ONLY from data the platform actually
 * holds: transferred calls in dialer_transfers, attributed by agent email.
 * Until call traffic flows, the board says so honestly — no sample rows, no
 * invented rankings, exactly the Book of Business "source pending" stance.
 * Members are shown by display name and role, never by email address.
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

  const { rows: transfers, fault: transfersFault } = await readRows("dialer_transfers", () =>
    getDb()
      .select({
        agentEmail: dialerTransfers.agentEmail,
        durationSeconds: dialerTransfers.durationSeconds,
      })
      .from(dialerTransfers),
  );

  const fault = membersFault ?? transfersFault;

  const totals = new Map<string, { calls: number; seconds: number }>();
  for (const transfer of transfers) {
    if (!transfer.agentEmail) continue;
    const key = transfer.agentEmail.toLowerCase();
    const entry = totals.get(key) ?? { calls: 0, seconds: 0 };
    entry.calls += 1;
    entry.seconds += transfer.durationSeconds ?? 0;
    totals.set(key, entry);
  }

  const board = members
    .map((member) => {
      const entry = totals.get(member.email.toLowerCase()) ?? { calls: 0, seconds: 0 };
      return {
        name: member.displayName ?? member.email.split("@")[0],
        role: member.role,
        calls: entry.calls,
        seconds: entry.seconds,
      };
    })
    .sort((a, b) => b.calls - a.calls || b.seconds - a.seconds);

  const anyProduction = board.some((row) => row.calls > 0);

  return (
    <PortalShell session={session} current={PATH} section="Leaderboard">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Production"
          title={<>Team <em>leaderboard</em></>}
          subtitle="Ranked by transferred calls handled and talk time — computed from the platform's own call records, never entered by hand."
          compact
        />

        <article className="portal-card">
          <div className="portal-card-title-row">
            <PortalCardHeader
              icon="L"
              title="Standings"
              description="Every active member. Rankings update as calls flow through the Call Lab."
            />
            <span className={`portal-state portal-state-${anyProduction ? "live" : "pending"}`}>
              {anyProduction ? "Live" : "Awaiting production"}
            </span>
          </div>

          {fault ? (
            <EmptyState {...readFaultCopy(fault, "The leaderboard")} />
          ) : board.length === 0 ? (
            <EmptyState
              title="No active members to rank"
              body="The roster returned no active members. This is the real state, not a placeholder."
            />
          ) : (
            <div className="portal-table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Calls handled</th>
                    <th scope="col">Talk time</th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((row, index) => (
                    <tr key={`${row.name}-${index}`}>
                      <td><strong>{index + 1}</strong></td>
                      <td><strong>{row.name}</strong></td>
                      <td>{ROLE_LABELS[row.role]}</td>
                      <td>{row.calls}</td>
                      <td>{row.seconds > 0 ? talk(row.seconds) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!fault && !anyProduction && board.length > 0 ? (
            <EmptyState
              title="Everyone is at zero — honestly"
              body="No transferred calls have been attributed to agents yet. The board ranks real production only; the first routed call starts the race."
            />
          ) : null}
        </article>
      </main>
    </PortalShell>
  );
}
