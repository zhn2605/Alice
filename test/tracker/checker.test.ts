import { describe, it, expect } from 'vitest';
import { decideNotify, NOTIFY_COOLDOWN_MS } from '../../lib/tracker/checker';

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
        expect(decideNotify({ ...base, last_status: null as unknown as 'out', newStatus: 'in' })).toBe(false);
    });

    it('does NOT notify when status stays the same', () => {
        expect(decideNotify({ ...base, last_status: 'in' as const, newStatus: 'in' })).toBe(false);
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
