'use client';

export default function LogoutButton() {
    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    }

    return (
        <button
            onClick={logout}
            className="text-sm text-cream/70 hover:text-rose underline"
        >
            Log out
        </button>
    );
}
