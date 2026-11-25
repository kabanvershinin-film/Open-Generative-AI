'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminGenerationsPage() {
    const [generations, setGenerations] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        const token = await getToken();
        const r = await fetch(`/api/admin/generations?page=${page}&limit=50`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setGenerations(d.generations || []);
        setTotal(d.total || 0);
        setLoading(false);
    }, [page, getToken]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="p-6">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Генерации</p>
            <h1 className="text-xl font-bold mb-6">Все генерации</h1>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.06] text-xs text-white/40 uppercase">
                        <th className="text-left px-4 py-3">Дата</th>
                        <th className="text-left px-4 py-3">Пользователь</th>
                        <th className="text-left px-4 py-3">Модель</th>
                        <th className="text-left px-4 py-3">Промпт</th>
                        <th className="text-right px-4 py-3">Кредитов</th>
                        <th className="text-left px-4 py-3">Статус</th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">Загрузка...</td></tr> :
                            generations.map(g => (
                                <tr key={g.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                    <td className="px-4 py-3 text-white/50 whitespace-nowrap text-xs">{new Date(g.created_at).toLocaleString('ru-RU')}</td>
                                    <td className="px-4 py-3 text-xs">{g.user?.email || g.user_id.slice(0, 8)}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-white/70">{g.model_key}</td>
                                    <td className="px-4 py-3 max-w-[160px] truncate text-white/50 text-xs">{g.prompt || '—'}</td>
                                    <td className="px-4 py-3 text-right text-xs">{g.credits_cost}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs ${g.status === 'success' ? 'bg-green-500/20 text-green-400' : g.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}>{g.status}</span></td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
            {total > 50 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-white/40">Всего: {total}</span>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-30">←</button>
                        <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg bg-white/5 disabled:opacity-30">→</button>
                    </div>
                </div>
            )}
        </div>
    );
}
