'use client';

import { useState } from 'react';
import NewClosetModal from '../components/NewClosetModal';

export default function ClosetsGridClient({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
                <button
                    onClick={() => setOpen(true)}
                    className="aspect-square flex items-center justify-center rounded-2xl border border-dashed border-rose/40 hover:border-rose/80 text-rose text-[clamp(1.5rem,4vw,3rem)] leading-none transition"
                    aria-label="New closet"
                >
                    +
                </button>
                {children}
            </div>
            {open && <NewClosetModal onClose={() => setOpen(false)} />}
        </>
    );
}
