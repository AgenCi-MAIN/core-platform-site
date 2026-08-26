-- CORE portal — roster reduced to two members, founder order 2026-08-26
--
-- ORDER, in the founder's words: "remove all MEBER ACCESS expept-Yuxiang
-- Mao(shawn) and Ray". Asked who Ray was, since no roster row carries that
-- name, he identified `ray@inkbox.ai` — the Reviewer / Coach row granted from
-- the portal on 2026-08-20 — and said Ray stays.
--
-- After this file, exactly two addresses can reach the portal:
--
--   btcmao518@gmail.com   Yuxiang Mao (Shawn)   owner      — untouched
--   ray@inkbox.ai         ray                   reviewer   — untouched
--
-- Everyone else active becomes `revoked`. Known to be affected on the roster
-- as read on 2026-08-26:
--
--   ryandavidson.zenith@gmail.com     Ryan Davidson      owner    — partner seat
--   andrew.davidson.zenith@gmail.com  Andrew Davidson    owner    — partner seat
--   epiclife.nguyen@gmail.com         Nate Nguyen        manager  — employee (A16/A26)
--
-- WHY THIS IS WRITTEN BY EXCLUSION RATHER THAN BY NAME. The live roster is
-- known to hold rows this repository never recorded: `ray@inkbox.ai` was
-- granted from the portal on 2026-08-20 and appears in no file here, which is
-- how it was discovered — from a screenshot, not from the record. A file that
-- revokes three named addresses would therefore have left behind any OTHER
-- row granted since 2026-08-18 and reported "done". `WHERE status = 'active'
-- AND email NOT IN (the two keepers)` cannot miss a row it has never heard
-- of, which is the only safe shape for an order phrased as "all except".
--
-- NO ROW IS DELETED. `app/portal/access.ts` refuses any row whose status is
-- not `active`, so a revoked row grants nothing while remaining readable. The
-- roster is the account of who held access and when, and a deleted row erases
-- that account (§5, standing rule since A15).
--
-- THE AUDIT INSERT RUNS FIRST, DELIBERATELY. It reads each affected row's
-- prior role and status and writes one append-only event per person before the
-- UPDATE changes them. Written afterwards it could only record what the row
-- had already become. This also means the sweep logs the rows this repository
-- does not know about, by name, at the moment they lose access.
--
-- OWNER ROWS ARE PEER-PROTECTED, which is why this is a console file and not a
-- portal action: `/portal/members/manage` refuses to change another owner's
-- role or status (`owner_peer_protected`, governance 2026-08-15). Two of the
-- three named people hold owner rows.
--
-- SAFE TO RE-RUN. A second execution finds no active row outside the keep list
-- and both statements no-op.
--
-- TWO THINGS THIS FILE CANNOT DO, both required for the order to be real:
--   1. The Cloudflare Access allow policy (Zero Trust team `thrive18`) is the
--      OTHER place a member is seated. Until the removed addresses are dropped
--      from it they still clear the edge gate and are stopped only by the
--      membership check inside. Before editing it, confirm `ray@inkbox.ai` is
--      ON that policy — he signs in, so it should be, but a policy trimmed to
--      `btcmao518` alone would lock Ray out at the edge while this file says
--      he has access, and the portal would look broken rather than closed.
--   2. Sessions already minted stay valid for up to 7 days. `access.ts`
--      re-resolves membership on every request, so a revoked member's next
--      request is refused regardless — no session flush is needed.
--
-- Identity allowlist change only — no passwords, keys, or tokens.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0012_roster_reduction_2026_08_26.sql --remote
-- Or paste into the D1 console if `--remote` fails with code 10000 (§6).

-- 1 ─────────────────────────────────────────────────────────────────────────
-- One append-only event per person about to lose access, carrying the role and
-- status the row held BEFORE the update. Runs first for that reason.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
SELECT
  'btcmao518@gmail.com',
  'members.manage',
  'allow',
  'founder_order_roster_reduced_to_two',
  'portal_member:' || `email`,
  '{"email":"' || `email` ||
    '","display_name":"' || COALESCE(`display_name`, '') ||
    '","from":{"role":"' || `role` || '","status":"' || `status` ||
    '"},"to":{"role":"' || `role` || '","status":"revoked"}' ||
    ',"decision":"2026-08-26 founder order: remove all member access except Yuxiang Mao (Shawn) and Ray (ray@inkbox.ai)"' ||
    ',"row":"retained","role":"unchanged"}'
FROM `portal_members`
WHERE `status` = 'active'
  AND `email` NOT IN ('btcmao518@gmail.com', 'ray@inkbox.ai');

-- 2 ─────────────────────────────────────────────────────────────────────────
-- The revocation itself. `role` is deliberately NOT touched: the order was
-- about access, not about rank, and rewriting a partner's role would put a
-- demotion in the record that the founder did not order. Status is what
-- carries the decision.
UPDATE `portal_members`
SET `status`      = 'revoked',
    `status_note` = 'Access removed 2026-08-26 by founder order: portal access reduced to Yuxiang Mao (Shawn) and Ray (ray@inkbox.ai) only. Role left as it stood; the row is retained for the record and this address can no longer reach the portal.',
    `updated_at`  = CURRENT_TIMESTAMP
WHERE `status` = 'active'
  AND `email` NOT IN ('btcmao518@gmail.com', 'ray@inkbox.ai');

-- 3 ─────────────────────────────────────────────────────────────────────────
-- Verify. Expect exactly two active rows, and nothing else:
--
--   btcmao518@gmail.com | Yuxiang Mao (Shawn) | owner    | active
--   ray@inkbox.ai       | ray                 | reviewer | active
--
--   SELECT email, display_name, role, status FROM portal_members
--    ORDER BY status, role, email;
--
-- And confirm the sweep logged everyone it touched:
--
--   SELECT occurred_at, resource, detail FROM audit_events
--    WHERE reason = 'founder_order_roster_reduced_to_two'
--    ORDER BY id;
