import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/middleware';
import { getSupabase } from '@/lib/db';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
    const s = await getSession();
    if (!s) redirect('/login');

    const { data: closets } = await getSupabase()
        .from('closets')
        .select('id')
        .eq('user_id', s.user.id);

    const count = closets?.length ?? 0;

    return (
        <main className="flex-1 bg-espresso text-cream p-8 space-y-6">
            <header className="flex items-baseline justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">Alice</h1>
                <p className="text-xs">{s.user.email}</p>
            </header>
            <section className="space-y-2">
                <h2 className="text-sm font-medium">Closets ({count})</h2>
                <p className="text-sm text-cream/70">
                    Dashboard UI W.I.P. API endpoints are live under
                    <code className="mx-1 rounded bg-cream/10 px-1">/api/closets</code>.
                </p>
            </section>
            <LogoutButton />
        </main>
    );
}
