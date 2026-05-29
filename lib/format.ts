export function formatRelative(timestamp: number | null, now: number = Date.now()): string {
    if (timestamp == null) return 'never';
    const diff = now - timestamp;
    if (diff < 60_000) return 'just now';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return `${Math.floor(diff / 86400_000)}d ago`;
}
