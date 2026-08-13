import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "../../db";
import {
  auditEvents,
  portalMembers,
  type MemberStatus,
  type PortalRole,
} from "../../db/schema";
import { getChatGPTUser, chatGPTSignInPath, type ChatGPTUser } from "../chatgpt-auth";

/**
 * Server-side authorization for the CORE portal.
 *
 * Two independent checks stand between a visitor and any protected data:
 *
 *   1. Identity  — Sign in with ChatGPT proves who the visitor is.
 *   2. Membership — an active `portal_members` row proves they belong to CORE
 *                   and fixes their role.
 *
 * Identity alone grants nothing. Anyone with a ChatGPT account can complete
 * step 1, so step 2 is what actually protects the portal. Both run on the
 * server on every request; nothing here may be moved to the client.
 *
 * This module is server-only by construction: it reads request headers and the
 * D1 binding, neither of which exists in a browser. Import it exclusively from
 * server components, route handlers, and server actions — never from a file
 * carrying the "use client" directive.
 */

export const CAPABILITIES = [
  "portal.access",
  "dashboard.view.self",
  "book.view.self",
  "calls.review",
  "scripts.manage",
  "team.view",
  "leadership.view.all",
  "members.view",
  "members.manage",
  "audit.view",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * Deny by default: a role holds exactly the capabilities listed here and
 * nothing else. Adding a capability to a role is a governance decision and
 * should be recorded in CORE_JARVIS_MASTER_LOG.md.
 */
const ROLE_CAPABILITIES: Record<PortalRole, readonly Capability[]> = {
  owner: [
    "portal.access",
    "dashboard.view.self",
    "book.view.self",
    "calls.review",
    "scripts.manage",
    "team.view",
    "leadership.view.all",
    "members.view",
    "members.manage",
    "audit.view",
  ],
  admin: [
    "portal.access",
    "dashboard.view.self",
    "book.view.self",
    "calls.review",
    "scripts.manage",
    "team.view",
    "leadership.view.all",
    "members.view",
    "members.manage",
    "audit.view",
  ],
  manager: [
    "portal.access",
    "dashboard.view.self",
    "book.view.self",
    "calls.review",
    "team.view",
    "leadership.view.all",
    "members.view",
  ],
  reviewer: [
    "portal.access",
    "dashboard.view.self",
    "calls.review",
    "scripts.manage",
    "team.view",
  ],
  agent: ["portal.access", "dashboard.view.self", "book.view.self"],
  support: ["portal.access", "dashboard.view.self", "team.view"],
};

export const ROLE_LABELS: Record<PortalRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  reviewer: "Reviewer / Coach",
  agent: "Agent",
  support: "Support",
};

export type PortalSession = {
  memberId: number;
  email: string;
  displayName: string;
  subjectId: string;
  role: PortalRole;
  status: MemberStatus;
  capabilities: readonly Capability[];
};

export type AccessDenial =
  | { kind: "anonymous" }
  | { kind: "not_provisioned" }
  | { kind: "not_a_member"; email: string }
  | { kind: "suspended"; email: string; status: MemberStatus; note: string | null }
  | { kind: "subject_conflict"; email: string }
  | { kind: "invalid_role"; email: string };

export type AccessResult =
  | { ok: true; session: PortalSession }
  | { ok: false; denial: AccessDenial };

const PORTAL_ROOT = "/portal";

/**
 * Resolve the caller's portal session, or the specific reason they have none.
 * Every outcome is written to the audit log before it is returned.
 */
export async function resolvePortalAccess(): Promise<AccessResult> {
  const requestPath = await currentPath();
  const user = await getChatGPTUser();

  if (!user) {
    await recordAudit({
      action: "portal.access",
      decision: "deny",
      reason: "anonymous",
      requestPath,
    });
    return { ok: false, denial: { kind: "anonymous" } };
  }

  const email = normalizeEmail(user.email);
  const db = tryGetDb();

  if (!db) {
    // The membership table is the only thing that can grant access. If it is
    // unreachable we fail closed rather than guessing.
    return { ok: false, denial: { kind: "not_provisioned" } };
  }

  const [member] = await db
    .select()
    .from(portalMembers)
    .where(or(eq(portalMembers.email, email), eq(portalMembers.subjectId, user.userId)))
    .limit(1);

  if (!member) {
    await recordAudit({
      action: "portal.access",
      decision: "deny",
      reason: "not_a_member",
      actorEmail: email,
      actorSubjectId: user.userId,
      requestPath,
    });
    return { ok: false, denial: { kind: "not_a_member", email } };
  }

  // A membership row is bound to the first subject that claims it. If a
  // different subject later presents the same email, refuse rather than hand
  // over the existing member's role.
  if (member.subjectId && member.subjectId !== user.userId) {
    await recordAudit({
      action: "portal.access",
      decision: "deny",
      reason: "subject_conflict",
      actorEmail: email,
      actorSubjectId: user.userId,
      requestPath,
      detail: JSON.stringify({ boundMemberId: member.id }),
    });
    return { ok: false, denial: { kind: "subject_conflict", email } };
  }

  if (member.status !== "active") {
    await recordAudit({
      action: "portal.access",
      decision: "deny",
      reason: `status_${member.status}`,
      actorEmail: email,
      actorSubjectId: user.userId,
      actorRole: member.role,
      requestPath,
    });
    return {
      ok: false,
      denial: {
        kind: "suspended",
        email,
        status: member.status,
        note: member.statusNote,
      },
    };
  }

  // The `role` column is plain text. A value that is not one of the six known
  // roles has no capability set, so refuse rather than issue a session whose
  // permissions are undefined.
  if (!isPortalRole(member.role)) {
    await recordAudit({
      action: "portal.access",
      decision: "deny",
      reason: "invalid_role",
      actorEmail: email,
      actorSubjectId: user.userId,
      actorRole: member.role,
      requestPath,
      detail: JSON.stringify({ memberId: member.id }),
    });
    return { ok: false, denial: { kind: "invalid_role", email } };
  }

  await bindSubjectOnFirstSignIn(db, member, user);

  const session: PortalSession = {
    memberId: member.id,
    email: member.email,
    displayName: member.displayName ?? user.displayName,
    subjectId: user.userId,
    role: member.role,
    status: member.status,
    capabilities: ROLE_CAPABILITIES[member.role],
  };

  await recordAudit({
    action: "portal.access",
    decision: "allow",
    reason: "active_member",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    requestPath,
  });

  return { ok: true, session };
}

/**
 * Guard for a protected page. Sends anonymous visitors through sign-in and
 * everyone else who lacks access to the explanation page. Returns only for a
 * caller who holds `capability`.
 */
export async function requireCapability(
  capability: Capability,
  returnTo: string = PORTAL_ROOT,
): Promise<PortalSession> {
  const result = await resolvePortalAccess();

  if (!result.ok) {
    if (result.denial.kind === "anonymous") redirect(chatGPTSignInPath(returnTo));
    redirect(`${PORTAL_ROOT}/no-access`);
  }

  const { session } = result;
  if (!can(session, capability)) {
    await recordAudit({
      action: capability,
      decision: "deny",
      reason: "capability_not_held",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: await currentPath(),
    });
    redirect(`${PORTAL_ROOT}/no-access?need=${encodeURIComponent(capability)}`);
  }

  return session;
}

export function can(session: PortalSession, capability: Capability): boolean {
  return session.capabilities.includes(capability);
}

/**
 * Assert a capability for a write action. Unlike `requireCapability` this
 * throws instead of redirecting, so it is safe to call from route handlers and
 * server actions where a redirect would mask the failure.
 */
export async function assertCapability(
  session: PortalSession,
  capability: Capability,
  resource?: string,
): Promise<void> {
  const allowed = can(session, capability);
  await recordAudit({
    action: capability,
    decision: allowed ? "allow" : "deny",
    reason: allowed ? "capability_granted" : "capability_not_held",
    actorEmail: session.email,
    actorSubjectId: session.subjectId,
    actorRole: session.role,
    resource,
    requestPath: await currentPath(),
  });

  if (!allowed) {
    throw new Error(`Forbidden: ${session.role} does not hold ${capability}`);
  }
}

export type AuditInput = {
  action: string;
  decision: "allow" | "deny";
  reason: string;
  actorEmail?: string | null;
  actorSubjectId?: string | null;
  actorRole?: string | null;
  resource?: string | null;
  requestPath?: string | null;
  detail?: string | null;
};

/**
 * Append one audit row. Never throws: a logging failure must not become a
 * denial-of-service on the portal, but it is surfaced on the server console so
 * the gap is visible.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const db = tryGetDb();
    if (!db) return;

    await db.insert(auditEvents).values({
      action: input.action,
      decision: input.decision,
      reason: input.reason,
      actorEmail: input.actorEmail ?? null,
      actorSubjectId: input.actorSubjectId ?? null,
      actorRole: input.actorRole ?? null,
      resource: input.resource ?? null,
      requestPath: input.requestPath ?? null,
      detail: input.detail ?? null,
    });
  } catch (error) {
    console.error("[portal] audit write failed", error);
  }
}

export function capabilitiesForRole(role: PortalRole): readonly Capability[] {
  return ROLE_CAPABILITIES[role] ?? [];
}

export function isPortalRole(value: string): value is PortalRole {
  return Object.prototype.hasOwnProperty.call(ROLE_CAPABILITIES, value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** True when the D1 binding is configured and reachable. */
export function isPortalProvisioned(): boolean {
  return tryGetDb() !== null;
}

type PortalDb = ReturnType<typeof getDb>;

function tryGetDb(): PortalDb | null {
  try {
    return getDb();
  } catch {
    return null;
  }
}

async function bindSubjectOnFirstSignIn(
  db: PortalDb,
  member: typeof portalMembers.$inferSelect,
  user: ChatGPTUser,
): Promise<void> {
  const now = new Date().toISOString();
  const needsSubject = !member.subjectId;
  const needsName = !member.displayName && Boolean(user.displayName);

  try {
    await db
      .update(portalMembers)
      .set({
        subjectId: member.subjectId ?? user.userId,
        displayName: needsName ? user.displayName : member.displayName,
        lastSeenAt: now,
        updatedAt: needsSubject || needsName ? now : member.updatedAt,
      })
      .where(eq(portalMembers.id, member.id));

    if (needsSubject) {
      await recordAudit({
        action: "members.bind_subject",
        decision: "allow",
        reason: "first_sign_in",
        actorEmail: member.email,
        actorSubjectId: user.userId,
        actorRole: member.role,
        resource: `member:${member.id}`,
      });
    }
  } catch (error) {
    console.error("[portal] failed to record sign-in", error);
  }
}

async function currentPath(): Promise<string | null> {
  try {
    const requestHeaders = await headers();
    return (
      requestHeaders.get("x-invoke-path") ??
      requestHeaders.get("x-matched-path") ??
      requestHeaders.get("referer") ??
      null
    );
  } catch {
    return null;
  }
}
