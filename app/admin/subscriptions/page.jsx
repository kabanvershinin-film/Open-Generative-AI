'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminSubscriptionsPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        const token = await getToken();
        const r = await fetch('/api/admin/plans', { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setPlans(d.plans || []);
        setLoading(false);
    }, [getToken]);

    useEffect(() => { load(); }, [load]);

    async function save() {
        setSaving(true);
        try {
            const token = await getToken();
            const method = editing === 'new' ? 'POST' : 'PATCH';
            const body = editing === 'new' ? form : { id: editing, ...form };
            await fetch('/api/admin/plans', { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            setEditing(null);
            load();
        } finally { setSaving(false); }
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Подписки</p>
                    <h1 className="text-xl font-bold">Тарифные планы</h1>
                </div>
                <button onClick={() => { setEditing('new'); setForm({ code: '', name: '', price_rub: 0, credits: 0, duration_days: 30, is_active: true, sort_order: 0 }); }} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors">+ Добавить план</button>
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#141420] border border-white/[0.08] p-6">
                        <h2 className="font-bold mb-5">{editing === 'new' ? 'Новый план' : 'Редактирование'}</h2>
                        <div className="flex flex-col gap-3">
                            {[['Код', 'code'], ['Название', 'name']].map(([l, f]) => (
                                <div key={f}><label className="block text-xs text-white/40 mb-1">{l}</label>
                                    <input value={form[f] || ''} onChange={e => setForm(x => ({ ...x, [f]: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></div>
                            ))}
                            {[['Цена (копейки)', 'price_rub'], ['Кредитов', 'credits'], ['Дней', 'duration_days'], ['Порядок', 'sort_order']].map(([l, f]) => (
                                <div key={f}><label className="block text-xs text-white/40 mb-1">{l}</label>
                                    <input type="number" value={form[f] || 0} onChange={e => setForm(x => ({ ...x, [f]: Number(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></div>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-50">Сохранить</button>
                            <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm">Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {loading ? <div className="text-white/40 text-sm">Загрузка...</div> : plans.map(plan => (
                    <div key={plan.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="font-semibold">{plan.name}</p>
                                <p className="text-xs text-white/40 font-mono">{plan.code}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${plan.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{plan.is_active ? 'Активен' : 'Отключён'}</span>
                        </div>
                        <p className="text-2xl font-bold mb-1">{(plan.price_rub / 100).toLocaleString('ru-RU')} ₽</p>
                        <p className="text-sm text-white/50 mb-3">на {plan.duration_days} дней</p>
                        <p className="text-lg font-semibold mb-4">{plan.credits.toLocaleString('ru-RU')} кредитов</p>
                        <button onClick={() => { setEditing(plan.id); setForm({ ...plan }); }} className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors">Изменить</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
