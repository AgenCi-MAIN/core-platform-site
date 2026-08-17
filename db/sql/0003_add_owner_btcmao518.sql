-- CORE portal — add second owner identity (owner order, 2026-08-17)
--
-- Additive grant. Does NOT remove or alter the seeded owner
-- (bankerrunners@gmail.com stays an active owner as the fallback identity).
-- This is an identity allowlist entry only — no passwords, keys, or tokens.
--
-- `subject_id` is intentionally NULL: it binds automatically and permanently
-- on this address's first successful Google sign-in, exactly like the seed.
--
-- IMPORTANT — this grants portal MEMBERSHIP (owner role), not founder access.
-- The founder-only surfaces (/portal/audit, /portal/investigator) answer only
-- FOUNDER_EMAIL in app/portal/access.ts; moving those is a separate code
-- change + redeploy, deliberately not bundled here.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0003_add_owner_btcmao518.sql --remote

INSERT OR IGNORE INTO `portal_members`
  (`email`, `display_name`, `role`, `status`, `granted_by`, `status_note`)
VALUES
  (
    'btcmao518@gmail.com',
    'Yuxiang Mao (Shawn)',
    'owner',
    'active',
    'owner-migration-2026-08-17',
    'Second owner identity added by owner order 2026-08-17. Binds on first sign-in. bankerrunners@gmail.com retained as fallback.'
  );

-- Record the grant in the append-only audit trail so the change is in the log,
-- not just the roster.
INSERT INTO `audit_events`
  (`actor_email`, `action`, `decision`, `reason`, `resource`, `detail`)
VALUES
  (
    'bootstrap',
    'members.manage',
    'allow',
    'owner_identity_migration',
    'portal_members',
    '{"note":"btcmao518@gmail.com added as owner by owner order 2026-08-17; bankerrunners retained as fallback."}'
  );
