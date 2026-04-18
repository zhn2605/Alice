import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { runCheck } from '@/lib/tracker/checker';
import { TrackerRow } from '@/lib/tracker/types';
import { ClosetRow } from '@/lib/closet/types';

const INTER_CHECK_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest): Promise<NextResponse> {
    const authHeader = req.headers.get('authorization');
    const expected = process.env.CRON_SECRET;

    if (!expected || authHeader !== `Bearer ${expected}`) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: trackers } = await supabase.from('trackers').select('*');
    const list = (trackers ?? []) as TrackerRow[];

    let checked = 0;
    for (const tracker of list) {
        const { data: closet } = await supabase
            .from('closets')
            .select('*')
            .eq('id', tracker.closet_id)
            .single<ClosetRow>();

        const webhookUrl = closet?.discord_webhook_url ?? null;

        await runCheck(supabase, tracker, webhookUrl);
        checked++;

        if (checked < list.length) {
            await sleep(INTER_CHECK_DELAY_MS);
        }
    }

    return NextResponse.json({ checked });
}
