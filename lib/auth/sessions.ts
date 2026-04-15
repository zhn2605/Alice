import type { Database } from 'better-sqlite3';
import { randomBytes } from 'node:crypto';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionRow {
    id: string;
    user_id: string;
    expires_at: number;
}

export interface UserRow {
    id: string;
    email: string;
    password_hash: string;
    discord_webhook_url: string | null;
    created_at: number;
}

export function createSession(db: Database, userId: string): SessionRow {
    const id = randomBytes(40).toString('hex');
    const expires_at = Date.now() + SESSION_TTL_MS;
    db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expires_at);
    return { id, user_id: userId, expires_at };
}

export function getSessionAndUser(db: Database, token: string): { session: SessionRow; user: UserRow } | null {
    const row = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(token) as SessionRow | undefined;
    if (!row) return null;

    if (row.expires_at <= Date.now()) {
        db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
        return null;
    }

    const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(row.user_id) as UserRow | undefined;
    if (!user) return null;

    return { session: row, user};
}

export function deleteSession(db: Database, token: string): void {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
}