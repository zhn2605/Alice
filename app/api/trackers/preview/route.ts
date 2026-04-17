import { getSession } from '@/lib/auth/middleware';
import { findAdapter } from '@/lib/tracker/adapters';
import { normalizeVsUrl, extractChoice } from '@/lib/tracker/adapters/victoriasSecret';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const url = new URL(req.url).searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

    const cleanUrl = normalizeVsUrl(url);
    const adapter = findAdapter(cleanUrl);
    if (!adapter) {
        return NextResponse.json({ error: 'unsupported site' }, { status: 400 });
    }
    if (adapter.id === 'victoriasSecret' && !extractChoice(cleanUrl)) {
        return NextResponse.json({ error: 'VS url must include ?choice= param' }, { status: 400 });
    }

    try {
        const snapshot = await adapter.check(cleanUrl);
        return NextResponse.json({
            label: snapshot.product?.title ?? null,
            image_url: snapshot.product?.image_url ?? null,
            available_sizes: Object.keys(snapshot.specific_stock),
            current_stock: snapshot.specific_stock,
        });
    } catch (err) {
        console.error('[preview] check failed:', err);
        return NextResponse.json({ error: "couldn't reach product page, try again" }, { status: 502 });
    }
}
