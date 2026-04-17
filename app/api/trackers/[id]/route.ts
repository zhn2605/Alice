import { getSession } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const s = await getSession();
    if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });;

    const { id } = await params;
    const result = getDb().prepare('DELETE FROM trackers WHERE id = ? AND user_id = ?').run(id, s.user.id);

    if (result.changes === 0) {
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

    const db = getDb();
    const existing = db
        .prepare('SELECT id FROM trackers WHERE id = ? AND user_id = ?')
        .get(id, s.user.id);
    if (!existing) {
        return NextResponse.json({ error: 'tracker not found' }, { status: 404 });
    }

    const sets: string[] = [];
    const args: unknown[] = [];
    if ('label' in body) {
        sets.push('label = ?');
        args.push(body.label ?? null);
    }
    if (Array.isArray(body.sizes)) {
        const sizes = body.sizes.filter((s): s is string => typeof s === 'string');
        sets.push('sizes = ?');
        args.push(JSON.stringify(sizes));
    }
    if (sets.length === 0) {
        return NextResponse.json({ ok: true });
    }
    args.push(id);
    db.prepare(`UPDATE trackers SET ${sets.join(', ')} WHERE id = ?`).run(...args);
    return NextResponse.json({ ok: true });
}