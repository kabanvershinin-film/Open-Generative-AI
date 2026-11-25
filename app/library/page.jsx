'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import StudioLayout from '@/components/studio/StudioLayout';

const TABS = [
    { key: 'image', label: 'Фото' },
    { key: 'video', label: 'Видео' },
    { key: 'audio', label: 'Аудио' },
];

export default function LibraryPage() {
    const [activeType, setActiveType] = useState('image');
    const [files, setFiles] = useState([]);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const r = await fetch(`/api/media?type=${activeType}&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
            const d = await r.json();
            setFiles(d.files || []);
        } finally {
            setLoading(false);
        }
    }, [activeType, getToken]);

    useEffect(() => { load(); }, [load]);

    async function deleteFiles() {
        const token = await getToken();
        await Promise.all([...selected].map(id => fetch(`/api/media?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })));
        setSelected(new Set());
        load();
    }

    const filtered = files.filter(f => !search || f.filename.toLowerCase().includes(search.toLowerCase()));

    return (
        <StudioLayout>
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Медиатека</p>
                        <div className="flex items-center gap-4">
                            {TABS.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveType(t.key)}
                                    className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${activeType === t.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
                                >
                                    {t.label} {files.filter(f => f.type === t.key).length > 0 && activeType === t.key ? `${filtered.length}` : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {selected.size > 0 && (
                            <button onClick={deleteFiles} className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-sm transition-colors">
                                Удалить ({selected.size})
                            </button>
                        )}
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Поиск по имени файла или ноды"
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 w-64"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-white/40 text-sm">Загрузка...</div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl mb-3">◈</div>
                        <p className="text-white/40 text-sm">Нет файлов</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {filtered.map(file => (
                            <div key={file.id} className="relative group rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/15 transition-all aspect-square bg-white/[0.03]">
                                <input
                                    type="checkbox"
                                    checked={selected.has(file.id)}
                                    onChange={e => {
                                        const next = new Set(selected);
                                        e.target.checked ? next.add(file.id) : next.delete(file.id);
                                        setSelected(next);
                                    }}
                                    className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4"
                                />
                                {file.type === 'video' ? (
                                    <video src={file.url} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[9px] text-white/70 truncate">{file.filename}</p>
                                    <p className="text-[9px] text-white/40">{new Date(file.created_at).toLocaleDateString('ru-RU')}</p>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={file.url} download className="w-6 h-6 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center text-xs">↓</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </StudioLayout>
    );
}
