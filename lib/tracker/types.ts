export type StockStatus = 'in' | 'out';

export interface StockAdapter {
    id: string;
    matches(url: string): boolean;
    check(url: string): Promise<StockStatus>;
}

export interface TrackerRow {
    id: string;
    user_id: string;
    url: string;
    adapter_id: string;
    label: string | null;
    last_status: StockStatus | null;
    last_checked_at: number | null;
    last_notified_at: number | null;
    created_at: number;
}