import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession, UserRow } from '@/lib/auth/sessions';
import { setSessionCookie } from '@/lib/auth/cookies';
import { verifyPassword } from '@/lib/auth/passwords';

export async function POST(req: Request) {
    const { email, password } = await req.json() as { email?: string; password?: string};

    if (!email || !password) {
        return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

    const ok = user && (await verifyPassword(user.password_hash, password));
    if (!ok || !user) {
        return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
    }

    const session = createSession(db, user.id);
    await setSessionCookie(session.id);

    return NextResponse.json({ ok: true });
}