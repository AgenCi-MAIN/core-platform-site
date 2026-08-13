-- CORE portal — first owner seed
--
-- The portal fails closed. Until at least one active row exists in
-- portal_members, every visitor is refused, including the people who built it.
-- This file bootstraps the first owner so the roster can then be managed from
-- inside the portal.
--
-- READ BEFORE APPLYING
--
-- 1. `email` must be the address the person actually signs in with at the
--    hosting platform's identity provider, lowercased. It is NOT necessarily
--    the address on file elsewhere in CORE records. Verify it first — seeding
--    the wrong address grants nothing and looks like a broken portal.
-- 2. Oscar Valencia and Nate Nguyen are named as owners in the agreement record
--    but their sign-in addresses were not available when this file was written.
--    Their rows are left commented out. Fill in the verified addresses and
--    uncomment, or grant them from inside the portal once the first owner is in.
-- 3. `subject_id` is intentionally left NULL. It binds automatically and
--    permanently on that person's first successful sign-in.
-- 4. This file contains identity allowlist entries only. It must never contain
--    passwords, API keys, tokens, or any other secret.
--
-- Apply with:
--   npx wrangler d1 execute <DATABASE_NAME> --file=db/sql/0002_portal_seed_owner.sql --remote

INSERT OR IGNORE INTO `portal_members`
  (`email`, `display_name`, `role`, `status`, `granted_by`, `status_note`)
VALUES
  (
    'bankerrunners@gmail.com',
    'Yuxiang Mao (Shawn)',
    'owner',
    'active',
    'bootstrap',
    'Initial owner seeded at portal provisioning. Verify this is the correct sign-in address.'
  );

-- Pending verified sign-in addresses — uncomment after confirming each one:
--
-- INSERT OR IGNORE INTO `portal_members`
--   (`email`, `display_name`, `role`, `status`, `granted_by`)
-- VALUES
--   ('<oscar-sign-in-address>', 'Oscar Valencia', 'owner', 'active', 'bootstrap'),
--   ('<nate-sign-in-address>',  'Nate Nguyen',    'owner', 'active', 'bootstrap');

-- Record the bootstrap itself, so the audit trail starts with how the first
-- access was created rather than beginning mid-story.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'bootstrap',
    'members.manage',
    'allow',
    'initial_owner_seed',
    'portal_members',
    '{"note":"First owner seeded by direct SQL during portal provisioning."}'
  );
