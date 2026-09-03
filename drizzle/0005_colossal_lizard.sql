CREATE TABLE `book_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`display_name` text NOT NULL,
	`phone_masked` text,
	`phone_last4` text,
	`state` text,
	`note` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "book_customers_display_name_check" CHECK(length("book_customers"."display_name") >= 1 AND length("book_customers"."display_name") <= 80),
	CONSTRAINT "book_customers_phone_last4_check" CHECK("book_customers"."phone_last4" IS NULL OR "book_customers"."phone_last4" GLOB '[0-9][0-9][0-9][0-9]'),
	CONSTRAINT "book_customers_state_check" CHECK("book_customers"."state" IS NULL OR "book_customers"."state" GLOB '[A-Z][A-Z]'),
	CONSTRAINT "book_customers_note_check" CHECK("book_customers"."note" IS NULL OR length("book_customers"."note") <= 500),
	CONSTRAINT "book_customers_status_check" CHECK("book_customers"."status" IN ('active','inactive'))
);
--> statement-breakpoint
CREATE INDEX `book_customers_member_idx` ON `book_customers` (`member_id`,`status`);--> statement-breakpoint
CREATE TABLE `book_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`customer_id` integer NOT NULL,
	`carrier` text NOT NULL,
	`product` text NOT NULL,
	`policy_last4` text,
	`status` text NOT NULL,
	`premium_cents` integer DEFAULT 0 NOT NULL,
	`effective_on` text,
	`next_action` text,
	`next_action_on` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `portal_members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `book_customers`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "book_policies_carrier_check" CHECK(length("book_policies"."carrier") >= 1 AND length("book_policies"."carrier") <= 60),
	CONSTRAINT "book_policies_product_check" CHECK(length("book_policies"."product") >= 1 AND length("book_policies"."product") <= 60),
	CONSTRAINT "book_policies_policy_last4_check" CHECK("book_policies"."policy_last4" IS NULL OR "book_policies"."policy_last4" GLOB '[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]'),
	CONSTRAINT "book_policies_status_check" CHECK("book_policies"."status" IN ('applied','requirement','in_force','lapsed','declined','withdrawn')),
	CONSTRAINT "book_policies_premium_check" CHECK("book_policies"."premium_cents" >= 0 AND "book_policies"."premium_cents" <= 100000000),
	CONSTRAINT "book_policies_effective_on_check" CHECK("book_policies"."effective_on" IS NULL OR "book_policies"."effective_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "book_policies_next_action_check" CHECK("book_policies"."next_action" IS NULL OR length("book_policies"."next_action") <= 120),
	CONSTRAINT "book_policies_next_action_on_check" CHECK("book_policies"."next_action_on" IS NULL OR "book_policies"."next_action_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);
--> statement-breakpoint
CREATE INDEX `book_policies_member_idx` ON `book_policies` (`member_id`,`status`);--> statement-breakpoint
CREATE INDEX `book_policies_customer_idx` ON `book_policies` (`customer_id`);