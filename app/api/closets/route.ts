import { getSession } from '@/lib/auth/middleware';
import { getSupabase } from '@/lib/db';
import { ClosetRow } from '@/lib/closet/types';
import { validateClosetName, validateDiscordWebhook } from '@/lib/closet/validate';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

export async function GET() {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: closets } = await getSupabase()
        .from('closets')
        .select('*')
        .eq('user_id', s.user.id)
        .order('created_at', { ascending: false });

    return NextResponse.json({ closets: (closets ?? []) as ClosetRow[] });
}

export async function POST(req: Request) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await req.json()) as {
        name?: unknown;
        discord_webhook_url?: unknown;
    };

    const nameCheck = validateClosetName(body.name);
    if (!nameCheck.ok) return NextResponse.json({ error: nameCheck.error }, { status: 400 });

    const hookCheck = validateDiscordWebhook(body.discord_webhook_url);
    if (!hookCheck.ok) return NextResponse.json({ error: hookCheck.error }, { status: 400 });

    const id = randomBytes(12).toString('hex');
    const { error } = await getSupabase().from('closets').insert({
        id,
        user_id: s.user.id,
        name: nameCheck.name,
        discord_webhook_url: hookCheck.url,
        created_at: Date.now(),
    });
    if (error) throw error;

    return NextResponse.json({ id });
}
