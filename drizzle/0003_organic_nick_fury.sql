-- command_passes and member_requests predate the Drizzle journal and were
-- applied through db/sql/0006 and db/sql/0009. The generated diff originally
-- repeated them; this Sites migration contains only the genuinely new table so
-- it is safe against the existing production D1 database.
CREATE TABLE `outbound_dial_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`mode` text NOT NULL,
	`destination_masked` text,
	`rate_bucket` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`external_call_id` text,
	`failure_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "outbound_dial_requests_mode_check" CHECK("outbound_dial_requests"."mode" IN ('agent_test','customer')),
	CONSTRAINT "outbound_dial_requests_status_check" CHECK("outbound_dial_requests"."status" IN ('pending','queued','failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_dial_requests_request_idx` ON `outbound_dial_requests` (`request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_dial_requests_rate_bucket_idx` ON `outbound_dial_requests` (`rate_bucket`);--> statement-breakpoint
CREATE INDEX `outbound_dial_requests_actor_idx` ON `outbound_dial_requests` (`actor_email`,`created_at`);
