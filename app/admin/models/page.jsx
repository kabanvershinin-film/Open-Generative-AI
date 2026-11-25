'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const MEDIA_TYPES = ['image', 'video', 'audio', 'text'];
const OPS = ['image_generate', 'image_edit', 'video_generate', 'video_edit', 'speech_synthesize', 'speech_transcribe', 'chat', 'music_generate', 'lip_sync'];
const EXEC_MODES = ['sync_result', 'async_task', 'streaming_text'];

const EMPTY = { key: '', name: '', provider_key: 'fake', media_type: 'image', operation: 'image_generate', execution_mode: 'sync_result', credits_per_unit: 1, is_active: true, sort_order: 0, description: '', config: '{}' };

export default function AdminModelsPage() {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        const token = await getToken();
        const r = await fetch('/api/admin/models', { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        setModels(d.models || []);
        setLoading(false);
    }, [getToken]);

    useEffect(() => { load(); }, [load]);

    function startEdit(model) {
        setEditing(model?.id || 'new');
        setForm(model ? { ...model, config: typeof model.config === 'object' ? JSON.stringify(model.config, null, 2) : model.config } : EMPTY);
    }

    async function save() {
        setSaving(true);
        try {
            const token = await getToken();
            const payload = { ...form, config: form.config };
            const method = editing === 'new' ? 'POST' : 'PATCH';
            const body = editing === 'new' ? payload : { id: editing, ...payload };
            await fetch('/api/admin/models', { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            setEditing(null);
            load();
        } finally { setSaving(false); }
    }

    async function toggleActive(model) {
        const token = await getToken();
        await fetch('/api/admin/models', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: model.id, is_active: !model.is_active }) });
        load();
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Модели</p>
                    <h1 className="text-xl font-bold">AI Модели</h1>
                </div>
                <button onClick={() => startEdit(null)} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors">+ Добавить модель</button>
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 px-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl bg-[#141420] border border-white/[0.08] p-6 mb-12">
                        <h2 className="font-bold text-lg mb-5">{editing === 'new' ? 'Новая модель' : 'Редактирование модели'}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[['Ключ (key)', 'key'], ['Название', 'name'], ['Провайдер', 'provider_key'], ['Описание', 'description']].map(([label, field]) => (
                                <div key={field}>
                                    <label className="block text-xs text-white/40 mb-1">{label}</label>
                                    <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs text-white/40 mb-1">Тип медиа</label>
                                <select value={form.media_type} onChange={e => setForm(f => ({ ...f, media_type: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                    {MEDIA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-1">Операция</label>
                                <select value={form.operation} onChange={e => setForm(f => ({ ...f, operation: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                    {OPS.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-1">Режим выполнения</label>
                                <select value={form.execution_mode} onChange={e => setForm(f => ({ ...f, execution_mode: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                                    {EXEC_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-1">Кредитов за единицу</label>
                                <input type="number" step="0.01" value={form.credits_per_unit} onChange={e => setForm(f => ({ ...f, credits_per_unit: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs text-white/40 mb-1">Сортировка</label>
                                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-white/40 mb-1">Config (JSON)</label>
                                <textarea value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none font-mono text-xs" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                <label htmlFor="is_active" className="text-sm text-white/70">Активна</label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-50 transition-colors">Сохранить</button>
                            <button onClick={() => setEditing(null)} className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition-colors">Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.06] text-xs text-white/40 uppercase">
                        <th className="text-left px-4 py-3">Ключ</th>
                        <th className="text-left px-4 py-3">Название</th>
                        <th className="text-left px-4 py-3">Тип</th>
                        <th className="text-right px-4 py-3">Кредитов</th>
                        <th className="text-left px-4 py-3">Статус</th>
                        <th className="px-4 py-3"></th>
                    </tr></thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">Загрузка...</td></tr> :
                            models.map(m => (
                                <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                                    <td className="px-4 py-3 font-mono text-xs text-white/70">{m.key}</td>
                                    <td className="px-4 py-3 font-medium">{m.name}</td>
                                    <td className="px-4 py-3 text-white/50">{m.media_type} / {m.operation}</td>
                                    <td className="px-4 py-3 text-right">{m.credits_per_unit}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleActive(m)} className={`px-2 py-0.5 rounded text-xs ${m.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{m.is_active ? 'Активна' : 'Отключена'}</button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => startEdit(m)} className="text-xs text-white/40 hover:text-white/70 transition-colors">Изменить</button>
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
