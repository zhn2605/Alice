import { describe, it, expect } from 'vitest';
import { formatRelative } from '../lib/format';

describe('formatRelative', () => {
    const now = 1_700_000_000_000;

    it('returns "just now" for <60s', () => {
        expect(formatRelative(now - 30_000, now)).toBe('just now');
    });

    it('returns minutes for <60m', () => {
        expect(formatRelative(now - 5 * 60_000, now)).toBe('5m ago');
        expect(formatRelative(now - 59 * 60_000, now)).toBe('59m ago');
    });

    it('returns hours for <24h', () => {
        expect(formatRelative(now - 2 * 3600_000, now)).toBe('2h ago');
        expect(formatRelative(now - 23 * 3600_000, now)).toBe('23h ago');
    });

    it('returns days for >=24h', () => {
        expect(formatRelative(now - 25 * 3600_000, now)).toBe('1d ago');
        expect(formatRelative(now - 9 * 86400_000, now)).toBe('9d ago');
    });

    it('handles null timestamps', () => {
        expect(formatRelative(null, now)).toBe('never');
    });
});
