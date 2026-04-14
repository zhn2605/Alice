import Database from 'better-sqlite3';
import path from 'node:path';

let _db:Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) {
    return _db;
  }
  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), 'data', 'alice.db');
  
  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      discord_webhook_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS trackers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      adapter_id TEXT NOT NULL,
      label TEXT,
      size TEXT,
      last_status TEXT,
      last_sizes TEXT,
      last_checked_at INTEGER,
      last_notified_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_trackers_user_id ON trackers(user_id);
    `);

  const cols = db.prepare(`PRAGMA table_info(trackers)`).all() as { name: string }[];
  if (!cols.some((c) => c.name === 'last_sizes')) {
    db.exec(`ALTER TABLE trackers ADD COLUMN last_sizes TEXT`);
  }

  _db = db;
  return db;
}