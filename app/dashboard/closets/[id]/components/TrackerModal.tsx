'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TrackerRow } from '@/lib/tracker/types';
import { formatRelative } from '@/lib/format';

export default function TrackerModal({
    tracker,
    onClose,
}: {
    tracker: TrackerRow;
    onClose: () => void;
}) {
    const router = useRouter();
    const [label, setLabel] = useState(tracker.label ?? '');
    const [editingLabel, setEditingLabel] = useState(false);

    const [sizes, setSizes] = useState<string[]>(
        Array.isArray(tracker.sizes) ? tracker.sizes : [],
    );
    const [editingSizes, setEditingSizes] = useState(false);
    const [availableSizes, setAvailableSizes] = useState<string[] | null>(null);
    const [sizesLoading, setSizesLoading] = useState(false);

    const [confirmDel, setConfirmDel] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const outOfStock = tracker.last_status === 'out';
    const domain = (() => {
        try {
            return new URL(tracker.url).hostname.replace(/^www\./, '');
        } catch {
            return tracker.url;
        }
    })();

    async function saveLabel() {
        setBusy(true);
        setErr(null);
        try {
            const res = await fetch(`/api/trackers/${tracker.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ label: label.trim() === '' ? null : label }),
            });
            if (!res.ok) {
                const body = await res.json();
                setErr(body.error ?? 'save failed');
                return;
            }
            setEditingLabel(false);
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function startEditSizes() {
        setEditingSizes(true);
        if (availableSizes === null) {
            setSizesLoading(true);
            try {
                const res = await fetch(
                    `/api/trackers/preview?url=${encodeURIComponent(tracker.url)}`,
                );
                if (res.ok) {
                    const body = await res.json();
                    setAvailableSizes(body.available_sizes ?? []);
                } else {
                    setErr('could not load size options');
                    setAvailableSizes([]);
                }
            } finally {
                setSizesLoading(false);
            }
        }
    }

    function toggleSize(s: string) {
        setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    }

    async function saveSizes() {
        setBusy(true);
        setErr(null);
        try {
            const res = await fetch(`/api/trackers/${tracker.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sizes }),
            });
            if (!res.ok) {
                const body = await res.json();
                setErr(body.error ?? 'save failed');
                return;
            }
            setEditingSizes(false);
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function doDelete() {
        setBusy(true);
        try {
            const res = await fetch(`/api/trackers/${tracker.id}`, { method: 'DELETE' });
            if (res.ok) {
                onClose();
                router.refresh();
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
                className="w-full max-w-2xl bg-espresso border border-rose/30 rounded-2xl p-6 space-y-4 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="close"
                    className="absolute top-4 right-4 text-cream/60 hover:text-cream"
                >
                    ×
                </button>

                <div className="flex gap-4">
                    <div className="w-48 h-48 shrink-0 rounded border border-rose/20 overflow-hidden bg-espresso">
                        {tracker.image_url ? (
                            <img src={tracker.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-cream/30 text-xs">
                                no image
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            {editingLabel ? (
                                <>
                                    <input
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        className="flex-1 rounded border border-rose/40 bg-transparent px-2 py-1 text-sm text-cream"
                                    />
                                    <button
                                        onClick={saveLabel}
                                        disabled={busy}
                                        className="text-xs text-moss hover:text-cream"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingLabel(false);
                                            setLabel(tracker.label ?? '');
                                        }}
                                        className="text-xs text-cream/60 hover:text-cream"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="font-fashion text-heading text-cream">
                                        {tracker.label ?? 'Untitled'}
                                    </span>
                                    <button
                                        onClick={() => setEditingLabel(true)}
                                        aria-label="edit label"
                                        className="text-cream/50 hover:text-cream text-sm"
                                    >
                                        ✎
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="text-xs text-cream/60">{domain}</div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs uppercase tracking-wide text-rose">Sizes tracked</span>
                                {!editingSizes && (
                                    <button
                                        onClick={startEditSizes}
                                        aria-label="edit sizes"
                                        className="text-cream/50 hover:text-cream text-sm"
                                    >
                                        ✎
                                    </button>
                                )}
                            </div>
                            {editingSizes ? (
                                <div className="mt-2 space-y-2">
                                    {sizesLoading && <p className="text-xs text-cream/60">loading…</p>}
                                    {availableSizes && availableSizes.length === 0 && (
                                        <p className="text-xs text-coral">no sizes available</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {(availableSizes ?? []).map((s) => {
                                            const on = sizes.includes(s);
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => toggleSize(s)}
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
                                    <div className="flex gap-2">
                                        <button
                                            onClick={saveSizes}
                                            disabled={busy}
                                            className="btn-sm rounded-full bg-moss hover:bg-coral text-cream text-xs disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingSizes(false);
                                                setSizes(Array.isArray(tracker.sizes) ? tracker.sizes : []);
                                            }}
                                            className="btn-sm rounded-full border border-rose/40 text-cream text-xs"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {sizes.length === 0 ? (
                                        <span className="text-xs text-cream/60">none</span>
                                    ) : (
                                        sizes.map((s) => (
                                            <span
                                                key={s}
                                                className="btn-sm rounded-full bg-moss/30 text-cream text-xs"
                                            >
                                                {s}
                                            </span>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-cream/70 space-y-1 pt-2">
                            <div>Last checked: {formatRelative(tracker.last_checked_at ?? null)}</div>
                            <div className="flex items-center gap-1.5">
                                Status:
                                <span
                                    className={`h-2 w-2 rounded-full ${
                                        outOfStock ? 'bg-coral' : 'bg-moss'
                                    }`}
                                />
                                <span>{outOfStock ? 'Out of stock' : 'In stock'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {err && <p className="text-sm text-coral">{err}</p>}

                <div className="flex justify-between pt-2 border-t border-rose/20">
                    <a
                        href={tracker.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-sm rounded-full border border-rose/40 hover:border-rose text-cream text-xs"
                    >
                        Open product ↗
                    </a>
                    {confirmDel ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-cream">Delete this tracker?</span>
                            <button
                                onClick={() => setConfirmDel(false)}
                                className="btn-sm rounded-full border border-rose/40 text-cream text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={doDelete}
                                disabled={busy}
                                className="btn-sm rounded-full bg-coral text-cream text-xs disabled:opacity-50"
                            >
                                Delete
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDel(true)}
                            className="btn-sm rounded-full bg-coral text-cream text-xs"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
