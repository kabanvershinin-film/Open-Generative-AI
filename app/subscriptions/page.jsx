'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import StudioLayout from '@/components/studio/StudioLayout';

export default function SubscriptionsPage() {
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [msg, setMsg] = useState('');

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const [sRes, bRes] = await Promise.all([
                fetch('/api/subscriptions', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const sData = await sRes.json();
            const bData = await bRes.json();
            setPlans(sData.plans || []);
            setSubscription(sData.subscription);
            setBalance(bData.balance ?? 0);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { load(); }, [load]);

    async function purchase(planId) {
        setPurchasing(planId);
        setMsg('');
        try {
            const token = await getToken();
            const r = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const d = await r.json();
            setMsg(d.message || (r.ok ? 'Готово!' : d.error));
            if (r.ok) load();
        } finally {
            setPurchasing(null);
        }
    }

    const formatRub = (kopecks) => `${(kopecks / 100).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`;

    return (
        <StudioLayout>
            <div className="max-w-4xl mx-auto p-8">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Подписки</p>
                <h1 className="text-3xl font-bold mb-2">Кредиты для каждой генерации</h1>
                <p className="text-white/50 text-sm mb-8">Выберите подписку с фиксированным сроком. Кредиты — это валюта генерации, не деньги: они доступны, пока действует подписка.</p>

                {/* Current balance */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-white/40 mb-1">Текущий баланс</p>
                        <p className="text-2xl font-bold">{balance.toFixed(2)} кредита</p>
                    </div>
                    {subscription && (
                        <div className="text-right">
                            <p className="text-xs text-white/40 mb-1">Текущая подписка</p>
                            <p className="font-medium">{subscription.plan?.name}</p>
                            <p className="text-xs text-white/40">до {new Date(subscription.ends_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                    )}
                </div>

                {msg && <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${msg.includes('ошибка') || msg.includes('error') ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{msg}</div>}

                <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Тарифы подписок</p>
                <p className="font-semibold mb-6">Выберите подписку</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-3 text-white/40 text-sm">Загрузка...</div>
                    ) : plans.map(plan => {
                        const isCurrent = subscription?.plan_id === plan.id;
                        return (
                            <div key={plan.id} className={`rounded-xl border p-6 flex flex-col ${isCurrent ? 'border-violet-400/40 bg-violet-900/10' : 'border-white/[0.08] bg-white/[0.03]'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">◈</span>
                                    <span className="font-semibold">{plan.name}</span>
                                </div>
                                <p className="text-2xl font-bold mb-1">{formatRub(plan.price_rub)}</p>
                                <p className="text-xs text-white/40 mb-4">на {plan.duration_days} дней</p>
                                <div className="mb-1">
                                    <p className="text-xs text-white/40 mb-1">Включено</p>
                                    <p className="text-lg font-semibold">{plan.credits.toLocaleString('ru-RU')} кредитов</p>
                                </div>
                                <div className="flex-1 mt-4">
                                    {['Кредиты для всех доступных генераций', 'Доступные кредиты переносятся при замене подписки', 'Новый срок начинается после подтверждения оплаты'].map(f => (
                                        <div key={f} className="flex items-start gap-2 mb-2">
                                            <span className="text-green-400 text-xs mt-0.5">✓</span>
                                            <span className="text-xs text-white/60">{f}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => purchase(plan.id)}
                                    disabled={!!purchasing || isCurrent}
                                    className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${isCurrent ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-white text-black hover:bg-white/90 disabled:opacity-50'}`}
                                >
                                    {purchasing === plan.id ? '...' : isCurrent ? 'Текущая' : 'Купить подписку'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-white/30 text-center mt-6">
                    Нажимая кнопку оплаты, вы подтверждаете согласование с Пользовательским соглашением. Демо-режим: оплата не производится.
                </p>
            </div>
        </StudioLayout>
    );
}
