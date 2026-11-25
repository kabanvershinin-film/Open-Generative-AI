'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function AdminOverviewPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data: sess } = await supabase.auth.getSession();
            const token = sess.session?.access_token;
            const r = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            setData(d);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const stats = [
        { label: 'Пользователей', value: data?.totalUsers ?? '—', href: '/admin/users', color: 'from-violet-600/20 to-fuchsia-600/20' },
        { label: 'Генераций', value: data?.totalGenerations ?? '—', href: '/admin/generations', color: 'from-blue-600/20 to-cyan-600/20' },
        { label: 'Активных подписок', value: data?.activeSubscriptions ?? '—', href: '/admin/subscriptions', color: 'from-green-600/20 to-emerald-600/20' },
        { label: 'Открытых тикетов', value: data?.openTickets ?? '—', href: '/admin/feedback', color: 'from-orange-600/20 to-amber-600/20' },
    ];

    return (
        <div className="p-6">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Администратор</p>
            <h1 className="text-2xl font-bold mb-6">Обзор платформы</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <Link key={s.href} href={s.href} className={`rounded-xl bg-gradient-to-br ${s.color} border border-white/[0.06] p-5 hover:border-white/15 transition-all`}>
                        <p className="text-xs text-white/40 mb-1">{s.label}</p>
                        <p className="text-3xl font-bold">{loading ? '...' : s.value.toLocaleString?.() ?? s.value}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <p className="text-sm font-medium">Последние генерации</p>
                        <Link href="/admin/generations" className="text-xs text-white/40 hover:text-white/60">Все →</Link>
                    </div>
                    {loading ? <div className="p-5 text-white/40 text-sm">Загрузка...</div> :
                        (data?.recentGenerations || []).map(g => (
                            <div key={g.id} className="px-5 py-3 border-b border-white/[0.04] last:border-0 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium truncate max-w-[200px]">{g.model_key}</p>
                                    <p className="text-xs text-white/40">{new Date(g.created_at).toLocaleString('ru-RU')}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded ${g.status === 'success' ? 'bg-green-500/20 text-green-400' : g.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}>{g.status}</span>
                            </div>
                        ))
                    }
                </div>

                <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <p className="text-sm font-medium">Новые пользователи</p>
                        <Link href="/admin/users" className="text-xs text-white/40 hover:text-white/60">Все →</Link>
                    </div>
                    {loading ? <div className="p-5 text-white/40 text-sm">Загрузка...</div> :
                        (data?.recentUsers || []).map(u => (
                            <div key={u.id} className="px-5 py-3 border-b border-white/[0.04] last:border-0 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">{u.full_name || u.email}</p>
                                    <p className="text-xs text-white/40">{u.email}</p>
                                </div>
                                <p className="text-xs text-white/40">{new Date(u.created_at).toLocaleDateString('ru-RU')}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
