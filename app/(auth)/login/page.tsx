'use client';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                window.location.href = '/dashboard';
                return;
            }
            const { error } = await res.json();
            setErr(error ?? 'login failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex-1 flex items-center justify-center p-6 bg-espresso">
            <div className="w-full max-w-sm space-y-6">
                <header>
                    <h1 className="text-3xl font-semibold tracking-tight text-cream">Log in</h1>
                    <p className="text-sm text-cream mt-1">Welcome back to Alice.</p>
                </header>
                <form onSubmit={submit} className="space-y-3">
                    <input
                        type="email"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded border border-rose px-[1vh] py-[.75vh] text-sm focus:outline-none focus:ring-1 focus:ring-rose"
                    />
                    <input
                        type="password"
                        placeholder="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded border border-rose px-[1vh] py-[.75vh] text-sm focus:outline-none focus:ring-1 focus:ring-rose"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-moss text-cream py-2 text-sm font-medium hover:bg-coral disabled:opacity-50"
                    >
                        {loading ? 'Logging in…' : 'Log in'}
                    </button>
                </form>
                {err && <p className="text-sm text-coral">{err}</p>}
                <p className="text-sm text-cream">
                    Need an account?{' '}
                    <a href="/signup" className="underline hover:text-rose">
                        Sign up
                    </a>
                </p>
            </div>
        </main>
    );
}
