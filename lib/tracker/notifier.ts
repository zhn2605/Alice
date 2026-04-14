import type { TrackerRow } from './types';

export async function sendDiscord(webhookUrl: string, tracker: TrackerRow): Promise<void> {
    const label = tracker.label ?? tracker.url;

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            embeds: [
                {
                  title: "🟢 IN STOCK",
                  url: tracker.url,
                  description: `[View Product](${tracker.url})`,
                  fields: [
                    {
                      name: "Item",
                      value: label
                    }
                  ],
                  color: 5763719
                }
              ]
        }),
    });

    if (!res.ok) {
        throw new Error(`Discord webhook failed: ${res.status} ${await res.text()}`);
    }
}