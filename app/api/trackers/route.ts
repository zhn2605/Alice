import { getSession } from "@/lib/auth/middleware";
import { getSupabase } from "@/lib/db";
import { findAdapter } from "@/lib/tracker/adapters";
import { TrackerRow } from "@/lib/tracker/types";
import { extractChoice, normalizeVsUrl } from "@/lib/tracker/adapters/victoriasSecret";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: trackers } = await getSupabase()
        .from('trackers')
        .select('*')
        .eq('user_id', s.user.id);

    return NextResponse.json({ trackers: (trackers ?? []) as TrackerRow[] });
}

export async function POST(req: Request) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = (await req.json()) as {
        url?: string;
        label?: string;
        sizes?: string[];
        image_url?: string | null;
    };
    if (!body.url) return NextResponse.json({ error: 'missing url' }, { status: 400 });
    if (!Array.isArray(body.sizes)) {
        return NextResponse.json({ error: 'sizes must be an array' }, { status: 400 });
    }
    const sizes = body.sizes.filter((s): s is string => typeof s === 'string');

    const cleanUrl = normalizeVsUrl(body.url);
    const adapter = findAdapter(cleanUrl);
    if (!adapter) {
        return NextResponse.json({ error: 'unsupported site' }, { status: 400 });
    }
    if (adapter.id === 'victoriasSecret' && !extractChoice(cleanUrl)) {
        return NextResponse.json(
            { error: 'VS url must include ?choice= (color variant code)' },
            { status: 400 },
        );
    }

    const supabase = getSupabase();
    const { data: existing } = await supabase
        .from('trackers')
        .select('id, sizes')
        .eq('user_id', s.user.id)
        .eq('url', cleanUrl)
        .single<{ id: string; sizes: string[] }>();

    if (existing) {
        const current = Array.isArray(existing.sizes) ? existing.sizes : [];
        const merged = [...new Set([...current, ...sizes])];
        await supabase
            .from('trackers')
            .update({ sizes: merged })
            .eq('id', existing.id);
        return NextResponse.json({ ok: true, id: existing.id, merged: true });
    }

    const id = randomBytes(12).toString('hex');
    const image_url =
        typeof body.image_url === 'string' && body.image_url.startsWith('http')
            ? body.image_url
            : null;

    const { error } = await supabase.from('trackers').insert({
        id,
        user_id: s.user.id,
        url: cleanUrl,
        adapter_id: adapter.id,
        label: body.label ?? null,
        image_url,
        sizes,
        created_at: Date.now(),
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, id, merged: false });
}
