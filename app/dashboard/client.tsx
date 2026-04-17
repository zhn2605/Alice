'use client';
import { useState } from 'react';
import type { TrackerRow } from '@/lib/tracker/types';
import TrackerWidget from './components/TrackerWidget';
import TrackTrackerModal from './components/TrackTrackerModal';

interface Props {
    initialTrackers: TrackerRow[];
    currentWebhook: string | null;
}

export default function DashboardClient({ initialTrackers, currentWebhook }: Props) {
    const [trackers, setTrackers] = useState<TrackerRow[]>(initialTrackers);
    const [webhook, setWebhook] = useState(currentWebhook ?? '');
    const [modal, setModal] = useState<
        { mode: 'create' } | { mode: 'edit'; tracker: TrackerRow } | null
    >(null);
    const [err, setErr] = useState<string | null>(null);
    const [msg, setMsg] = useState<string | null>(null);

    async function refresh() {
        const r = await fetch('/api/trackers');
        const j = await r.json();
        setTrackers(j.trackers ?? []);
    }

    async function del(id: string) {
        await fetch(`/api/trackers/${id}`, { method: 'DELETE' });
        refresh();
    }

    async function saveWebhook() {
        setErr(null);
        setMsg(null);
        const r = await fetch('/api/me/webhook', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ webhookUrl: webhook || null }),
        });
        if (!r.ok) {
            setErr((await r.json()).error ?? 'failed to save webhook');
            return;
        }
        setMsg('Webhook saved.');
    }

    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    }

    const fallbackNames = new Map<string, string>();
    let unnamedCount = 0;
    for (const t of trackers) {
        if (!t.label) {
            unnamedCount += 1;
            fallbackNames.set(t.id, `Unnamed-${unnamedCount}`);
        }
    }

    return (
        <div className="space-y-6">
            <section className="space-y-2">
                <h2 className="text-sm font-medium text-neutral-700">Discord webhook</h2>
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={webhook}
                        onChange={(e) => setWebhook(e.target.value)}
                        className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <button
                        onClick={saveWebhook}
                        className="rounded bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800"
                    >
                        Save
                    </button>
                </div>
                {(err || msg) && (
                    <p className={`text-xs ${err ? 'text-red-600' : 'text-green-600'}`}>
                        {err ?? msg}
                    </p>
                )}
            </section>

            <button
                onClick={() => setModal({ mode: 'create' })}
                className="w-full rounded-full bg-pink-500 hover:bg-pink-600 text-white py-3 text-sm font-medium"
            >
                Track New Item +
            </button>

            <section className="space-y-2">
                <h2 className="text-sm font-medium text-neutral-700">
                    Tracked <span className="text-neutral-400">({trackers.length})</span>
                </h2>
                {trackers.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                        Nothing tracked yet. Click Track New Item above.
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {trackers.map((t) => (
                            <TrackerWidget
                                key={t.id}
                                tracker={t}
                                fallbackName={fallbackNames.get(t.id) ?? (t.label ?? 'Unnamed')}
                                onEdit={() => setModal({ mode: 'edit', tracker: t })}
                                onDelete={() => del(t.id)}
                            />
                        ))}
                    </div>
                )}
            </section>

            <div className="pt-4 border-t border-neutral-200">
                <button
                    onClick={logout}
                    className="text-sm text-neutral-500 hover:text-neutral-900 underline"
                >
                    Log out
                </button>
            </div>

            {modal && (
                <TrackTrackerModal
                    mode={modal.mode}
                    existing={modal.mode === 'edit' ? modal.tracker : undefined}
                    currentWebhook={currentWebhook}
                    onClose={() => setModal(null)}
                    onSaved={refresh}
                />
            )}
        </div>
    );
}
