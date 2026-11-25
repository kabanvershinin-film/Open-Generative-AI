'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import StudioLayout from '@/components/studio/StudioLayout';

const STATUS_MAP = { open: { label: 'Открыт', cls: 'bg-green-500/20 text-green-400' }, pending: { label: 'Ожидание', cls: 'bg-yellow-500/20 text-yellow-400' }, closed: { label: 'Закрыт', cls: 'bg-white/10 text-white/40' } };

export default function FeedbackPage() {
    const [tickets, setTickets] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            const r = await fetch(`/api/tickets?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            setTickets(d.tickets || []);
            setTotal(d.total || 0);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, getToken]);

    useEffect(() => { load(); }, [load]);

    async function createTicket(e) {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        try {
            const token = await getToken();
            const r = await fetch('/api/tickets', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body }),
            });
            if (r.ok) { setTitle(''); setBody(''); setShowNew(false); load(); }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <StudioLayout>
            <div className="p-6 max-w-3xl">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Обратная связь</p>
                <h1 className="text-2xl font-bold mb-1">Обратная связь</h1>
                <p className="text-sm text-white/40 mb-6">Задайте вопрос поддержке и следите за ответами в переписке.</p>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold">Мои обращения</h2>
                    <button onClick={() => setShowNew(true)} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors">Создать тикет</button>
                </div>

                {showNew && (
                    <form onSubmit={createTicket} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 mb-6">
                        <div className="mb-3">
                            <label className="block text-xs text-white/40 mb-1.5">Тема</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20" placeholder="Опишите проблему..." />
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs text-white/40 mb-1.5">Сообщение</label>
                            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 resize-none" placeholder="Подробности..." />
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-50 transition-colors">Отправить</button>
                            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 rounded-lg text-white/40 hover:text-white/60 text-sm transition-colors">Отмена</button>
                        </div>
                    </form>
                )}

                <div className="flex items-center gap-3 mb-4">
                    <input placeholder="Поиск по обратной связи" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none">
                        <option value="">Все статусы</option>
                        <option value="open">Открытые</option>
                        <option value="pending">В ожидании</option>
                        <option value="closed">Закрытые</option>
                    </select>
                    <button onClick={load} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors">Применить</button>
                </div>

                <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-white/40 text-sm">Загрузка...</div>
                    ) : tickets.length === 0 ? (
                        <div className="p-8 text-center text-white/40 text-sm">Совпадающих страниц пока нет</div>
                    ) : tickets.map(t => {
                        const st = STATUS_MAP[t.status] || STATUS_MAP.open;
                        return (
                            <div key={t.id} className="border-b border-white/[0.04] p-4 hover:bg-white/[0.02] transition-colors last:border-0">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">{t.title}</p>
                                    <span className={`px-2 py-0.5 rounded text-xs ${st.cls}`}>{st.label}</span>
                                </div>
                                {t.body && <p className="text-xs text-white/40 mt-1 truncate">{t.body}</p>}
                                <p className="text-xs text-white/30 mt-1">{new Date(t.created_at).toLocaleString('ru-RU')}</p>
                            </div>
                        );
                    })}
                </div>

                <p className="text-xs text-white/30 mt-4 text-center">Всего: {total}</p>

                <div className="mt-12 pt-8 border-t border-white/[0.06] text-xs text-white/30">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-white/40 font-medium mb-2">Контакты</p>
                            <p>📧 Обратная связь</p>
                            <p>✈ @telegram-canal</p>
                            <p>✉ inbox@neurover.io</p>
                        </div>
                        <div>
                            <p className="text-white/40 font-medium mb-2">Правовая информация</p>
                            <p>Политика контента</p>
                            <p>Пользовательское соглашение</p>
                            <p>Политика конфиденциальности</p>
                        </div>
                    </div>
                </div>
            </div>
        </StudioLayout>
    );
}
