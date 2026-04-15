import { getSession } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db";
import { findAdapter } from "@/lib/tracker/adapters";
import { TrackerRow } from "@/lib/tracker/types";
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

    const { url, label } = (await req.json()) as { url?: string; label?: string };
    if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

    const adapter = findAdapter(url);
    if (!adapter) {
        return NextResponse.json({ error: 'unsupported site' }, { status: 400 });
    }

    const id = randomBytes(12).toString('hex');
    getDb().prepare('INSERT INTO trackers (id, user_id, url, adapter_id, label, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, s.user.id, url, adapter.id, label ?? null, Date.now());

    return  NextResponse.json({ ok: true, id });
}