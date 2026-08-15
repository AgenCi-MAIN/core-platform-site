import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  MEMBER_STATUSES,
  PORTAL_ROLES,
  portalMembers,
  type MemberStatus,
  type PortalRole,
} from "../../../../db/schema";
import {
  assertCapability,
  isPortalRole,
  normalizeEmail,
  recordAudit,
  resolvePortalAccess,
} from "../../access";

export const dynamic = "force-dynamic";

/**
 * Membership writes — grant, role change, status change.
 *
 * Every request re-resolves the caller's session and asserts `members.manage`
 * server-side. Nothing here trusts the interface: the buttons are a
 * convenience, and hiding one has never been what stops an action.
 *
 * GOVERNANCE DEFAULTS — these were open questions before this route existed,
 * deliberately left to a human. They are now settled as follows, and each is a
 * policy choice rather than a technical constraint, so each can be changed:
 *
 *   1. SINGLE APPROVER. One holder of `members.manage` can grant any role,
 *      including owner. This matches how grants were already being applied by
 *      hand, so the interface does not quietly become stricter than the
 *      practice it replaces. If CORE wants two-person approval for owner and
 *      administrator grants, that is a real change — a pending-grants table and
 *      a second confirmation step — not a tweak to this file.
 *
 *   2. NO SELF-MODIFICATION. A member cannot change their own role or status,
 *      even holding `members.manage`. This is the one separation-of-duties rule
 *      enforced here. It prevents self-promotion, and it prevents the more
 *      common accident of an owner revoking themselves.
 *
 *   3. THE LAST ACTIVE OWNER IS PROTECTED. The final active owner cannot be
 *      demoted, suspended, or revoked. Without this the portal can be locked
 *      permanently by one wrong click, recoverable only through direct database
 *      access — which is precisely the dependency this interface exists to
 *      remove.
 *
 * Every outcome, allowed or refused, is written to the audit log.
 */

type Payload = {
  action?: unknown;
  email?: unknown;
  displayName?: unknown;
  role?: unknown;
  status?: unknown;
  note?: unknown;
};

/** Deliberately permissive: the provider is the authority on deliverability. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(error: string, status = 400) {
  return Response.json({ error }, { status });
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  // Strip C0/C1 control characters; keep everything a name may legitimately
  // contain. React escapes on render; this keeps the stored value sane.
  const cleaned = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  return cleaned ? cleaned.slice(0, max) : null;
}

export async function POST(request: Request) {
  const access = await resolvePortalAccess();
  if (!access.ok) {
    return Response.json(
      { error: "Sign in required." },
      { status: access.denial.kind === "anonymous" ? 401 : 403 },
    );
  }

  const { session } = access;
  const path = new URL(request.url).pathname;

  // Throws on refusal, and records the decision either way. The third argument
  // is the audited resource, not the request path.
  try {
    await assertCapability(session, "members.manage", "portal_members");
  } catch {
    return Response.json(
      { error: "Only an owner or administrator can change membership." },
      { status: 403 },
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return bad("Expected a JSON body.");
  }

  const action = payload.action;
  if (action !== "grant" && action !== "role" && action !== "status") {
    return bad("Unknown action.");
  }

  const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
  if (!email || !EMAIL.test(email) || email.length > 254) {
    return bad("That does not look like an email address.");
  }

  const db = getDb();

  // Self-modification: refused for role and status alike. See governance note 2.
  if (
    (action === "role" || action === "status") &&
    email === normalizeEmail(session.email)
  ) {
    await recordAudit({
      action: `members.${action}_change`,
      decision: "deny",
      reason: "self_modification_refused",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `member:${email}`,
      requestPath: path,
    });
    return bad(
      "You cannot change your own role or status. Ask another owner or administrator.",
      409,
    );
  }

  /**
   * Would this change leave the portal with no active owner? Counts owners
   * other than the target, so it answers "is this the last one" directly.
   */
  async function wouldStrandThePortal(targetEmail: string): Promise<boolean> {
    const [row] = await db
      .select({ n: sql<number>`count(*)` })
      .from(portalMembers)
      .where(
        and(
          eq(portalMembers.role, "owner"),
          eq(portalMembers.status, "active"),
          ne(portalMembers.email, targetEmail),
        ),
      );
    return (row?.n ?? 0) === 0;
  }

  const now = new Date().toISOString();

  /* ---------------------------- grant ---------------------------- */
  if (action === "grant") {
    const role = payload.role;
    if (typeof role !== "string" || !isPortalRole(role)) {
      return bad(`Role must be one of: ${PORTAL_ROLES.join(", ")}.`);
    }

    const [existing] = await db
      .select({ id: portalMembers.id, status: portalMembers.status })
      .from(portalMembers)
      .where(eq(portalMembers.email, email))
      .limit(1);

    if (existing) {
      return bad(
        "That address already has a membership record. Change its role or status instead.",
        409,
      );
    }

    const displayName = text(payload.displayName, 120);
    const note = text(payload.note, 400);

    await db.insert(portalMembers).values({
      email,
      displayName,
      role: role as PortalRole,
      status: "active",
      grantedBy: session.email,
      statusNote:
        note ?? `Granted by ${session.email} from the portal on ${now.slice(0, 10)}.`,
    });

    await recordAudit({
      action: "members.grant",
      decision: "allow",
      reason: "granted_from_portal",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `member:${email}`,
      requestPath: path,
      detail: JSON.stringify({ granted: email, role, displayName }),
    });

    return Response.json({ ok: true, email, role }, { status: 201 });
  }

  /* ------------------------ role / status ------------------------ */
  const [member] = await db
    .select()
    .from(portalMembers)
    .where(eq(portalMembers.email, email))
    .limit(1);

  if (!member) return bad("No membership record for that address.", 404);

  if (action === "role") {
    const role = payload.role;
    if (typeof role !== "string" || !isPortalRole(role)) {
      return bad(`Role must be one of: ${PORTAL_ROLES.join(", ")}.`);
    }
    if (role === member.role) {
      return bad(`That member already holds ${role}.`);
    }

    if (
      member.role === "owner" &&
      member.status === "active" &&
      role !== "owner" &&
      (await wouldStrandThePortal(email))
    ) {
      await recordAudit({
        action: "members.role_change",
        decision: "deny",
        reason: "last_active_owner_protected",
        actorEmail: session.email,
        actorSubjectId: session.subjectId,
        actorRole: session.role,
        resource: `member:${email}`,
        requestPath: path,
      });
      return bad(
        "This is the last active owner. Grant owner to someone else before changing this one.",
        409,
      );
    }

    await db
      .update(portalMembers)
      .set({ role: role as PortalRole, updatedAt: now })
      .where(eq(portalMembers.id, member.id));

    await recordAudit({
      action: "members.role_change",
      decision: "allow",
      reason: "role_changed_from_portal",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `member:${email}`,
      requestPath: path,
      detail: JSON.stringify({ from: member.role, to: role }),
    });

    return Response.json({ ok: true, email, role });
  }

  const status = payload.status;
  if (
    typeof status !== "string" ||
    !(MEMBER_STATUSES as readonly string[]).includes(status)
  ) {
    return bad(`Status must be one of: ${MEMBER_STATUSES.join(", ")}.`);
  }
  if (status === member.status) {
    return bad(`That member is already ${status}.`);
  }

  if (
    member.role === "owner" &&
    member.status === "active" &&
    status !== "active" &&
    (await wouldStrandThePortal(email))
  ) {
    await recordAudit({
      action: "members.status_change",
      decision: "deny",
      reason: "last_active_owner_protected",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      resource: `member:${email}`,
      requestPath: path,
    });
    return bad(
      "This is the last active owner. Grant owner to someone else before suspending or revoking this one.",
      409,
    );
  }

  const note = text(payload.note, 400);

  await db
    .update(portalMembers)
    .set({
      status: status as MemberStatus,
      statusNote:
        note ?? `Set to ${status} by ${session.email} on ${now.slice(0, 10)}.`,
      updatedAt: now,
    })
    .where(eq(portalMembers.id, member.id));

  await recordAudit({
    action: "members.status_change",
    decision: "allow",
    reason: "status_changed_from_portal",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource: `member:${email}`,
    requestPath: path,
    detail: JSON.stringify({ from: member.status, to: status }),
  });

  return Response.json({ ok: true, email, status });
}
