import { UserRow } from '@/lib/auth/sessions';
import { getDb } from '@/lib/db';
import { closeBrowser } from '@/lib/tracker/browser';
import { runCheck } from '@/lib/tracker/checker';
import { TrackerRow } from '@/lib/tracker/types';
import 'dotenv/config';

const INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 5 * 60 * 1000);
const JITTER_MS= 30_000;
const INTER_CHECK_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tick(): Promise<void> {
    const db = getDb();
    const trackers = db.prepare('SELECT * FROM trackers')
    .all() as TrackerRow[];

    console.log(`[worker] tick: ${trackers.length} trackers`);

    for (const tracker of trackers) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(tracker.user_id) as UserRow | undefined;
        if (!user) {
            console.error(`[worker] user not found for tracker ${tracker.id}`);
            continue;
        }
        await runCheck(db, tracker, user);
        await sleep(INTER_CHECK_DELAY_MS);
    }
}

async function main(): Promise<void> {
    console.log(`[worker] started. interval=${INTERVAL_MS}ms`);
  
    process.on('SIGINT', async () => {
        console.log('[worker] SIGINT');
        await closeBrowser();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('[worker] SIGTERM');
        await closeBrowser();
        process.exit(0);
    });
  
    // run first tick immediately, then loop
    while (true) {
        try {
        await tick();
        } catch (err) {
            console.error('[worker] tick threw:', err);
        }
            const jitter = (Math.random() * 2 - 1) * JITTER_MS;
            await sleep(INTERVAL_MS + jitter);
        }
    }

    main().catch((err) => {
    console.error('[worker] fatal:', err);
    closeBrowser().finally(() => process.exit(1));
});