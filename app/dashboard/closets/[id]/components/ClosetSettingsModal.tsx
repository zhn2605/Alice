'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClosetSettingsModal({
    closet,
    onClose,
}: {
    closet: { id: string; name: string; discord_webhook_url: string | null };
    onClose: () => void;
}) {
    const router = useRouter();
    const [name, setName] = useState(closet.name);
    const [webhook, setWebhook] = useState(closet.discord_webhook_url ?? '');
    const [deleting, setDeleting] = useState(false);
    const [typed, setTyped] = useState('');
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function save() {
        setBusy(true);
        setErr(null);
        try {
            const res = await fetch(`/api/closets/${closet.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    name,
                    discord_webhook_url: webhook.trim() === '' ? null : webhook,
                }),
            });
            if (!res.ok) {
                const body = await res.json();
                setErr(body.error ?? 'save failed');
                return;
            }
            router.refresh();
            onClose();
        } finally {
            setBusy(false);
        }
    }

    async function doDelete() {
        setBusy(true);
        try {
            const res = await fetch(`/api/closets/${closet.id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/dashboard');
            } else {
                const body = await res.json();
                setErr(body.error ?? 'delete failed');
            }
        } finally {
            setBusy(false);
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
                <h2 className="font-fashion text-heading font-semibold text-cream">
                    Closet settings
                </h2>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs uppercase tracking-wide text-rose">Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full rounded border border-rose/40 bg-transparent px-3 py-2 text-sm text-cream focus:outline-none focus:border-rose"
                        />
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-wide text-rose">
                            Discord webhook
                        </label>
                        <input
                            type="url"
                            placeholder="optional"
                            value={webhook}
                            onChange={(e) => setWebhook(e.target.value)}
                            className="mt-1 w-full rounded border border-rose/40 bg-transparent px-3 py-2 text-sm text-cream focus:outline-none focus:border-rose"
                        />
                    </div>
                </div>

                {err && <p className="text-sm text-coral">{err}</p>}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="btn-sm rounded-full border border-rose/40 hover:border-rose text-cream"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={busy}
                        className="btn-sm rounded-full bg-moss hover:bg-coral text-cream disabled:opacity-50"
                    >
                        Save
                    </button>
                </div>

                <div className="pt-4 border-t border-rose/20 space-y-2">
                    <div className="text-xs uppercase tracking-wide text-coral">Danger zone</div>
                    {!deleting ? (
                        <button
                            onClick={() => setDeleting(true)}
                            className="btn-sm rounded-full bg-coral text-cream text-xs"
                        >
                            Delete closet
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-cream/80">
                                This deletes the closet and all of its trackers. Type{' '}
                                <span className="font-mono text-cream">{closet.name}</span> to confirm.
                            </p>
                            <input
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                className="w-full rounded border border-coral/40 bg-transparent px-3 py-2 text-sm text-cream focus:outline-none focus:border-coral"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setDeleting(false);
                                        setTyped('');
                                    }}
                                    className="btn-sm rounded-full border border-rose/40 text-cream text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={doDelete}
                                    disabled={busy || typed !== closet.name}
                                    className="btn-sm rounded-full bg-coral text-cream text-xs disabled:opacity-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
