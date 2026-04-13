import { getDb } from '../db';
import { getSessionAndUser, type UserRow, type SessionRow } from './sessions';
import { readSessionCookie } from './cookies';

export async function getSession(): Promise<{ user: UserRow; session: SessionRow } | null> {
    const token = await readSessionCookie();
    if (!token) return null;
    return getSessionAndUser(getDb(), token);
}

export async function requireUser(): Promise<UserRow> {
    const s = await getSession();
    if (!s) throw new Response('Unauthorized', { status: 401 });
    return s.user;
}