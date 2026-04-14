import { describe, it, expect } from 'vitest';
import { parseVictoriasSecret, findVariant, victoriasSecret, normalizeVsUrl, extractChoice } from '../../lib/tracker/adapters/victoriasSecret';

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

    it('returns empty map + anyAvailable false when variant isSoldOut AND no sizes', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, '7MXW');
        expect(snap.anyAvailable).toBe(false);
        expect(snap.sizes).toEqual({});
    });

    it('trusts availableSizes over isSoldOut flag (limited-quantity case)', () => {
        const limited = {
            apiData: {
                choices: {
                    LIMITED: {
                        isSoldOut: true,
                        availableSizes: {
                            '32DDD (F)': { isAvailable: true, status: 'limitedQuantity' },
                            '40C': { isAvailable: true, status: 'limitedQuantity' },
                        },
                    },
                },
            },
        };
        const snap = parseVictoriasSecret(JSON.stringify(limited), 'LIMITED');
        expect(snap.anyAvailable).toBe(true);
        expect(snap.sizes).toEqual({ '32DDD (F)': true, '40C': true });
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

    it('prefers the rich variant when both thin config and rich stock are present (bras)', () => {
        const bra = {
            config: {
                TARGET: {
                    availableSizes: {
                        '30A': { variantId: 'v1', size1: '30', size2: 'A' },
                        '30B': { variantId: 'v2', size1: '30', size2: 'B' },
                    },
                },
            },
            stock: {
                TARGET: {
                    isSoldOut: false,
                    availableSizes: {
                        '30A': { isAvailable: true, status: 'available' },
                        '30B': { isAvailable: false, status: 'outOfStock' },
                    },
                },
            },
        };
        const v = findVariant(bra, 'TARGET');
        expect(v?.availableSizes?.['30A']).toMatchObject({ isAvailable: true });
    });
});

describe('parseVictoriasSecret with bra sizes', () => {
    it('parses combined band+cup keys as size map', () => {
        const bra = {
            apiData: {
                choices: {
                    BRA1: {
                        isSoldOut: false,
                        availableSizes: {
                            '30A': { isAvailable: true },
                            '30B': { isAvailable: false },
                            '34DD': { isAvailable: true },
                        },
                    },
                },
            },
        };
        const snap = parseVictoriasSecret(JSON.stringify(bra), 'BRA1');
        expect(snap.sizes).toEqual({ '30A': true, '30B': false, '34DD': true });
        expect(snap.anyAvailable).toBe(true);
    });
});

describe('victoriasSecret adapter metadata', () => {
    it('matches victoriassecret.com hostnames', () => {
        expect(victoriasSecret.matches('https://www.victoriassecret.com/us/p/x/123?choice=5TKS')).toBe(true);
        expect(victoriasSecret.matches('https://example.com/x')).toBe(false);
    });

    it('matches shell-escaped URLs with backslashes', () => {
        const escaped = 'https://www.victoriassecret.com/us/p/x/123\\?choice\\=5TKS\\&foo\\=bar';
        expect(victoriasSecret.matches(escaped)).toBe(true);
    });
});

describe('normalizeVsUrl + extractChoice', () => {
    it('strips shell-escape backslashes', () => {
        const raw = 'https://www.victoriassecret.com/us/p/x/123\\?choice\\=5TKS\\&foo\\=bar';
        expect(normalizeVsUrl(raw)).toBe('https://www.victoriassecret.com/us/p/x/123?choice=5TKS&foo=bar');
    });

    it('extracts choice from clean URL', () => {
        expect(extractChoice('https://www.victoriassecret.com/x?choice=5TKS&foo=bar')).toBe('5TKS');
    });

    it('extracts choice from shell-escaped URL', () => {
        const raw = 'https://www.victoriassecret.com/x\\?choice\\=7MXW\\&foo\\=bar';
        expect(extractChoice(raw)).toBe('7MXW');
    });

    it('returns null when choice missing', () => {
        expect(extractChoice('https://www.victoriassecret.com/x?foo=bar')).toBeNull();
    });
});
