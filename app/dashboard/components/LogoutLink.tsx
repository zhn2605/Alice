'use client';

import { useRouter } from 'next/navigation';

export default function LogoutLink() {
    const router = useRouter();
    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    }
    return (
        <button
            onClick={logout}
            className="text-left text-body text-cream/80 hover:text-coral transition"
        >
            Log Out
        </button>
    );
}
