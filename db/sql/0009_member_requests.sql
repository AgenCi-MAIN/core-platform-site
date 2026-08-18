-- CORE portal — member requests, founder order 2026-08-18
--
-- WHY A TABLE AND NOT A QUERY OVER audit_events. Requests are written today
-- as `marketplace.request` rows in the append-only trail, which records that
-- someone ASKED and can never record what was decided — audit_events is
-- immutable by design, so a row cannot later become approved. A pending count
-- read from it would therefore only ever grow, and a notification bubble over
-- it would climb forever and be ignored inside a week.
--
-- So: state lives here, and the trail keeps recording. Both. The audit row
-- remains the account of what happened; this row is the thing with a status.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0009_member_requests.sql --remote

CREATE TABLE IF NOT EXISTS `member_requests` (
  `id`              INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Who asked. Stored lowercase; every join against portal_members in this
  -- codebase normalises case, and a mixed-case email here would silently
  -- never match its owner.
  `requested_by`    TEXT NOT NULL,
  `requested_role`  TEXT NOT NULL,
  -- What kind of thing is being asked for. Open text rather than a CHECK: the
  -- catalogue grows, and SQLite cannot alter a CHECK without rebuilding the
  -- table, so a fixed list here would make adding a request type a migration.
  `kind`            TEXT NOT NULL,
  `summary`         TEXT NOT NULL,
  `quantity`        INTEGER CHECK (`quantity` IS NULL OR `quantity` > 0),
  `detail`          TEXT,
  `status`          TEXT NOT NULL DEFAULT 'pending'
    CHECK (`status` IN ('pending','approved','declined','withdrawn')),
  -- Set together, by the CHECK below: a decided request always names who
  -- decided it. An approval nobody signed is not an approval.
  `decided_by`      TEXT,
  `decided_at`      TEXT,
  `decision_note`   TEXT,
  `created_at`      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CHECK ((`status` = 'pending') = (`decided_by` IS NULL)),
  CHECK ((`decided_by` IS NULL) = (`decided_at` IS NULL))
);

-- The badge query: pending work, newest first.
CREATE INDEX IF NOT EXISTS `member_requests_status_idx`
  ON `member_requests` (`status`, `created_at`);

-- "What have I asked for" on the requester's own page.
CREATE INDEX IF NOT EXISTS `member_requests_requester_idx`
  ON `member_requests` (`requested_by`);

INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'marketplace.request',
    'allow',
    'member_requests_table_created',
    'member_requests',
    '{"note":"Requests gain a status so a pending count can exist. audit_events keeps recording every ask and every decision; it cannot hold the status itself because it is append-only, which is the point of it."}'
  );
