import { getSupabase } from '@/lib/db';
import type { TrackerRow } from '@/lib/tracker/types';
import ClosetView from './ClosetView';

export default async function ClosetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = getSupabase();

    const { data: closet } = await supabase
        .from('closets')
        .select('id, name, discord_webhook_url')
        .eq('id', id)
        .single();

    const { data: trackers } = await supabase
        .from('trackers')
        .select('*')
        .eq('closet_id', id)
        .order('created_at', { ascending: false });

    return (
        <ClosetView
            closet={{
                id,
                name: closet?.name ?? 'Closet',
                discord_webhook_url: closet?.discord_webhook_url ?? null,
            }}
            trackers={(trackers ?? []) as TrackerRow[]}
        />
    );
}
