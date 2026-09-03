-- CORE portal — Book of Business entries, owner direction 2026-09-02
--
-- WHY. The Book of Business page rendered every field of a customer and a
-- policy with "no source connected" behind it. The owner's order is that a
-- member can enter their own customers and policies directly, so the book
-- fills from the member's own hand until an approved CRM or carrier feed
-- exists. Two tables, both SELF-SCOPED: every row carries the member_id of
-- the book it belongs to, every read filters on the session's own resolved
-- membership, and every write is made only by the routes under
-- /portal/book/* behind the new `book.edit.self` capability.
--
-- WHAT IS DELIBERATELY NOT STORED. No full phone number and no full policy
-- number. The platform's standing rule for callers — full numbers are never
-- plain text — is kept for customers a member types in: the route masks the
-- phone server-side and stores the masked form plus the last four digits,
-- and the policy number is kept as its last four characters only. A book
-- that is later fed by a system of record can widen this by its own
-- migration and its own review; this one does not.
--
-- Bounds mirror the routes' validation so a bypassed validator still cannot
-- store an absurd row: names 1..80 chars, notes up to 500, premium 0..
-- 100,000,000 cents ($1,000,000/month), dates as YYYY-MM-DD.
--
-- Idempotent on purpose (IF NOT EXISTS throughout).
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0014_book_of_business.sql --remote

CREATE TABLE IF NOT EXISTS `book_customers` (
  `id`            INTEGER PRIMARY KEY AUTOINCREMENT,
  `member_id`     INTEGER NOT NULL REFERENCES `portal_members`(`id`),
  `display_name`  TEXT NOT NULL
    CHECK (length(`display_name`) >= 1 AND length(`display_name`) <= 80),
  -- "***-***-1234", derived server-side; never the full number.
  `phone_masked`  TEXT
    -- GLOB has no escape character: a literal asterisk is a one-member class.
    CHECK (`phone_masked` IS NULL OR `phone_masked` GLOB '[*][*][*]-[*][*][*]-[0-9][0-9][0-9][0-9]'),
  `phone_last4`   TEXT
    CHECK (`phone_last4` IS NULL OR `phone_last4` GLOB '[0-9][0-9][0-9][0-9]'),
  -- Two-letter US state, upper case, or nothing.
  `state`         TEXT
    CHECK (`state` IS NULL OR `state` GLOB '[A-Z][A-Z]'),
  `note`          TEXT
    CHECK (`note` IS NULL OR length(`note`) <= 500),
  `status`        TEXT NOT NULL DEFAULT 'active'
    CHECK (`status` IN ('active','inactive')),
  `created_at`    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS `book_customers_member_idx`
  ON `book_customers` (`member_id`, `status`);

CREATE TABLE IF NOT EXISTS `book_policies` (
  `id`                  INTEGER PRIMARY KEY AUTOINCREMENT,
  `member_id`           INTEGER NOT NULL REFERENCES `portal_members`(`id`),
  `customer_id`         INTEGER NOT NULL REFERENCES `book_customers`(`id`),
  `carrier`             TEXT NOT NULL
    CHECK (length(`carrier`) >= 1 AND length(`carrier`) <= 60),
  `product`             TEXT NOT NULL
    CHECK (length(`product`) >= 1 AND length(`product`) <= 60),
  -- Last four characters of the policy number, or nothing. Never the whole.
  `policy_last4`        TEXT
    CHECK (`policy_last4` IS NULL OR `policy_last4` GLOB '[A-Za-z0-9][A-Za-z0-9][A-Za-z0-9][A-Za-z0-9]'),
  `status`              TEXT NOT NULL
    CHECK (`status` IN ('applied','requirement','in_force','lapsed','declined','withdrawn')),
  -- Monthly premium, integer cents.
  `premium_cents`       INTEGER NOT NULL DEFAULT 0
    CHECK (`premium_cents` >= 0 AND `premium_cents` <= 100000000),
  `effective_on`        TEXT
    CHECK (`effective_on` IS NULL OR `effective_on` GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  `next_action`         TEXT
    CHECK (`next_action` IS NULL OR length(`next_action`) <= 120),
  `next_action_on`      TEXT
    CHECK (`next_action_on` IS NULL OR `next_action_on` GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  `created_at`          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS `book_policies_member_idx`
  ON `book_policies` (`member_id`, `status`);
CREATE INDEX IF NOT EXISTS `book_policies_customer_idx`
  ON `book_policies` (`customer_id`);

INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'book.edit.self',
    'allow',
    'book_tables_created',
    'book_customers,book_policies',
    '{"note":"Book of Business gains member-entered customers and policies by owner direction. Self-scoped rows, masked phone and last-four policy number only, written solely by the member''s own session through /portal/book/customers and /portal/book/policies."}'
  );
