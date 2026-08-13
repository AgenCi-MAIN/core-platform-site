-- CORE portal — initial schema
-- Matches db/schema.ts as of August 13, 2026.
--
-- Apply with:
--   npx wrangler d1 execute <DATABASE_NAME> --file=db/sql/0001_portal_init.sql --remote
-- Local development against the simulated binding:
--   npx wrangler d1 execute <DATABASE_NAME> --file=db/sql/0001_portal_init.sql --local
--
-- This file is written to be applied directly. Drizzle's own migration journal
-- (drizzle/meta/_journal.json) is still empty because drizzle-kit could not be
-- run on the authoring machine. Before the NEXT schema change, run
-- `npm run db:generate` on a machine with Node >=22.13.0 so drizzle's snapshot
-- metadata is regenerated from db/schema.ts and future diffs stay correct.

CREATE TABLE IF NOT EXISTS `portal_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`subject_id` text,
	`display_name` text,
	`role` text NOT NULL CHECK (`role` IN ('owner','admin','manager','reviewer','agent','support')),
	`status` text DEFAULT 'active' NOT NULL CHECK (`status` IN ('active','suspended','revoked')),
	`granted_by` text NOT NULL,
	`granted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text,
	`status_note` text
);

CREATE UNIQUE INDEX IF NOT EXISTS `portal_members_email_idx` ON `portal_members` (`email`);
CREATE UNIQUE INDEX IF NOT EXISTS `portal_members_subject_idx` ON `portal_members` (`subject_id`);
CREATE INDEX IF NOT EXISTS `portal_members_role_idx` ON `portal_members` (`role`);

CREATE TABLE IF NOT EXISTS `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`actor_email` text,
	`actor_subject_id` text,
	`actor_role` text,
	`action` text NOT NULL,
	`resource` text,
	`request_path` text,
	`decision` text NOT NULL CHECK (`decision` IN ('allow','deny')),
	`reason` text NOT NULL,
	`detail` text
);

CREATE INDEX IF NOT EXISTS `audit_events_occurred_idx` ON `audit_events` (`occurred_at`);
CREATE INDEX IF NOT EXISTS `audit_events_actor_idx` ON `audit_events` (`actor_email`);
CREATE INDEX IF NOT EXISTS `audit_events_action_idx` ON `audit_events` (`action`);

CREATE TABLE IF NOT EXISTS `dialer_transfers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transfer_id` text NOT NULL,
	`source_system` text NOT NULL,
	`external_call_id` text,
	`direction` text NOT NULL CHECK (`direction` IN ('inbound','outbound')),
	`status` text DEFAULT 'received' NOT NULL CHECK (`status` IN ('received','processing','ready','needs_review','failed')),
	`consent_status` text DEFAULT 'pending' NOT NULL CHECK (`consent_status` IN ('pending','verified','restricted')),
	`caller_number_masked` text,
	`agent_email` text,
	`queue_name` text,
	`started_at` text,
	`ended_at` text,
	`duration_seconds` integer CHECK (`duration_seconds` IS NULL OR `duration_seconds` >= 0),
	`recording_object_key` text,
	`recording_mime_type` text,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `dialer_transfers_transfer_id_idx` ON `dialer_transfers` (`transfer_id`);
CREATE INDEX IF NOT EXISTS `dialer_transfers_received_idx` ON `dialer_transfers` (`received_at`);
CREATE INDEX IF NOT EXISTS `dialer_transfers_status_idx` ON `dialer_transfers` (`status`);
CREATE INDEX IF NOT EXISTS `dialer_transfers_agent_idx` ON `dialer_transfers` (`agent_email`);
