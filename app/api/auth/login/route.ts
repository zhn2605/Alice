import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { createSession, UserRow } from '@/lib/auth/sessions';
import { setSessionCookie } from '@/lib/auth/cookies';
import { verifyPassword } from '@/lib/auth/passwords';

export async function POST(req: Request) {
    const { email, password } = await req.json() as { email?: string; password?: string };

    if (!email || !password) {
        return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single<UserRow>();

    const ok = user && (await verifyPassword(user.password_hash, password));
    if (!ok || !user) {
        return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
    }

    const session = await createSession(supabase, user.id);
    await setSessionCookie(session.id);

    return NextResponse.json({ ok: true });
}
