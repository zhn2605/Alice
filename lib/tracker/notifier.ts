import type { TrackerRow } from './types';

export async function sendDiscord(
    webhookUrl: string,
    tracker: TrackerRow,
    restockedSizes: string[] = [],
): Promise<void> {
    const label = tracker.label ?? tracker.url;
    const fields: { name: string; value: string; inline?: boolean }[] = [
        { name: 'Item', value: label },
    ];

    if (restockedSizes.length > 0) {
        fields.push({
            name: restockedSizes.length === 1 ? 'Size' : 'Sizes',
            value: restockedSizes.join(', '),
            inline: true,
        });
    }

    const embed: Record<string, unknown> = {
        title: '🟢 IN STOCK',
        url: tracker.url,
        description: `[View Product](${tracker.url})`,
        fields,
        color: 5763719,
    };
    if (tracker.image_url) {
        embed.thumbnail = { url: tracker.image_url };
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
        throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    }
}
