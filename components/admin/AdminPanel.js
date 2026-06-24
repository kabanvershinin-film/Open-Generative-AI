'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { isAdminUser } from '@/lib/admin';
import {
    getAdminNotificationSeverity,
    getAdminNotificationTypeLabel,
    isIncidentNotification,
} from '@/lib/adminNotifications';

async function getCnyRate() {
    try {
        const r = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
        const j = await r.json();
        const cny = j.Valute?.CNY;
        if (!cny) return null;
        const real = cny.Value / cny.Nominal;
        return { real: Math.round(real * 100) / 100, withMarkup: Math.round(real * 1.15 * 100) / 100 };
    } catch {
        return null;
    }
}

export default function AdminPanel() {
    const { user } = useAuth();
    const admin = isAdminUser(user);
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [authUsersCount, setAuthUsersCount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');
    const [cnyRate, setCnyRate] = useState(null);
    const [platformMarkup, setPlatformMarkup] = useState('1.15');
    const [savingMarkup, setSavingMarkup] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [markupDialogOpen, setMarkupDialogOpen] = useState(false);
    const [userMarkup, setUserMarkup] = useState('');
    const [savingUserMarkup, setSavingUserMarkup] = useState(false);

    const [transactionsOpen, setTransactionsOpen] = useState(false);
    const [transactionsUser, setTransactionsUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsError, setEventsError] = useState(null);

    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [paymentsError, setPaymentsError] = useState(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error('Нет активной сессии');
            const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || `Ошибка ${res.status}`);
            setUsers(payload.profiles ?? []);
            setAuthUsersCount(payload.authUsersCount ?? null);
        } catch (e) {
            setLoadError(e.message);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadConfig = useCallback(async () => {
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) return;
            const res = await fetch('/api/admin/config', { headers: { Authorization: `Bearer ${token}` } });
            const payload = await res.json();
            if (res.ok && payload.config?.platform_markup) {
                setPlatformMarkup(payload.config.platform_markup);
            }
        } catch (e) {
            console.error('Failed to load config:', e);
        }
    }, []);

    const loadTransactions = useCallback(async (userId) => {
        setTransactionsLoading(true);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error('Нет активной сессии');
            const res = await fetch(`/api/admin/transactions?userId=${encodeURIComponent(userId)}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || `Ошибка ${res.status}`);
            setTransactions(payload.transactions ?? []);
        } catch (e) {
            toast.error(e.message);
            setTransactions([]);
        } finally {
            setTransactionsLoading(false);
        }
    }, []);

    const loadEvents = useCallback(async () => {
        setEventsLoading(true);
        setEventsError(null);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error('Нет активной сессии');
            const res = await fetch('/api/admin/notifications?scope=incidents', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || `Ошибка ${res.status}`);
            setEvents(payload.notifications ?? []);
        } catch (e) {
            setEventsError(e.message);
            setEvents([]);
        } finally {
            setEventsLoading(false);
        }
    }, []);

    const loadPayments = useCallback(async () => {
        setPaymentsLoading(true);
        setPaymentsError(null);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error('Нет активной сессии');
            const res = await fetch('/api/admin/payments', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || `Ошибка ${res.status}`);
            setPayments(payload.payments ?? []);
        } catch (e) {
            setPaymentsError(e.message);
            setPayments([]);
        } finally {
            setPaymentsLoading(false);
        }
    }, []);

    const saveMarkup = useCallback(async () => {
        const num = parseFloat(platformMarkup);
        if (isNaN(num) || num <= 0) {
            toast.error('Введите корректное число больше 0');
            return;
        }
        setSavingMarkup(true);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error('Нет активной сессии');
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ key: 'platform_markup', value: num.toString() }),
            });
            if (!res.ok) throw new Error('Ошибка сохранения');
            toast.success('Наценка обновлена');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSavingMarkup(false);
        }
    }, [platformMarkup]);

    useEffect(() => {
        if (admin) {
            loadUsers();
            getCnyRate().then(setCnyRate);
            loadConfig();
            loadEvents();
            loadPayments();
        }
    }, [admin, loadUsers, loadConfig, loadEvents, loadPayments]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const base = q ? users.filter((u) => (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) : users;
        const dir = sortDir === 'asc' ? 1 : -1;
        return [...base].sort((a, b) => {
            if (sortKey === 'balance') return (a.balance - b.balance) * dir;
            return (new Date(a.created_at) - new Date(b.created_at)) * dir;
        });
    }, [users, search, sortKey, sortDir]);

    const stats = useMemo(() => {
        const total = users.reduce((s, u) => s + (u.balance || 0), 0);
        return { count: users.length, total, avg: users.length > 0 ? total / users.length : 0 };
    }, [users]);

    const eventStats = useMemo(() => {
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const incidents = events.filter((item) => isIncidentNotification(item.type));
        const last24h = incidents.filter((item) => new Date(item.createdAt).getTime() >= dayAgo);
        return {
            total: events.length,
            incidents: incidents.length,
            incidents24h: last24h.length,
            generation24h: last24h.filter((item) => item.type === 'generation_failed').length,
            billing24h: last24h.filter((item) => item.type === 'billing_failed').length,
        };
    }, [events]);

    const paymentStats = useMemo(() => {
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        const last24h = payments.filter((item) => new Date(item.created_at).getTime() >= dayAgo);
        const paid24h = last24h.filter((item) => item.status === 'paid');
        const pending = payments.filter((item) => item.status === 'pending');
        const failed24h = last24h.filter((item) => item.status === 'failed');
        return {
            total: payments.length,
            paid24h: paid24h.length,
            pending: pending.length,
            failed24h: failed24h.length,
            amount24h: paid24h.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        };
    }, [payments]);

    const recentEvents = useMemo(() => events.slice(0, 12), [events]);

    const openDialog = (u) => { setTargetUser(u); setAmount(''); setDialogOpen(true); };
    const openTransactions = (u) => {
        setTransactionsUser(u);
        setTransactions([]);
        setTransactionsOpen(true);
        loadTransactions(u.id);
    };
    const openMarkupDialog = (u) => {
        setTargetUser(u);
        setUserMarkup(u.markup ? u.markup.toString() : '');
        setMarkupDialogOpen(true);
    };

    const submitMarkup = async () => {
        if (!targetUser) return;
        const val = userMarkup.trim() === '' ? null : Number(userMarkup.replace(',', '.').trim());
        if (val !== null && (isNaN(val) || val < 0)) {
            toast.error('Введите корректное число (напр. 1.2) или оставьте пустым');
            return;
        }
        setSavingUserMarkup(true);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error('Нет сессии');
            const res = await fetch('/api/admin/update-markup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: targetUser.id, markup: val }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || `Ошибка ${res.status}`);
            toast.success('Наценка пользователя обновлена');
            setMarkupDialogOpen(false);
            loadUsers();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSavingUserMarkup(false);
        }
    };

    const submitBalance = async () => {
        if (!targetUser) return;
        const num = Number(amount.replace(',', '.').trim());
        if (!Number.isFinite(num) || num === 0) {
            toast.error('Введи корректную сумму (можно отрицательную)');
            return;
        }
        setSubmitting(true);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            if (!token) throw new Error('Нет сессии');
            const res = await fetch('/api/admin/credit-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: targetUser.id, amount: num }),
            });
            const payload = await res.json();
            if (!res.ok || !payload.ok) throw new Error(payload?.error || `Ошибка ${res.status}`);
            toast.success(`Начислено ${num > 0 ? '+' : ''}${num.toFixed(2)}₽. Новый баланс: ${payload.balance.toFixed(2)}₽`);
            setDialogOpen(false);
            loadUsers();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const severityClassName = useCallback((type) => {
        switch (getAdminNotificationSeverity(type)) {
            case 'danger':
                return 'border-red-500/30 bg-red-500/10 text-red-300';
            case 'warning':
                return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
            case 'info':
                return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
            default:
                return 'border-white/10 bg-white/5 text-white/60';
        }
    }, []);

    const tabClassName = useCallback((tab) => (
        `px-4 py-2 rounded-lg text-sm border transition-colors ${
            activeTab === tab
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'
        }`
    ), [activeTab]);

    const leaveAdmin = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
        router.push('/');
    }, [router]);

    if (!user) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center">
                <div className="text-white/50 text-sm">Войдите в аккаунт для доступа к админ-панели</div>
            </div>
        );
    }

    if (!admin) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center space-y-3">
                    <div className="text-2xl">🔒</div>
                    <h2 className="text-white font-semibold">Доступ ограничен</h2>
                    <p className="text-white/40 text-sm">Эта зона доступна только администраторам.<br />{user.email}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030303] text-white p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Админ-панель</h1>
                        <p className="text-white/40 text-sm">Пользователи, логи и платежи</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                loadUsers();
                                loadEvents();
                                loadPayments();
                            }}
                            disabled={loading || eventsLoading || paymentsLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            <span className={(loading || eventsLoading || paymentsLoading) ? 'animate-spin' : ''}>↻</span>
                            Обновить
                        </button>
                        <button
                            onClick={leaveAdmin}
                            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 transition-colors"
                        >
                            Назад
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setActiveTab('users')} className={tabClassName('users')}>Пользователи</button>
                    <button type="button" onClick={() => setActiveTab('logs')} className={tabClassName('logs')}>Логи</button>
                    <button type="button" onClick={() => setActiveTab('payments')} className={tabClassName('payments')}>Платежи</button>
                </div>

                {activeTab === 'users' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Пользователи', value: authUsersCount ?? '—', sub: 'Зарегистрировано' },
                                { label: 'Суммарный баланс', value: `₽${stats.total.toFixed(2)}`, sub: 'По всем аккаунтам' },
                                { label: 'Средний баланс', value: `₽${stats.avg.toFixed(2)}`, sub: 'На пользователя' },
                                {
                                    label: 'Курс юаня',
                                    value: cnyRate ? `${cnyRate.real.toFixed(2)} ₽/¥` : '—',
                                    sub: cnyRate ? `+${((parseFloat(platformMarkup) - 1) * 100).toFixed(0)}% → ${(cnyRate.real * parseFloat(platformMarkup)).toFixed(2)} ₽/¥` : 'ЦБ РФ',
                                },
                            ].map((c) => (
                                <div key={c.label} className="bg-neutral-900 border border-white/10 rounded-xl p-4">
                                    <div className="text-xs text-white/40 mb-1">{c.label}</div>
                                    <div className="text-xl font-bold text-white">{c.value}</div>
                                    <div className="text-xs text-white/30 mt-1">{c.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-neutral-900 border border-white/10 rounded-xl p-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="text-xs text-white/40 mb-1">Наценка платформы</div>
                                    <div className="text-white">Текущее значение: <span className="font-bold">{platformMarkup}</span></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={platformMarkup}
                                        onChange={(e) => setPlatformMarkup(e.target.value)}
                                        className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-purple-500 w-32"
                                        placeholder="1.15"
                                    />
                                    <button
                                        onClick={saveMarkup}
                                        disabled={savingMarkup}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        {savingMarkup ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">⌕</span>
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Поиск по email или имени"
                                        className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSortKey('created_at')}
                                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${sortKey === 'created_at' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'}`}
                                    >Дата</button>
                                    <button
                                        onClick={() => setSortKey('balance')}
                                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${sortKey === 'balance' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/40 border-white/10 text-white/60 hover:border-white/30'}`}
                                    >Баланс</button>
                                    <button
                                        onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                                        className="px-3 py-1.5 rounded-lg text-xs border bg-black/40 border-white/10 text-white/60 hover:border-white/30 transition-colors"
                                    >{sortDir === 'asc' ? '↑' : '↓'}</button>
                                </div>
                            </div>

                            {loadError && (
                                <div className="mx-4 my-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{loadError}</div>
                            )}

                            {loading ? (
                                <div className="py-16 text-center text-white/30 text-sm">Загрузка…</div>
                            ) : filtered.length === 0 ? (
                                <div className="py-16 text-center text-white/30 text-sm">Нет пользователей</div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Пользователь</th>
                                            <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Баланс</th>
                                            <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Наценка</th>
                                            <th className="text-left px-4 py-3 text-xs text-white/40 font-medium hidden md:table-cell">Регистрация</th>
                                            <th className="px-4 py-3 text-xs text-white/40 font-medium text-right">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((u) => (
                                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-sm text-white">{u.full_name || '—'}</div>
                                                    <div className="text-xs text-white/40">{u.email}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-xs font-semibold">
                                                        ₽{Number(u.balance).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {u.markup ? (
                                                        <span className="text-xs text-orange-400 font-medium">{u.markup}x</span>
                                                    ) : (
                                                        <span className="text-xs text-white/20">стандарт ({platformMarkup}x)</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-white/40 hidden md:table-cell">
                                                    {new Date(u.created_at).toLocaleDateString('ru-RU')}
                                                </td>
                                                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                                                    <button onClick={() => openTransactions(u)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition-colors">История</button>
                                                    <button onClick={() => openMarkupDialog(u)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition-colors">Наценка</button>
                                                    <button onClick={() => openDialog(u)} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors">Начислить</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'logs' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Логи', value: eventStats.total, sub: 'Ошибки и инциденты' },
                                { label: 'Инциденты', value: eventStats.incidents, sub: 'Все проблемные события' },
                                { label: 'Генерация 24ч', value: eventStats.generation24h, sub: 'Ошибки генерации' },
                                { label: 'Биллинг 24ч', value: eventStats.billing24h, sub: 'Проблемы списания' },
                            ].map((c) => (
                                <div key={c.label} className="bg-neutral-900 border border-white/10 rounded-xl p-4">
                                    <div className="text-xs text-white/40 mb-1">{c.label}</div>
                                    <div className="text-xl font-bold text-white">{c.value}</div>
                                    <div className="text-xs text-white/30 mt-1">{c.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white">Логи и инциденты</div>
                                    <div className="text-xs text-white/40">Отдельно от регистраций пользователей</div>
                                </div>
                                <button onClick={loadEvents} className="px-3 py-1.5 rounded-lg text-xs border bg-black/40 border-white/10 text-white/60 hover:border-white/30 transition-colors">
                                    {eventsLoading ? 'Загрузка...' : 'Обновить события'}
                                </button>
                            </div>

                            {eventsError && (
                                <div className="mx-4 my-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{eventsError}</div>
                            )}

                            {eventsLoading && events.length === 0 ? (
                                <div className="py-16 text-center text-white/30 text-sm">Загрузка событий…</div>
                            ) : recentEvents.length === 0 ? (
                                <div className="py-16 text-center text-white/30 text-sm">Пока нет ошибок и инцидентов</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {recentEvents.map((item) => (
                                        <div key={item.id} className="px-4 py-3">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                <div className="min-w-0 space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] border ${severityClassName(item.type)}`}>
                                                            {getAdminNotificationTypeLabel(item.type)}
                                                        </span>
                                                        <span className="text-[11px] text-white/30">
                                                            {new Date(item.createdAt).toLocaleString('ru-RU')}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-medium text-white">{item.title}</div>
                                                    <div className="text-sm text-white/65 break-words">{item.message}</div>
                                                    <div className="text-xs text-white/35">
                                                        {(item.fullName || '—')} {item.email ? `· ${item.email}` : ''}
                                                    </div>
                                                </div>
                                                {item.payload && Object.keys(item.payload).length > 0 && (
                                                    <details className="md:max-w-md rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                                        <summary className="cursor-pointer text-xs text-white/50">Подробнее</summary>
                                                        <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-white/45">
                                                            {JSON.stringify(item.payload, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'payments' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Платежи', value: paymentStats.total, sub: 'Последние записи' },
                                { label: 'Успешно 24ч', value: paymentStats.paid24h, sub: `На сумму ₽${paymentStats.amount24h.toFixed(2)}` },
                                { label: 'В ожидании', value: paymentStats.pending, sub: 'Статус pending' },
                                { label: 'Ошибки 24ч', value: paymentStats.failed24h, sub: 'Статус failed' },
                            ].map((c) => (
                                <div key={c.label} className="bg-neutral-900 border border-white/10 rounded-xl p-4">
                                    <div className="text-xs text-white/40 mb-1">{c.label}</div>
                                    <div className="text-xl font-bold text-white">{c.value}</div>
                                    <div className="text-xs text-white/30 mt-1">{c.sub}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white">Платежи</div>
                                    <div className="text-xs text-white/40">Пополнения, pending и failed статусы</div>
                                </div>
                                <button onClick={loadPayments} className="px-3 py-1.5 rounded-lg text-xs border bg-black/40 border-white/10 text-white/60 hover:border-white/30 transition-colors">
                                    {paymentsLoading ? 'Загрузка...' : 'Обновить платежи'}
                                </button>
                            </div>

                            {paymentsError && (
                                <div className="mx-4 my-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">{paymentsError}</div>
                            )}

                            {paymentsLoading && payments.length === 0 ? (
                                <div className="py-16 text-center text-white/30 text-sm">Загрузка платежей…</div>
                            ) : payments.length === 0 ? (
                                <div className="py-16 text-center text-white/30 text-sm">Пока нет платежей</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/5">
                                                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Пользователь</th>
                                                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Сумма</th>
                                                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Статус</th>
                                                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Создан</th>
                                                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Оплачен</th>
                                                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Order ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((item) => (
                                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-sm text-white">{item.full_name || '—'}</div>
                                                        <div className="text-xs text-white/40">{item.email || item.user_id}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-white">₽{Number(item.amount || 0).toFixed(2)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            item.status === 'paid'
                                                                ? 'bg-green-500/15 text-green-300'
                                                                : item.status === 'failed'
                                                                    ? 'bg-red-500/15 text-red-300'
                                                                    : 'bg-amber-500/15 text-amber-300'
                                                        }`}>
                                                            {item.status || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-white/40">{new Date(item.created_at).toLocaleString('ru-RU')}</td>
                                                    <td className="px-4 py-3 text-xs text-white/40">{item.paid_at ? new Date(item.paid_at).toLocaleString('ru-RU') : '—'}</td>
                                                    <td className="px-4 py-3 text-xs text-white/40">
                                                        <div>{item.id}</div>
                                                        {item.operation_id && <div className="text-white/25 mt-1">{item.operation_id}</div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {dialogOpen && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDialogOpen(false)}>
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-white">Начисление баланса</h3>
                            <button onClick={() => setDialogOpen(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>
                        {targetUser && (
                            <div className="text-sm text-white/50">
                                {targetUser.full_name || '—'} · {targetUser.email}
                                <div className="mt-1 text-purple-400">Текущий баланс: ₽{Number(targetUser.balance).toFixed(2)}</div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <div className="text-xs text-white/40">Сумма (₽) — можно отрицательную для списания</div>
                            <input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Например: 1000"
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && submitBalance()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setDialogOpen(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:border-white/30 transition-colors">Отмена</button>
                            <button onClick={submitBalance} disabled={submitting || !targetUser} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">{submitting ? '...' : 'Начислить'}</button>
                        </div>
                    </div>
                </div>
            )}

            {transactionsOpen && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTransactionsOpen(false)}>
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-white">История операций</h3>
                            <button onClick={() => setTransactionsOpen(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>
                        {transactionsUser && (
                            <div className="text-sm text-white/50 mb-4">
                                {transactionsUser.full_name || '—'} · {transactionsUser.email}
                            </div>
                        )}
                        {transactionsLoading ? (
                            <div className="py-16 text-center text-white/30 text-sm">Загрузка…</div>
                        ) : transactions.length === 0 ? (
                            <div className="py-16 text-center text-white/30 text-sm">Нет транзакций</div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="p-3 rounded-xl bg-black/30 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-white/40">{new Date(tx.created_at).toLocaleString('ru-RU')}</div>
                                            <div className={`text-sm font-bold ${Number(tx.amount) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}₽
                                            </div>
                                        </div>
                                        <div className="text-white text-sm mt-1">{tx.reason || '—'}</div>
                                        {tx.meta && Object.keys(tx.meta).length > 0 && (
                                            <div className="text-xs text-white/30 mt-1">{JSON.stringify(tx.meta)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {markupDialogOpen && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMarkupDialogOpen(false)}>
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-white">Индивидуальная наценка</h3>
                            <button onClick={() => setMarkupDialogOpen(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>
                        {targetUser && (
                            <div className="text-sm text-white/50">
                                {targetUser.full_name || '—'} · {targetUser.email}
                                <div className="mt-1 text-orange-400">Глобальная наценка: {platformMarkup}x</div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <div className="text-xs text-white/40 flex justify-between items-center">
                                <span>Наценка (коэффициент)</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setUserMarkup('1.0')} className="text-[10px] bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/10 transition-colors">1.0 (Без наценки)</button>
                                    <button onClick={() => setUserMarkup('')} className="text-[10px] bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/10 transition-colors">Сброс</button>
                                </div>
                            </div>
                            <input
                                value={userMarkup}
                                onChange={(e) => setUserMarkup(e.target.value)}
                                placeholder="Оставьте пустым для стандартной"
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && submitMarkup()}
                            />
                            <p className="text-[10px] text-white/30 italic">
                                Если пусто, будет использоваться общая наценка платформы ({platformMarkup}x).
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setMarkupDialogOpen(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:border-white/30 transition-colors">Отмена</button>
                            <button onClick={submitMarkup} disabled={savingUserMarkup || !targetUser} className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">{savingUserMarkup ? '...' : 'Сохранить'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
