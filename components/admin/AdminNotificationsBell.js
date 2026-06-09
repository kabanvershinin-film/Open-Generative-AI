'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { isAdminEmail } from '@/lib/admin';

const STORAGE_KEY = 'admin_notifications_last_seen_registration_at_v1';
const POLL_MS = 30000;

function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AdminNotificationsBell() {
    const { user } = useAuth();
    const admin = isAdminEmail(user?.email || '');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [lastSeenAt, setLastSeenAt] = useState(null);
    const initializedRef = useRef(false);
    const previousLatestRef = useRef(null);
    const panelRef = useRef(null);

    const rememberSeen = useCallback((timestamp) => {
        if (!timestamp || typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, timestamp);
        setLastSeenAt(timestamp);
    }, []);

    const loadNotifications = useCallback(async ({ silent = false } = {}) => {
        if (!admin) return;

        if (!silent) setLoading(true);
        setError(null);

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
            setItems(notifications);

            if (!initializedRef.current) {
                initializedRef.current = true;
                previousLatestRef.current = latestCreatedAt;

                if (typeof window !== 'undefined') {
                    const stored = localStorage.getItem(STORAGE_KEY);
                    if (stored) {
                        setLastSeenAt(stored);
                    } else if (latestCreatedAt) {
                        rememberSeen(latestCreatedAt);
                    }
                }
                return;
            }

            if (
                latestCreatedAt &&
                previousLatestRef.current &&
                new Date(latestCreatedAt).getTime() > new Date(previousLatestRef.current).getTime()
            ) {
                const freshCount = notifications.filter(
                    (item) => new Date(item.createdAt).getTime() > new Date(previousLatestRef.current).getTime()
                ).length;

                if (freshCount > 0) {
                    toast.success(
                        freshCount === 1
                            ? 'Зарегистрировался 1 новый пользователь'
                            : `Зарегистрировались новые пользователи: ${freshCount}`
                    );
                }
            }

            previousLatestRef.current = latestCreatedAt;
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [admin, rememberSeen]);

    useEffect(() => {
        if (!admin) return undefined;

        loadNotifications();
        const timer = setInterval(() => loadNotifications({ silent: true }), POLL_MS);
        return () => clearInterval(timer);
    }, [admin, loadNotifications]);

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

    const unreadCount = useMemo(() => {
        if (!lastSeenAt) return 0;
        const lastSeenTime = new Date(lastSeenAt).getTime();
        return items.filter((item) => new Date(item.createdAt).getTime() > lastSeenTime).length;
    }, [items, lastSeenAt]);

    const latestCreatedAt = items[0]?.createdAt || null;

    const toggleOpen = () => {
        setOpen((prev) => {
            const next = !prev;
            if (next && latestCreatedAt) {
                rememberSeen(latestCreatedAt);
            }
            return next;
        });
    };

    const markAllRead = () => {
        if (latestCreatedAt) {
            rememberSeen(latestCreatedAt);
        }
    };

    if (!admin) return null;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={toggleOpen}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/90 border border-white/10 text-white hover:border-purple-500 transition-colors backdrop-blur"
                aria-label="Уведомления администратора"
                title="Уведомления администратора"
            >
                <span className="text-base">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div>
                            <div className="text-sm font-semibold text-white">Уведомления</div>
                            <div className="text-xs text-white/40">Новые регистрации пользователей</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={markAllRead}
                                className="text-xs text-white/50 hover:text-white transition-colors"
                            >
                                Прочитано
                            </button>
                            <button
                                onClick={() => loadNotifications()}
                                className="text-xs text-white/50 hover:text-white transition-colors"
                            >
                                {loading ? '...' : 'Обновить'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="max-h-[360px] overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-white/35">
                                Пока нет новых регистраций
                            </div>
                        ) : (
                            items.map((item) => {
                                const unread = lastSeenAt
                                    ? new Date(item.createdAt).getTime() > new Date(lastSeenAt).getTime()
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

                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <div className="text-xs text-white/35">
                            {unreadCount > 0 ? `Непрочитанных: ${unreadCount}` : 'Все просмотрено'}
                        </div>
                        <Link
                            href="/admin"
                            className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            Открыть админку
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
