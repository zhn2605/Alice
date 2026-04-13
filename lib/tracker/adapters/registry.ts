import type { StockAdapter } from "../types";

const adapters: StockAdapter[] = [];

export function registerAdapter(adapter: StockAdapter): void {
    adapters.push(adapter);
}

export function findAdapter(url: string): StockAdapter | null {
    return adapters.find((a) => a.matches(url)) ?? null;
}

export function listAdapters(): StockAdapter[] {
    return [...adapters];
}