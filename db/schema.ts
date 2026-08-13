import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * CORE portal data model.
 *
 * Sign in with ChatGPT establishes *identity* only. It does not prove that the
 * person signing in belongs to CORE. Membership and role live here, and every
 * protected read and write checks this table server-side. A person who can sign
 * in but has no active row in `portalMembers` has no portal access.
 *
 * NOTE ON CHECK CONSTRAINTS: `$type<T>()` is a compile-time annotation only and
 * emits no database constraint. Relying on it alone let `drizzle-kit generate`
 * produce DDL without the `role`, `status`, and `decision` restrictions that
 * `db/sql/0001_portal_init.sql` applies by hand — a database that would accept
 * role values the application refuses to honor.
 *
 * The `check(...)` constraints below close that gap: generated migrations now
 * carry the same restrictions as the hand-written DDL. They are derived from
 * the constant arrays in this file, so adding a role or status updates the
 * constraint automatically instead of leaving the two definitions to drift.
 */

/**
 * Render a string-literal set for a SQL `IN (...)` clause. Inputs are the
 * compile-time constants declared in this file — never user input.
 */
function literalSet(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value}'`).join(","));
}

export const AUDIT_DECISIONS = ["allow", "deny"] as const;

export type AuditDecision = (typeof AUDIT_DECISIONS)[number];

export const PORTAL_ROLES = [
  "owner",
  "admin",
  "manager",
  "agent",
  "reviewer",
  "support",
] as const;

export type PortalRole = (typeof PORTAL_ROLES)[number];

export const MEMBER_STATUSES = ["active", "suspended", "revoked"] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const DIALER_TRANSFER_DIRECTIONS = ["inbound", "outbound"] as const;
export type DialerTransferDirection = (typeof DIALER_TRANSFER_DIRECTIONS)[number];

export const DIALER_TRANSFER_STATUSES = [
  "received",
  "processing",
  "ready",
  "needs_review",
  "failed",
] as const;
export type DialerTransferStatus = (typeof DIALER_TRANSFER_STATUSES)[number];

export const CALL_CONSENT_STATUSES = ["pending", "verified", "restricted"] as const;
export type CallConsentStatus = (typeof CALL_CONSENT_STATUSES)[number];

export const portalMembers = sqliteTable(
  "portal_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    /**
     * Lowercased email, the stable allowlist key. Membership is granted to an
     * email by an authorized human before that person ever signs in.
     */
    email: text("email").notNull(),

    /**
     * The Sites identity-provider subject (`oai-authenticated-user-id`). Null
     * until the member's first successful sign-in, then bound permanently so a
     * later email change at the provider cannot silently transfer access.
     */
    subjectId: text("subject_id"),

    displayName: text("display_name"),
    role: text("role").$type<PortalRole>().notNull(),
    status: text("status").$type<MemberStatus>().notNull().default("active"),

    /** Email of the human who granted this membership. */
    grantedBy: text("granted_by").notNull(),
    grantedAt: text("granted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastSeenAt: text("last_seen_at"),

    /** Free-text reason for the current status, shown in the admin view. */
    statusNote: text("status_note"),
  },
  (table) => [
    uniqueIndex("portal_members_email_idx").on(table.email),
    uniqueIndex("portal_members_subject_idx").on(table.subjectId),
    index("portal_members_role_idx").on(table.role),
    check(
      "portal_members_role_check",
      sql`${table.role} IN (${literalSet(PORTAL_ROLES)})`,
    ),
    check(
      "portal_members_status_check",
      sql`${table.status} IN (${literalSet(MEMBER_STATUSES)})`,
    ),
  ],
);

/**
 * Append-only authorization and access record. Every allow and every deny is
 * written here. Nothing in the portal updates or deletes these rows.
 */
export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    /** Null when an anonymous visitor is turned away before identifying. */
    actorEmail: text("actor_email"),
    actorSubjectId: text("actor_subject_id"),
    actorRole: text("actor_role"),

    /** Capability or operation attempted, e.g. "members.manage". */
    action: text("action").notNull(),
    resource: text("resource"),
    requestPath: text("request_path"),

    /** "allow" or "deny". */
    decision: text("decision").$type<AuditDecision>().notNull(),

    /** Machine-readable reason, e.g. "not_a_member", "capability_granted". */
    reason: text("reason").notNull(),

    /** Optional JSON detail. Must never contain credentials or secrets. */
    detail: text("detail"),
  },
  (table) => [
    index("audit_events_occurred_idx").on(table.occurredAt),
    index("audit_events_actor_idx").on(table.actorEmail),
    index("audit_events_action_idx").on(table.action),
    check(
      "audit_events_decision_check",
      sql`${table.decision} IN (${literalSet(AUDIT_DECISIONS)})`,
    ),
  ],
);

/**
 * Metadata for calls transferred from an approved dialer into CORE.
 * Recording bytes live in the CALL_RECORDINGS R2 bucket; D1 keeps only the
 * protected index and lifecycle state needed by the Call Lab inbox.
 */
export const dialerTransfers = sqliteTable(
  "dialer_transfers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    transferId: text("transfer_id").notNull(),
    sourceSystem: text("source_system").notNull(),
    externalCallId: text("external_call_id"),
    direction: text("direction").$type<DialerTransferDirection>().notNull(),
    status: text("status").$type<DialerTransferStatus>().notNull().default("received"),
    consentStatus: text("consent_status").$type<CallConsentStatus>().notNull().default("pending"),
    callerNumberMasked: text("caller_number_masked"),
    agentEmail: text("agent_email"),
    queueName: text("queue_name"),
    startedAt: text("started_at"),
    endedAt: text("ended_at"),
    durationSeconds: integer("duration_seconds"),
    recordingObjectKey: text("recording_object_key"),
    recordingMimeType: text("recording_mime_type"),
    receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("dialer_transfers_transfer_id_idx").on(table.transferId),
    index("dialer_transfers_received_idx").on(table.receivedAt),
    index("dialer_transfers_status_idx").on(table.status),
    index("dialer_transfers_agent_idx").on(table.agentEmail),
    check(
      "dialer_transfers_direction_check",
      sql`${table.direction} IN (${literalSet(DIALER_TRANSFER_DIRECTIONS)})`,
    ),
    check(
      "dialer_transfers_status_check",
      sql`${table.status} IN (${literalSet(DIALER_TRANSFER_STATUSES)})`,
    ),
    check(
      "dialer_transfers_consent_check",
      sql`${table.consentStatus} IN (${literalSet(CALL_CONSENT_STATUSES)})`,
    ),
    check(
      "dialer_transfers_duration_check",
      sql`${table.durationSeconds} IS NULL OR ${table.durationSeconds} >= 0`,
    ),
  ],
);
