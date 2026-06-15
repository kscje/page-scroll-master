CREATE TABLE IF NOT EXISTS feedback_rate_limits (
  ip_hash TEXT NOT NULL,
  hour_bucket TEXT NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 1),
  expires_at TEXT NOT NULL,
  PRIMARY KEY (ip_hash, hour_bucket)
);

CREATE INDEX IF NOT EXISTS feedback_rate_limits_expires_at_idx
  ON feedback_rate_limits (expires_at);

CREATE TABLE IF NOT EXISTS feedback_logs (
  request_id TEXT PRIMARY KEY,
  feedback_type TEXT NOT NULL,
  image_count INTEGER NOT NULL CHECK (image_count BETWEEN 0 AND 3),
  included_page_url INTEGER NOT NULL CHECK (included_page_url IN (0, 1)),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('sent', 'failed')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_logs_expires_at_idx
  ON feedback_logs (expires_at);
