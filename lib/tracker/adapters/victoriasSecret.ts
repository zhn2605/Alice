import { StockAdapter, StockSnapshot } from '../types';
import { getBrowser } from '../browser';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

interface VSSizeEntry {
    isAvailable?: boolean;
    status?: string;
}

// VS emits two shapes for the sizes lists:
//   1. Object map: { "34D": { isAvailable: true }, ... }   (rich stock node)
//   2. String array: ["34D", "36D"]                         (thin catalog node)
type SizeList = Record<string, VSSizeEntry> | string[];

interface VariantNode {
    isSoldOut?: boolean;
    availableSizes?: SizeList;
    unavailableSizes?: SizeList;
}

function isVariantNode(v: unknown): v is VariantNode {
    if (!v || typeof v !== 'object') return false;
    return 'availableSizes' in (v as object) || 'unavailableSizes' in (v as object);
}

function sizeKeys(list: SizeList | undefined): string[] {
    if (!list) return [];
    if (Array.isArray(list)) return list.filter((s): s is string => typeof s === 'string');
    return Object.keys(list);
}

function isAvailableFlag(list: SizeList | undefined, size: string): boolean | undefined {
    if (!list) return undefined;
    if (Array.isArray(list)) return list.includes(size) ? true : undefined;
    const entry = list[size];
    if (!entry) return undefined;
    return entry.isAvailable === true;
}

interface ProductInfo {
    title: string;
    image_url: string | null;
}

const VS_IMAGE_BASE = 'https://www.victoriassecret.com/p/760x1013/';

function resolveVsImage(rel: string): string {
    if (rel.startsWith('http')) return rel;
    return `${VS_IMAGE_BASE}${rel}.jpg`;
}

function extractProduct(data: unknown, choice: string): ProductInfo | undefined {
    // VS shape: productData[<id>] has { label, choices: { <choice>: { label, images } } }.
    // walk until a node whose `choices` map contains choice key; that's
    // the product record. Title = product label + choice label (color), image from
    // the choice's images array.
    let productLabel: string | undefined;
    let choiceNode: Record<string, unknown> | undefined;

    const walk = (o: unknown, depth = 0): boolean => {
        if (depth > 10 || !o || typeof o !== 'object') return false;
        const rec = o as Record<string, unknown>;
        const choices = rec.choices;
        if (choices && typeof choices === 'object' && choice in (choices as object)) {
            const c = (choices as Record<string, unknown>)[choice];
            if (c && typeof c === 'object') {
                choiceNode = c as Record<string, unknown>;
                if (typeof rec.label === 'string') productLabel = rec.label;
                return true;
            }
        }
        for (const v of Object.values(rec)) {
            if (walk(v, depth + 1)) return true;
        }
        return false;
    };
    walk(data);

    if (!productLabel && !choiceNode) return undefined;

    const choiceLabel = typeof choiceNode?.label === 'string' ? (choiceNode.label as string) : '';
    const title = [productLabel, choiceLabel].filter(Boolean).join(' — ') || 'Victoria\'s Secret item';

    let image_url: string | null = null;
    const images = choiceNode?.images;
    if (Array.isArray(images)) {
        const preferred = ['offModelFront', 'onModelFront', 'offModelBack', 'onModelBack'];
        for (const want of preferred) {
            const hit = images.find(
                (i) => i && typeof i === 'object' && (i as { type?: string }).type === want
            );
            const img = hit && typeof (hit as { image?: unknown }).image === 'string'
                ? ((hit as { image: string }).image)
                : null;
            if (img) {
                image_url = resolveVsImage(img);
                break;
            }
        }
        if (!image_url && images[0] && typeof (images[0] as { image?: unknown }).image === 'string') {
            image_url = resolveVsImage((images[0] as { image: string }).image);
        }
    }

    return { title, image_url };
}

function hasRichSizes(v: VariantNode): boolean {
    if (v.isSoldOut === true) return true;
    const sizes = v.availableSizes;
    if (!sizes || Array.isArray(sizes)) return false;
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

function collectCandidates(obj: unknown, choice: string): VariantNode[] {
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
    return candidates;
}

// Collect ALL size keys from every sibling choice under the same parent `choices`
// map. VS only lists in-stock sizes for nearly-sold-out colors, but the full
// catalog is visible across siblings (the "View All Sizes" UX).
function collectAllProductSizes(data: unknown, choice: string): Set<string> {
    const all = new Set<string>();
    const walk = (o: unknown): void => {
        if (!o || typeof o !== 'object') return;
        const rec = o as Record<string, unknown>;
        if (choice in rec && isVariantNode(rec[choice])) {
            for (const sibling of Object.values(rec)) {
                if (!sibling || typeof sibling !== 'object') continue;
                const node = sibling as Record<string, unknown>;
                if ('availableSizes' in node) {
                    for (const s of sizeKeys(node.availableSizes as SizeList)) all.add(s);
                }
                if ('unavailableSizes' in node) {
                    for (const s of sizeKeys(node.unavailableSizes as SizeList)) all.add(s);
                }
            }
        }
        for (const v of Object.values(rec)) walk(v);
    };
    walk(data);
    return all;
}

export function parseVictoriasSecret(clientPropsJson: string, choice: string): StockSnapshot {
    const data = JSON.parse(clientPropsJson);
    const product = extractProduct(data, choice);
    const productSpread = product ? { product } : {};

    const candidates = collectCandidates(data, choice);
    if (candidates.length === 0) {
        return { overall_stock: 'out', specific_stock: {}, ...productSpread };
    }

    // Start with every size the product carries (across all sibling choices).
    // This mirrors VS's "View All Sizes" — nearly-sold-out colors omit OOS
    // sizes from their own node, but siblings have the full catalog.
    const allProductSizes = collectAllProductSizes(data, choice);

    // Determine which sizes are in-stock for THIS choice specifically.
    const inSizes = new Set<string>();
    for (const c of candidates) {
        for (const s of sizeKeys(c.availableSizes)) {
            if (isAvailableFlag(c.availableSizes, s) === true) inSizes.add(s);
        }
    }

    const specific_stock: Record<string, 'in' | 'out'> = {};
    for (const s of allProductSizes) {
        specific_stock[s] = inSizes.has(s) ? 'in' : 'out';
    }

    const anyAvailable = inSizes.size > 0;
    const richCandidate = candidates.find(hasRichSizes);
    if (allProductSizes.size === 0 && richCandidate?.isSoldOut === true) {
        return { overall_stock: 'out', specific_stock: {}, ...productSpread };
    }
    return { overall_stock: anyAvailable ? 'in' : 'out', specific_stock, ...productSpread };
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
        if (!choice) {
            console.warn(`[victoriasSecret] skipping: url missing choice param: ${clean}`);
            return { overall_stock: 'out', specific_stock: {} };
        }

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
