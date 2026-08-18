-- CORE portal — Command Center lodge passes, owner decision 2026-08-18
--
-- The founder holds Command Center permanently and never touches this table.
-- Everyone else reaches it only by redeeming a pass HE issued for THEIR
-- address, which dies on first use or at expiry, whichever comes first.
--
-- The code is never stored. Only its SHA-256 hash lands here, so reading this
-- table — including from the D1 console — cannot recover a live code. The
-- plaintext exists exactly once, on the screen that issued it.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0006_command_passes.sql --remote

CREATE TABLE IF NOT EXISTS `command_passes` (
  `id`                  INTEGER PRIMARY KEY AUTOINCREMENT,
  `email`               TEXT NOT NULL,
  `code_hash`           TEXT NOT NULL,
  `issued_by`           TEXT NOT NULL,
  `issued_at`           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at`          TEXT NOT NULL,
  `redeemed_at`         TEXT,
  `redeemed_subject_id` TEXT,
  `revoked_at`          TEXT,
  `failed_attempts`     INTEGER NOT NULL DEFAULT 0,
  `note`                TEXT
);

CREATE INDEX IF NOT EXISTS `command_passes_email_idx`   ON `command_passes` (`email`);
CREATE INDEX IF NOT EXISTS `command_passes_expires_idx` ON `command_passes` (`expires_at`);

-- Record the table's creation in the append-only trail.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'command.view',
    'allow',
    'lodge_pass_table_created',
    'command_passes',
    '{"note":"Command Center lodge passes: single-use, 15-minute, bound to one email, hashed at rest. Founder retains permanent unlocked access and never uses a pass."}'
  );
