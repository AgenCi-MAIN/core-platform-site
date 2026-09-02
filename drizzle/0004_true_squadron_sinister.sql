CREATE TABLE `inbound_voice_calls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider_call_id` text NOT NULL,
	`parent_provider_call_id` text,
	`active_provider_call_id` text,
	`line_type` text NOT NULL,
	`called_number_masked` text NOT NULL,
	`caller_number_masked` text NOT NULL,
	`caller_ciphertext` text,
	`caller_cipher_iv` text,
	`caller_cipher_version` integer,
	`assigned_member_id` integer,
	`accepted_member_id` integer,
	`routing_stage` text DEFAULT 'received' NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`answered_at` text,
	`ended_at` text,
	`disposition` text,
	`voicemail_state` text,
	`voicemail_object_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`assigned_member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accepted_member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "inbound_voice_calls_line_type_check" CHECK("inbound_voice_calls"."line_type" IN ('personal','shared')),
	CONSTRAINT "inbound_voice_calls_stage_check" CHECK("inbound_voice_calls"."routing_stage" IN ('received','personal','team','mobile','voicemail','complete')),
	CONSTRAINT "inbound_voice_calls_status_check" CHECK("inbound_voice_calls"."status" IN ('received','offering','connected','completed','voicemail','failed')),
	CONSTRAINT "inbound_voice_calls_cipher_check" CHECK(("inbound_voice_calls"."caller_ciphertext" IS NULL AND "inbound_voice_calls"."caller_cipher_iv" IS NULL AND "inbound_voice_calls"."caller_cipher_version" IS NULL) OR ("inbound_voice_calls"."caller_ciphertext" IS NOT NULL AND "inbound_voice_calls"."caller_cipher_iv" IS NOT NULL AND "inbound_voice_calls"."caller_cipher_version" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inbound_voice_calls_provider_idx` ON `inbound_voice_calls` (`provider_call_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `inbound_voice_calls_active_provider_idx` ON `inbound_voice_calls` (`active_provider_call_id`);--> statement-breakpoint
CREATE INDEX `inbound_voice_calls_assigned_idx` ON `inbound_voice_calls` (`assigned_member_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `inbound_voice_calls_accepted_idx` ON `inbound_voice_calls` (`accepted_member_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `inbound_voice_calls_status_idx` ON `inbound_voice_calls` (`status`,`started_at`);--> statement-breakpoint
CREATE TABLE `voice_call_offers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`voice_call_id` integer NOT NULL,
	`stage` text NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`member_id` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`offered_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`resolved_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`voice_call_id`) REFERENCES `inbound_voice_calls`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "voice_call_offers_attempt_check" CHECK("voice_call_offers"."attempt" > 0),
	CONSTRAINT "voice_call_offers_stage_check" CHECK("voice_call_offers"."stage" IN ('received','personal','team','mobile','voicemail','complete')),
	CONSTRAINT "voice_call_offers_status_check" CHECK("voice_call_offers"."status" IN ('queued','ringing','answered','answered_elsewhere','missed','transfer_pending','sent_to_team'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_call_offers_once_idx` ON `voice_call_offers` (`voice_call_id`,`stage`,`attempt`,`member_id`);--> statement-breakpoint
CREATE INDEX `voice_call_offers_member_idx` ON `voice_call_offers` (`member_id`,`offered_at`);--> statement-breakpoint
CREATE TABLE `voice_callback_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`voice_call_id` integer NOT NULL,
	`assigned_member_id` integer,
	`claimed_by_member_id` integer,
	`voicemail_object_key` text,
	`status` text DEFAULT 'open' NOT NULL,
	`due_at` text NOT NULL,
	`disposition` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`voice_call_id`) REFERENCES `inbound_voice_calls`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`claimed_by_member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "voice_callback_tasks_status_check" CHECK("voice_callback_tasks"."status" IN ('open','claimed','completed','dismissed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_callback_tasks_call_idx` ON `voice_callback_tasks` (`voice_call_id`);--> statement-breakpoint
CREATE INDEX `voice_callback_tasks_assignee_idx` ON `voice_callback_tasks` (`assigned_member_id`,`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `voice_callback_tasks_claimant_idx` ON `voice_callback_tasks` (`claimed_by_member_id`,`status`);--> statement-breakpoint
CREATE TABLE `voice_number_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`line_type` text NOT NULL,
	`e164_number` text NOT NULL,
	`provider_number_id` text NOT NULL,
	`provider_subscriber_id` text NOT NULL,
	`subscriber_reference` text NOT NULL,
	`subscriber_address` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "voice_number_assignments_line_type_check" CHECK("voice_number_assignments"."line_type" IN ('personal','shared')),
	CONSTRAINT "voice_number_assignments_status_check" CHECK("voice_number_assignments"."status" IN ('active','suspended','retired'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_number_assignments_number_idx` ON `voice_number_assignments` (`e164_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `voice_number_assignments_provider_idx` ON `voice_number_assignments` (`provider_number_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `voice_number_assignments_provider_subscriber_idx` ON `voice_number_assignments` (`provider_subscriber_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `voice_number_assignments_subscriber_idx` ON `voice_number_assignments` (`subscriber_reference`);--> statement-breakpoint
CREATE INDEX `voice_number_assignments_member_idx` ON `voice_number_assignments` (`member_id`,`status`);--> statement-breakpoint
CREATE TABLE `voice_presence` (
	`member_id` integer PRIMARY KEY NOT NULL,
	`browser_session_id` text NOT NULL,
	`ready_state` text DEFAULT 'offline' NOT NULL,
	`last_heartbeat_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "voice_presence_state_check" CHECK("voice_presence"."ready_state" IN ('offline','available','busy'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_presence_browser_session_idx` ON `voice_presence` (`browser_session_id`);--> statement-breakpoint
CREATE INDEX `voice_presence_expiry_idx` ON `voice_presence` (`ready_state`,`expires_at`);--> statement-breakpoint
CREATE TABLE `weekly_commitments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`week_key` text NOT NULL,
	`lead_budget_cents` integer NOT NULL,
	`call_target` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "weekly_commitments_week_key_check" CHECK("weekly_commitments"."week_key" GLOB '[0-9][0-9][0-9][0-9]-W[0-9][0-9]'),
	CONSTRAINT "weekly_commitments_lead_budget_check" CHECK("weekly_commitments"."lead_budget_cents" >= 0 AND "weekly_commitments"."lead_budget_cents" <= 2000000),
	CONSTRAINT "weekly_commitments_call_target_check" CHECK("weekly_commitments"."call_target" >= 0 AND "weekly_commitments"."call_target" <= 2000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weekly_commitments_member_week_idx` ON `weekly_commitments` (`member_id`,`week_key`);