CREATE TABLE `dialer_transfers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transfer_id` text NOT NULL,
	`source_system` text NOT NULL,
	`external_call_id` text,
	`direction` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`consent_status` text DEFAULT 'pending' NOT NULL,
	`caller_number_masked` text,
	`agent_email` text,
	`queue_name` text,
	`started_at` text,
	`ended_at` text,
	`duration_seconds` integer,
	`recording_object_key` text,
	`recording_mime_type` text,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "dialer_transfers_direction_check" CHECK("dialer_transfers"."direction" IN ('inbound','outbound')),
	CONSTRAINT "dialer_transfers_status_check" CHECK("dialer_transfers"."status" IN ('received','processing','ready','needs_review','failed')),
	CONSTRAINT "dialer_transfers_consent_check" CHECK("dialer_transfers"."consent_status" IN ('pending','verified','restricted')),
	CONSTRAINT "dialer_transfers_duration_check" CHECK("dialer_transfers"."duration_seconds" IS NULL OR "dialer_transfers"."duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dialer_transfers_transfer_id_idx` ON `dialer_transfers` (`transfer_id`);--> statement-breakpoint
CREATE INDEX `dialer_transfers_received_idx` ON `dialer_transfers` (`received_at`);--> statement-breakpoint
CREATE INDEX `dialer_transfers_status_idx` ON `dialer_transfers` (`status`);--> statement-breakpoint
CREATE INDEX `dialer_transfers_agent_idx` ON `dialer_transfers` (`agent_email`);