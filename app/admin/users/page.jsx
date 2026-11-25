'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [credDialog, setCredDialog] = useState(null);
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const r = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            setUsers(d.profiles || []);
        } finally { setLoading(false); }
    }, [getToken]);

    useEffect(() => { load(); }, [load]);

    async function addCredits(e) {
        e.preventDefault();
        if (!credDialog) return;
        setSubmitting(true);
        try {
            const token = await getToken();
            await fetch('/api/admin/credit-balance', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: credDialog.id, amount: Number(amount) }),
            });
            setCredDialog(null);
            setAmount('');
        } finally { setSubmitting(false); }
    }

    const filtered = users.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Пользователи</p>
            <h1 className="text-xl font-bold mb-6">Управление пользователями</h1>

            {credDialog && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                    <form onSubmit={addCredits} className="w-full max-w-sm rounded-2xl bg-[#141420] border border-white/[0.08] p-6">
                        <h2 className="font-bold mb-4">Начислить кредиты</h2>
                        <p className="text-sm text-white/50 mb-4">{credDialog.email}</p>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Количество кредитов" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none" />
                        <div className="flex gap-3">
                            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-50">Начислить</button>
                            <button type="button" onClick={() => setCredDialog(null)} className="px-5 py-2 rounded-lg bg-white/10 text-sm">Отмена</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mb-4">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по email или имени" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none w-72" />
            </div>

            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.06] text-xs text-white/40 uppercase">
                        <th className="text-left px-4 py-3">Пользователь</th>
                        <th className="text-left px-4 py-3">Роль</th>
                        <th className="text-right px-4 py-3">Баланс</th>
                        <th className="text-left px-4 py-3">Дата регистрации</th>
                        <th className="px-4 py-3"></th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-white/40">Загрузка...</td></tr> :
                            filtered.map(u => (
                                <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{u.full_name || '—'}</p>
                                        <p className="text-xs text-white/40">{u.email}</p>
                                    </td>
                                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">{u.role || 'client'}</span></td>
                                    <td className="px-4 py-3 text-right font-mono">{(u.balance || 0).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-xs text-white/40">{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setCredDialog(u)} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">+ Кредиты</button>
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
