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
 * Sign in with Google establishes *identity* only. It does not prove that the
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

export const OUTBOUND_DIAL_MODES = ["agent_test", "customer"] as const;
export type OutboundDialMode = (typeof OUTBOUND_DIAL_MODES)[number];

export const OUTBOUND_DIAL_STATUSES = ["pending", "queued", "failed"] as const;
export type OutboundDialStatus = (typeof OUTBOUND_DIAL_STATUSES)[number];

export const VOICE_LINE_TYPES = ["personal", "shared"] as const;
export type VoiceLineType = (typeof VOICE_LINE_TYPES)[number];

export const VOICE_ASSIGNMENT_STATUSES = ["active", "suspended", "retired"] as const;
export type VoiceAssignmentStatus = (typeof VOICE_ASSIGNMENT_STATUSES)[number];

export const VOICE_PRESENCE_STATES = ["offline", "available", "busy"] as const;
export type VoicePresenceState = (typeof VOICE_PRESENCE_STATES)[number];

export const INBOUND_VOICE_STAGES = [
  "received",
  "personal",
  "team",
  "mobile",
  "voicemail",
  "complete",
] as const;
export type InboundVoiceStage = (typeof INBOUND_VOICE_STAGES)[number];

export const INBOUND_VOICE_STATUSES = [
  "received",
  "offering",
  "connected",
  "completed",
  "voicemail",
  "failed",
] as const;
export type InboundVoiceStatus = (typeof INBOUND_VOICE_STATUSES)[number];

export const VOICE_OFFER_STATUSES = [
  "queued",
  "ringing",
  "answered",
  "answered_elsewhere",
  "missed",
  "transfer_pending",
  "sent_to_team",
] as const;
export type VoiceOfferStatus = (typeof VOICE_OFFER_STATUSES)[number];

export const VOICE_CALLBACK_STATUSES = ["open", "claimed", "completed", "dismissed"] as const;
export type VoiceCallbackStatus = (typeof VOICE_CALLBACK_STATUSES)[number];

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

/**
 * Founder-authorized calls placed by the CORE portal through SignalWire.
 *
 * Only masked destination metadata is retained. The full destination exists
 * transiently in the server-side request sent to SignalWire and is never
 * written to D1, the audit log, source code, or browser storage.
 *
 * `rateBucket` is a 30-second UTC bucket with a unique index. Inserting the
 * request before contacting SignalWire makes accidental double-clicks race on
 * the database rather than create two billable calls. This limit is stricter
 * than SignalWire's documented 1 CPS Space limit; it protects CORE's own
 * caller, but it does not pretend to coordinate unrelated apps in the Space.
 */
export const outboundDialRequests = sqliteTable(
  "outbound_dial_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    requestId: text("request_id").notNull(),
    actorEmail: text("actor_email").notNull(),
    mode: text("mode").$type<OutboundDialMode>().notNull(),
    destinationMasked: text("destination_masked"),
    rateBucket: integer("rate_bucket").notNull(),
    status: text("status").$type<OutboundDialStatus>().notNull().default("pending"),
    externalCallId: text("external_call_id"),
    failureCode: text("failure_code"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("outbound_dial_requests_request_idx").on(table.requestId),
    uniqueIndex("outbound_dial_requests_rate_bucket_idx").on(table.rateBucket),
    index("outbound_dial_requests_actor_idx").on(table.actorEmail, table.createdAt),
    check(
      "outbound_dial_requests_mode_check",
      sql`${table.mode} IN (${literalSet(OUTBOUND_DIAL_MODES)})`,
    ),
    check(
      "outbound_dial_requests_status_check",
      sql`${table.status} IN (${literalSet(OUTBOUND_DIAL_STATUSES)})`,
    ),
  ],
);

/**
 * Server-only mapping between a CORE member and a SignalWire line/subscriber.
 * Personal numbers are protected operational data; ordinary UI receives only
 * a masked form. Subscriber references deliberately contain a stable member
 * id rather than an email address.
 */
export const voiceNumberAssignments = sqliteTable(
  "voice_number_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull().references(() => portalMembers.id),
    lineType: text("line_type").$type<VoiceLineType>().notNull(),
    e164Number: text("e164_number").notNull(),
    providerNumberId: text("provider_number_id").notNull(),
    providerSubscriberId: text("provider_subscriber_id").notNull(),
    subscriberReference: text("subscriber_reference").notNull(),
    subscriberAddress: text("subscriber_address").notNull(),
    status: text("status").$type<VoiceAssignmentStatus>().notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("voice_number_assignments_number_idx").on(table.e164Number),
    uniqueIndex("voice_number_assignments_provider_idx").on(table.providerNumberId),
    uniqueIndex("voice_number_assignments_provider_subscriber_idx").on(table.providerSubscriberId),
    uniqueIndex("voice_number_assignments_subscriber_idx").on(table.subscriberReference),
    index("voice_number_assignments_member_idx").on(table.memberId, table.status),
    check(
      "voice_number_assignments_line_type_check",
      sql`${table.lineType} IN (${literalSet(VOICE_LINE_TYPES)})`,
    ),
    check(
      "voice_number_assignments_status_check",
      sql`${table.status} IN (${literalSet(VOICE_ASSIGNMENT_STATUSES)})`,
    ),
  ],
);

/** One primary, expiring browser registration per member. */
export const voicePresence = sqliteTable(
  "voice_presence",
  {
    memberId: integer("member_id").primaryKey().references(() => portalMembers.id),
    browserSessionId: text("browser_session_id").notNull(),
    readyState: text("ready_state").$type<VoicePresenceState>().notNull().default("offline"),
    lastHeartbeatAt: text("last_heartbeat_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("voice_presence_browser_session_idx").on(table.browserSessionId),
    index("voice_presence_expiry_idx").on(table.readyState, table.expiresAt),
    check(
      "voice_presence_state_check",
      sql`${table.readyState} IN (${literalSet(VOICE_PRESENCE_STATES)})`,
    ),
  ],
);

/**
 * Carrier lifecycle record for an inbound call. Full caller numbers are never
 * kept in plaintext; the optional cipher fields are populated only when an
 * authorized callback workflow genuinely needs the number.
 */
export const inboundVoiceCalls = sqliteTable(
  "inbound_voice_calls",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    providerCallId: text("provider_call_id").notNull(),
    parentProviderCallId: text("parent_provider_call_id"),
    /** Current child leg after a browser blind-transfer returns the caller to the hunt. */
    activeProviderCallId: text("active_provider_call_id"),
    lineType: text("line_type").$type<VoiceLineType>().notNull(),
    calledNumberMasked: text("called_number_masked").notNull(),
    callerNumberMasked: text("caller_number_masked").notNull(),
    callerCiphertext: text("caller_ciphertext"),
    callerCipherIv: text("caller_cipher_iv"),
    callerCipherVersion: integer("caller_cipher_version"),
    assignedMemberId: integer("assigned_member_id").references(() => portalMembers.id),
    acceptedMemberId: integer("accepted_member_id").references(() => portalMembers.id),
    routingStage: text("routing_stage").$type<InboundVoiceStage>().notNull().default("received"),
    status: text("status").$type<InboundVoiceStatus>().notNull().default("received"),
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    answeredAt: text("answered_at"),
    endedAt: text("ended_at"),
    disposition: text("disposition"),
    voicemailState: text("voicemail_state"),
    voicemailObjectKey: text("voicemail_object_key"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("inbound_voice_calls_provider_idx").on(table.providerCallId),
    uniqueIndex("inbound_voice_calls_active_provider_idx").on(table.activeProviderCallId),
    index("inbound_voice_calls_assigned_idx").on(table.assignedMemberId, table.startedAt),
    index("inbound_voice_calls_accepted_idx").on(table.acceptedMemberId, table.startedAt),
    index("inbound_voice_calls_status_idx").on(table.status, table.startedAt),
    check(
      "inbound_voice_calls_line_type_check",
      sql`${table.lineType} IN (${literalSet(VOICE_LINE_TYPES)})`,
    ),
    check(
      "inbound_voice_calls_stage_check",
      sql`${table.routingStage} IN (${literalSet(INBOUND_VOICE_STAGES)})`,
    ),
    check(
      "inbound_voice_calls_status_check",
      sql`${table.status} IN (${literalSet(INBOUND_VOICE_STATUSES)})`,
    ),
    check(
      "inbound_voice_calls_cipher_check",
      sql`(${table.callerCiphertext} IS NULL AND ${table.callerCipherIv} IS NULL AND ${table.callerCipherVersion} IS NULL) OR (${table.callerCiphertext} IS NOT NULL AND ${table.callerCipherIv} IS NOT NULL AND ${table.callerCipherVersion} IS NOT NULL)`,
    ),
  ],
);

/** Idempotent per-member offers, including honest answered-elsewhere state. */
export const voiceCallOffers = sqliteTable(
  "voice_call_offers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    voiceCallId: integer("voice_call_id").notNull().references(() => inboundVoiceCalls.id),
    stage: text("stage").$type<InboundVoiceStage>().notNull(),
    attempt: integer("attempt").notNull().default(1),
    memberId: integer("member_id").notNull().references(() => portalMembers.id),
    status: text("status").$type<VoiceOfferStatus>().notNull().default("queued"),
    offeredAt: text("offered_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    resolvedAt: text("resolved_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("voice_call_offers_once_idx").on(
      table.voiceCallId,
      table.stage,
      table.attempt,
      table.memberId,
    ),
    index("voice_call_offers_member_idx").on(table.memberId, table.offeredAt),
    check("voice_call_offers_attempt_check", sql`${table.attempt} > 0`),
    check(
      "voice_call_offers_stage_check",
      sql`${table.stage} IN (${literalSet(INBOUND_VOICE_STAGES)})`,
    ),
    check(
      "voice_call_offers_status_check",
      sql`${table.status} IN (${literalSet(VOICE_OFFER_STATUSES)})`,
    ),
  ],
);

/** Voicemail follow-up work; one task at most per inbound call. */
export const voiceCallbackTasks = sqliteTable(
  "voice_callback_tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    voiceCallId: integer("voice_call_id").notNull().references(() => inboundVoiceCalls.id),
    assignedMemberId: integer("assigned_member_id").references(() => portalMembers.id),
    claimedByMemberId: integer("claimed_by_member_id").references(() => portalMembers.id),
    voicemailObjectKey: text("voicemail_object_key"),
    status: text("status").$type<VoiceCallbackStatus>().notNull().default("open"),
    dueAt: text("due_at").notNull(),
    disposition: text("disposition"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"),
  },
  (table) => [
    uniqueIndex("voice_callback_tasks_call_idx").on(table.voiceCallId),
    index("voice_callback_tasks_assignee_idx").on(table.assignedMemberId, table.status, table.dueAt),
    index("voice_callback_tasks_claimant_idx").on(table.claimedByMemberId, table.status),
    check(
      "voice_callback_tasks_status_check",
      sql`${table.status} IN (${literalSet(VOICE_CALLBACK_STATUSES)})`,
    ),
  ],
);

/**
 * Command Center lodge passes — single-use, time-boxed, bound to one person.
 *
 * The founder holds Command Center permanently and never touches this table.
 * Everyone else reaches it only by redeeming a pass the founder issued for
 * their address, which dies on first use or on expiry, whichever comes first.
 *
 * The code itself is NEVER stored. Only its SHA-256 hash is written here, so a
 * database read — by anyone, including an operator with console access — cannot
 * recover a live code. The plaintext exists exactly once, on the screen that
 * issued it, and is never written to a file, a log, a commit, or a message.
 */
export const commandPasses = sqliteTable(
  "command_passes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    /** Lowercased email this pass is bound to. A pass is useless to anyone else. */
    email: text("email").notNull(),

    /** SHA-256 of the code, hex. The code itself is never persisted. */
    codeHash: text("code_hash").notNull(),

    /** Email of the human who issued it — the founder. */
    issuedBy: text("issued_by").notNull(),
    issuedAt: text("issued_at").notNull().default(sql`CURRENT_TIMESTAMP`),

    /** Expiry instant. A pass dies here whether or not it was ever used. */
    expiresAt: text("expires_at").notNull(),

    /** Set on redemption. A pass with this set can never be redeemed again. */
    redeemedAt: text("redeemed_at"),
    redeemedSubjectId: text("redeemed_subject_id"),

    /** Set when the founder kills a pass early. */
    revokedAt: text("revoked_at"),

    /**
     * Failed redemption attempts. A six-digit code is a small space, so a pass
     * locks itself after FIVE wrong guesses rather than waiting for expiry.
     * Guessing is therefore bounded by 5, not by 15 minutes of traffic.
     */
    failedAttempts: integer("failed_attempts").notNull().default(0),

    /** Free-text reason the founder issued it, shown in the audit view. */
    note: text("note"),
  },
  (table) => [
    index("command_passes_email_idx").on(table.email),
    index("command_passes_expires_idx").on(table.expiresAt),
  ],
);

export const MEMBER_REQUEST_STATUSES = [
  "pending",
  "approved",
  "declined",
  "withdrawn",
] as const;

export type MemberRequestStatus = (typeof MEMBER_REQUEST_STATUSES)[number];

/**
 * Requests a member has made that someone above them must decide.
 *
 * Separate from `audit_events` on purpose: the trail is append-only and
 * therefore cannot hold a status, so a pending count read from it would only
 * ever grow. Both are written — the trail records that a thing happened, this
 * row is the thing that has a state.
 */
export const memberRequests = sqliteTable("member_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestedBy: text("requested_by").notNull(),
  requestedRole: text("requested_role").notNull(),
  kind: text("kind").notNull(),
  summary: text("summary").notNull(),
  quantity: integer("quantity"),
  detail: text("detail"),
  status: text("status").$type<MemberRequestStatus>().notNull().default("pending"),
  decidedBy: text("decided_by"),
  decidedAt: text("decided_at"),
  decisionNote: text("decision_note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/**
 * One member's stated plan for one ISO week — the check-in the dashboard's
 * commitment panel writes. PLAN, never ACTUAL: nothing here is production
 * data, and the dashboard renders it on a visually distinct panel so the two
 * can never be misread as each other.
 *
 * One row per member per week (unique index), written only by the member's
 * own session through POST /portal/checkin. member_id comes from the
 * session's resolved membership — which is subject-bound in portal_members —
 * and week_key is computed server-side from the current UTC instant, so a
 * request can neither name another member nor back-date a week.
 *
 * Money is integer cents. TEXT dollars invite float drift; the founder's
 * "cost per policy = lead spend ÷ policies sold" must eventually divide this.
 */
export const weeklyCommitments = sqliteTable(
  "weekly_commitments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull().references(() => portalMembers.id),
    /** ISO-8601 week key in UTC, e.g. "2026-W36". Monday-start. */
    weekKey: text("week_key").notNull(),
    /** Planned lead spend for the week, integer cents, 0..2,000,000 ($20k). */
    leadBudgetCents: integer("lead_budget_cents").notNull(),
    /** Planned calls for the week, integer, 0..2,000. */
    callTarget: integer("call_target").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("weekly_commitments_member_week_idx").on(table.memberId, table.weekKey),
    check(
      "weekly_commitments_week_key_check",
      sql`${table.weekKey} GLOB '[0-9][0-9][0-9][0-9]-W[0-9][0-9]'`,
    ),
    check(
      "weekly_commitments_lead_budget_check",
      sql`${table.leadBudgetCents} >= 0 AND ${table.leadBudgetCents} <= 2000000`,
    ),
    check(
      "weekly_commitments_call_target_check",
      sql`${table.callTarget} >= 0 AND ${table.callTarget} <= 2000`,
    ),
  ],
);

/* ────────────────────────────────────────────────────────────────────────
 * Book of Business entries (db/sql/0014, owner direction 2026-09-02).
 * Self-scoped by member_id; masked phone and last-four policy number only.
 * ──────────────────────────────────────────────────────────────────────── */

export const BOOK_CUSTOMER_STATUSES = ["active", "inactive"] as const;
export type BookCustomerStatus = (typeof BOOK_CUSTOMER_STATUSES)[number];

export const BOOK_POLICY_STATUSES = [
  "applied",
  "requirement",
  "in_force",
  "lapsed",
  "declined",
  "withdrawn",
] as const;
export type BookPolicyStatus = (typeof BOOK_POLICY_STATUSES)[number];

export const bookCustomers = sqliteTable(
  "book_customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull().references(() => portalMembers.id),
    /** 1..80 characters, as the member typed it. */
    displayName: text("display_name").notNull(),
    /** "***-***-1234" — derived server-side from what was typed; never the full number. */
    phoneMasked: text("phone_masked"),
    phoneLast4: text("phone_last4"),
    /** Two-letter US state, upper case, or null. */
    state: text("state"),
    /** Up to 500 characters. */
    note: text("note"),
    status: text("status").$type<BookCustomerStatus>().notNull().default("active"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("book_customers_member_idx").on(table.memberId, table.status),
    check(
      "book_customers_display_name_check",
      sql`length(${table.displayName}) >= 1 AND length(${table.displayName}) <= 80`,
    ),
    check(
      "book_customers_phone_last4_check",
      sql`${table.phoneLast4} IS NULL OR ${table.phoneLast4} GLOB '[0-9][0-9][0-9][0-9]'`,
    ),
    check("book_customers_state_check", sql`${table.state} IS NULL OR ${table.state} GLOB '[A-Z][A-Z]'`),
    check("book_customers_note_check", sql`${table.note} IS NULL OR length(${table.note}) <= 500`),
    check(
      "book_customers_status_check",
      sql`${table.status} IN (${literalSet(BOOK_CUSTOMER_STATUSES)})`,
    ),
  ],
);

export const bookPolicies = sqliteTable(
  "book_policies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    memberId: integer("member_id").notNull().references(() => portalMembers.id),
    customerId: integer("customer_id").notNull().references(() => bookCustomers.id),
    carrier: text("carrier").notNull(),
    product: text("product").notNull(),
    /** Last four characters of the policy number, or null. Never the whole. */
    policyLast4: text("policy_last4"),
    status: text("status").$type<BookPolicyStatus>().notNull(),
    /** Monthly premium, integer cents, 0..100,000,000. */
    premiumCents: integer("premium_cents").notNull().default(0),
    effectiveOn: text("effective_on"),
    /** Up to 120 characters: the one next thing to do on this policy. */
    nextAction: text("next_action"),
    nextActionOn: text("next_action_on"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("book_policies_member_idx").on(table.memberId, table.status),
    index("book_policies_customer_idx").on(table.customerId),
    check("book_policies_carrier_check", sql`length(${table.carrier}) >= 1 AND length(${table.carrier}) <= 60`),
    check("book_policies_product_check", sql`length(${table.product}) >= 1 AND length(${table.product}) <= 60`),
    check(
      "book_policies_policy_last4_check",
      sql`${table.policyLast4} IS NULL OR ${table.policyLast4} GLOB '[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]'`,
    ),
    check("book_policies_status_check", sql`${table.status} IN (${literalSet(BOOK_POLICY_STATUSES)})`),
    check(
      "book_policies_premium_check",
      sql`${table.premiumCents} >= 0 AND ${table.premiumCents} <= 100000000`,
    ),
    check(
      "book_policies_effective_on_check",
      sql`${table.effectiveOn} IS NULL OR ${table.effectiveOn} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
    check("book_policies_next_action_check", sql`${table.nextAction} IS NULL OR length(${table.nextAction}) <= 120`),
    check(
      "book_policies_next_action_on_check",
      sql`${table.nextActionOn} IS NULL OR ${table.nextActionOn} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`,
    ),
  ],
);
