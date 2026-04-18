import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getSupabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth/passwords';
import { createSession } from '@/lib/auth/sessions';
import { setSessionCookie } from '@/lib/auth/cookies';

export async function POST(req: Request) {
    const { email, password } = await req.json() as { email?: string; password?: string };

    if (!email || !password) {
        return NextResponse.json({ error: 'email and password required' }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json({ error: 'password must be at least 8 characters' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
    if (existing) {
        return NextResponse.json({ error: 'email already registered' }, { status: 409 });
    }

    const id = randomBytes(16).toString('hex');
    const password_hash = await hashPassword(password);

    const { error } = await supabase.from('users').insert({
        id, email, password_hash,
    });
    if (error) throw error;

    const session = await createSession(supabase, id);
    await setSessionCookie(session.id);

    return NextResponse.json({ ok: true });
}
