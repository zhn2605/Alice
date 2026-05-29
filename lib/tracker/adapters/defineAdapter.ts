import type { Page } from 'playwright';
import type { StockAdapter, StockSnapshot } from '../types';
import { getBrowser } from '../browser';

export interface AdapterConfig<Key> {
    id: string;
    hosts: string[];
    userAgent?: string;
    normalizeUrl?: (raw: string) => string;
    extractKey: (cleanUrl: string) => Key | null;
    fetch: (page: Page, key: Key) => Promise<string>;
    parse: (raw: string, key: Key) => StockSnapshot;
    debug?: (raw: string, key: Key) => void;
    debugEnv?: string;
}

const DEFAULT_UA =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const DEBUG_ENV = 'ADAPTER_DEBUG';

function hostMatches(url: string, hosts: string[]): boolean {
    try {
        const h = new URL(url).hostname.toLowerCase();
        return hosts.some((p) => h === p || h.endsWith(`.${p}`));
    } catch {
        return false;
    }
}

export function defineAdapter<Key>(cfg: AdapterConfig<Key>): StockAdapter {
    const normalize = cfg.normalizeUrl ?? ((s: string) => s);

    return {
        id: cfg.id,
        matches(url: string): boolean {
            return hostMatches(normalize(url), cfg.hosts);
        },
        async check(url: string): Promise<StockSnapshot> {
            const clean = normalize(url);
            const key = cfg.extractKey(clean);
            if (key === null || key === undefined) {
                console.warn(`[${cfg.id}] skipping: cannot extract key from ${clean}`);
                return { overall_stock: 'out', specific_stock: {} };
            }

            const browser = await getBrowser();
            const context = await browser.newContext({ userAgent: cfg.userAgent ?? DEFAULT_UA });
            const page = await context.newPage();
            try {
                await page.goto(clean, { waitUntil: 'domcontentloaded', timeout: 30_000 });
                const raw = await cfg.fetch(page, key);
                const debugOn =
                    process.env[DEBUG_ENV] || (cfg.debugEnv && process.env[cfg.debugEnv]);
                if (cfg.debug && debugOn) cfg.debug(raw, key);
                return cfg.parse(raw, key);
            } finally {
                await page.close();
                await context.close();
            }
        },
    };
}
