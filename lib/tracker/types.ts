export type StockStatus = 'in' | 'out';

export interface StockSnapshot {
    overall_stock: StockStatus;
    specific_stock: Record<string, StockStatus>;
    product?: {
        title: string;
        image_url: string | null;
    };
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
    image_url: string | null;
    sizes: string[];
    last_status: StockStatus | null;
    last_sizes: Record<string, StockStatus> | null;
    last_checked_at: number | null;
    last_notified_at: number | null;
    created_at: number;
}
