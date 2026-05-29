export default function ClosetIcon({ className = '' }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
            preserveAspectRatio="xMidYMid meet"
        >
            <path d="M5 6 H27 V27 H5 Z" />
            <path d="M16 6 V27" />
            <path d="M10 13 V17" />
            <path d="M22 13 V17" />
        </svg>
    );
}
