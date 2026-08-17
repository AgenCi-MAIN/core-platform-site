-- CORE portal — add Andrew Davidson as manager (founder order, 2026-08-17)
--
-- Authorized by: Yuxiang Mao (Shawn), founder — btcmao518@gmail.com, by
-- explicit instruction 2026-08-17: "unlock COMMAND CENTER for ANDREW
-- DAVIDSON" / "he is going to be help Dev", email confirmed by the founder in
-- the same session. Comment-only provenance; the applied SQL is unchanged.
--
-- Additive grant. Removes or alters nothing.
--
-- `subject_id` is intentionally NULL: it binds automatically and permanently
-- on this address's first successful Google sign-in, exactly like the seed.
--
-- IMPORTANT — this grants portal MEMBERSHIP (manager role) only. Andrew's
-- Command Center access comes from COMMAND_CENTER_EMAILS in
-- app/portal/access.ts (a separate code change, deployed with this file's
-- companion commit). The audit log, the investigator, and every /go/*
-- handoff remain founder-only and are deliberately NOT part of this grant.
--
-- Apply with (from the project directory, with Cloudflare auth):
--   npx wrangler d1 execute site-creator-d1 --file=db/sql/0004_add_manager_andrew.sql --remote

INSERT OR IGNORE INTO `portal_members`
  (`email`, `display_name`, `role`, `status`, `granted_by`, `status_note`)
VALUES
  (
    'andrew.davidson.zenith@gmail.com',
    'Andrew Davidson',
    'manager',
    'active',
    'founder-order-2026-08-17',
    'Helper dev. Manager membership + named Command Center access by founder order 2026-08-17. Binds on first sign-in. Audit/investigator/go remain founder-only.'
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
    'founder_order_helper_dev',
    'portal_members',
    '{"note":"andrew.davidson.zenith@gmail.com added as manager by founder order 2026-08-17; Command Center access via COMMAND_CENTER_EMAILS in the same change."}'
  );
