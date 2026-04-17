'use client';
import { useState } from 'react';
import type { TrackerRow, StockStatus } from '@/lib/tracker/types';

interface Props {
    tracker: TrackerRow;
    fallbackName: string;
    onEdit: () => void;
    onDelete: () => void;
}

function parseJsonArray(s: string | string[]): string[] {
    if (Array.isArray(s)) return s.filter((x): x is string => typeof x === 'string');
    try {
        const v = JSON.parse(s);
        return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

function parseStatusMap(s: string | Record<string, StockStatus> | null): Record<string, StockStatus> {
    if (!s) return {};
    if (typeof s === 'object') {
        const out: Record<string, StockStatus> = {};
        for (const [k, val] of Object.entries(s)) {
            if (val === 'in' || val === 'out') out[k] = val;
        }
        return out;
    }
    try {
        const v = JSON.parse(s);
        if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
        const out: Record<string, StockStatus> = {};
        for (const [k, val] of Object.entries(v)) {
            if (val === 'in' || val === 'out') out[k] = val;
        }
        return out;
    } catch {
        return {};
    }
}

function Pill({ status }: { status: StockStatus | null }) {
    const cls =
        status === 'in'
            ? 'bg-green-100 text-green-700'
            : status === 'out'
              ? 'bg-red-100 text-red-700'
              : 'bg-neutral-100 text-neutral-500';
    return (
        <span className={`text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded ${cls}`}>
            {status ?? '—'}
        </span>
    );
}

export default function TrackerWidget({ tracker, fallbackName, onEdit, onDelete }: Props) {
    const [imgBroken, setImgBroken] = useState(false);
    const tracked = parseJsonArray(tracker.sizes);
    const lastStatusMap = parseStatusMap(tracker.last_sizes);
    const allSizes = Object.keys(lastStatusMap);
    const imgSrc = !imgBroken && tracker.image_url ? tracker.image_url : '/no-image.svg';
    const displayName = tracker.label ?? fallbackName;

    return (
        <div className="border border-neutral-200 rounded-lg p-3 bg-white flex gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imgSrc}
                alt={displayName}
                onError={() => setImgBroken(true)}
                className="w-24 h-24 object-cover rounded bg-neutral-100 shrink-0"
            />
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                    <strong className="truncate text-sm">{displayName}</strong>
                    <div className="flex gap-1 shrink-0">
                        <button
                            onClick={onEdit}
                            className="text-xs text-neutral-500 hover:text-neutral-900"
                            title="Edit"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-xs text-red-500 hover:text-red-700"
                            title="Delete"
                        >
                            🗑
                        </button>
                    </div>
                </div>

                <div className="mt-1 space-y-0.5 text-xs">
                    {tracked.length === 0 ? (
                        <div className="flex items-center gap-1.5">
                            <span className="text-neutral-600">whole product:</span>
                            <Pill status={tracker.last_status} />
                        </div>
                    ) : (
                        tracked.map((size) => (
                            <div key={size} className="flex items-center gap-1.5">
                                <span className="text-neutral-600">{size}:</span>
                                <Pill status={lastStatusMap[size] ?? null} />
                            </div>
                        ))
                    )}
                </div>

                {allSizes.length > 0 && (
                    <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700">
                            all sizes ({allSizes.length})
                        </summary>
                        <div className="mt-1 space-y-0.5 pl-2">
                            {allSizes.map((size) => (
                                <div key={size} className="flex items-center gap-1.5">
                                    <span className="text-neutral-600">{size}:</span>
                                    <Pill status={lastStatusMap[size]} />
                                </div>
                            ))}
                        </div>
                    </details>
                )}

                <a
                    href={tracker.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 self-start bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium px-3 py-1.5 rounded-full"
                >
                    Visit Product →
                </a>
            </div>
        </div>
    );
}
