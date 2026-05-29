import { getSession } from '@/lib/auth/middleware';
import Sidebar from '../components/Sidebar';

export default async function TopLayout({ children }: { children: React.ReactNode }) {
    const s = await getSession();
    return (
        <>
            <Sidebar mode="top" email={s!.user.email} />
            <main className="flex-1 p-8">{children}</main>
        </>
    );
}
