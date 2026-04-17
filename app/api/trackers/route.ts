import { getSession } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db";
import { findAdapter } from "@/lib/tracker/adapters";
import { TrackerRow } from "@/lib/tracker/types";
import { extractChoice, normalizeVsUrl } from "@/lib/tracker/adapters/victoriasSecret";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

export async function GET() {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });;

    const trackers = getDb().prepare('SELECT * FROM trackers WHERE user_id = ?')
    .all(s.user.id) as TrackerRow[];
    return NextResponse.json({ trackers });
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

    const db = getDb();
    const existing = db
        .prepare('SELECT id, sizes FROM trackers WHERE user_id = ? AND url = ?')
        .get(s.user.id, cleanUrl) as { id: string; sizes: string } | undefined;

    if (existing) {
        const current: string[] = (() => {
            try {
                const v = JSON.parse(existing.sizes);
                return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
            } catch {
                return [];
            }
        })();
        const merged = [...new Set([...current, ...sizes])];
        db.prepare('UPDATE trackers SET sizes = ? WHERE id = ?').run(
            JSON.stringify(merged),
            existing.id,
        );
        return NextResponse.json({ ok: true, id: existing.id, merged: true });
    }

    const id = randomBytes(12).toString('hex');
    const image_url =
        typeof body.image_url === 'string' && body.image_url.startsWith('http')
            ? body.image_url
            : null;
    db.prepare(
        `INSERT INTO trackers (id, user_id, url, adapter_id, label, image_url, sizes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
        id,
        s.user.id,
        cleanUrl,
        adapter.id,
        body.label ?? null,
        image_url,
        JSON.stringify(sizes),
        Date.now(),
    );

    return NextResponse.json({ ok: true, id, merged: false });
}