'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { isAdminEmail } from '@/lib/admin';
import { ACTIVE_SITE_ANNOUNCEMENT } from '@/lib/siteAnnouncements';

const STORAGE_PREFIX = 'site_announcement_seen_';
const ADMIN_STORAGE_KEY = 'admin_notifications_last_seen_registration_at_v1';
const POLL_MS = 30000;

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
    const { user } = useAuth();
    const admin = isAdminEmail(user?.email || '');
    const announcement = ACTIVE_SITE_ANNOUNCEMENT;
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [seen, setSeen] = useState(true);
    const [adminItems, setAdminItems] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState(null);
    const [adminLastSeenAt, setAdminLastSeenAt] = useState(null);
    const adminInitializedRef = useRef(false);
    const adminPreviousLatestRef = useRef(null);

    const storageKey = useMemo(
        () => (announcement ? `${STORAGE_PREFIX}${announcement.id}` : null),
        [announcement],
    );

    useEffect(() => {
        if (!announcement || typeof window === 'undefined' || !storageKey) return;
        setSeen(localStorage.getItem(storageKey) === '1');
    }, [announcement, storageKey]);

    const rememberAdminSeen = useCallback((timestamp) => {
        if (!timestamp || typeof window === 'undefined') return;
        localStorage.setItem(ADMIN_STORAGE_KEY, timestamp);
        setAdminLastSeenAt(timestamp);
    }, []);

    const loadAdminNotifications = useCallback(async ({ silent = false } = {}) => {
        if (!admin) return;

        if (!silent) setAdminLoading(true);
        setAdminError(null);

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) throw new Error('Нет активной сессии');

            const res = await fetch('/api/admin/notifications', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || `Ошибка ${res.status}`);

            const notifications = payload.notifications || [];
            const latestCreatedAt = payload.latestCreatedAt || notifications[0]?.createdAt || null;
            setAdminItems(notifications);

            if (!adminInitializedRef.current) {
                adminInitializedRef.current = true;
                adminPreviousLatestRef.current = latestCreatedAt;

                if (typeof window !== 'undefined') {
                    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
                    if (stored) {
                        setAdminLastSeenAt(stored);
                    } else if (latestCreatedAt) {
                        rememberAdminSeen(latestCreatedAt);
                    }
                }
                return;
            }

            if (
                latestCreatedAt &&
                adminPreviousLatestRef.current &&
                new Date(latestCreatedAt).getTime() > new Date(adminPreviousLatestRef.current).getTime()
            ) {
                const freshCount = notifications.filter(
                    (item) => new Date(item.createdAt).getTime() > new Date(adminPreviousLatestRef.current).getTime()
                ).length;

                if (freshCount > 0) {
                    toast.success(
                        freshCount === 1
                            ? 'Зарегистрировался 1 новый пользователь'
                            : `Зарегистрировались новые пользователи: ${freshCount}`
                    );
                }
            }

            adminPreviousLatestRef.current = latestCreatedAt;
        } catch (loadError) {
            setAdminError(loadError.message);
        } finally {
            if (!silent) setAdminLoading(false);
        }
    }, [admin, rememberAdminSeen]);

    useEffect(() => {
        if (!admin) return undefined;

        loadAdminNotifications();
        const timer = setInterval(() => loadAdminNotifications({ silent: true }), POLL_MS);
        return () => clearInterval(timer);
    }, [admin, loadAdminNotifications]);

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
            if (next) {
                markSeen();
                const latestAdminCreatedAt = adminItems[0]?.createdAt || null;
                if (latestAdminCreatedAt) rememberAdminSeen(latestAdminCreatedAt);
            }
            return next;
        });
    };

    const adminUnreadCount = adminLastSeenAt
        ? adminItems.filter((item) => new Date(item.createdAt).getTime() > new Date(adminLastSeenAt).getTime()).length
        : 0;
    const showUnreadDot = !seen || adminUnreadCount > 0;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={toggleOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#0f0c18]/90 border border-purple-500/10 text-white hover:border-purple-400 transition-colors backdrop-blur"
                aria-label="Объявления сайта"
                title="Объявления сайта"
            >
                <span className="text-base">🔔</span>
                {showUnreadDot && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-purple-500 border-2 border-[#050308]" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-purple-500/10 bg-[#0f0c18]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-purple-500/10">
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
                        <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-300">
                            Ведутся работы
                        </div>
                        <div className="text-base font-semibold text-white">{announcement.title}</div>
                        <div className="text-sm leading-6 text-white/70">{announcement.message}</div>
                        <div className="text-[11px] text-white/35">
                            Обновлено: {formatDateTime(announcement.updatedAt)}
                        </div>
                    </div>

                    {admin && (
                        <>
                            <div className="border-t border-purple-500/10" />
                            <div className="px-4 py-3 border-b border-purple-500/10 flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-semibold text-white">Админ-уведомления</div>
                                    <div className="text-xs text-white/40">Новые регистрации пользователей</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            const latestAdminCreatedAt = adminItems[0]?.createdAt || null;
                                            if (latestAdminCreatedAt) rememberAdminSeen(latestAdminCreatedAt);
                                        }}
                                        className="text-xs text-white/50 hover:text-white transition-colors"
                                    >
                                        Прочитано
                                    </button>
                                    <button
                                        onClick={() => loadAdminNotifications()}
                                        className="text-xs text-white/50 hover:text-white transition-colors"
                                    >
                                        {adminLoading ? '...' : 'Обновить'}
                                    </button>
                                </div>
                            </div>

                            {adminError && (
                                <div className="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                    {adminError}
                                </div>
                            )}

                            <div className="max-h-[260px] overflow-y-auto">
                                {adminItems.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-white/35">
                                        Пока нет новых регистраций
                                    </div>
                                ) : (
                                    adminItems.map((item) => {
                                        const unread = adminLastSeenAt
                                            ? new Date(item.createdAt).getTime() > new Date(adminLastSeenAt).getTime()
                                            : false;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`px-4 py-3 border-b border-white/5 ${unread ? 'bg-purple-500/8' : ''}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-white">{item.title}</div>
                                                        <div className="text-xs text-white/55 mt-1">{item.message}</div>
                                                        {item.email && (
                                                            <div className="text-xs text-purple-300 mt-1 break-all">{item.email}</div>
                                                        )}
                                                    </div>
                                                    {unread && (
                                                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-purple-500 shrink-0" />
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-white/30 mt-2">{formatDateTime(item.createdAt)}</div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="text-xs text-white/35">
                                    {adminUnreadCount > 0 ? `Непрочитанных: ${adminUnreadCount}` : 'Все просмотрено'}
                                </div>
                                <Link
                                    href="/admin"
                                    className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    Открыть админку
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
