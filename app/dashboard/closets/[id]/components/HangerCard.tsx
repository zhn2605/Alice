import type { TrackerRow } from '@/lib/tracker/types';
import Hanger from './Hanger';

export default function HangerCard({
    tracker,
    onClick,
}: {
    tracker: TrackerRow;
    onClick?: () => void;
}) {
    const outOfStock = tracker.last_status === 'out';
    const sizeCount = Array.isArray(tracker.sizes) ? tracker.sizes.length : 0;

    const content = (
        <div className="flex flex-col items-center w-full">
            <div className="w-3/5">
                <Hanger className="w-full text-moss" />
            </div>
            <div className="w-full -mt-[4%] rounded-2xl bg-cream/5 border border-rose/20 group-hover:border-rose/60 group-hover:bg-cream/10 transition overflow-hidden relative">
                <div className="relative aspect-square bg-espresso">
                    {tracker.image_url ? (
                        <img
                            src={tracker.image_url}
                            alt={tracker.label ?? 'product'}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-cream/30 text-xs">
                            no image
                        </div>
                    )}
                    {outOfStock && (
                        <span className="absolute top-2 right-2 h-[1.2vmin] w-[1.2vmin] min-h-[0.5rem] min-w-[0.5rem] rounded-full bg-coral" />
                    )}
                </div>
                <div className="px-3 py-2">
                    <div className="text-body text-cream truncate">
                        {tracker.label ?? 'Untitled'}
                    </div>
                    <div className={`text-xs mt-0.5 ${outOfStock ? 'text-coral' : 'text-cream/60'}`}>
                        {outOfStock ? 'OUT' : `${sizeCount} size${sizeCount === 1 ? '' : 's'}`}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!onClick) return <div className="group w-full">{content}</div>;
    return (
        <button onClick={onClick} className="group text-left w-full">
            {content}
        </button>
    );
}
