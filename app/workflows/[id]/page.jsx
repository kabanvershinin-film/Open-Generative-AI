'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabaseClient';
import StudioSidebar from '@/components/studio/StudioSidebar';

const NODE_TYPES = { image: '🖼', video: '🎬', audio: '🎵', text: '📝' };
const NODE_COLORS = { image: 'from-violet-600/20 to-fuchsia-600/20', video: 'from-blue-600/20 to-cyan-600/20', audio: 'from-green-600/20 to-emerald-600/20', text: 'from-orange-600/20 to-amber-600/20' };

function NodeCard({ node, selected, onSelect, onGenerate, generating }) {
    return (
        <div
            className={`absolute rounded-xl border transition-all cursor-pointer select-none ${selected ? 'border-violet-400/60 shadow-lg shadow-violet-500/20' : 'border-white/10 hover:border-white/20'}`}
            style={{ left: node.pos_x, top: node.pos_y, width: 220 }}
            onClick={() => onSelect(node)}
        >
            <div className={`rounded-xl bg-gradient-to-br ${NODE_COLORS[node.type] || NODE_COLORS.image} p-3`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium truncate max-w-[140px]">{node.name}</span>
                    <span className="text-xs text-white/40">@{node.slug}</span>
                </div>
                {node.output_url && (
                    <div className="rounded-lg overflow-hidden mb-2 h-28 bg-black/40">
                        {node.type === 'video'
                            ? <video src={node.output_url} className="w-full h-full object-cover" />
                            : <img src={node.output_url} alt="" className="w-full h-full object-cover" />
                        }
                    </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-white/40">{NODE_TYPES[node.type]} {node.type}</span>
                    {node.model_key && <span className="text-[10px] text-white/30 truncate">{node.model_key.split('.').pop()}</span>}
                </div>
            </div>
        </div>
    );
}

export default function WorkflowEditorPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [workflow, setWorkflow] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [models, setModels] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [activeTab, setActiveTab] = useState('image');
    const canvasRef = useRef(null);

    const getToken = useCallback(async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const [wfRes, modRes, balRes] = await Promise.all([
                fetch(`/api/workflows/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/models', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const wfData = await wfRes.json();
            const modData = await modRes.json();
            const balData = await balRes.json();
            if (!wfRes.ok) { router.push('/projects'); return; }
            setWorkflow(wfData.workflow);
            setNodes(wfData.nodes || []);
            setModels(modData.models || []);
            setBalance(balData.balance ?? 0);
        } finally {
            setLoading(false);
        }
    }, [id, getToken, router]);

    useEffect(() => { load(); }, [load]);

    const addNode = useCallback(async (type) => {
        const token = await getToken();
        const r = await fetch(`/api/workflows/${id}/nodes`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`, type, pos_x: 100 + (nodes.length % 3) * 240, pos_y: 100 + Math.floor(nodes.length / 3) * 180 }),
        });
        const d = await r.json();
        if (d.node) { setNodes(prev => [...prev, d.node]); setSelectedNode(d.node); }
    }, [id, getToken, nodes.length]);

    const generate = useCallback(async () => {
        if (!selectedNode) return;
        setGenerating(true);
        try {
            const token = await getToken();
            const modelKey = selectedNode.model_key || (models.find(m => m.media_type === selectedNode.type)?.key) || `fake.${selectedNode.type}`;
            const r = await fetch('/api/generate', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelKey, prompt, nodeId: selectedNode.id, workflowId: id }),
            });
            const d = await r.json();
            if (d.result?.outputUrl) {
                setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, output_url: d.result.outputUrl } : n));
                setBalance(prev => prev - (d.generation?.credits_cost || 0));
            }
        } finally {
            setGenerating(false);
        }
    }, [selectedNode, prompt, models, id, getToken]);

    const nodesForTab = models.filter(m => m.media_type === activeTab);
    const selectedModel = selectedNode ? models.find(m => m.key === selectedNode.model_key) : null;

    if (loading) return <div className="min-h-screen bg-[#0d0d14] text-white flex items-center justify-center"><p className="text-white/40">Загрузка...</p></div>;

    return (
        <div className="min-h-screen bg-[#09090f] text-white flex">
            <StudioSidebar />

            {/* Left node panel */}
            <div className="fixed left-14 top-0 h-full w-16 bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col items-center py-4 gap-1 z-40">
                <button title="Полотно" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white mb-2">◫</button>
                {['image', 'video', 'audio', 'text'].map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        title={t}
                        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[9px] transition-all
                            ${activeTab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                    >
                        <span className="text-lg leading-none">{NODE_TYPES[t]}</span>
                        <span>{t === 'image' ? 'Изображ.' : t === 'video' ? 'Видео' : t === 'audio' ? 'Аудио' : 'Текст'}</span>
                    </button>
                ))}

                <div className="flex-1" />
                <button
                    onClick={() => router.push('/library')}
                    title="Медиатека"
                    className="w-10 h-10 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/5 flex flex-col items-center justify-center gap-0.5 text-[9px]"
                >
                    <span className="text-lg">◈</span>
                    <span>Медиа</span>
                </button>
            </div>

            {/* Top bar */}
            <div className="fixed top-0 left-30 right-0 h-10 bg-[#0a0a0f] border-b border-white/[0.06] flex items-center px-4 gap-3 z-30" style={{ left: 128 }}>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{workflow?.name}</span>
                </div>
                <div className="flex-1" />
                <span className="text-xs text-white/40">● {balance.toFixed(2)} кредитов</span>
                <button
                    onClick={generate}
                    disabled={!selectedNode || generating}
                    className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-medium disabled:opacity-40 transition-colors"
                >
                    {generating ? '...' : '▶ Запустить'}
                </button>
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="fixed bg-[#09090f]"
                style={{ left: 128, top: 40, right: selectedNode ? 320 : 0, bottom: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                onClick={(e) => { if (e.target === canvasRef.current) setSelectedNode(null); }}
            >
                <div className="absolute inset-0" style={{ position: 'relative' }}>
                    {nodes.map(node => (
                        <NodeCard key={node.id} node={node} selected={selectedNode?.id === node.id} onSelect={setSelectedNode} />
                    ))}
                </div>

                {/* Add node button */}
                <button
                    onClick={() => addNode(activeTab)}
                    className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-xl transition-colors shadow-lg"
                    title="Добавить узел"
                >+</button>
            </div>

            {/* Right panel: node properties */}
            {selectedNode && (
                <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#0d0d14] border-l border-white/[0.06] flex flex-col z-40 overflow-y-auto">
                    <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                        <div>
                            <p className="font-medium text-sm">{selectedNode.name}</p>
                            <p className="text-xs text-white/40">@{selectedNode.slug}</p>
                        </div>
                        <button onClick={() => setSelectedNode(null)} className="text-white/40 hover:text-white text-lg">×</button>
                    </div>

                    {selectedNode.output_url && (
                        <div className="p-4 border-b border-white/[0.06]">
                            {selectedNode.type === 'video'
                                ? <video src={selectedNode.output_url} controls className="w-full rounded-lg" />
                                : <img src={selectedNode.output_url} alt="" className="w-full rounded-lg" />
                            }
                        </div>
                    )}

                    <div className="p-4 flex flex-col gap-4 flex-1">
                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Модель</label>
                            <select
                                value={selectedNode.model_key || ''}
                                onChange={async (e) => {
                                    const token = await getToken();
                                    await fetch(`/api/workflows/${id}/nodes`, {
                                        method: 'PATCH',
                                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ nodeId: selectedNode.id, model_key: e.target.value }),
                                    });
                                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, model_key: e.target.value } : n));
                                    setSelectedNode(prev => ({ ...prev, model_key: e.target.value }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/50"
                            >
                                <option value="">Выберите модель...</option>
                                {models.filter(m => m.media_type === selectedNode.type).map(m => (
                                    <option key={m.key} value={m.key}>{m.name} — {m.credits_per_unit} кред.</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Промпт</label>
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                rows={4}
                                placeholder="Опишите что нужно создать..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-400/50 resize-none"
                            />
                        </div>

                        {selectedModel && (
                            <div className="text-xs text-white/40 flex items-center justify-between">
                                <span>Стоимость:</span>
                                <span className="text-white/70 font-medium">{selectedModel.credits_per_unit} кредитов</span>
                            </div>
                        )}

                        <button
                            onClick={generate}
                            disabled={generating || !selectedNode.model_key}
                            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-40 transition-colors mt-auto"
                        >
                            {generating ? 'Генерация...' : `Создать${selectedModel ? ` за ${selectedModel.credits_per_unit} кред.` : ''}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
