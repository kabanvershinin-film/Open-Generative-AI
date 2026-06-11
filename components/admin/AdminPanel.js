'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { isAdminUser } from '@/lib/admin';

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
    
    const [transactionsOpen, setTransactionsOpen] = useState(false);
    const [transactionsUser, setTransactionsUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);

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

    const openTransactions = (u) => {
        setTransactionsUser(u);
        setTransactions([]);
        setTransactionsOpen(true);
        loadTransactions(u.id);
    };

    useEffect(() => {
        if (admin) {
            loadUsers();
            getCnyRate().then(setCnyRate);
            loadConfig();
        }
    }, [admin, loadUsers, loadConfig]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const base = q ? users.filter(u => (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) : users;
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

    const openDialog = (u) => { setTargetUser(u); setAmount(''); setDialogOpen(true); };

    const submitBalance = async () => {
        if (!targetUser) return;
        const num = Number(amount.replace(',', '.').trim());
        if (!Number.isFinite(num) || num === 0) { toast.error('Введи корректную сумму (можно отрицательную)'); return; }
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

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Админ-панель</h1>
                        <p className="text-white/40 text-sm">Пользователи, баланс и диагностика</p>
                    </div>
                    <button
                        onClick={loadUsers}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <span className={loading ? 'animate-spin' : ''}>↻</span>
                        Обновить
                    </button>
                </div>

                {/* Stats */}
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
            ].map(c => (
                <div key={c.label} className="bg-neutral-900 border border-white/10 rounded-xl p-4">
                    <div className="text-xs text-white/40 mb-1">{c.label}</div>
                    <div className="text-xl font-bold text-white">{c.value}</div>
                    <div className="text-xs text-white/30 mt-1">{c.sub}</div>
                </div>
            ))}
        </div>

        {/* Platform Markup */}
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

                {/* Users table */}
                <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">⌕</span>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
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
                                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
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
                                    <th className="text-left px-4 py-3 text-xs text-white/40 font-medium hidden md:table-cell">Регистрация</th>
                                    <th className="px-4 py-3 text-xs text-white/40 font-medium text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
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
                                        <td className="px-4 py-3 text-xs text-white/40 hidden md:table-cell">
                                            {new Date(u.created_at).toLocaleDateString('ru-RU')}
                                        </td>
                                        <td className="px-4 py-3 text-right flex gap-2 justify-end">
                                            <button
                                                onClick={() => openTransactions(u)}
                                                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition-colors"
                                            >История</button>
                                            <button
                                                onClick={() => openDialog(u)}
                                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors"
                                            >Начислить</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Balance dialog */}
            {dialogOpen && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                     onClick={() => setDialogOpen(false)}>
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
                         onClick={e => e.stopPropagation()}>
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
                                onChange={e => setAmount(e.target.value)}
                                placeholder="Например: 1000"
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && submitBalance()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDialogOpen(false)}
                                className="flex-1 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:border-white/30 transition-colors"
                            >Отмена</button>
                            <button
                                onClick={submitBalance}
                                disabled={submitting || !targetUser}
                                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                            >{submitting ? '...' : 'Начислить'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions dialog */}
            {transactionsOpen && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                     onClick={() => setTransactionsOpen(false)}>
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col"
                         onClick={e => e.stopPropagation()}>
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
                                {transactions.map(tx => (
                                    <div key={tx.id} className="p-3 rounded-xl bg-black/30 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-white/40">
                                                {new Date(tx.created_at).toLocaleString('ru-RU')}
                                            </div>
                                            <div className={`text-sm font-bold ${Number(tx.amount) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}₽
                                            </div>
                                        </div>
                                        <div className="text-white text-sm mt-1">{tx.reason || '—'}</div>
                                        {tx.meta && Object.keys(tx.meta).length > 0 && (
                                            <div className="text-xs text-white/30 mt-1">
                                                {JSON.stringify(tx.meta)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
