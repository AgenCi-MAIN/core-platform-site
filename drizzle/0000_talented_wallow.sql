CREATE TABLE `audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`actor_email` text,
	`actor_subject_id` text,
	`actor_role` text,
	`action` text NOT NULL,
	`resource` text,
	`request_path` text,
	`decision` text NOT NULL,
	`reason` text NOT NULL,
	`detail` text,
	CONSTRAINT "audit_events_decision_check" CHECK("audit_events"."decision" IN ('allow','deny'))
);
--> statement-breakpoint
CREATE INDEX `audit_events_occurred_idx` ON `audit_events` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_events_actor_idx` ON `audit_events` (`actor_email`);--> statement-breakpoint
CREATE INDEX `audit_events_action_idx` ON `audit_events` (`action`);--> statement-breakpoint
CREATE TABLE `portal_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`subject_id` text,
	`display_name` text,
	`role` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`granted_by` text NOT NULL,
	`granted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text,
	`status_note` text,
	CONSTRAINT "portal_members_role_check" CHECK("portal_members"."role" IN ('owner','admin','manager','agent','reviewer','support')),
	CONSTRAINT "portal_members_status_check" CHECK("portal_members"."status" IN ('active','suspended','revoked'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_members_email_idx` ON `portal_members` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `portal_members_subject_idx` ON `portal_members` (`subject_id`);--> statement-breakpoint
CREATE INDEX `portal_members_role_idx` ON `portal_members` (`role`);