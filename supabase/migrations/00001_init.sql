CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  discord_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE TABLE trackers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  label TEXT,
  image_url TEXT,
  sizes JSONB NOT NULL DEFAULT '[]',
  last_status TEXT,
  last_sizes JSONB,
  last_checked_at BIGINT,
  last_notified_at BIGINT,
  created_at BIGINT NOT NULL
);
CREATE INDEX idx_trackers_user_id ON trackers(user_id);
