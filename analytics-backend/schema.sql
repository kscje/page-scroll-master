CREATE TABLE IF NOT EXISTS upload_batches (
  batch_id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  event_count INTEGER NOT NULL CHECK (event_count BETWEEN 1 AND 21),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS upload_batches_expires_at_idx
  ON upload_batches (expires_at);

CREATE TABLE IF NOT EXISTS daily_action_counts (
  event_date TEXT NOT NULL,
  action_key TEXT NOT NULL,
  action_count INTEGER NOT NULL CHECK (action_count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (event_date, action_key)
);

CREATE TABLE IF NOT EXISTS daily_toggle_counts (
  event_date TEXT NOT NULL,
  feature TEXT NOT NULL,
  source TEXT NOT NULL,
  enabled_count INTEGER NOT NULL CHECK (enabled_count >= 0),
  disabled_count INTEGER NOT NULL CHECK (disabled_count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (event_date, feature, source)
);

CREATE TABLE IF NOT EXISTS settings_snapshot_counts (
  event_date TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  snapshot_count INTEGER NOT NULL CHECK (snapshot_count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (event_date, snapshot_json)
);

