'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClosetModal({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const [name, setName] = useState('');
    const [webhook, setWebhook] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setSaving(true);
        try {
            const res = await fetch('/api/closets', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    name,
                    discord_webhook_url: webhook.trim() === '' ? null : webhook,
                }),
            });
            if (res.ok) {
                router.refresh();
                onClose();
                return;
            }
            const { error } = await res.json();
            setErr(error ?? 'failed to create closet');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-40 bg-espresso/80 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-espresso border border-rose/30 rounded-2xl p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="font-fashion text-heading font-semibold text-cream">New Closet</h2>
                <form onSubmit={submit} className="space-y-3">
                    <input
                        type="text"
                        placeholder="closet name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded border border-rose/40 bg-transparent px-3 py-2 text-sm text-cream focus:outline-none focus:border-rose"
                    />
                    <input
                        type="url"
                        placeholder="optional Discord webhook for restock alerts"
                        value={webhook}
                        onChange={(e) => setWebhook(e.target.value)}
                        className="w-full rounded border border-rose/40 bg-transparent px-3 py-2 text-sm text-cream focus:outline-none focus:border-rose"
                    />
                    {err && <p className="text-sm text-coral">{err}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-sm rounded-full border border-rose/40 hover:border-rose text-cream"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-sm rounded-full bg-moss hover:bg-coral text-cream disabled:opacity-50"
                        >
                            {saving ? 'Creating…' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
