import { StockAdapter, StockSnapshot } from '../types';
import { getBrowser } from '../browser';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

interface VSSizeEntry {
    isAvailable?: boolean;
    status?: string;
}

interface VariantNode {
    isSoldOut?: boolean;
    availableSizes?: Record<string, VSSizeEntry>;
}

function isVariantNode(v: unknown): v is VariantNode {
    return !!v && typeof v === 'object' && 'availableSizes' in (v as object);
}

function hasRichSizes(v: VariantNode): boolean {
    if (v.isSoldOut === true) return true;
    const sizes = v.availableSizes;
    if (!sizes) return false;
    for (const entry of Object.values(sizes)) {
        if (entry && typeof entry === 'object' && 'isAvailable' in (entry as object)) {
            return true;
        }
    }
    return false;
}

export function findVariant(obj: unknown, choice: string): VariantNode | null {
    const candidates: VariantNode[] = [];
    const walk = (o: unknown): void => {
        if (!o || typeof o !== 'object') return;
        const rec = o as Record<string, unknown>;
        if (choice in rec && isVariantNode(rec[choice])) {
            candidates.push(rec[choice] as VariantNode);
        }
        for (const v of Object.values(rec)) walk(v);
    };
    walk(obj);
    if (candidates.length === 0) return null;
    return candidates.find(hasRichSizes) ?? candidates[0];
}

export function parseVictoriasSecret(clientPropsJson: string, choice: string): StockSnapshot {
    const data = JSON.parse(clientPropsJson);
    const variant = findVariant(data, choice);
    if (!variant) {
        return { sizes: {}, anyAvailable: false };
    }
    const rawSizes = variant.availableSizes ?? {};
    const sizes: Record<string, boolean> = {};
    for (const [label, entry] of Object.entries(rawSizes)) {
        sizes[label] = entry?.isAvailable === true;
    }
    const anyAvailable = Object.values(sizes).some((v) => v);
    if (!anyAvailable && variant.isSoldOut === true) {
        return { sizes: {}, anyAvailable: false };
    }
    return { sizes, anyAvailable };
}

export function normalizeVsUrl(raw: string): string {
    return raw.replace(/\\([?&=#])/g, '$1');
}

export function extractChoice(url: string): string | null {
    const clean = normalizeVsUrl(url);
    try {
        const fromParams = new URL(clean).searchParams.get('choice');
        if (fromParams) return fromParams;
    } catch {
        /* fall through */
    }
    const match = clean.match(/[?&]choice=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export const victoriasSecret: StockAdapter = {
    id: 'victoriasSecret',
    matches(url: string): boolean {
        try {
            const host = new URL(normalizeVsUrl(url)).hostname.toLowerCase();
            return host === 'victoriassecret.com' || host.endsWith('.victoriassecret.com');
        } catch {
            return false;
        }
    },
    async check(url: string): Promise<StockSnapshot> {
        const clean = normalizeVsUrl(url);
        const choice = extractChoice(clean);
        if (!choice) throw new Error('VS url missing ?choice= param');

        const browser = await getBrowser();
        const context = await browser.newContext({ userAgent: UA });
        const page = await context.newPage();
        try {
            await page.goto(clean, { waitUntil: 'domcontentloaded', timeout: 30_000 });
            const raw = await page.$eval('script#clientProps', (el) => el.textContent);
            if (!raw) throw new Error('clientProps script empty');

            if (process.env.VS_DEBUG) {
                const data = JSON.parse(raw);
                const allCandidates: VariantNode[] = [];
                const walk = (o: unknown): void => {
                    if (!o || typeof o !== 'object') return;
                    const rec = o as Record<string, unknown>;
                    if (choice in rec && isVariantNode(rec[choice])) {
                        allCandidates.push(rec[choice] as VariantNode);
                    }
                    for (const v of Object.values(rec)) walk(v);
                };
                walk(data);
                console.log('[VS_DEBUG] choice:', choice);
                console.log('[VS_DEBUG] candidate count:', allCandidates.length);
                allCandidates.forEach((c, i) => {
                    const keys = Object.keys(c.availableSizes ?? {});
                    const rich = keys.some((k) => {
                        const e = (c.availableSizes as Record<string, unknown>)[k];
                        return !!e && typeof e === 'object' && 'isAvailable' in (e as object);
                    });
                    console.log(`[VS_DEBUG] candidate[${i}] isSoldOut=${c.isSoldOut} rich=${rich} sizeKeys=${JSON.stringify(keys)}`);
                });
                const picked = findVariant(data, choice);
                console.log('[VS_DEBUG] picked sizeKeys:', Object.keys(picked?.availableSizes ?? {}));
                if (picked?.availableSizes) {
                    for (const [k, v] of Object.entries(picked.availableSizes)) {
                        console.log(`[VS_DEBUG]   ${k}: isAvailable=${(v as { isAvailable?: boolean })?.isAvailable}`);
                    }
                }
            }

            return parseVictoriasSecret(raw, choice);
        } finally {
            await page.close();
            await context.close();
        }
    },
};
