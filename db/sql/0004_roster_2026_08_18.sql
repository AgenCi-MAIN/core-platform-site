-- CORE portal — roster corrections, owner decisions 2026-08-18
--
-- TWO changes, both owner-ordered on 2026-08-18, both retaining their rows.
-- Nothing here deletes a membership record: the roster is the account of who
-- held access and when, and a deleted row erases that account. Status is what
-- carries the decision — `app/portal/access.ts` refuses any row whose status
-- is not `active`, so a revoked row grants nothing while still being readable.
--
-- These are D1-console operations, not portal actions. Owner rows are
-- peer-protected: /portal/members/manage refuses to change another owner's
-- role or status (`owner_peer_protected`), by governance decision 2026-08-15.
--
-- This file contains identity allowlist changes only. It must never contain
-- passwords, API keys, tokens, or any other secret.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0004_roster_2026_08_18.sql --remote

-- 1 ─────────────────────────────────────────────────────────────────────────
-- Nate Nguyen leaves the roster. Owner's official decision, 2026-08-18: he
-- decided not to invest. Access ends; the record of his membership remains.
UPDATE `portal_members`
SET `status`      = 'revoked',
    `status_note` = 'Left the roster 2026-08-18 by owner decision: decided not to invest. Row retained for the record; this address can no longer reach the portal.',
    `updated_at`  = CURRENT_TIMESTAMP
WHERE `email` = 'epiclife.nguyen@gmail.com';

-- 2 ─────────────────────────────────────────────────────────────────────────
-- The founder's retired identity is marked retired in the database, which it
-- has been in reality since Google locked the account on 2026-08-17. It was
-- still stored as `active`, so every roster and leaderboard surface rendered
-- "Yuxiang Mao (Shawn)" twice — as though the founder were two people. The
-- live identity btcmao518@gmail.com is untouched and remains an active owner.
UPDATE `portal_members`
SET `status`      = 'revoked',
    `status_note` = 'Retired identity. Google locked this account 2026-08-17 and it can never sign in; superseded by btcmao518@gmail.com (A9). Row retained for the record.',
    `updated_at`  = CURRENT_TIMESTAMP
WHERE `email` = 'bankerrunners@gmail.com';

-- Record both in the append-only trail, so the roster change is in the log
-- rather than only in the roster.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'members.manage',
    'allow',
    'owner_decision_roster_departure',
    'portal_members',
    '{"email":"epiclife.nguyen@gmail.com","from":"active","to":"revoked","decision":"2026-08-18 owner decision: declined to invest","row":"retained"}'
  ),
  (
    'btcmao518@gmail.com',
    'members.manage',
    'allow',
    'retired_identity_marked',
    'portal_members',
    '{"email":"bankerrunners@gmail.com","from":"active","to":"revoked","reason":"Google-locked 2026-08-17, superseded by btcmao518@gmail.com (A9)","row":"retained"}'
  );

-- Verify (expect: epiclife + bankerrunners revoked; btcmao518, ryandavidson
-- and andrew.davidson active):
--   SELECT email, display_name, role, status FROM portal_members ORDER BY status, email;
