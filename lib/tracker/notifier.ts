import type { TrackerRow } from './types';

export async function sendDiscord(webhookUrl: string, tracker: TrackerRow): Promise<void> {
    const label = tracker.label ?? tracker.url;
    const fields: { name: string; value: string; inline?: boolean }[] = [
        { name: 'Item', value: label },
    ];
    if (tracker.size) {
        fields.push({ name: 'Size', value: tracker.size, inline: true });
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            embeds: [
                {
                    title: '🟢 IN STOCK',
                    url: tracker.url,
                    description: `[View Product](${tracker.url})`,
                    fields,
                    color: 5763719,
                },
            ],
        }),
    });

    if (!res.ok) {
        throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    }
}