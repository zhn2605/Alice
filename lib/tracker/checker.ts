import type { StockSnapshot, StockStatus } from './types';

export const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export function effectiveStatus(snapshot: StockSnapshot, size: string | null): StockStatus {
    if (size === null) {
        return snapshot.anyAvailable ? 'in' : 'out';
    }
    return snapshot.sizes[size] === true ? 'in' : 'out';
}

export interface DecideNotifyArgs {
    newStatus: StockStatus;
    last_status: StockStatus | null;
    last_notified_at: number | null;
    webhookUrl: string | null;
    now: number;
}

export function decideNotify(a: DecideNotifyArgs): boolean {
    if (!a.webhookUrl) return false;
    if (a.last_status !== 'out') return false;
    if (a.newStatus !== 'in') return false;
    if (a.last_notified_at !== null && a.now - a.last_notified_at < NOTIFY_COOLDOWN_MS) return false;
    return true;
}
