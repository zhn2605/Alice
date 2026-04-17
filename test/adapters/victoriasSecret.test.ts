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
    it('returns per-size map and overall_stock in when sizes available', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, '5TKS');
        expect(snap.overall_stock).toBe('in');
        expect(snap.specific_stock).toEqual({ S: 'in', M: 'in', L: 'out' });
    });

    it('returns sibling sizes as out when variant isSoldOut AND no own sizes', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, '7MXW');
        expect(snap.overall_stock).toBe('out');
        expect(snap.specific_stock).toEqual({ S: 'out', M: 'out', L: 'out' });
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
        expect(snap.overall_stock).toBe('in');
        expect(snap.specific_stock).toEqual({ '32DDD (F)': 'in', '40C': 'in' });
    });

    it('returns empty map when availableSizes empty even without isSoldOut', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, '9ZZZ');
        expect(snap.overall_stock).toBe('out');
    });

    it('returns empty snapshot when choice not present', () => {
        const snap = parseVictoriasSecret(SAMPLE_JSON, 'NOPE');
        expect(snap.overall_stock).toBe('out');
        expect(snap.specific_stock).toEqual({});
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
        const sizes = v?.availableSizes as Record<string, { isAvailable?: boolean }> | undefined;
        expect(sizes?.['30A']).toMatchObject({ isAvailable: true });
    });
});

describe('parseVictoriasSecret product extraction', () => {
    it('builds title from product label + choice label and resolves image path', () => {
        const json = JSON.stringify({
            productData: {
                '11270925': {
                    label: 'Logo Strappy Plunge Bra',
                    choices: {
                        '7CLB': {
                            label: 'Heather Burgundy',
                            images: [
                                { type: 'onModelFront', image: 'png/zz/25/07/30/01/112709257CLB_OM_F' },
                                { type: 'offModelFront', image: 'png/zz/25/08/01/03/112709257CLB_OF_F' },
                            ],
                            isSoldOut: false,
                            availableSizes: {
                                '32DDD': { isAvailable: true },
                                '34DD':  { isAvailable: false },
                            },
                        },
                    },
                },
            },
        });
        const snap = parseVictoriasSecret(json, '7CLB');
        expect(snap.product?.title).toBe('Logo Strappy Plunge Bra — Heather Burgundy');
        expect(snap.product?.image_url).toContain('112709257CLB_OF_F.jpg');
        expect(snap.overall_stock).toBe('in');
        expect(snap.specific_stock).toEqual({ '32DDD': 'in', '34DD': 'out' });
    });

    it('parses real-world string-array shape with availableSizes + unavailableSizes', () => {
        const json = JSON.stringify({
            productData: {
                '11270925': {
                    label: 'Cotton Lace Trim',
                    choices: {
                        '7J0X': {
                            label: 'Noir Navy',
                            images: [{ type: 'offModelFront', image: 'png/zz/x/7J0X_OF_F' }],
                            availableSizes: ['32A', '32B', '34A'],
                            unavailableSizes: ['30A', '30B'],
                        },
                    },
                },
            },
        });
        const snap = parseVictoriasSecret(json, '7J0X');
        expect(snap.overall_stock).toBe('in');
        expect(snap.specific_stock).toEqual({
            '32A': 'in',
            '32B': 'in',
            '34A': 'in',
            '30A': 'out',
            '30B': 'out',
        });
    });
});

describe('parseVictoriasSecret size union across thin + rich nodes', () => {
    it('lists OOS sizes that only exist in the thin config node', () => {
        const data = {
            config: {
                BRA1: {
                    // thin: complete size list, no isAvailable
                    availableSizes: {
                        '30A': { variantId: 'v1' },
                        '30B': { variantId: 'v2' },
                        '34DD': { variantId: 'v3' },
                    },
                },
            },
            stock: {
                BRA1: {
                    // rich: only the currently-purchasable sizes
                    isSoldOut: false,
                    availableSizes: {
                        '34DD': { isAvailable: true },
                    },
                },
            },
        };
        const snap = parseVictoriasSecret(JSON.stringify(data), 'BRA1');
        expect(snap.specific_stock).toEqual({
            '30A': 'out',
            '30B': 'out',
            '34DD': 'in',
        });
        expect(snap.overall_stock).toBe('in');
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
        expect(snap.specific_stock).toEqual({ '30A': 'in', '30B': 'out', '34DD': 'in' });
        expect(snap.overall_stock).toBe('in');
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
