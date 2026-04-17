import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { runCheck } from '@/lib/tracker/checker';
import { TrackerRow } from '@/lib/tracker/types';
import { UserRow } from '@/lib/auth/sessions';

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

    let checked = 0;
    for (const tracker of (trackers ?? []) as TrackerRow[]) {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', tracker.user_id)
            .single<UserRow>();

        if (!user) continue;

        await runCheck(supabase, tracker, user);
        checked++;

        if (checked < (trackers ?? []).length) {
            await sleep(INTER_CHECK_DELAY_MS);
        }
    }

    return NextResponse.json({ checked });
}
