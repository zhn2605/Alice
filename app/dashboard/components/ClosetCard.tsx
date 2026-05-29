import Link from 'next/link';
import ClosetIcon from './ClosetIcon';

export default function ClosetCard({
    id,
    name,
    trackerCount,
}: {
    id: string;
    name: string;
    trackerCount: number;
}) {
    return (
        <Link
            href={`/dashboard/closets/${id}`}
            className="aspect-square flex flex-col items-start justify-between p-[6%] rounded-2xl bg-cream/5 border border-rose/20 hover:border-rose/60 hover:bg-cream/10 transition"
        >
            <ClosetIcon className="w-[100%] text-moss" />
            <div className="w-full">
                <div className="text-lead text-cream truncate">{name}</div>
                <div className="text-xs text-cream/60 mt-1">
                    {trackerCount} tracker{trackerCount === 1 ? '' : 's'}
                </div>
            </div>
        </Link>
    );
}
