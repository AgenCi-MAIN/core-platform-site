import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "../../db";
import { appendAuditRow } from "../../db/audit";
import { isMissingTableError } from "../../db/errors";
import {
  portalMembers,
  type MemberStatus,
  type PortalRole,
} from "../../db/schema";
import { headers } from "next/headers";
import { getAuthUser, readCookie, signInPath, type AuthUser } from "../google-auth";
import { COMMAND_PASS_COOKIE, hasLivePass } from "./command-pass";

/**
 * Server-side authorization for the CORE portal.
 *
 * Two independent checks stand between a visitor and any protected data:
 *
 *   1. Identity  — Sign in with Google proves who the visitor is.
 *   2. Membership — an active `portal_members` row proves they belong to CORE
 *                   and fixes their role.
 *
 * Identity alone grants nothing. Anyone with a Google account can complete
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
  // Deleting a recording or a transcript is a SEPARATE power from reading one,
  // and it is deliberately held by roles that cannot read (admin) as well as
  // one that can (owner). Retention is a records duty, not a review activity:
  // the person who runs the two-year purge does not need to hear the calls to
  // do it, and a reader must not be able to destroy the evidence they just
  // read. Founder order 2026-08-18: "Retention-2-yrs-delete-only-ADMIN or
  // OWNER".
  "calls.recording.delete",
  // An agent's own call, and only their own. Founder order 2026-08-18:
  // "agents should def see their own call's transcript! It's the whole
  // coaching value." This is NOT a weaker calls.review — it is a different
  // shape. calls.review answers "any call"; this answers "this call, if it is
  // mine", and the ownership test is a SECOND check the route must make
  // against the row, never something the capability alone decides. A
  // capability cannot know whose call it is.
  "calls.review.self",
  "scripts.manage",
  "team.view",
  "leadership.view.all",
  "members.view",
  "members.manage",
  "audit.view",
  "pet.chat",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * Deny by default: a role holds exactly the capabilities listed here and
 * nothing else. Adding a capability to a role is a governance decision and
 * must be recorded in CORE_PLATFORM_RECORD.md § 4 (Roles and capabilities).
 */
const ROLE_CAPABILITIES: Record<PortalRole, readonly Capability[]> = {
  owner: [
    "portal.access",
    "dashboard.view.self",
    "book.view.self",
    "calls.review",
    "calls.review.self",
    "calls.recording.delete",
    "scripts.manage",
    "team.view",
    "leadership.view.all",
    "members.view",
    "members.manage",

    "pet.chat",
  ],
  admin: [
    "portal.access",
    "dashboard.view.self",
    "book.view.self",
    "calls.review.self",
    "calls.recording.delete",
    "scripts.manage",
    "team.view",
    "leadership.view.all",
    "members.view",
    "members.manage",

    "pet.chat",
  ],
  manager: [
    "portal.access",
    "dashboard.view.self",
    "book.view.self",
    "calls.review.self",
    "team.view",
    "leadership.view.all",
    "members.view",

    "pet.chat",
  ],
  reviewer: [
    "portal.access",
    "dashboard.view.self",
    "scripts.manage",
    "team.view",
    "pet.chat",
  ],
  agent: [
    "portal.access",
    "dashboard.view.self",
    "book.view.self",
    "calls.review.self",
    "pet.chat",
  ],
  support: ["portal.access", "dashboard.view.self", "team.view", "pet.chat"],
};

/**
 * Seniority, for VISIBILITY only — never for authorization.
 *
 * Founder order 2026-08-18: "you can see only RANKS below you, you can't see
 * yOUR UPLINE." A member sees their downline and themselves; they never see a
 * peer or anyone above them.
 *
 * This ladder decides who APPEARS IN A LIST. It decides nothing about what
 * anyone may DO — that stays `ROLE_CAPABILITIES`, which is deny-by-default and
 * unaffected by any number here. Keeping the two apart matters: a rank
 * comparison is an ordering and quietly invites "greater than or equal means
 * allowed", which is how a visibility ladder turns into an authorization
 * ladder nobody voted for. Capabilities are a set, not a height.
 *
 * `reviewer` and `support` are staff functions rather than rungs on the sales
 * ladder, and they are ranked below `agent` deliberately: neither carries a
 * downline, so ranking them low means they see nobody, which is the honest
 * answer for a role that supervises nobody.
 */
const ROLE_RANK: Record<PortalRole, number> = {
  owner: 60,
  admin: 50,
  manager: 40,
  agent: 30,
  reviewer: 20,
  support: 10,
};

/**
 * May `viewer` see `subject` in a roster?
 *
 * At or below, never above. The operative half of the founder's sentence is
 * "you can't see yOUR UPLINE" — peers are not upline, and hiding them breaks
 * the surfaces this is meant to protect rather than protecting them. A
 * leaderboard filtered to strictly-below shows an agent a standings table
 * containing one name, their own, which is not a leaderboard. Comparison
 * against peers is the point of that page; comparison against the people
 * above you is what was ordered hidden.
 *
 * The founder is exempt, matching every other place identity outranks role in
 * this system (`requireFounder`, `audit.view`): the person accountable for
 * the roster has to be able to read all of it.
 */
export function canSeeInRoster(
  viewer: { email: string; role: PortalRole },
  subject: { email: string; role: PortalRole },
): boolean {
  if (normalizeEmail(viewer.email) === normalizeEmail(subject.email)) return true;
  if (FOUNDER_EMAILS.has(normalizeEmail(viewer.email))) return true;
  return ROLE_RANK[subject.role] <= ROLE_RANK[viewer.role];
}

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
  | { kind: "identity_ambiguous"; email: string }
  | { kind: "invalid_role"; email: string };

export type AccessResult =
  | { ok: true; session: PortalSession }
  | { ok: false; denial: AccessDenial };

const PORTAL_ROOT = "/portal";

/**
 * Resolve the caller's portal session, or the specific reason they have none.
 * Every outcome is written to the audit log before it is returned.
 */
export async function resolvePortalAccess(
  /**
   * The path being accessed, for the audit row. State it from a literal or from
   * `new URL(request.url).pathname` — never from a request header. See the note
   * above the removed `currentPath` helper for why this is a parameter.
   */
  requestPath: string | null = null,
): Promise<AccessResult> {
  const user = await getAuthUser();

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
    await recordAudit({
      action: "portal.access",
      decision: "deny",
      reason: "not_provisioned",
      actorEmail: email,
      actorSubjectId: user.userId,
      requestPath,
    });
    return { ok: false, denial: { kind: "not_provisioned" } };
  }

  /**
   * Resolve the membership row by SUBJECT FIRST, then by email.
   *
   * Both `email` and `subject_id` are unique, so each lookup returns at most
   * one row — but they can return two DIFFERENT rows. That happens when a
   * subject is already bound to one membership and the address they now
   * present belongs to another: an address was reassigned, or a second row was
   * created for someone who already had one.
   *
   * The previous single `or(email, subject)` query with `limit(1)` and no
   * ordering resolved that case arbitrarily. Whichever row the database
   * happened to return decided whether the person was let in, refused as
   * revoked, or — worse — bound to a membership that was never theirs.
   *
   * The subject is the strong identity: it is issued by the provider and, once
   * bound, is permanent. An address is not. So the subject wins, and a genuine
   * conflict between the two is refused rather than guessed.
   */
  let subjectRow: typeof portalMembers.$inferSelect | undefined;
  let emailRow: typeof portalMembers.$inferSelect | undefined;

  try {
    [subjectRow] = await db
      .select()
      .from(portalMembers)
      .where(eq(portalMembers.subjectId, user.userId))
      .limit(1);

    [emailRow] = await db
      .select()
      .from(portalMembers)
      .where(eq(portalMembers.email, email))
      .limit(1);
  } catch (error) {
    // A bound database whose migration has not been applied has no
    // portal_members table. That used to escape as an unhandled error and
    // surface as HTTP 500 on every portal route. It is the same situation as
    // an absent binding — membership cannot be verified — so it fails closed
    // the same way, with an explanation instead of a stack trace.
    if (isMissingTableError(error)) {
      await recordAudit({
        action: "portal.access",
        decision: "deny",
        reason: "not_provisioned_schema_missing",
        actorEmail: email,
        actorSubjectId: user.userId,
        requestPath,
      });
      return { ok: false, denial: { kind: "not_provisioned" } };
    }
    // Anything else is a real fault. Do not disguise it as "not provisioned" —
    // that would be a false statement about the deployment.
    throw error;
  }

  // Two different rows matched. Refuse; a human must resolve which membership
  // this person actually holds.
  if (subjectRow && emailRow && subjectRow.id !== emailRow.id) {
    await recordAudit({
      action: "portal.access",
      decision: "deny",
      reason: "identity_ambiguous",
      actorEmail: email,
      actorSubjectId: user.userId,
      requestPath,
      detail: JSON.stringify({
        subjectBoundMemberId: subjectRow.id,
        emailMemberId: emailRow.id,
      }),
    });
    return { ok: false, denial: { kind: "identity_ambiguous", email } };
  }

  const member = subjectRow ?? emailRow;

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
  // `returnTo` is a literal at every call site and is the page's own path,
  // which makes it the honest value for the audit row.
  const result = await resolvePortalAccess(returnTo);

  if (!result.ok) {
    if (result.denial.kind === "anonymous") redirect(signInPath(returnTo));
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
      requestPath: returnTo,
    });
    redirect(`${PORTAL_ROOT}/no-access?need=${encodeURIComponent(capability)}`);
  }

  return session;
}

export function can(session: PortalSession, capability: Capability): boolean {
  return session.capabilities.includes(capability);
}

/**
 * The founder — the single owner identity. Some surfaces (audit,
 * investigator) are closed to everyone but this person, regardless of role or
 * capability: a second owner does not inherit them.
 *
 * MIGRATED 2026-08-17: btcmao518@gmail.com replaced bankerrunners@gmail.com
 * (Google locked the original account). The transition ran as a two-identity
 * set until btcmao518 was verified signed-in, bound, and reading the audit
 * log; the old identity was then removed — its Google account is locked, so
 * it can never mint a session, and the founder gate should answer exactly one
 * identity. History (seed, grants, audit rows) naming the old address is
 * truthful and stays untouched.
 *
 * This is identity, not a header claim: it is only ever tested against
 * `session.email`, which is resolved from the HMAC-signed cookie. There is no
 * request-header path to it, on purpose. Entries are lowercase because identity
 * is always compared normalized.
 */
export const FOUNDER_EMAILS: ReadonlySet<string> = new Set(["btcmao518@gmail.com"]);

export function isFounder(session: PortalSession): boolean {
  return FOUNDER_EMAILS.has(normalizeEmail(session.email));
}

/**
 * Command Center access — the founder plus individually NAMED helpers.
 *
 * Granted per person by founder order, never per role: Andrew Davidson
 * (helper dev) was added by the founder's explicit instruction on 2026-08-17
 * ("unlock COMMAND CENTER for ANDREW DAVIDSON"). THIS SET governs the Command
 * Center page only; the audit log, the investigator, and every /go/* handoff
 * remain founder-only — they answer FOUNDER_EMAILS, not this set. Note
 * plainly: a listed helper's WIDER portal access comes from their member
 * role, which this allowlist neither grants nor limits — Andrew is already a
 * live, bound owner (OWNER-DECISIONS A7; the Command Center grant is A13),
 * so he holds every role capability by that grant, not by this one.
 *
 * Like FOUNDER_EMAILS this is identity, not a header claim: tested only
 * against the cookie-resolved session email, entries lowercase. A test pins
 * this set's exact contents so a quiet addition fails in CI rather than
 * shipping — widening it is a governance decision recorded in
 * OWNER-DECISIONS.md, not a code convenience.
 */
export const COMMAND_CENTER_EMAILS: ReadonlySet<string> = new Set([
  ...FOUNDER_EMAILS,
  "andrew.davidson.zenith@gmail.com",
]);

export function isCommandCenter(session: PortalSession): boolean {
  return COMMAND_CENTER_EMAILS.has(normalizeEmail(session.email));
}

/**
 * Command Center is locked to everyone except the founder (owner decision
 * 2026-08-18: "code-per-session for ALL except Shawn"; "Yuxiang will have it
 * 24/7 UNLOCKED").
 *
 * The founder's address opens it permanently and never touches a pass.
 * Everyone else — owners included — must redeem a single-use code he issued
 * for their own address, which dies on first use or after fifteen minutes.
 *
 * This deliberately NARROWS the A13 grant: Andrew Davidson keeps his named
 * place on COMMAND_CENTER_EMAILS, which is what makes him eligible to hold a
 * pass at all, but the name alone no longer opens the door. Being on the list
 * is now necessary and not sufficient, which is the whole point of the change.
 */
export function isCommandCenterUnlocked(session: PortalSession): boolean {
  return FOUNDER_EMAILS.has(normalizeEmail(session.email));
}

/**
 * Guard for the Command Center page. Identical in shape to `requireFounder`
 * but gated on COMMAND_CENTER_EMAILS, and its denial rows say so honestly:
 * reason "command_only", because "founder_only" would be a false statement in
 * an append-only log once the gate admits a named helper. Membership is still
 * required first — an allowlisted address with no active member row never
 * reaches this check.
 */
export async function requireCommandCenter(
  returnTo: string = PORTAL_ROOT,
  action: string = "command.view",
): Promise<PortalSession> {
  const result = await resolvePortalAccess(returnTo);

  if (!result.ok) {
    if (result.denial.kind === "anonymous") redirect(signInPath(returnTo));
    redirect(`${PORTAL_ROOT}/no-access`);
  }

  const { session } = result;

  // Two independent conditions, in this order. Being on the named list is
  // necessary; for anyone but the founder it is no longer sufficient.
  if (isCommandCenter(session) && !isCommandCenterUnlocked(session)) {
    const requestHeaders = await headers();
    const passCookie = readCookie(requestHeaders.get("cookie"), COMMAND_PASS_COOKIE);
    const unlocked = await hasLivePass(passCookie, session.subjectId);

    if (!unlocked) {
      await recordAudit({
        action,
        decision: "deny",
        reason: "lodge_pass_required",
        actorEmail: session.email,
        actorSubjectId: session.subjectId,
        actorRole: session.role,
        requestPath: returnTo,
      });
      redirect(`${PORTAL_ROOT}/command/lodge?return_to=${encodeURIComponent(returnTo)}`);
    }
  }

  if (!isCommandCenter(session)) {
    await recordAudit({
      action,
      decision: "deny",
      reason: "command_only",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: returnTo,
    });
    redirect(`${PORTAL_ROOT}/no-access`);
  }

  return session;
}

/**
 * Guard for a founder-only page. Identical to `requireCapability` except the
 * gate is the seeded identity itself, not a capability a role can hold — so
 * the audit log stays reachable by exactly one person even if others are
 * owners. Anonymous → sign-in; anyone else → the explanation page, audited.
 */
export async function requireFounder(
  returnTo: string = PORTAL_ROOT,
  /**
   * The action recorded on the founder_only denial row. Defaults to
   * "audit.view" so the audit page's existing rows keep their historical
   * shape. Every OTHER founder-gated surface must pass its own: the row lands
   * in an append-only table that is never edited, so a wrong action here is a
   * false statement nothing can retract later. T3 took this gate from two call
   * sites to six, which is what made the hardcoded literal worth removing.
   */
  action: string = "audit.view",
): Promise<PortalSession> {
  const result = await resolvePortalAccess(returnTo);

  if (!result.ok) {
    if (result.denial.kind === "anonymous") redirect(signInPath(returnTo));
    redirect(`${PORTAL_ROOT}/no-access`);
  }

  const { session } = result;
  if (!isFounder(session)) {
    await recordAudit({
      action,
      decision: "deny",
      reason: "founder_only",
      actorEmail: session.email,
      actorSubjectId: session.subjectId,
      actorRole: session.role,
      requestPath: returnTo,
    });
    redirect(`${PORTAL_ROOT}/no-access`);
  }

  return session;
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
  /** The handler's own path, from `new URL(request.url).pathname`. */
  requestPath?: string,
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
    requestPath: requestPath ?? null,
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
 *
 * The insert itself is `appendAuditRow`, which reports whether the row landed.
 * That answer is deliberately discarded here. Every caller of this function is
 * a guard deciding whether to render a page, and a member who is entitled to a
 * page must still get it when the log is down — so the return type stays
 * `void`, which is the honest shape for a caller that would ignore the outcome
 * anyway. Callers that must fail closed on a dropped row use `appendAuditRow`
 * directly.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  await appendAuditRow(input);
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

/**
 * True when a query failed because the table does not exist. Defined in
 * `db/errors.ts` and re-exported here so existing importers keep working.
 *
 * It moved because it is not an access decision. A machine endpoint that never
 * resolves a session still has to classify the same error the same way, and
 * importing it from this module would pull the whole server-only access model —
 * `next/headers`, the D1 binding, the capability table — into a caller that
 * needs one regex. Keep the re-export: dropping it would make every existing
 * import a rewrite for no gain.
 */
export { isMissingTableError };

async function bindSubjectOnFirstSignIn(
  db: PortalDb,
  member: typeof portalMembers.$inferSelect,
  user: AuthUser,
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

/**
 * The request path recorded on an audit row is now stated by the caller, never
 * read from the request.
 *
 * It used to be `x-invoke-path ?? x-matched-path ?? referer`. All three are
 * client-supplied. vinext strips `x-matched-path` inbound, but **not**
 * `x-invoke-path`, and never sets it — so the first value was a raw, unfiltered
 * request header, and `referer` behind it is no better. Whatever the caller
 * chose was written into `audit_events.request_path` for the majority of rows.
 *
 * Nothing was granted by it: identity comes from the signed cookie and role
 * from the members table, and neither consults this. But the audit log is the
 * stated basis for trusting the access model, and one of its six columns was
 * authored by whoever was being audited. A reviewer opening two hundred call
 * recordings while sending `X-Invoke-Path: /portal/library` produced a
 * plausible and completely false record of an afternoon.
 *
 * It also leaked: a same-origin `Referer` carries the full query string, so
 * once `PAY_RATES_KEY` were enabled, the second factor would have been copied
 * out of the URL into a table that everyone holding `audit.view` can read.
 *
 * Every guard already knows its own path as a literal — `requireCapability`
 * takes it, route handlers derive it from `request.url`. So the path is passed
 * down explicitly, and where no caller states one the column is `null`. A blank
 * is a smaller lie than a confident wrong answer.
 */
