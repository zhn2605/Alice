import { Database } from 'better-sqlite3';
import type { StockSnapshot, StockStatus, TrackerRow } from './types';
import { findAdapter } from './adapters';
import { UserRow } from '../auth/sessions';
import { sendDiscord } from './notifier';

export const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export function effectiveStatus(snapshot: StockSnapshot, size: string | null): StockStatus {
    if (size === null) {
        return snapshot.overall_stock;
    }
    return snapshot.specific_stock[size] ?? 'out';
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

export async function runCheck (db: Database, tracker: TrackerRow,user: UserRow, now: number = Date.now()): Promise<void> {
    const adapter = findAdapter(tracker.url);
    if (!adapter) {
        console.error(`[checker] no adapter for ${tracker.url}`);
        return;
    }

    let snapshot: StockSnapshot;
    try {
        snapshot = await adapter.check(tracker.url);
    } catch (err) {
        console.error(`[checker] ${tracker.id} check failed:`, err);
        return;
    }

    const newStatus = effectiveStatus(snapshot, tracker.size);
    const sizesJson = JSON.stringify(Object.keys(snapshot.specific_stock));

    const shouldNotify = decideNotify({
        newStatus,
        last_status: tracker.last_status,
        last_notified_at: tracker.last_notified_at,
        webhookUrl: user.discord_webhook_url,
        now,
    });

    const updated: TrackerRow = {
        ...tracker,
        last_status: newStatus,
        last_sizes: sizesJson,
        last_checked_at: now,
        last_notified_at: shouldNotify ? now : tracker.last_notified_at,
    };

    if (shouldNotify) {
        db.prepare(
            `UPDATE trackers SET last_status = ?, last_sizes = ?, last_checked_at = ?, last_notified_at = ? WHERE id = ?`
        ).run(newStatus, sizesJson, now, now, tracker.id);
    } else {
        db.prepare(
            `UPDATE trackers SET last_status = ?, last_sizes = ?, last_checked_at = ? WHERE id = ?`
        ).run(newStatus, sizesJson, now, tracker.id);
    }

    if (shouldNotify && user.discord_webhook_url) {
        try {
            await sendDiscord(user.discord_webhook_url, updated);
        } catch (err) {
            console.error(`[checker] ${tracker.id} notify failed:`, err);
        }
    }
}