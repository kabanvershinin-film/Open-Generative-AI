'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVE_SITE_ANNOUNCEMENT } from '@/lib/siteAnnouncements';

const STORAGE_PREFIX = 'site_announcement_seen_';

function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function SiteAnnouncementBell() {
    const announcement = ACTIVE_SITE_ANNOUNCEMENT;
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [seen, setSeen] = useState(true);

    const storageKey = useMemo(
        () => (announcement ? `${STORAGE_PREFIX}${announcement.id}` : null),
        [announcement],
    );

    useEffect(() => {
        if (!announcement || typeof window === 'undefined' || !storageKey) return;
        setSeen(localStorage.getItem(storageKey) === '1');
    }, [announcement, storageKey]);

    useEffect(() => {
        if (!open) return undefined;

        const handlePointerDown = (event) => {
            if (!panelRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    if (!announcement) return null;

    const markSeen = () => {
        if (typeof window !== 'undefined' && storageKey) {
            localStorage.setItem(storageKey, '1');
        }
        setSeen(true);
    };

    const toggleOpen = () => {
        setOpen((prev) => {
            const next = !prev;
            if (next) markSeen();
            return next;
        });
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={toggleOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/90 border border-white/10 text-white hover:border-cyan-400 transition-colors backdrop-blur"
                aria-label="Объявления сайта"
                title="Объявления сайта"
            >
                <span className="text-base">🔔</span>
                {!seen && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-cyan-400 border-2 border-neutral-950" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/10">
                        <div>
                            <div className="text-sm font-semibold text-white">Объявление</div>
                            <div className="text-xs text-white/40">Оперативная информация по сайту</div>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/40 hover:text-white transition-colors"
                            aria-label="Закрыть"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="px-4 py-4 space-y-3">
                        <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                            Ведутся работы
                        </div>
                        <div className="text-base font-semibold text-white">{announcement.title}</div>
                        <div className="text-sm leading-6 text-white/70">{announcement.message}</div>
                        <div className="text-[11px] text-white/35">
                            Обновлено: {formatDateTime(announcement.updatedAt)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
