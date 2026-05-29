export default function Hanger({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 36"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
            preserveAspectRatio="xMidYMid meet"
        >
            <path d="M50 18 V8 A5 5 0 0 1 60 8" />
            <path d="M50 18 L8 34 H92 Z" />
        </svg>
    );
}
