import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createSession, getSessionAndUser, deleteSession, SESSION_TTL_MS } from '../../lib/auth/sessions';

function freshDb(): Database.Database {
    const db = new Database(':memory:');
    db.exec(`
        CREATE TABLE users (
            id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL, discord_webhook_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at INTEGER NOT NULL
        );
    `);

    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?)').run(
        'ul', 'a@b.com', 'x', null, Date.now()
    );

    return db;
}

describe('sessions', () => {
    let db: Database.Database;;
    beforeEach(() => { db = freshDb(); });

    it('creates a session with a random id and 30-day expiry', () =>  {
        const s = createSession(db, 'ul');
        expect(s.id).toHaveLength(80); // 40 bytes hex
        expect(s.expires_at).toBeGreaterThan(Date.now() + SESSION_TTL_MS - 1000);   
    });

    it('returns null for unknown token', () => {
        expect(getSessionAndUser(db, 'nope')).toBeNull();
    });

    it('returns null for expired session and deletes it', () => {
        const s = createSession(db, 'ul');
        db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').run(Date.now() - 1, s.id);
        expect(getSessionAndUser(db, s.id)).toBeNull();
        expect(db.prepare('SELECT * FROM sessions WHERE id = ?').get(s.id)).toBeUndefined();
    });

    it('deletes a session', () => {
        const s = createSession(db, 'ul');
        deleteSession(db, s.id);
        expect(getSessionAndUser(db, s.id)).toBeNull();
    });
});