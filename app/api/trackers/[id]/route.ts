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