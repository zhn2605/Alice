'use client';

import { useState } from 'react';
import type { TrackerRow } from '@/lib/tracker/types';
import TrackerGrid from './components/TrackerGrid';
import AddTrackerModal from './components/AddTrackerModal';
import TrackerModal from './components/TrackerModal';
import ClosetSettingsModal from './components/ClosetSettingsModal';
import Hanger from './components/Hanger';

export default function ClosetView({
    closet,
    trackers,
}: {
    closet: { id: string; name: string; discord_webhook_url: string | null };
    trackers: TrackerRow[];
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [selected, setSelected] = useState<TrackerRow | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <div>
            <header className="flex items-center justify-between">
                <h1 className="font-fashion text-title font-semibold tracking-tight text-cream">
                    {closet.name}
                </h1>
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="btn-sm rounded-full border border-rose/40 hover:border-rose text-cream"
                >
                    ⚙ Settings
                </button>
            </header>
            <hr className="border-rose/20 mt-3" />

            <TrackerGrid
                trackers={trackers}
                onHangerClick={(t) => setSelected(t)}
                addButton={
                    <button
                        onClick={() => setAddOpen(true)}
                        aria-label="Add tracker"
                        className="group flex flex-col items-center w-full text-rose"
                    >
                        <div className="w-3/5">
                            <Hanger className="w-full text-rose/40" />
                        </div>
                        <div className="w-full -mt-[4%] rounded-2xl border border-dashed border-rose/40 group-hover:border-rose/80 transition overflow-hidden">
                            <div className="aspect-square flex items-center justify-center text-[clamp(1.5rem,4vw,3rem)] leading-none">
                                +
                            </div>
                            <div className="px-3 py-2">
                                <div className="text-body text-rose/70">New tracker</div>
                                <div className="text-xs mt-0.5 text-transparent select-none">.</div>
                            </div>
                        </div>
                    </button>
                }
            />

            {addOpen && (
                <AddTrackerModal closetId={closet.id} onClose={() => setAddOpen(false)} />
            )}
            {selected && (
                <TrackerModal tracker={selected} onClose={() => setSelected(null)} />
            )}
            {settingsOpen && (
                <ClosetSettingsModal closet={closet} onClose={() => setSettingsOpen(false)} />
            )}
        </div>
    );
}
