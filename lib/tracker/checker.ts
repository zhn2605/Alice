import { SupabaseClient } from '@supabase/supabase-js';
import type { StockSnapshot, StockStatus, TrackerRow } from './types';
import { findAdapter } from './adapters';
import { sendDiscord } from './notifier';
import {
    parseSizes,
    parseLastSizes,
    effectiveStatusMulti,
    newlyRestocked,
} from './sizeLogic';

export const NOTIFY_COOLDOWN_MS = 60 * 60 * 1000;

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

export async function runCheck(
    supabase: SupabaseClient,
    tracker: TrackerRow,
    webhookUrl: string | null,
    now: number = Date.now(),
): Promise<void> {
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

    const tracked = parseSizes(tracker.sizes);
    const newStatus = effectiveStatusMulti(snapshot, tracked);

    const previousSizes = parseLastSizes(tracker.last_sizes);
    const restockedSizes = newlyRestocked(tracked, previousSizes, snapshot.specific_stock);

    const shouldNotify = decideNotify({
        newStatus,
        last_status: tracker.last_status,
        last_notified_at: tracker.last_notified_at,
        webhookUrl,
        now,
    });

    const updates: Record<string, unknown> = {
        last_status: newStatus,
        last_sizes: snapshot.specific_stock,
        last_checked_at: now,
    };
    if (shouldNotify) updates.last_notified_at = now;

    await supabase.from('trackers').update(updates).eq('id', tracker.id);

    if (shouldNotify && webhookUrl) {
        try {
            await sendDiscord(webhookUrl, {
                ...tracker,
                last_status: newStatus,
                last_sizes: snapshot.specific_stock,
                last_checked_at: now,
                last_notified_at: now,
            }, restockedSizes);
        } catch (err) {
            console.error(`[checker] ${tracker.id} notify failed:`, err);
        }
    }
}
