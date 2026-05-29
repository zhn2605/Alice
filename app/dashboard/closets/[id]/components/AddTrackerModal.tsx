'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Preview = {
    label: string | null;
    image_url: string | null;
    available_sizes: string[];
};

export default function AddTrackerModal({
    closetId,
    onClose,
}: {
    closetId: string;
    onClose: () => void;
}) {
    const router = useRouter();
    const [stage, setStage] = useState<'url' | 'preview'>('url');
    const [url, setUrl] = useState('');
    const [preview, setPreview] = useState<Preview | null>(null);
    const [label, setLabel] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function fetchPreview(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setBusy(true);
        try {
            const res = await fetch(`/api/trackers/preview?url=${encodeURIComponent(url)}`);
            const body = await res.json();
            if (!res.ok) {
                setErr(body.error ?? 'preview failed');
                return;
            }
            const p: Preview = body;
            setPreview(p);
            setLabel(p.label ?? '');
            setSelected(new Set(p.available_sizes));
            setStage('preview');
        } finally {
            setBusy(false);
        }
    }

    async function submit() {
        setErr(null);
        setBusy(true);
        try {
            const res = await fetch(`/api/closets/${closetId}/trackers`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    url,
                    label: label.trim() === '' ? null : label,
                    sizes: [...selected],
                    image_url: preview?.image_url ?? null,
                }),
            });
            const body = await res.json();
            if (!res.ok) {
                setErr(body.error ?? 'failed to add');
                return;
            }
            router.refresh();
            onClose();
        } finally {
            setBusy(false);
        }
    }

    function toggle(size: string) {
        const next = new Set(selected);
        if (next.has(size)) next.delete(size);
        else next.add(size);
        setSelected(next);
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
                <h2 className="font-fashion text-heading font-semibold text-cream">Add Tracker</h2>

                {stage === 'url' && (
                    <form onSubmit={fetchPreview} className="space-y-3">
                        <input
                            type="url"
                            placeholder="paste product URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                            className="w-full rounded border border-rose/40 bg-transparent px-3 py-2 text-sm text-cream focus:outline-none focus:border-rose"
                        />
                        {err && <p className="text-sm text-coral">{err}</p>}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-sm rounded-full border border-rose/40 hover:border-rose text-cream"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={busy}
                                className="btn-sm rounded-full bg-moss hover:bg-coral text-cream disabled:opacity-50"
                            >
                                {busy ? 'Loading…' : 'Preview'}
                            </button>
                        </div>
                    </form>
                )}

                {stage === 'preview' && preview && (
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            {preview.image_url && (
                                <img
                                    src={preview.image_url}
                                    alt=""
                                    className="w-24 h-24 object-cover rounded border border-rose/20"
                                />
                            )}
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="label"
                                className="flex-1 rounded border border-rose/40 bg-transparent px-3 py-2 text-sm text-cream focus:outline-none focus:border-rose"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-wide text-rose">Sizes</span>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setSelected(new Set(preview.available_sizes))}
                                        className="text-cream/70 hover:text-cream"
                                    >
                                        All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelected(new Set())}
                                        className="text-cream/70 hover:text-cream"
                                    >
                                        None
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {preview.available_sizes.map((s) => {
                                    const on = selected.has(s);
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggle(s)}
                                            className={`btn-sm rounded-full text-xs ${
                                                on
                                                    ? 'bg-moss text-cream'
                                                    : 'border border-rose/40 text-cream/80 hover:border-rose'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {err && <p className="text-sm text-coral">{err}</p>}
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={() => setStage('url')}
                                className="btn-sm rounded-full border border-rose/40 hover:border-rose text-cream"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={busy || selected.size === 0}
                                className="btn-sm rounded-full bg-moss hover:bg-coral text-cream disabled:opacity-50"
                            >
                                {busy ? 'Adding…' : 'Add'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
