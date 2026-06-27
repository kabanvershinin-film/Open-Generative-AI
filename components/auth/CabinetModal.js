'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import { txnLabel } from './transactionLabels';

const PRESETS = [500, 1000, 2000, 5000];
const ADMIN_EMAILS = ['kaban.vershinin@gmail.com', 'didig.vershinin@yandex.ru'];

function fmtDate(s) {
    if (!s) return '';
    try {
        return new Date(s).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return ''; }
}

export default function CabinetModal() {
    const { cabinetOpen, setCabinetOpen, profile, balance, logout, refreshBalance, user } = useAuth();
    const [amount, setAmount] = useState('1000');
    const [busy, setBusy] = useState(false);
    const [txns, setTxns] = useState(null); // null = not loaded, [] = loaded empty
    const [txnsLoading, setTxnsLoading] = useState(false);
    const paymentReturnAttemptedRef = useRef(false);

    // Load spending history whenever the cabinet opens.
    const loadTxns = useCallback(async () => {
        setTxnsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = {};
            if (session?.access_token) headers['x-sb-token'] = session.access_token;
            const r = await fetch('/api/transactions', { headers });
            const j = await r.json().catch(() => ({}));
            setTxns(Array.isArray(j.transactions) ? j.transactions : []);
        } catch {
            setTxns([]);
        } finally {
            setTxnsLoading(false);
        }
    }, []);

    useEffect(() => { if (cabinetOpen) loadTxns(); }, [cabinetOpen, loadTxns]);

    // After returning from Точка (?payment=success&order=...), verify & credit.
    const verifyReturn = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('payment') !== 'success') return;
        const order = url.searchParams.get('order');
        if (!order) return;
        let shouldScrub = false;
        try {
            setCabinetOpen(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            paymentReturnAttemptedRef.current = true;
            shouldScrub = true;
            // Poll verify a few times (Точка may confirm with a slight delay)
            for (let i = 0; i < 10; i++) {
                const r = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                    body: JSON.stringify({ orderId: order }),
                });
                const j = await r.json();
                if (j.status === 'paid') {
                    await refreshBalance();
                    await loadTxns();
                    if (j.credited) toast.success('Баланс пополнен');
                    break;
                }
                await new Promise(res => setTimeout(res, 2000));
            }
        } finally {
            if (shouldScrub && paymentReturnAttemptedRef.current) {
                url.searchParams.delete('payment');
                url.searchParams.delete('order');
                window.history.replaceState({}, '', url.toString());
            }
        }
    }, [loadTxns, refreshBalance, setCabinetOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('payment') !== 'success') return;
        if (!url.searchParams.get('order')) return;
        if (!user) return;
        verifyReturn();
    }, [user, verifyReturn]);

    if (!cabinetOpen) return null;
    const contact = profile?.email || user?.email || profile?.phone || user?.phone || 'Контакт не указан';

    const topup = async () => {
        const value = Number(amount);
        if (!Number.isFinite(value) || value < 100) { toast.error('Минимум 100 руб'); return; }
        setBusy(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { toast.error('Сессия истекла, войдите снова'); return; }
            const r = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ amount: value }),
            });
            const j = await r.json();
            if (!r.ok || !j.paymentUrl) { toast.error(j.error || 'Не удалось создать платёж'); return; }
            window.location.href = j.paymentUrl;
        } catch (e) {
            toast.error(e?.message || 'Ошибка сети');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setCabinetOpen(false)}>
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 max-h-[90vh] overflow-y-auto"
                 onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Личный кабинет</h3>
                    <button onClick={() => setCabinetOpen(false)} className="text-white/40 hover:text-white">✕</button>
                </div>

                {/* Contact (Email/Phone) */}
                <div className="mt-1">
                    <div className="text-xs text-white/30 mb-1">Ваша почта:</div>
                    <div className="flex items-center gap-2">
                        <code className="text-[11px] text-white/60 bg-black/40 border border-white/10 px-2 py-1 rounded-lg flex-1 select-all font-mono">
                            {contact}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(contact);
                                toast.success('Почта скопирована!');
                            }}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            Копировать
                        </button>
                    </div>
                </div>
                
                {/* User ID */}
                {user?.id && (
                    <div className="mt-4">
                        <div className="text-xs text-white/30 mb-1">Ваш ID:</div>
                        <div className="flex items-center gap-2">
                            <code className="text-[11px] text-white/60 bg-black/40 border border-white/10 px-2 py-1 rounded-lg flex-1 select-all font-mono">
                                {user.id}
                            </code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(user.id);
                                    toast.success('ID скопирован!');
                                }}
                                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Копировать
                            </button>
                        </div>
                    </div>
                )}

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="text-xs text-white/50">Ваш баланс</div>
                    <div className="text-2xl font-bold text-white">{balance.toFixed(2)} ₽</div>
                </div>

                <div className="space-y-3">
                    <div className="text-sm text-white/70">Пополнить баланс</div>
                    <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-center">
                        <div className="text-base font-bold uppercase tracking-wide text-amber-300">
                            Пополнение только через российский банк
                        </div>
                        <div className="mt-1 text-sm font-medium text-amber-100">
                            Поддерживаются только карты российских банков и СБП
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {PRESETS.map(p => (
                            <button key={p} onClick={() => setAmount(String(p))}
                                    className={`py-2 rounded-lg text-sm border transition-colors ${
                                        amount === String(p)
                                            ? 'bg-purple-600 border-purple-500 text-white'
                                            : 'bg-black/40 border-white/10 text-white/70 hover:border-white/30'}`}>
                                {p}₽
                            </button>
                        ))}
                    </div>
                    <input type="number" min={100} max={100000} value={amount}
                           onChange={(e) => setAmount(e.target.value)}
                           className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500"
                           placeholder="Сумма, ₽" />
                    <button onClick={topup} disabled={busy}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
                        {busy ? '...' : 'Пополнить'}
                    </button>
                    <div className="text-sm font-semibold text-amber-300 text-center">Только российский банк · карта РФ или СБП · от 100 ₽</div>
                </div>

                <div className="space-y-2">
                    <div className="text-sm text-white/70">История операций</div>
                    {txnsLoading && (txns === null) ? (
                        <div className="text-xs text-white/40 py-3 text-center">Загрузка…</div>
                    ) : (txns && txns.length > 0) ? (
                        <div className="rounded-xl border border-white/10 divide-y divide-white/5 max-h-60 overflow-y-auto">
                            {txns.map((t) => {
                                const amt = Number(t.amount) || 0;
                                const spend = amt < 0;
                                return (
                                    <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                        <div className="min-w-0">
                                            <div className="text-sm text-white/90 truncate">{txnLabel(t)}</div>
                                            <div className="text-[11px] text-white/35">{fmtDate(t.created_at)}</div>
                                        </div>
                                        <div className={`text-sm font-medium whitespace-nowrap ${spend ? 'text-red-400' : 'text-green-400'}`}>
                                            {spend ? '' : '+'}{amt.toFixed(2)} ₽
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-xs text-white/40 py-3 text-center">Пока нет операций</div>
                    )}
                </div>

                {ADMIN_EMAILS.some(e => e.toLowerCase() === (user?.email || '').toLowerCase()) && (
                    <a href="/admin"
                       className="w-full py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors text-center block">
                        ⚙ Админ-панель
                    </a>
                )}

                <button onClick={logout}
                        className="w-full py-2 text-sm text-white/50 hover:text-red-400 transition-colors">
                    Выйти из аккаунта
                </button>
            </div>
        </div>
    );
}
