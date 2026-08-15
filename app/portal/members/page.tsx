import { asc } from "drizzle-orm";
import { getDb } from "../../../db";
import { portalMembers } from "../../../db/schema";
import { ROLE_LABELS, can, requireCapability } from "../access";
import { EmptyState, PortalCardHeader, PortalPageIntro, PortalShell } from "../components";
import { readFaultCopy, readRows } from "../read-guard";
import { MemberControls } from "./manager";

export const dynamic = "force-dynamic";

/**
 * Membership roster. Visible to managers and above; only owners and
 * administrators hold `members.manage`, which is what any future grant,
 * role-change, or revocation action will assert before writing.
 */
export default async function MembersPage() {
  const session = await requireCapability("members.view", "/portal/members");
  const manages = can(session, "members.manage");

  const { rows: members, fault } = await readRows("portal_members", () =>
    getDb()
      .select()
      .from(portalMembers)
      .orderBy(asc(portalMembers.role), asc(portalMembers.email)),
  );

  return (
    <PortalShell session={session} current="/portal/members" section="Members">
      <main className="portal-main">
        <PortalPageIntro
          eyebrow="Access control"
          title={<>Portal <em>members</em></>}
          subtitle={
            <>
            Signing in proves identity only. A person reaches the portal solely
            because they hold an active row here, granted by an authorized human
            before their first sign-in.
            </>
          }
        />

        <section className="portal-card">
          <PortalCardHeader
            icon="◇"
            title="Member roster"
            description={
              fault
                ? "The roster could not be read, so no count is shown."
                : `${members.length} verified membership record${members.length === 1 ? "" : "s"} in the portal database.`
            }
          />
          {fault ? (
            <EmptyState {...readFaultCopy(fault, "The member roster")} />
          ) : members.length === 0 ? (
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
          <PortalCardHeader
            icon="＋"
            title="Granting and revoking access"
            description="Every change is checked on the server and written to the audit log."
          />
          {fault ? (
            // The controls edit a roster this page could not read. Offering
            // them over an empty list would invite a grant decided against
            // nothing — the operator could not see who already holds what.
            // The server would still enforce every rule; the interface would
            // simply have misled them into the attempt.
            <p className="portal-lede">
              The roster could not be read, so the controls are withheld until
              it can. Nothing about your permissions has changed — this is a
              database fault, not an access decision. If it persists, the SQL in
              CORE_PLATFORM_RECORD.md § 5 still works from the D1 console.
            </p>
          ) : manages ? (
            <>
              <p className="portal-lede">
                Your role holds <code>members.manage</code>. Grants, role
                changes, and revocations take effect immediately and are
                recorded in the audit log under your name.
              </p>
              <MemberControls
                selfEmail={session.email}
                members={members.map((member) => ({
                  email: member.email,
                  displayName: member.displayName,
                  role: member.role,
                  status: member.status,
                }))}
              />
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
    </PortalShell>
  );
}
