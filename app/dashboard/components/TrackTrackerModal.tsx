'use client';
import { useEffect, useState } from 'react';
import type { TrackerRow } from '@/lib/tracker/types';

interface PreviewResult {
    label: string | null;
    image_url: string | null;
    available_sizes: string[];
}

interface Props {
    mode: 'create' | 'edit';
    existing?: TrackerRow;
    currentWebhook: string | null;
    onClose: () => void;
    onSaved: () => void;
}

export default function TrackTrackerModal({
    mode,
    existing,
    currentWebhook,
    onClose,
    onSaved,
}: Props) {
    const [url, setUrl] = useState(existing?.url ?? '');
    const [label, setLabel] = useState(existing?.label ?? '');
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [selected, setSelected] = useState<Set<string>>(() => {
        if (!existing) return new Set();
        try {
            const v = JSON.parse(existing.sizes);
            return new Set(Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
        } catch {
            return new Set();
        }
    });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function runPreview(targetUrl: string) {
        if (!targetUrl) return;
        setLoading(true);
        setErr(null);
        try {
            const r = await fetch(`/api/trackers/preview?url=${encodeURIComponent(targetUrl)}`);
            const j = await r.json();
            if (!r.ok) {
                setErr(j.error ?? 'preview failed');
                setPreview(null);
            } else {
                setPreview(j);
            }
        } catch {
            setErr('preview failed');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (mode === 'edit' && existing) {
            runPreview(existing.url);
        }
    }, [mode, existing]);

    function toggleSize(size: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(size)) next.delete(size);
            else next.add(size);
            return next;
        });
    }

    async function submit() {
        setSubmitting(true);
        setErr(null);
        try {
            if (mode === 'create') {
                const r = await fetch('/api/trackers', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        url,
                        label: label || undefined,
                        sizes: [...selected],
                        image_url: preview?.image_url ?? null,
                    }),
                });
                if (!r.ok) {
                    setErr((await r.json()).error ?? 'failed to track');
                    setSubmitting(false);
                    return;
                }
            } else if (existing) {
                const r = await fetch(`/api/trackers/${existing.id}`, {
                    method: 'PATCH',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        label: label || null,
                        sizes: [...selected],
                    }),
                });
                if (!r.ok) {
                    setErr((await r.json()).error ?? 'failed to save');
                    setSubmitting(false);
                    return;
                }
            }
            onSaved();
            onClose();
        } catch {
            setErr('network error');
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-3 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                        {mode === 'create' ? 'Track New Item' : 'Edit Tracker'}
                    </h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
                        ✕
                    </button>
                </div>

                {!currentWebhook && (
                    <div className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-2">
                        ⚠ Set a Discord webhook before tracking — you won&apos;t get notified.
                    </div>
                )}

                {mode === 'create' && (
                    <div>
                        <label className="block text-xs text-neutral-600 mb-1">Product URL</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    if (preview) setPreview(null);
                                }}
                                className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-sm"
                                placeholder="https://www.victoriassecret.com/..."
                            />
                            <button
                                type="button"
                                onClick={() => runPreview(url)}
                                disabled={!url || loading}
                                className="rounded bg-neutral-900 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                            >
                                Check
                            </button>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="text-xs text-neutral-500">checking product...</div>
                )}

                {preview && (
                    <>
                        {preview.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={preview.image_url}
                                alt=""
                                className="w-full max-h-40 object-contain rounded bg-neutral-50"
                            />
                        )}
                        <div>
                            <label className="block text-xs text-neutral-600 mb-1">Label</label>
                            <input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder={preview.label ?? 'optional'}
                                className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-neutral-600 mb-1">
                                Sizes to track (none = whole product)
                            </label>
                            {preview.available_sizes.length === 0 ? (
                                <p className="text-xs text-neutral-500">
                                    no sizes found — will track whole product
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto border border-neutral-200 rounded p-2">
                                    {preview.available_sizes.map((size) => (
                                        <label
                                            key={size}
                                            className="flex items-center gap-1 text-xs cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected.has(size)}
                                                onChange={() => toggleSize(size)}
                                            />
                                            <span>{size}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {err && <p className="text-xs text-red-600">{err}</p>}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="text-sm text-neutral-500 hover:text-neutral-900 px-3 py-1.5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={submitting || (mode === 'create' && !preview)}
                        className="rounded-full bg-pink-500 hover:bg-pink-600 text-white px-4 py-1.5 text-sm font-medium disabled:opacity-50"
                    >
                        {submitting ? 'saving...' : mode === 'create' ? 'Track' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
