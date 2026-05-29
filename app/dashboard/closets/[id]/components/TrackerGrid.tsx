import type { TrackerRow } from '@/lib/tracker/types';
import HangerCard from './HangerCard';

export default function TrackerGrid({
    trackers,
    addButton,
    onHangerClick,
}: {
    trackers: TrackerRow[];
    addButton?: React.ReactNode;
    onHangerClick?: (t: TrackerRow) => void;
}) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
            {addButton}
            {trackers.map((t) => (
                <HangerCard
                    key={t.id}
                    tracker={t}
                    onClick={onHangerClick ? () => onHangerClick(t) : undefined}
                />
            ))}
        </div>
    );
}
