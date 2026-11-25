'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import StudioLayout from '@/components/studio/StudioLayout';

export default function ProjectsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [balance, setBalance] = useState(0);

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const r = await fetch('/api/workflows', { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            setWorkflows(d.workflows || []);
            const br = await fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } });
            const bd = await br.json();
            setBalance(bd.balance ?? 0);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { load(); }, [load]);

    async function createWorkflow() {
        setCreating(true);
        try {
            const token = await getToken();
            const r = await fetch('/api/workflows', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Новый проект' }),
            });
            const d = await r.json();
            if (d.workflow?.id) router.push(`/workflows/${d.workflow.id}`);
        } finally {
            setCreating(false);
        }
    }

    return (
        <StudioLayout>
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Рабочее пространство</p>
                        <h1 className="text-2xl font-bold">Проекты</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-white/50">
                            ● <span className="text-white font-medium">{balance.toFixed(2)}</span> кредитов
                        </span>
                        <button
                            onClick={createWorkflow}
                            disabled={creating}
                            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {creating ? '...' : '+ Создать проект'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-white/40 text-sm">Загрузка...</div>
                ) : workflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-4">◻</div>
                        <p className="text-lg font-medium mb-2">Нет проектов</p>
                        <p className="text-white/40 text-sm mb-6">Создайте первый проект, чтобы начать генерацию</p>
                        <button
                            onClick={createWorkflow}
                            className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
                        >
                            Создать проект
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {workflows.map(wf => (
                            <button
                                key={wf.id}
                                onClick={() => router.push(`/workflows/${wf.id}`)}
                                className="text-left p-5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center text-2xl mb-3">◻</div>
                                <p className="font-medium text-sm mb-1 truncate group-hover:text-white/90">{wf.name}</p>
                                <p className="text-xs text-white/30">{new Date(wf.updated_at).toLocaleDateString('ru-RU')}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </StudioLayout>
    );
}
