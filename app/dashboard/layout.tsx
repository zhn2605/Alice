import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/middleware';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const s = await getSession();
    if (!s) redirect('/login');

    return (
        <div className="flex min-h-screen bg-espresso text-cream">
            {children}
        </div>
    );
}
