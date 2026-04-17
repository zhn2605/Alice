import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/middleware';
import { getSupabase } from '@/lib/db';
import type { TrackerRow } from '@/lib/tracker/types';
import DashboardClient from './client';

export default async function DashboardPage() {
    const s = await getSession();
    if (!s) redirect('/login');

    const { data: trackers } = await getSupabase()
        .from('trackers')
        .select('*')
        .eq('user_id', s.user.id)
        .order('created_at', { ascending: false });

    return (
        <main className="flex-1 w-full max-w-3xl mx-auto p-6 space-y-8">
            <header className="flex items-baseline justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Alice</h1>
                    <p className="text-sm text-neutral-500">Your restock trackers.</p>
                </div>
                <p className="text-xs text-neutral-500">{s.user.email}</p>
            </header>
            <DashboardClient
                initialTrackers={(trackers ?? []) as TrackerRow[]}
                currentWebhook={s.user.discord_webhook_url}
            />
        </main>
    );
}
