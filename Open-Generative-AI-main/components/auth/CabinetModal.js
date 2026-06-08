'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];
const ADMIN_EMAILS = ['kaban.vershinin@gmail.com', 'didig.vershinin@yandex.ru'];
const MIN_TOPUP_AMOUNT = 100;
const MAX_TOPUP_AMOUNT = 100000;

const formatCurrency = (value) =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

function formatTransactionLabel(txn) {
    const reason = txn.reason || '';
    if (reason === 'admin_topup') return 'Пополнение (администратор)';
    if (reason === 'topup' || reason === 'payment') return 'Пополнение';
    if (/^Возврат/i.test(reason)) return reason;
    const model = txn.meta?.model || reason;
    if (model) return `Генерация / ${model}`;
    return 'Операция';
}

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    try {
        return new Date(timestamp).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

function isAdmin(email) {
    if (!email) return false;
    return ADMIN_EMAILS.some((candidate) => candidate.toLowerCase() === email.toLowerCase());
}

export default function CabinetModal() {
    const { cabinetOpen, setCabinetOpen, profile, balance, logout, refreshBalance, user } = useAuth();
    const [amount, setAmount] = useState('1000');
    const [busy, setBusy] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsLoadedOnce, setTransactionsLoadedOnce] = useState(false);
    const paymentReturnAttemptedRef = useRef(false);
    const modalRef = useRef(null);

    const handleClose = useCallback(() => {
        setCabinetOpen(false);
    }, [setCabinetOpen]);

    const fetchTransactions = useCallback(async () => {
        setTransactionsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = {};
            if (session?.access_token) headers['x-sb-token'] = session.access_token;
            const response = await fetch('/api/transactions', { headers });
            if (!response.ok) throw new Error('Не удалось получить историю операций');
            const payload = await response.json().catch(() => ({}));
            setTransactions(Array.isArray(payload.transactions) ? payload.transactions : []);
        } catch (error) {
            setTransactions([]);
            if (transactionsLoadedOnce) {
                toast.error(error.message || 'Не удалось загрузить историю операций');
            }
        } finally {
            setTransactionsLoading(false);
            setTransactionsLoadedOnce(true);
        }
    }, [transactionsLoadedOnce]);

    const verifyPaymentReturn = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('payment') !== 'success') return;

        const orderId = currentUrl.searchParams.get('order');
        if (!orderId) return;

        let shouldScrub = false;
        try {
            setCabinetOpen(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            paymentReturnAttemptedRef.current = true;
            shouldScrub = true;

            for (let attempt = 0; attempt < 10; attempt += 1) {
                const response = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ orderId }),
                });

                const result = await response.json().catch(() => ({}));
                if (result.status === 'paid') {
                    await refreshBalance();
                    await fetchTransactions();
                    if (result.credited) toast.success('Баланс пополнен');
                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        } finally {
            if (shouldScrub && paymentReturnAttemptedRef.current) {
                const nextUrl = new URL(window.location.href);
                nextUrl.searchParams.delete('payment');
                nextUrl.searchParams.delete('order');
                window.history.replaceState({}, '', nextUrl.toString());
            }
        }
    }, [fetchTransactions, refreshBalance, setCabinetOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('payment') !== 'success') return;
        if (!currentUrl.searchParams.get('order')) return;
        if (!user) return;
        verifyPaymentReturn();
    }, [user, verifyPaymentReturn]);

    useEffect(() => {
        if (!cabinetOpen) return;
        fetchTransactions();
    }, [cabinetOpen, fetchTransactions]);

    useEffect(() => {
        if (!cabinetOpen) return;

        function handleKeyDown(event) {
            if (event.key === 'Escape') handleClose();
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cabinetOpen, handleClose]);

    useEffect(() => {
        if (!cabinetOpen) return;
        const previouslyFocused = document.activeElement;
        const node = modalRef.current;
        node?.focus({ preventScroll: true });
        return () => {
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
        };
    }, [cabinetOpen]);

    const handlePreset = useCallback((value) => {
        setAmount(String(value));
    }, []);

    const handleTopUp = useCallback(async () => {
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount < MIN_TOPUP_AMOUNT) {
            toast.error(`Минимальная сумма пополнения ${MIN_TOPUP_AMOUNT} ₽`);
            return;
        }

        if (numericAmount > MAX_TOPUP_AMOUNT) {
            toast.error(`Максимальная сумма пополнения ${MAX_TOPUP_AMOUNT} ₽`);
            return;
        }

        setBusy(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Сессия истекла, войдите снова');
                return;
            }

            const response = await fetch('/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ amount: numericAmount }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.paymentUrl) {
                throw new Error(payload.error || 'Не удалось создать платеж');
            }

            window.location.assign(payload.paymentUrl);
        } catch (error) {
            toast.error(error.message || 'Ошибка сети');
        } finally {
            setBusy(false);
        }
    }, [amount]);

    const numericBalance = Number(balance) || 0;
    const formattedBalance = useMemo(() => formatCurrency(numericBalance), [numericBalance]);

    if (!cabinetOpen) return null;

    const adminLinkVisible = isAdmin(user?.email);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8">
            <div
                className="absolute inset-0"
                onClick={handleClose}
                aria-hidden="true"
            />
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="grid gap-6 p-8 md:grid-cols-[1.15fr_1fr]">
                    <div className="flex flex-col gap-6">
                        <header className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <p className="text-sm uppercase tracking-[0.24em] text-white/40">Кошелёк</p>
                                <h2 className="text-xl font-semibold text-white">Личный кабинет</h2>
                                <p className="text-sm text-white/50">{profile?.email}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                            >
                                <span className="sr-only">Закрыть</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        fill="currentColor"
                                        d="m12 10.586 5.657-5.657 1.414 1.414L13.414 12l5.657 5.657-1.414 1.414L12 13.414l-5.657 5.657-1.414-1.414L10.586 12 4.929 6.343l1.414-1.414z"
                                    />
                                </svg>
                            </button>
                        </header>

                        <section className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent p-6 shadow-inner">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Ваш баланс</p>
                            <p className="mt-2 text-3xl font-semibold text-white">{formattedBalance}</p>
                        </section>

                        <section className="space-y-4 rounded-2xl border border-white/10 bg-neutral-900/40 p-6">
                            <div>
                                <p className="text-sm font-medium text-white/80">Пополнить баланс</p>
                                <p className="text-xs text-white/40">Минимум {MIN_TOPUP_AMOUNT} ₽ · максимум {MAX_TOPUP_AMOUNT} ₽</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {PRESET_AMOUNTS.map((preset) => {
                                    const isActive = amount === String(preset);
                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => handlePreset(preset)}
                                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                                isActive
                                                    ? 'border-purple-400 bg-purple-500/40 text-white shadow-[0_0_25px_rgba(168,85,247,0.25)]'
                                                    : 'border-white/10 bg-black/30 text-white/60 hover:border-white/30 hover:text-white'
                                            }`}
                                        >
                                            {preset.toLocaleString('ru-RU')} ₽
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min={MIN_TOPUP_AMOUNT}
                                    max={MAX_TOPUP_AMOUNT}
                                    value={amount}
                                    onChange={(event) => setAmount(event.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-0"
                                    placeholder="Сумма пополнения"
                                    inputMode="numeric"
                                    aria-label="Сумма пополнения"
                                />
                                <button
                                    type="button"
                                    onClick={handleTopUp}
                                    disabled={busy}
                                    className="whitespace-nowrap rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-purple-500 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {busy ? 'Загрузка...' : 'Пополнить'}
                                </button>
                            </div>
                            <p className="text-xs text-center text-white/35">Поддерживаются карты и СБП</p>
                        </section>
                    </div>

                    <aside className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-black/40 p-6">
                        <header className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white/80">История операций</h3>
                            <button
                                type="button"
                                onClick={fetchTransactions}
                                disabled={transactionsLoading}
                                className="text-xs font-medium text-purple-300 transition hover:text-purple-200 disabled:cursor-not-allowed disabled:text-white/30"
                            >
                                {transactionsLoading ? 'Обновление...' : 'Обновить'}
                            </button>
                        </header>

                        <div className="flex-1 overflow-hidden rounded-xl border border-white/5 bg-black/30">
                            {transactionsLoading && !transactionsLoadedOnce ? (
                                <div className="flex h-40 items-center justify-center text-xs text-white/40">Загрузка...</div>
                            ) : transactions.length === 0 ? (
                                <div className="flex h-40 items-center justify-center px-4 text-center text-xs text-white/35">
                                    История операций пока пустая
                                </div>
                            ) : (
                                <ul className="max-h-80 space-y-2 overflow-y-auto p-3">
                                    {transactions.map((txn) => {
                                        const rawAmount = Number(txn.amount) || 0;
                                        const isSpend = rawAmount < 0;
                                        const formattedAmount = formatCurrency(Math.abs(rawAmount));
                                        return (
                                            <li
                                                key={txn.id}
                                                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/40 px-3 py-2"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-white/90">{formatTransactionLabel(txn)}</p>
                                                    <p className="text-[11px] text-white/35">{formatTimestamp(txn.created_at)}</p>
                                                </div>
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        isSpend ? 'text-red-400' : 'text-emerald-400'
                                                    }`}
                                                >
                                                    {isSpend ? '-' : '+'}
                                                    {formattedAmount}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {adminLinkVisible && (
                            <a
                                href="/admin"
                                className="rounded-xl border border-purple-500/50 bg-purple-500/15 px-4 py-2 text-center text-sm font-medium text-purple-200 transition hover:border-purple-400 hover:text-purple-100"
                            >
                                Перейти в админ-панель
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={logout}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition hover:border-red-400/60 hover:text-red-300"
                        >
                            Выйти из аккаунта
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
}
