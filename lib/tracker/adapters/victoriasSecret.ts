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

export function findVariant(obj: unknown, choice: string): VariantNode | null {
    if (!obj || typeof obj !== 'object') return null;
    const rec = obj as Record<string, unknown>;
    if (choice in rec && isVariantNode(rec[choice])) {
        return rec[choice] as VariantNode;
    }
    for (const v of Object.values(rec)) {
        const found = findVariant(v, choice);
        if (found) return found;
    }
    return null;
}

export function parseVictoriasSecret(clientPropsJson: string, choice: string): StockSnapshot {
    const data = JSON.parse(clientPropsJson);
    const variant = findVariant(data, choice);
    if (!variant || variant.isSoldOut) {
        return { sizes: {}, anyAvailable: false };
    }
    const rawSizes = variant.availableSizes ?? {};
    const sizes: Record<string, boolean> = {};
    for (const [label, entry] of Object.entries(rawSizes)) {
        sizes[label] = entry?.isAvailable === true;
    }
    const anyAvailable = Object.values(sizes).some((v) => v);
    return { sizes, anyAvailable };
}

export const victoriasSecret: StockAdapter = {
    id: 'victoriasSecret',
    matches(url: string): boolean {
        try {
            const host = new URL(url).hostname.toLowerCase();
            return host === 'victoriassecret.com' || host.endsWith('.victoriassecret.com');
        } catch {
            return false;
        }
    },
    async check(url: string): Promise<StockSnapshot> {
        const choice = new URL(url).searchParams.get('choice');
        if (!choice) throw new Error('VS url missing ?choice= param');

        const browser = await getBrowser();
        const context = await browser.newContext({ userAgent: UA });
        const page = await context.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
            const raw = await page.$eval('script#clientProps', (el) => el.textContent);
            if (!raw) throw new Error('clientProps script empty');
            return parseVictoriasSecret(raw, choice);
        } finally {
            await page.close();
            await context.close();
        }
    },
};
