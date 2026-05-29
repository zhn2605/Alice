import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth/middleware';
import { getSupabase } from '@/lib/db';
import Sidebar from '../../components/Sidebar';

export default async function ClosetLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const s = await getSession();
    const { id } = await params;

    const { data: closet } = await getSupabase()
        .from('closets')
        .select('id, name')
        .eq('id', id)
        .eq('user_id', s!.user.id)
        .single();

    if (!closet) notFound();

    return (
        <>
            <Sidebar
                mode="closet"
                email={s!.user.email}
                closetId={id}
                closetName={closet.name}
            />
            <main className="flex-1 p-8">{children}</main>
        </>
    );
}
