import { getSession } from "@/lib/auth/middleware";
import { getSupabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const { data } = await getSupabase()
        .from('trackers')
        .delete()
        .eq('id', id)
        .eq('user_id', s.user.id)
        .select('id');

    if (!data?.length) {
        return NextResponse.json({ error: 'tracker not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = (await req.json()) as {
        label?: string | null;
        sizes?: string[];
    };

    const supabase = getSupabase();
    const { data: existing } = await supabase
        .from('trackers')
        .select('id')
        .eq('id', id)
        .eq('user_id', s.user.id)
        .single();
    if (!existing) {
        return NextResponse.json({ error: 'tracker not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if ('label' in body) updates.label = body.label ?? null;
    if (Array.isArray(body.sizes)) {
        updates.sizes = body.sizes.filter((s): s is string => typeof s === 'string');
    }
    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ ok: true });
    }

    await supabase.from('trackers').update(updates).eq('id', id);
    return NextResponse.json({ ok: true });
}
