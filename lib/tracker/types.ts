export type StockStatus = 'in' | 'out';

export interface StockSnapshot {
    sizes: Record<string, boolean>;
    anyAvailable: boolean;
}

export interface StockAdapter {
    id: string;
    matches(url: string): boolean;
    check(url: string): Promise<StockSnapshot>;
}

export interface TrackerRow {
    id: string;
    user_id: string;
    url: string;
    adapter_id: string;
    label: string | null;
    size: string | null;
    last_status: StockStatus | null;
    last_checked_at: number | null;
    last_notified_at: number | null;
    created_at: number;
}
