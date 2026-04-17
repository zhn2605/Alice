'use client';
import { useState } from 'react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                window.location.href = '/dashboard';
                return;
            }
            const { error } = await res.json();
            setErr(error ?? 'signup failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-6">
                <header>
                    <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
                    <p className="text-sm text-neutral-500 mt-1">Create an Alice account.</p>
                </header>
                <form onSubmit={submit} className="space-y-3">
                    <input
                        type="email"
                        placeholder="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <input
                        type="password"
                        placeholder="password (≥8 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                    >
                        {loading ? 'Creating…' : 'Sign up'}
                    </button>
                </form>
                {err && <p className="text-sm text-red-600">{err}</p>}
                <p className="text-sm text-neutral-500">
                    Already have an account?{' '}
                    <a href="/login" className="underline hover:text-neutral-900">
                        Log in
                    </a>
                </p>
            </div>
        </main>
    );
}
