PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS voice_number_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES portal_members(id),
  line_type TEXT NOT NULL CHECK (line_type IN ('personal', 'shared')),
  e164_number TEXT NOT NULL,
  provider_number_id TEXT NOT NULL,
  provider_subscriber_id TEXT NOT NULL,
  subscriber_reference TEXT NOT NULL,
  subscriber_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'retired')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS voice_number_assignments_number_idx ON voice_number_assignments(e164_number);
CREATE UNIQUE INDEX IF NOT EXISTS voice_number_assignments_provider_idx ON voice_number_assignments(provider_number_id);
CREATE UNIQUE INDEX IF NOT EXISTS voice_number_assignments_provider_subscriber_idx ON voice_number_assignments(provider_subscriber_id);
CREATE UNIQUE INDEX IF NOT EXISTS voice_number_assignments_subscriber_idx ON voice_number_assignments(subscriber_reference);
CREATE INDEX IF NOT EXISTS voice_number_assignments_member_idx ON voice_number_assignments(member_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS voice_number_assignments_active_personal_member_idx
  ON voice_number_assignments(member_id)
  WHERE line_type = 'personal' AND status = 'active';

CREATE TABLE IF NOT EXISTS voice_presence (
  member_id INTEGER PRIMARY KEY REFERENCES portal_members(id),
  browser_session_id TEXT NOT NULL,
  ready_state TEXT NOT NULL DEFAULT 'offline' CHECK (ready_state IN ('offline', 'available', 'busy')),
  last_heartbeat_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS voice_presence_browser_session_idx ON voice_presence(browser_session_id);
CREATE INDEX IF NOT EXISTS voice_presence_expiry_idx ON voice_presence(ready_state, expires_at);

CREATE TABLE IF NOT EXISTS inbound_voice_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_call_id TEXT NOT NULL,
  parent_provider_call_id TEXT,
  active_provider_call_id TEXT,
  line_type TEXT NOT NULL CHECK (line_type IN ('personal', 'shared')),
  called_number_masked TEXT NOT NULL,
  caller_number_masked TEXT NOT NULL,
  caller_ciphertext TEXT,
  caller_cipher_iv TEXT,
  caller_cipher_version INTEGER,
  assigned_member_id INTEGER REFERENCES portal_members(id),
  accepted_member_id INTEGER REFERENCES portal_members(id),
  routing_stage TEXT NOT NULL DEFAULT 'received' CHECK (routing_stage IN ('received', 'personal', 'team', 'mobile', 'voicemail', 'complete')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'offering', 'connected', 'completed', 'voicemail', 'failed')),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TEXT,
  ended_at TEXT,
  disposition TEXT,
  voicemail_state TEXT,
  voicemail_object_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (caller_ciphertext IS NULL AND caller_cipher_iv IS NULL AND caller_cipher_version IS NULL)
    OR
    (caller_ciphertext IS NOT NULL AND caller_cipher_iv IS NOT NULL AND caller_cipher_version IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS inbound_voice_calls_provider_idx ON inbound_voice_calls(provider_call_id);
CREATE UNIQUE INDEX IF NOT EXISTS inbound_voice_calls_active_provider_idx ON inbound_voice_calls(active_provider_call_id);
CREATE INDEX IF NOT EXISTS inbound_voice_calls_assigned_idx ON inbound_voice_calls(assigned_member_id, started_at);
CREATE INDEX IF NOT EXISTS inbound_voice_calls_accepted_idx ON inbound_voice_calls(accepted_member_id, started_at);
CREATE INDEX IF NOT EXISTS inbound_voice_calls_status_idx ON inbound_voice_calls(status, started_at);

CREATE TABLE IF NOT EXISTS voice_call_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voice_call_id INTEGER NOT NULL REFERENCES inbound_voice_calls(id),
  stage TEXT NOT NULL CHECK (stage IN ('received', 'personal', 'team', 'mobile', 'voicemail', 'complete')),
  attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt > 0),
  member_id INTEGER NOT NULL REFERENCES portal_members(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'answered', 'answered_elsewhere', 'missed', 'transfer_pending', 'sent_to_team')),
  offered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS voice_call_offers_once_idx ON voice_call_offers(voice_call_id, stage, attempt, member_id);
CREATE INDEX IF NOT EXISTS voice_call_offers_member_idx ON voice_call_offers(member_id, offered_at);

CREATE TABLE IF NOT EXISTS voice_callback_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voice_call_id INTEGER NOT NULL REFERENCES inbound_voice_calls(id),
  assigned_member_id INTEGER REFERENCES portal_members(id),
  claimed_by_member_id INTEGER REFERENCES portal_members(id),
  voicemail_object_key TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'completed', 'dismissed')),
  due_at TEXT NOT NULL,
  disposition TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS voice_callback_tasks_call_idx ON voice_callback_tasks(voice_call_id);
CREATE INDEX IF NOT EXISTS voice_callback_tasks_assignee_idx ON voice_callback_tasks(assigned_member_id, status, due_at);
CREATE INDEX IF NOT EXISTS voice_callback_tasks_claimant_idx ON voice_callback_tasks(claimed_by_member_id, status);
