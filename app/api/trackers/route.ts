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
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });;

    const body = (await req.json()) as {
        url?: string;
        label?: string;
        size?: string;
    };
    if (!body.url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

    const cleanUrl = normalizeVsUrl(body.url);
    const adapter = findAdapter(cleanUrl);
    if (!adapter) {
        return NextResponse.json({ error: 'unsupported site' }, { status: 400 });
    }

    if (adapter.id === 'victoriasSecret' && !extractChoice(cleanUrl)) {
        return NextResponse.json(
            { error: 'VS url must include ?choice= (color variant code)' },
            { status: 400 }
        );
    }

    const id = randomBytes(12).toString('hex');
    getDb()
        .prepare(
            'INSERT INTO trackers (id, user_id, url, adapter_id, label, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(id, s.user.id, cleanUrl, adapter.id, body.label ?? null, body.size ?? null, Date.now());

    return  NextResponse.json({ ok: true, id });
}