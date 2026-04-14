import { describe, it, expect } from 'vitest';
import { parseVictoriasSecret, findVariant, victoriasSecret } from '../../lib/tracker/adapters/victoriasSecret';

const SAMPLE = {
    apiData: {
        product: {
            choices: {
                '5TKS': {
                    isSoldOut: false,
                    availableSizes: {
                        S: { isAvailable: true },
                        M: { isAvailable: true },
                        L: { isAvailable: false },
                    },
                },
                '7MXW': {
                    isSoldOut: true,
                    availableSizes: {},
                },
                '9ZZZ': {
                    isSoldOut: false,
                    availableSizes: {},
                },
            },
        },
    },
};
const SAMPLE_JSON = JSON.stringify(SAMPLE);

describe('parseVictoriasSecret', () => {
    it('returns per-size map and anyAvailable true when sizes available', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, '5TKS');
        expect(snap.anyAvailable).toBe(true);
        expect(snap.sizes).toEqual({ S: true, M: true, L: false });
    });

    it('returns empty map + anyAvailable false when variant isSoldOut', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, '7MXW');
        expect(snap.anyAvailable).toBe(false);
        expect(snap.sizes).toEqual({});
    });

    it('returns empty map when availableSizes empty even without isSoldOut', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, '9ZZZ');
        expect(snap.anyAvailable).toBe(false);
    });

    it('returns empty snapshot when choice not present', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, 'NOPE');
        expect(snap.anyAvailable).toBe(false);
        expect(snap.sizes).toEqual({});
    });
});

describe('findVariant', () => {
    it('locates variant regardless of nesting depth', () => {
        const nested = { a: { b: { c: { TARGET: { availableSizes: { S: {} } } } } } };
        expect(findVariant(nested, 'TARGET')?.availableSizes).toBeDefined();
    });

    it('returns null when no matching key exists', () => {
        expect(findVariant({ x: { y: 1 } }, 'TARGET')).toBeNull();
    });
});

describe('victoriasSecret adapter metadata', () => {
    it('matches victoriassecret.com hostnames', () => {
        expect(victoriasSecret.matches('https://www.victoriassecret.com/us/p/x/123?choice=5TKS')).toBe(true);
        expect(victoriasSecret.matches('https://example.com/x')).toBe(false);
    });
});
