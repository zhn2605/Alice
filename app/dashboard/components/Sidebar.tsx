'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutLink from './LogoutLink';

type SidebarProps =
    | { email: string; mode: 'top' }
    | { email: string; mode: 'closet'; closetId: string; closetName: string };

export default function Sidebar(props: SidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const item = (href: string, label: string) => {
        const active = pathname === href;
        return (
            <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between text-body transition ${
                    active ? 'text-cream' : 'text-cream/70 hover:text-cream'
                }`}
            >
                <span>{label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-rose" />}
            </Link>
        );
    };

    const panel = (
        <aside className="w-60 shrink-0 border-r border-rose/20 flex flex-col px-5 py-6 gap-4 h-full bg-espresso">
            <div className="text-xs text-cream/60 truncate">{props.email}</div>

            {props.mode === 'closet' && (
                <div className="text-xs uppercase tracking-wide text-rose truncate">
                    {props.closetName}
                </div>
            )}

            <hr className="border-rose/20" />

            <nav className="flex flex-col gap-3">
                {props.mode === 'top' ? (
                    <>
                        {item('/dashboard', 'My Closets')}
                        {item('/dashboard/community', 'Community')}
                    </>
                ) : (
                    <>
                        {item(`/dashboard/closets/${props.closetId}`, 'Trackers')}
                        {item(`/dashboard/closets/${props.closetId}/outfits`, 'Outfits')}
                        {item(`/dashboard/closets/${props.closetId}/search`, 'Search')}
                    </>
                )}
            </nav>

            <div className="flex-grow" />

            {props.mode === 'closet' && (
                <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="text-body text-cream/80 hover:text-cream transition"
                >
                    ← Back
                </Link>
            )}

            <hr className="border-rose/20" />

            <LogoutLink />
        </aside>
    );

    return (
        <>
            {/* Desktop */}
            <div className="hidden md:flex">{panel}</div>

            {/* Mobile toggle */}
            <button
                onClick={() => setOpen(true)}
                aria-label="open menu"
                className="md:hidden fixed top-4 left-4 z-30 btn-sm rounded-full border border-rose/40 text-cream bg-espresso/80"
            >
                ☰
            </button>

            {/* Mobile drawer */}
            {open && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-espresso/80"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="h-full w-60 bg-espresso"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {panel}
                    </div>
                </div>
            )}
        </>
    );
}
