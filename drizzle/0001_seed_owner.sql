-- CORE portal — first owner seed
--
-- This migration applies the confirmed production bootstrap from
-- db/sql/0002_portal_seed_owner.sql. The subject_id remains NULL until the
-- first successful Sign in with ChatGPT request binds it.

INSERT OR IGNORE INTO `portal_members`
  (`email`, `display_name`, `role`, `status`, `granted_by`, `status_note`)
VALUES
  (
    'bankerrunners@gmail.com',
    'Yuxiang Mao (Shawn)',
    'owner',
    'active',
    'bootstrap',
    'Initial owner seeded at portal provisioning. Sign-in address confirmed by the owner on 2026-08-13.'
  );
--> statement-breakpoint
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
