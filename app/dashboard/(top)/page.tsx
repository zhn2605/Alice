import { getSession } from '@/lib/auth/middleware';
import { getSupabase } from '@/lib/db';
import ClosetCard from '../components/ClosetCard';
import ClosetsGridClient from './ClosetsGridClient';

export default async function ClosetsPage() {
    const s = await getSession();
    const supabase = getSupabase();

    const { data: closets } = await supabase
        .from('closets')
        .select('id, name')
        .eq('user_id', s!.user.id)
        .order('created_at', { ascending: false });

    const rows = closets ?? [];

    const counts: Record<string, number> = {};
    if (rows.length > 0) {
        const { data: trackerRows } = await supabase
            .from('trackers')
            .select('closet_id')
            .in('closet_id', rows.map((c) => c.id));
        for (const t of trackerRows ?? []) {
            counts[t.closet_id] = (counts[t.closet_id] ?? 0) + 1;
        }
    }

    return (
        <div>
            <h1 className="font-fashion text-title font-semibold tracking-tight text-cream">
                My Closets
            </h1>
            <p className="text-xs uppercase tracking-wide text-rose mt-1">
                {rows.length === 0 ? 'No closets yet. Create one to start tracking.' : `${rows.length} closet${rows.length === 1 ? '' : 's'}`}
            </p>
            <ClosetsGridClient>
                {rows.map((c) => (
                    <ClosetCard key={c.id} id={c.id} name={c.name} trackerCount={counts[c.id] ?? 0} />
                ))}
            </ClosetsGridClient>
        </div>
    );
}
