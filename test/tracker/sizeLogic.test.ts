import { describe, it, expect } from 'vitest';
import {
    parseSizes,
    parseLastSizes,
    effectiveStatusMulti,
    mergeSizes,
    newlyRestocked,
} from '../../lib/tracker/sizeLogic';
import type { StockSnapshot } from '../../lib/tracker/types';

describe('parseSizes', () => {
    it('parses JSON array', () => {
        expect(parseSizes('["32DDD","34DD"]')).toEqual(['32DDD', '34DD']);
    });
    it('returns [] on garbage', () => {
        expect(parseSizes('not json')).toEqual([]);
        expect(parseSizes('{}')).toEqual([]);
    });
});

describe('parseLastSizes', () => {
    it('parses object of status', () => {
        expect(parseLastSizes('{"S":"in","M":"out"}')).toEqual({ S: 'in', M: 'out' });
    });
    it('returns {} on null or bad input', () => {
        expect(parseLastSizes(null)).toEqual({});
        expect(parseLastSizes('[]')).toEqual({});
    });
});

describe('effectiveStatusMulti', () => {
    const snap: StockSnapshot = {
        overall_stock: 'in',
        specific_stock: { S: 'in', M: 'out', L: 'in' },
    };
    it('returns overall when tracked is empty', () => {
        expect(effectiveStatusMulti(snap, [])).toBe('in');
    });
    it('returns in if any tracked size is in', () => {
        expect(effectiveStatusMulti(snap, ['M', 'L'])).toBe('in');
    });
    it('returns out if all tracked sizes are out', () => {
        expect(effectiveStatusMulti(snap, ['M'])).toBe('out');
    });
    it('returns out for tracked sizes not present', () => {
        expect(effectiveStatusMulti(snap, ['XXL'])).toBe('out');
    });
});

describe('mergeSizes', () => {
    it('unions and dedupes', () => {
        expect(mergeSizes(['S', 'M'], ['M', 'L']).sort()).toEqual(['L', 'M', 'S']);
    });
    it('handles empty inputs', () => {
        expect(mergeSizes([], ['S'])).toEqual(['S']);
        expect(mergeSizes(['S'], [])).toEqual(['S']);
    });
});

describe('newlyRestocked', () => {
    it('returns sizes that went out→in', () => {
        const prev = { S: 'out', M: 'in', L: 'out' } as const;
        const curr = { S: 'in', M: 'in', L: 'in' } as const;
        expect(newlyRestocked(['S', 'M', 'L'], prev, curr).sort()).toEqual(['L', 'S']);
    });
    it('ignores untracked sizes', () => {
        const prev = { S: 'out' } as const;
        const curr = { S: 'in', M: 'in' } as const;
        expect(newlyRestocked(['S'], prev, curr)).toEqual(['S']);
    });
    it('returns empty if nothing flipped', () => {
        const prev = { S: 'in' } as const;
        const curr = { S: 'in' } as const;
        expect(newlyRestocked(['S'], prev, curr)).toEqual([]);
    });
});
