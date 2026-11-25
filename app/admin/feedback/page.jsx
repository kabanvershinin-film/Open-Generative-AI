'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminFeedbackPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        const token = await getToken();
        const r = await fetch('/api/admin/tickets', { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setTickets(d.tickets || []);
        setLoading(false);
    }, [getToken]);

    useEffect(() => { load(); }, [load]);

    async function setStatus(id, status) {
        const token = await getToken();
        await fetch('/api/admin/tickets', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
        load();
    }

    return (
        <div className="p-6">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Поддержка</p>
            <h1 className="text-xl font-bold mb-6">Обратная связь</h1>
            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.06] text-xs text-white/40 uppercase">
                        <th className="text-left px-4 py-3">Пользователь</th>
                        <th className="text-left px-4 py-3">Тема</th>
                        <th className="text-left px-4 py-3">Дата</th>
                        <th className="text-left px-4 py-3">Статус</th>
                        <th className="px-4 py-3"></th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-white/40">Загрузка...</td></tr> :
                            tickets.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-white/40">Нет обращений</td></tr> :
                            tickets.map(t => (
                                <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                    <td className="px-4 py-3 text-xs text-white/60">{t.user?.email}</td>
                                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{t.title}</td>
                                    <td className="px-4 py-3 text-xs text-white/40">{new Date(t.created_at).toLocaleString('ru-RU')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'open' ? 'bg-green-500/20 text-green-400' : t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/40'}`}>{t.status}</span>
                                    </td>
                                    <td className="px-4 py-3 flex gap-2 justify-end">
                                        {t.status !== 'closed' && <button onClick={() => setStatus(t.id, 'closed')} className="text-xs text-white/40 hover:text-white/70">Закрыть</button>}
                                        {t.status === 'open' && <button onClick={() => setStatus(t.id, 'pending')} className="text-xs text-yellow-400/70 hover:text-yellow-400">В ожидание</button>}
                                        {t.status !== 'open' && <button onClick={() => setStatus(t.id, 'open')} className="text-xs text-green-400/70 hover:text-green-400">Открыть</button>}
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}
