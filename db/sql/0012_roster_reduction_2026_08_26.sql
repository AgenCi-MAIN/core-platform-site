-- CORE portal — access reduced to two people; Ryan and Andrew downgraded
-- owner -> reviewer. Founder orders, 2026-08-26.
--
-- REVISED 2026-08-26, BEFORE EVER BEING APPLIED. The first version of this
-- file carried the first order only and deliberately left `role` untouched,
-- on the reasoning that the order was about access rather than rank. The
-- founder then ordered the demotion explicitly: "now remove the access for
-- ryan and andrew, downgrade them from role owner to reviewer." Because this
-- file had not been run against any database and had not reached `main`, it
-- is corrected in place rather than superseded by a second file — there is no
-- applied statement here to preserve, and shipping a file known to do the
-- wrong thing would be worse than editing an unapplied one.
--
-- TWO ORDERS, ONE FILE:
--
--   1. "remove all MEBER ACCESS expept-Yuxiang Mao(shawn) and Ray"
--      Access reduced to `btcmao518@gmail.com` and `ray@inkbox.ai`. Ray was
--      identified by the founder when asked: no roster row carries that name,
--      and `ray@inkbox.ai` is the Reviewer / Coach row granted 2026-08-20.
--
--   2. "downgrade them from role owner to reviewer" — Ryan Davidson and
--      Andrew Davidson specifically, named. The second order NARROWS the role
--      treatment of those two; it does not withdraw the first order, so the
--      sweep below still governs everyone who is not a keeper.
--
-- END STATE:
--
--   btcmao518@gmail.com               owner      active     — untouched
--   ray@inkbox.ai                     reviewer   active     — untouched
--   ryandavidson.zenith@gmail.com     reviewer   revoked    — demoted + revoked
--   andrew.davidson.zenith@gmail.com  reviewer   revoked    — demoted + revoked
--   epiclife.nguyen@gmail.com         manager    revoked    — revoked by the sweep
--   (any row this repository does not know about)  revoked  — revoked by the sweep
--
-- ROLE AND STATUS ARE INDEPENDENT, AND THE DEMOTION GRANTS NOTHING. A reader
-- could reasonably fear that setting `role = 'reviewer'` hands these two the
-- reviewer capability set. It does not: `app/portal/access.ts` refuses any row
-- whose status is not `active` before role is ever consulted, so a revoked
-- reviewer row grants exactly what a revoked owner row grants, which is
-- nothing. What the demotion changes is what the row MEANS and what it would
-- restore to: if either address is ever reinstated, it comes back a reviewer,
-- not an owner. That is the durable half of this order.
--
-- WHAT THIS DOES NOT TOUCH, stated so the roster is never read as a cap table:
-- `portal_members.role` is a capability set in this application. It is not an
-- equity position, a partnership interest, or anything in the agreement
-- record. Demoting these rows changes what the portal permits and says
-- nothing about ownership of the company. If the intent extends to the
-- partnership itself, that is a separate decision in a separate record and
-- this file is not it.
--
-- NO ROW IS DELETED. A revoked row grants nothing while remaining readable,
-- and the roster is the account of who held access and when (§5, standing
-- since A15).
--
-- WHY THE REVOCATION IS WRITTEN BY EXCLUSION RATHER THAN BY NAME. The live
-- roster is known to hold rows this repository never recorded: `ray@inkbox.ai`
-- was granted from the portal on 2026-08-20 and appears in no file here — it
-- was found on a screenshot, not in the record. A file revoking named
-- addresses would silently leave behind any other row granted since
-- 2026-08-18 and report success. `status = 'active' AND email NOT IN (the two
-- keepers)` cannot miss a row it has never heard of. The demotion, by
-- contrast, IS by name: it was ordered for two specific people.
--
-- THE AUDIT INSERT RUNS FIRST, DELIBERATELY, and covers both populations —
-- everyone losing access and everyone being demoted. It reads each row's prior
-- role and status before anything changes them; written afterwards it could
-- only record what the rows had already become. This is also what puts the
-- rows this repository does not know about into the append-only trail by name,
-- closing the A26 gap (console statements change access and leave no audit
-- row) for this change.
--
-- OWNER ROWS ARE PEER-PROTECTED, which is why this is a console file and not a
-- portal action: `/portal/members/manage` refuses to change another owner's
-- role or status (`owner_peer_protected`, A1). It also never writes `role` on
-- an existing member at all — no application code path can perform this
-- demotion (A26).
--
-- SAFE TO RE-RUN. A second execution finds nothing left to change and every
-- statement no-ops.
--
-- TWO THINGS THIS FILE CANNOT DO:
--   1. The Cloudflare Access allow policy (Zero Trust team `thrive18`) is the
--      OTHER place a member is seated. Until Ryan, Andrew and Nate are dropped
--      from it they still clear the edge gate and are stopped only by the
--      membership check inside. Confirm `ray@inkbox.ai` is ON that policy
--      before trimming it — a policy cut back to `btcmao518` alone locks Ray
--      out at the edge while the roster says he has access.
--      NOTE (A31, 2026-08-26): that gate was observed NOT fronting this
--      hostname, before and after Worker version 572f72e7. An allow policy
--      that is not being enforced removes nobody from anything.
--   2. Sessions already minted last up to 7 days, but `access.ts` re-resolves
--      membership on every request, so a revoked member's next request is
--      refused regardless. No session flush is needed.
--
-- Identity allowlist change only — no passwords, keys, or tokens.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0012_roster_reduction_2026_08_26.sql --remote
-- Or paste into the D1 console if `--remote` fails with code 10000 (§6).

-- 1 ─────────────────────────────────────────────────────────────────────────
-- One append-only event per person affected, carrying the role and status the
-- row held BEFORE anything below changes it. Covers both populations: rows
-- losing access, and rows being demoted. Runs first for that reason.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
SELECT
  'btcmao518@gmail.com',
  'members.manage',
  'allow',
  'founder_order_roster_reduced_and_owners_demoted',
  'portal_member:' || `email`,
  '{"email":"' || `email` ||
    '","display_name":"' || COALESCE(`display_name`, '') ||
    '","from":{"role":"' || `role` || '","status":"' || `status` || '"}' ||
    ',"to":{"role":"' ||
      CASE WHEN `email` IN ('ryandavidson.zenith@gmail.com',
                            'andrew.davidson.zenith@gmail.com')
           THEN 'reviewer' ELSE `role` END ||
    '","status":"' ||
      CASE WHEN `status` = 'active'
             AND `email` NOT IN ('btcmao518@gmail.com', 'ray@inkbox.ai')
           THEN 'revoked' ELSE `status` END ||
    '"},"decision":"2026-08-26 founder orders: access reduced to Yuxiang Mao (Shawn) and Ray (ray@inkbox.ai); Ryan Davidson and Andrew Davidson demoted owner -> reviewer by name"' ||
    ',"row":"retained"}'
FROM `portal_members`
WHERE (`status` = 'active'
       AND `email` NOT IN ('btcmao518@gmail.com', 'ray@inkbox.ai'))
   OR (`email` IN ('ryandavidson.zenith@gmail.com',
                   'andrew.davidson.zenith@gmail.com')
       AND `role` <> 'reviewer');

-- 2 ─────────────────────────────────────────────────────────────────────────
-- The revocation sweep. Everyone active who is not one of the two keepers.
UPDATE `portal_members`
SET `status`      = 'revoked',
    `status_note` = 'Access removed 2026-08-26 by founder order: portal access reduced to Yuxiang Mao (Shawn) and Ray (ray@inkbox.ai) only. Row retained for the record; this address can no longer reach the portal.',
    `updated_at`  = CURRENT_TIMESTAMP
WHERE `status` = 'active'
  AND `email` NOT IN ('btcmao518@gmail.com', 'ray@inkbox.ai');

-- 3 ─────────────────────────────────────────────────────────────────────────
-- The demotion, by name, for the two the founder named. Runs AFTER the sweep
-- so its more specific note is the one that survives on these two rows.
-- `status` is set here too rather than relied upon: the order was to remove
-- their access, and this statement should be correct on its own even if the
-- sweep above ever changes shape.
UPDATE `portal_members`
SET `role`        = 'reviewer',
    `status`      = 'revoked',
    `status_note` = 'Demoted owner -> reviewer and access removed 2026-08-26 by founder order. The owner seat on this row is ended; if this address is ever reinstated it returns as a reviewer, not an owner. Role in portal_members is a capability set in this application and is not a statement about equity or partnership. Row retained for the record.',
    `updated_at`  = CURRENT_TIMESTAMP
WHERE `email` IN ('ryandavidson.zenith@gmail.com',
                  'andrew.davidson.zenith@gmail.com');

-- 4 ─────────────────────────────────────────────────────────────────────────
-- Verify. Expect exactly two active rows and no owner row but the founder's:
--
--   btcmao518@gmail.com               | owner    | active
--   ray@inkbox.ai                     | reviewer | active
--   ryandavidson.zenith@gmail.com     | reviewer | revoked
--   andrew.davidson.zenith@gmail.com  | reviewer | revoked
--   epiclife.nguyen@gmail.com         | manager  | revoked
--   bankerrunners@gmail.com           | owner    | revoked   (retired identity)
--
--   SELECT email, display_name, role, status FROM portal_members
--    ORDER BY status, role, email;
--
-- Confirm nobody but the founder holds an active owner row:
--
--   SELECT email FROM portal_members WHERE role = 'owner' AND status = 'active';
--
-- And confirm the trail logged everyone touched:
--
--   SELECT occurred_at, resource, detail FROM audit_events
--    WHERE reason = 'founder_order_roster_reduced_and_owners_demoted'
--    ORDER BY id;
