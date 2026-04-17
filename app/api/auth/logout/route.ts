import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { deleteSession } from '@/lib/auth/sessions';
import { clearSessionCookie, readSessionCookie } from '@/lib/auth/cookies';

export async function POST() {
    const token = await readSessionCookie();
    if (token) {
        await deleteSession(getSupabase(), token);
        await clearSessionCookie();
    }

    return NextResponse.json({ ok: true });
}
