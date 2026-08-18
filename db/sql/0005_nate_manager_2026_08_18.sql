-- CORE portal — Nate Nguyen reinstated as manager, owner decision 2026-08-18
--
-- SUPERSEDES the epiclife.nguyen half of db/sql/0004 the same day. That file
-- revoked him on the owner's decision that he declined to invest; the owner
-- then clarified that he remains an EMPLOYEE and keeps access. Investing and
-- working here are different things, and the role system is what carries the
-- difference: he is no longer an owner, he is a manager.
--
-- What the manager role holds (app/portal/access.ts, ROLE_CAPABILITIES):
--   portal.access, dashboard.view.self, book.view.self, calls.review,
--   team.view, leadership.view.all, members.view, pet.chat
-- What it does NOT hold, and this is the point of the change:
--   members.manage  — he can see the roster, never change it
--   scripts.manage  — approved call language stays owner-controlled
--
-- His Cloudflare Access entry STAYS. He is staff and signs in normally; no
-- Access policy edit is needed, and the removal recommended under A15 is
-- withdrawn.
--
-- `subject_id` is deliberately NOT touched. If he has signed in before, the
-- binding persists and continues to pin his identity; if he has not, it binds
-- on his first sign-in exactly as for any member.
--
-- Identity allowlist change only — no passwords, keys, or tokens.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0005_nate_manager_2026_08_18.sql --remote

UPDATE `portal_members`
SET `role`        = 'manager',
    `status`      = 'active',
    `status_note` = 'Reinstated 2026-08-18 by owner decision: remains an employee. Moved owner -> manager because he declined to invest; employment and ownership are separate. Holds members.view, never members.manage.',
    `updated_at`  = CURRENT_TIMESTAMP
WHERE `email` = 'epiclife.nguyen@gmail.com';

-- The append-only trail carries the reversal as its own event rather than
-- quietly overwriting the revocation: both decisions happened, in this order,
-- on the same day.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'btcmao518@gmail.com',
    'members.manage',
    'allow',
    'owner_decision_reinstate_as_employee',
    'portal_members',
    '{"email":"epiclife.nguyen@gmail.com","from":{"role":"owner","status":"revoked"},"to":{"role":"manager","status":"active"},"decision":"2026-08-18 owner clarification: employee, keeps access; not an investor, so not an owner","supersedes":"db/sql/0004"}'
  );

-- Verify (expect four active — btcmao518, ryandavidson, andrew.davidson as
-- owners and epiclife.nguyen as manager — with bankerrunners the only revoked
-- row):
--   SELECT email, display_name, role, status FROM portal_members ORDER BY status, role, email;
