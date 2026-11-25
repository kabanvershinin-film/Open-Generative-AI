'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StudioLayout from '@/components/studio/StudioLayout';

const STATUS_LABEL = { success: { label: 'Успешно', cls: 'bg-green-500/20 text-green-400' }, failed: { label: 'Неудача', cls: 'bg-red-500/20 text-red-400' }, running: { label: 'Выполняется', cls: 'bg-blue-500/20 text-blue-400' }, pending: { label: 'В очереди', cls: 'bg-white/10 text-white/50' } };

export default function StatisticsPage() {
    const [generations, setGenerations] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const params = new URLSearchParams({ page, limit: 20 });
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            const r = await fetch(`/api/generations?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            setGenerations(d.generations || []);
            setTotal(d.total || 0);
        } finally {
            setLoading(false);
        }
    }, [page, dateFrom, dateTo, getToken]);

    useEffect(() => { load(); }, [load]);

    return (
        <StudioLayout>
            <div className="p-6">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Статистика</p>
                <h1 className="text-2xl font-bold mb-1">История генераций</h1>
                <p className="text-sm text-white/40 mb-6">Модели, итоговые списания в кредитах и статус ваших генераций.</p>

                <div className="flex items-center gap-3 mb-6">
                    <div>
                        <label className="block text-xs text-white/40 mb-1">Начало</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-white/40 mb-1">Конец</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                    </div>
                    <div className="flex items-end gap-2">
                        <button onClick={() => { setPage(1); load(); }} className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors">Применить</button>
                        <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }} className="px-4 py-1.5 rounded-lg text-white/40 hover:text-white/60 text-sm transition-colors">Сбросить</button>
                    </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06] text-xs text-white/40 uppercase tracking-wider">
                                <th className="text-left px-4 py-3">Дата</th>
                                <th className="text-left px-4 py-3">Модель</th>
                                <th className="text-left px-4 py-3">Промпт</th>
                                <th className="text-right px-4 py-3">Списано</th>
                                <th className="text-left px-4 py-3">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-white/40">Загрузка...</td></tr>
                            ) : generations.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-white/40">Нет данных за выбранный период</td></tr>
                            ) : generations.map(g => {
                                const st = STATUS_LABEL[g.status] || STATUS_LABEL.pending;
                                return (
                                    <tr key={g.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 text-white/60 whitespace-nowrap">{new Date(g.created_at).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="px-4 py-3 font-medium max-w-[200px] truncate">{g.model_key}</td>
                                        <td className="px-4 py-3 text-white/50 max-w-[200px] truncate">{g.prompt || '—'}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">{g.credits_cost > 0 ? `${g.credits_cost} кредитов` : '0 кредитов'}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${st.cls}`}>{st.label}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {total > 20 && (
                    <div className="flex items-center justify-between mt-4 text-sm">
                        <span className="text-white/40">Всего: {total} · Страница {page}/{Math.ceil(total / 20)}</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors">←</button>
                            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 transition-colors">→</button>
                        </div>
                    </div>
                )}
            </div>
        </StudioLayout>
    );
}
