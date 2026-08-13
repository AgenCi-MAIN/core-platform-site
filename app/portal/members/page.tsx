import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { portalMembers } from "../../../db/schema";
import { ROLE_LABELS, can, requireCapability } from "../access";
import { EmptyState, PortalHeader } from "../components";

export const dynamic = "force-dynamic";

/**
 * Membership roster. Visible to managers and above; only owners and
 * administrators hold `members.manage`, which is what any future grant,
 * role-change, or revocation action will assert before writing.
 */
export default async function MembersPage() {
  const session = await requireCapability("members.view", "/portal/members");
  const manages = can(session, "members.manage");

  const members = await getDb()
    .select()
    .from(portalMembers)
    .orderBy(asc(portalMembers.role), asc(portalMembers.email));

  return (
    <>
      <PortalHeader session={session} current="/portal/members" />

      <main className="portal-main">
        <section className="portal-intro">
          <p className="eyebrow">
            <span /> Access control
          </p>
          <h1>
            Portal <em>members</em>
          </h1>
          <p className="portal-lede">
            Signing in proves identity only. A person reaches the portal solely
            because they hold an active row here, granted by an authorized human
            before their first sign-in.
          </p>
        </section>

        <section className="portal-card">
          {members.length === 0 ? (
            <EmptyState
              title="No members provisioned"
              body="Apply the portal migration and seed the first owner before anyone can sign in. Until then the portal correctly refuses every visitor."
            />
          ) : (
            <div className="portal-table-scroll">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Bound</th>
                    <th scope="col">Granted by</th>
                    <th scope="col">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.displayName ?? "—"}</strong>
                        <span className="portal-cell-sub">{member.email}</span>
                      </td>
                      <td>{ROLE_LABELS[member.role] ?? member.role}</td>
                      <td>
                        <span
                          className={`portal-status portal-status-${member.status}`}
                        >
                          {member.status}
                        </span>
                        {member.statusNote ? (
                          <span className="portal-cell-sub">
                            {member.statusNote}
                          </span>
                        ) : null}
                      </td>
                      <td>{member.subjectId ? "Yes" : "Awaiting first sign-in"}</td>
                      <td>{member.grantedBy}</td>
                      <td>{member.lastSeenAt ?? "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="portal-card">
          <h2>Granting and revoking access</h2>
          {manages ? (
            <>
              <p className="portal-lede">
                Your role holds <code>members.manage</code>. Grant, role-change,
                and revocation actions are not yet wired into this interface —
                membership changes are currently applied as reviewed SQL against
                the portal database.
              </p>
              <p className="portal-fine">
                Building those write actions in the UI is deliberately gated
                behind a human decision on approval flow, separation of duties,
                and whether a second approver is required for owner and
                administrator grants. That decision belongs to CORE leadership,
                not to J.A.R.V.I.S.
              </p>
            </>
          ) : (
            <p className="portal-lede">
              Your role can view the roster but cannot change it. Membership
              changes require <code>members.manage</code>, held by owners and
              administrators.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
