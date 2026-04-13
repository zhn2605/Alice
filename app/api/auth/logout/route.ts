import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { deleteSession } from '@/lib/auth/sessions';
import { clearSessionCookie, readSessionCookie } from '@/lib/auth/cookies';

export async function POST(req: Request) {
    const token = await readSessionCookie();
    if (token) {
        deleteSession(getDb(), token);
        await clearSessionCookie();
    }

    return NextResponse.json({ ok: true });
}