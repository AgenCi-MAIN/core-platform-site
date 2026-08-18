-- CORE portal — Nate Nguyen returned to manager, founder order 2026-08-18
--
-- WHY THIS FILE EXISTS. A16 set `epiclife.nguyen@gmail.com` to
-- manager/active and was verified by query the same day. The live roster was
-- later found showing him as **owner**, carrying the note "Restored to owner
-- 2026-08-18 by owner decision." The founder's response, on being shown it:
-- "i DID NOT RESTORE! he is a MANAGER!"
--
-- So the note is false. It attributes a decision to the owner that the owner
-- did not make, and it sits in the roster where the next person to read it
-- will believe it.
--
-- WHAT IS KNOWN ABOUT THE WRITE, stated as fact and not as accusation:
--
--   The portal's own member-management route writes status notes in exactly
--   two shapes (app/portal/members/manage/route.ts):
--     "Granted by <email> from the portal on <date>."
--     "Set to <status> by <email> on <date>."
--   The observed note matches neither, and that route's status path sets
--   `status` only — it never writes `role`. There is no code path in this
--   application that can move an existing member from manager to owner.
--
--   Therefore the change was made outside the application: a direct D1
--   console statement, or a hand-passed `note` on a route that does not
--   change roles. Either way the portal did not author it.
--
-- THE STRUCTURAL PROBLEM THIS EXPOSES, which outlives the fix: a D1 console
-- statement can set any row to any role and writes no `audit_events` row,
-- because the audit trail is written by the application and the console is
-- underneath it. Every deliberate roster change in this repo has been made
-- that way, including A15 and A16 — so the practice that made this possible
-- is our own. The trail is only as complete as the promise to use the file
-- route, and this is the day that promise was worth something.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0008_nate_manager_restored_2026_08_18.sql --remote

UPDATE `portal_members`
SET `role`        = 'manager',
    `status`      = 'active',
    `status_note` = 'Manager per A16 (2026-08-18). A later row set this account to owner with a note claiming an owner decision; the founder confirmed he made no such decision, and this statement returns it to the standing role. Manager holds members.view and never members.manage.',
    `updated_at`  = CURRENT_TIMESTAMP
WHERE `email` = 'epiclife.nguyen@gmail.com';

-- Recorded as its own event. The append-only trail carries the correction
-- rather than quietly overwriting the escalation, for the same reason A16
-- carried the reinstatement separately: both writes happened, in this order.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'members.grant',
    'allow',
    'role_corrected_to_manager',
    'portal_member:epiclife.nguyen@gmail.com',
    '{"note":"Returned owner -> manager on the founder''s order. The prior row read owner with the note \"Restored to owner 2026-08-18 by owner decision\"; the founder states he made no such decision. No application code path can change an existing member''s role, so the escalation was written outside the portal and left no audit row of its own."}'
  );
