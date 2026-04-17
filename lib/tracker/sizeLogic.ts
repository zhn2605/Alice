import type { StockSnapshot, StockStatus } from './types';

export function parseSizes(sizes: string | string[]): string[] {
    if (Array.isArray(sizes)) return sizes.filter((s): s is string => typeof s === 'string');
    try {
        const v = JSON.parse(sizes);
        return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
    } catch {
        return [];
    }
}

export function parseLastSizes(lastSizes: string | Record<string, StockStatus> | null): Record<string, StockStatus> {
    if (!lastSizes) return {};
    if (typeof lastSizes === 'object') {
        const out: Record<string, StockStatus> = {};
        for (const [k, s] of Object.entries(lastSizes)) {
            if (s === 'in' || s === 'out') out[k] = s;
        }
        return out;
    }
    try {
        const v = JSON.parse(lastSizes);
        if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
        const out: Record<string, StockStatus> = {};
        for (const [k, s] of Object.entries(v)) {
            if (s === 'in' || s === 'out') out[k] = s;
        }
        return out;
    } catch {
        return {};
    }
}

export function effectiveStatusMulti(snapshot: StockSnapshot, tracked: string[]): StockStatus {
    if (tracked.length === 0) return snapshot.overall_stock;
    for (const size of tracked) {
        if (snapshot.specific_stock[size] === 'in') return 'in';
    }
    return 'out';
}

export function mergeSizes(existing: string[], incoming: string[]): string[] {
    const set = new Set(existing);
    for (const s of incoming) set.add(s);
    return [...set];
}

export function newlyRestocked(
    tracked: string[],
    previous: Record<string, StockStatus>,
    current: Record<string, StockStatus>,
): string[] {
    const result: string[] = [];
    for (const size of tracked) {
        if (previous[size] === 'out' && current[size] === 'in') {
            result.push(size);
        }
    }
    return result;
}
