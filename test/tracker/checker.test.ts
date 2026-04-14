import { describe, it, expect } from 'vitest';
import { decideNotify, effectiveStatus, NOTIFY_COOLDOWN_MS } from '../../lib/tracker/checker';
import type { StockSnapshot } from '../../lib/tracker/types';

const base = {
    last_status: 'out' as const,
    last_notified_at: null as number | null,
    webhookUrl: 'https://discord.com/api/webhooks/x',
    now: 1_000_000_000_000,
};

describe('decideNotify', () => {
    it('notifies when status changes from out to in', () => {
        expect(decideNotify({ ...base, newStatus: 'in' })).toBe(true);
    });

    it('does NOT notify on first check (last_status = null)', () => {
        expect(decideNotify({ ...base, last_status: null, newStatus: 'in' })).toBe(false);
    });

    it('does NOT notify when status stays the same', () => {
        expect(decideNotify({ ...base, last_status: 'in', newStatus: 'in' })).toBe(false);
    });

    it('does NOT notify when webhook is not set', () => {
        expect(decideNotify({ ...base, webhookUrl: null, newStatus: 'in' })).toBe(false);
    });

    it('does NOT notify within cooldown window', () => {
        expect(decideNotify({ ...base, last_notified_at: base.now - (NOTIFY_COOLDOWN_MS - 1), newStatus: 'in' })).toBe(false);
    });

    it('notifies after cooldown window', () => {
        expect(decideNotify({ ...base, last_notified_at: base.now - (NOTIFY_COOLDOWN_MS + 1), newStatus: 'in' })).toBe(true);
    });
});

describe('effectiveStatus', () => {
    const snap: StockSnapshot = {
        overall_stock: 'in',
        specific_stock: { S: 'in', M: 'out', L: 'in' },
    };
    const empty: StockSnapshot = { overall_stock: 'out', specific_stock: {} };

    it('returns "in" when size=null and overall_stock in', () => {
        expect(effectiveStatus(snap, null)).toBe('in');
    });

    it('returns "out" when size=null and overall_stock out', () => {
        expect(effectiveStatus(empty, null)).toBe('out');
    });

    it('returns "in" when target size is available', () => {
        expect(effectiveStatus(snap, 'S')).toBe('in');
    });

    it('returns "out" when target size is not available', () => {
        expect(effectiveStatus(snap, 'M')).toBe('out');
    });

    it('returns "out" when target size is missing from map', () => {
        expect(effectiveStatus(snap, 'XXL')).toBe('out');
    });
});
