-- CORE portal — founder-only SignalWire outbound requests, 2026-08-20
--
-- The full customer number is intentionally absent. It exists only in the
-- transient server-to-SignalWire request; D1 keeps the masked suffix, who
-- authorized the call, and the provider lifecycle identifier.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0010_outbound_dialer.sql --remote

CREATE TABLE IF NOT EXISTS `outbound_dial_requests` (
  `id`                  INTEGER PRIMARY KEY AUTOINCREMENT,
  `request_id`          TEXT NOT NULL,
  `actor_email`         TEXT NOT NULL,
  `mode`                TEXT NOT NULL
    CHECK (`mode` IN ('agent_test','customer')),
  `destination_masked`  TEXT,
  `rate_bucket`         INTEGER NOT NULL,
  `status`              TEXT NOT NULL DEFAULT 'pending'
    CHECK (`status` IN ('pending','queued','failed')),
  `external_call_id`    TEXT,
  `failure_code`        TEXT,
  `created_at`          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS `outbound_dial_requests_request_idx`
  ON `outbound_dial_requests` (`request_id`);

-- One accepted request per 30-second UTC bucket. This protects the portal
-- from duplicate billable clicks and stays far below the carrier's 1 CPS
-- Space limit; it does not claim to coordinate unrelated Space applications.
CREATE UNIQUE INDEX IF NOT EXISTS `outbound_dial_requests_rate_bucket_idx`
  ON `outbound_dial_requests` (`rate_bucket`);

CREATE INDEX IF NOT EXISTS `outbound_dial_requests_actor_idx`
  ON `outbound_dial_requests` (`actor_email`, `created_at`);

PRAGMA optimize;
