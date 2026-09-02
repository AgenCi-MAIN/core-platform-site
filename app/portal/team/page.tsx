import { requireCapability } from "../access";
import { EmptyState, PortalShell, PrototypeNotice } from "../components";
import { InertChip, PanelHead, PanelNote, PanelTiles, SourcePill, Tile } from "../panel";

export const dynamic = "force-dynamic";

/**
 * Team — the people and coaching panel (Dispatch R3, 2026-09-02).
 *
 * The route and its `team.view` guard are unchanged. What changed is the
 * shape: this is now the focused panel the approved artboard describes — a
 * period chip row, three tiles, and one roster table — drawn with every
 * column the team data model will carry, and with every value honest. No
 * team model is connected, so every figure is "Not provisioned" and the
 * table holds an empty state, not a fabricated roster. Member names are
 * protected data with their own capability and are not listed here.
 */
export default async function TeamPage() {
  const session = await requireCapability("team.view", "/portal/team");

  return (
    <PortalShell session={session} current="/portal/team" section="Team">
      <main className="portal-main portal-panel">
        <PanelHead
          eyebrow={
            <>
              People and coaching · <SourcePill state="protected" label="team.view" />
            </>
          }
          title="Team"
          lede="Assignments, availability, and progression evidence for your downline, once the team data model is approved and connected."
          chips={
            <>
              <InertChip current>This week</InertChip>
              <InertChip>Last week</InertChip>
              <InertChip>Quarter</InertChip>
            </>
          }
        />

        <PanelTiles label="Team at a glance">
          <Tile label="Members active" value={null} state="pending" note="roster source pending" />
          <Tile label="Answered this week" value={null} state="pending" note="team scope pending" />
          <Tile label="Coaching plans" value={null} state="pending" />
        </PanelTiles>

        <section className="portal-card portal-panel-card" aria-labelledby="team-roster-title">
          <header className="portal-panel-card-head">
            <h2 id="team-roster-title">Roster</h2>
            <SourcePill state="pending" />
          </header>
          <div className="portal-table-wrap">
            <table className="portal-panel-table">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Role</th>
                  <th scope="col">Presence</th>
                  <th scope="col">Answered</th>
                  <th scope="col">Callbacks</th>
                  <th scope="col">Rank</th>
                  <th scope="col">Coaching</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="Team operations not connected"
                      body="This workspace populates after CORE approves the team data model and connects its member, assignment, coaching, and rank-evidence sources. Rank will come from the existing leaderboard once it is wired."
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <PanelNote>
            The period chips name the windows the table will offer. They do nothing yet, and say so.
          </PanelNote>
        </section>

        <PrototypeNotice>
          No member, assignment, or coaching data is read here. The roster with names lives behind
          its own capability on the Members page.
        </PrototypeNotice>
      </main>
    </PortalShell>
  );
}
