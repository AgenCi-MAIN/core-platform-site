-- CORE portal — weekly commitments, founder dashboard order 2026-09-02
--
-- WHY A TABLE. The dashboard's commitment panel shows a PLAN — lead budget
-- and call target for the current week — and a plan must be a record the
-- member actually stated, not a default the page invented. This platform's
-- rule is that every rendered number is computed from records it holds;
-- until this table exists there is no honest place for a plan to live.
--
-- WHY IT IS NOT PRODUCTION DATA. Nothing in this table is an actual. The
-- dashboard renders it on a visually separate, lighter panel precisely so
-- plan never reads as performance, and no metric tile ever derives its
-- value from a row here (cost-per-policy divides ACTUAL spend, which has no
-- source yet and therefore renders "source pending", not this budget).
--
-- ONE ROW PER MEMBER PER WEEK, upserted. member_id is the session's own
-- resolved membership (subject-bound in portal_members); week_key is
-- computed server-side (UTC ISO week, e.g. '2026-W36'). The only writer is
-- POST /portal/checkin, which cannot be pointed at another member or week.
--
-- Bounds mirror the route's validation so a bypassed validator still cannot
-- store an absurd plan: budget 0..2,000,000 cents ($20,000), target 0..2,000.
--
-- Idempotent on purpose (IF NOT EXISTS throughout) — this file must never
-- need an "ALREADY APPLIED" banner like 0012.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0013_weekly_commitments.sql --remote

CREATE TABLE IF NOT EXISTS `weekly_commitments` (
  `id`                INTEGER PRIMARY KEY AUTOINCREMENT,
  `member_id`         INTEGER NOT NULL REFERENCES `portal_members`(`id`),
  -- ISO-8601 week key in UTC, Monday-start, e.g. '2026-W36'.
  `week_key`          TEXT NOT NULL
    CHECK (`week_key` GLOB '[0-9][0-9][0-9][0-9]-W[0-9][0-9]'),
  -- Integer cents. $20,000/week is the ceiling a fat-fingered extra zero hits.
  `lead_budget_cents` INTEGER NOT NULL
    CHECK (`lead_budget_cents` >= 0 AND `lead_budget_cents` <= 2000000),
  `call_target`       INTEGER NOT NULL
    CHECK (`call_target` >= 0 AND `call_target` <= 2000),
  `created_at`        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- The upsert key and the dashboard's read: this member, this week.
CREATE UNIQUE INDEX IF NOT EXISTS `weekly_commitments_member_week_idx`
  ON `weekly_commitments` (`member_id`, `week_key`);

INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'dashboard.checkin',
    'allow',
    'weekly_commitments_table_created',
    'weekly_commitments',
    '{"note":"Weekly plan gains a table so the dashboard commitment panel can render only numbers a member actually stated. Plan data, never production data. One row per member per week, written only by the member''s own session."}'
  );
