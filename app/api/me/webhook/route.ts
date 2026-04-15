import { getSession } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const s = await getSession();
    if (!s) return new Response('Unauthorized', { status: 401 });

    const { webhookUrl } = (await req.json()) as { webhookUrl?: string };
    if (webhookUrl !== null && typeof webhookUrl !== 'string') {
        return NextResponse.json({ error: 'invalid webhookUrl' }, { status: 400 });
    }

    if (webhookUrl && !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        return NextResponse.json({ error: 'invalid  discord webhookUrl' }, { status: 400 });
    }

    getDb().prepare('UPDATE users SET discord_webhook_url = ? WHERE id = ?')
    .run(webhookUrl ?? null, s.user.id);

    return NextResponse.json({ ok: true });
}
