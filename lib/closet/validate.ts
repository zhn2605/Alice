export type NameResult = { ok: true; name: string } | { ok: false; error: string };

export function validateClosetName(raw: unknown): NameResult {
    if (typeof raw !== 'string') return { ok: false, error: 'name must be a string' };
    const name = raw.trim();
    if (name.length === 0) return { ok: false, error: 'name is required' };
    if (name.length > 80) return { ok: false, error: 'name must be 80 characters or fewer' };
    return { ok: true, name };
}

export type WebhookResult = { ok: true; url: string | null } | { ok: false; error: string };

export function validateDiscordWebhook(raw: unknown): WebhookResult {
    if (raw === null || raw === undefined) return { ok: true, url: null };
    if (typeof raw !== 'string') return { ok: false, error: 'webhookUrl must be a string or null' };
    if (raw === '') return { ok: true, url: null };
    if (!raw.startsWith('https://discord.com/api/webhooks/')) {
        return { ok: false, error: 'invalid discord webhook url' };
    }
    return { ok: true, url: raw };
}
