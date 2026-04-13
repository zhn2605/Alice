import { cookies } from 'next/headers';
import { SESSION_TTL_MS } from './sessions';

export const SESSION_COOKIE = 'alice_session';

export async function setSessionCookie(token: string): Promise<void> {
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL_MS / 1000,
        secure: process.env.NODE_ENV === 'production',
    });
}

export async function clearSessionCookie(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
}

export async function readSessionCookie(): Promise<string | null> {
    const store = await cookies();
    return store.get(SESSION_COOKIE)?.value ?? null;
}