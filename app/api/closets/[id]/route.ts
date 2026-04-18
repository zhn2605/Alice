import { getSession } from '@/lib/auth/middleware';
import { getSupabase } from '@/lib/db';
import { validateClosetName, validateDiscordWebhook } from '@/lib/closet/validate';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = (await req.json()) as {
        name?: unknown;
        discord_webhook_url?: unknown;
    };

    const supabase = getSupabase();
    const { data: existing } = await supabase
        .from('closets')
        .select('id')
        .eq('id', id)
        .eq('user_id', s.user.id)
        .single();
    if (!existing) {
        return NextResponse.json({ error: 'closet not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if ('name' in body) {
        const nameCheck = validateClosetName(body.name);
        if (!nameCheck.ok) return NextResponse.json({ error: nameCheck.error }, { status: 400 });
        updates.name = nameCheck.name;
    }

    if ('discord_webhook_url' in body) {
        const hookCheck = validateDiscordWebhook(body.discord_webhook_url);
        if (!hookCheck.ok) return NextResponse.json({ error: hookCheck.error }, { status: 400 });
        updates.discord_webhook_url = hookCheck.url;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ ok: true });
    }

    await supabase.from('closets').update(updates).eq('id', id);
    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data } = await getSupabase()
        .from('closets')
        .delete()
        .eq('id', id)
        .eq('user_id', s.user.id)
        .select('id');

    if (!data?.length) {
        return NextResponse.json({ error: 'closet not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
}
