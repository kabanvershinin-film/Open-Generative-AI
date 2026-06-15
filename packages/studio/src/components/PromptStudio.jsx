'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { uploadFile, persistImageToTOS } from '../muapi.js';

const CATEGORIES = [
  'Все',
  'Google Omni',
  'Seedance 2.0'
];

export default function PromptStudio({ apiKey }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Все');
  const [user, setUser] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  
  // Form state
  const [newPrompt, setNewPrompt] = useState({
    prompt: '',
    model: 'Google Omni',
    videoUrl: ''
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserInfo();
    fetchPrompts();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/user/info');
      const data = await res.json();
      setUser(data);
    } catch (e) {
      console.error('Failed to fetch user info', e);
    }
  };

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prompts/admin?t=' + Date.now());
      const data = await res.json();
      console.log('Fetched prompts data:', data);
      if (data.prompts) {
        setPrompts(data.prompts);
      }
      if (data.debug) {
        console.log('Debug info:', data.debug);
      }
    } catch (e) {
      console.error('Failed to fetch prompts', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Подготовка к загрузке...');
    setUploading(true);
    setUploadProgress(0);
    try {
      // 1. Get presigned URL from our API
      const res = await fetch(`/api/upload-file?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`);
      if (!res.ok) throw new Error('Не удалось получить URL для загрузки');
      const { putUrl, publicUrl } = await res.json();

      // 2. Upload with progress using XMLHttpRequest
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', putUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
            toast.loading(`Загрузка: ${percent}%`, { id: toastId });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Загрузка не удалась: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Ошибка сети при загрузке'));
        xhr.send(file);
      });

      setNewPrompt(prev => ({ ...prev, videoUrl: publicUrl }));
      toast.success('Видео успешно загружено!', { id: toastId });
    } catch (e) {
      console.error('Upload error:', e);
      toast.error('Ошибка при загрузке: ' + e.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlBlur = async () => {
    if (newPrompt.videoUrl && newPrompt.videoUrl.startsWith('http') && !newPrompt.videoUrl.includes('tos-s3')) {
      setUploading(true);
      const toastId = toast.loading('Обработка ссылки...');
      try {
        const res = await fetch('/api/upload-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newPrompt.videoUrl })
        });
        const data = await res.json();
        if (data.url) {
          setNewPrompt(prev => ({ ...prev, videoUrl: data.url }));
          toast.success('Видео успешно перенесено в базу!', { id: toastId });
        }
      } catch (e) {
        toast.error('Ошибка при обработке ссылки: ' + e.message, { id: toastId });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSavePrompt = async () => {
    if (!newPrompt.prompt || !newPrompt.videoUrl || !newPrompt.model) {
      toast.error('Пожалуйста, заполните все поля');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Сохранение промта...');
    try {
      const res = await fetch('/api/prompts/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt)
      });
      const data = await res.json();
      if (data.success) {
        setShowUploadModal(false);
        setNewPrompt({ prompt: '', model: 'Google Omni', videoUrl: '' });
        fetchPrompts();
        toast.success('Промт успешно добавлен!', { id: toastId });
      } else {
        toast.error('Ошибка: ' + (data.error || 'Неизвестная ошибка'), { id: toastId });
      }
    } catch (e) {
      toast.error('Ошибка при сохранении: ' + e.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = p.prompt.toLowerCase().includes(search.toLowerCase()) || 
                          p.model.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Все' || p.model === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const displayPrompts = filteredPrompts.length > 0 ? filteredPrompts : [
    { model: 'Google Omni', prompt: 'Cinematic portrait of a futuristic cyberpunk warrior in a rain-soaked Neo-Tokyo street, neon lights reflecting in armor, 8k resolution, highly detailed' },
    { model: 'Seedance 2.0', prompt: 'A magical forest with glowing plants and floating islands, ethereal atmosphere, cinematic lighting, hyper-realistic' },
    { model: 'Google Omni', prompt: 'Close up of a human eye with a galaxy inside, cosmic reflection, surrealism, macro photography' },
    { model: 'Seedance 2.0', prompt: 'Cute 3D character design of a small robot explorer, Pixar style, soft shadows, vibrant colors' },
    { model: 'Google Omni', prompt: 'Architectural visualization of a modern minimalist villa by the ocean, sunset lighting, glass reflections, high-end design' },
    { model: 'Seedance 2.0', prompt: 'Epic landscape of a dragon flying over snow-capped mountains, dramatic clouds, fantasy art style' },
    { model: 'Google Omni', prompt: 'A cozy coffee shop interior with plants and vintage furniture, warm sunlight streaming through windows, isometric view' },
    { model: 'Seedance 2.0', prompt: 'A futuristic electric car driving through a desert at night, long exposure light trails, sci-fi aesthetic' },
  ].filter(p => activeCategory === 'Все' || p.model === activeCategory);

  return (
    <div className="h-full w-full bg-[#0a0714] overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              База Промтов — Сапог AI
            </h1>
            <p className="text-white/40 text-lg max-w-2xl">
              Исследуйте лучшие промты для генерации изображений и видео. Копируйте, адаптируйте и создавайте свои шедевры.
            </p>
          </div>
          
          {user?.isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Добавить промт
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Поиск по моделям и промтам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 bg-white/5 border border-purple-500/10 rounded-xl px-12 text-sm text-white focus:outline-none focus:border-purple-500/30 transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full md:w-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 border border-purple-500/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayPrompts.map((item, i) => (
              <div key={item.id || i} className="group bg-white/5 border border-purple-500/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
                <div className="aspect-[4/3] bg-purple-500/5 flex items-center justify-center relative overflow-hidden">
                  {item.url ? (
                    <video 
                      src={item.url} 
                      className="absolute inset-0 w-full h-full object-cover"
                      muted loop onMouseEnter={e => e.target.play()} onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0714] to-transparent opacity-60" />
                  )}
                  {!item.url && <span className="text-white/10 font-bold text-4xl relative z-10">Prompt {i + 1}</span>}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase rounded border border-purple-500/20">
                      {item.model}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 line-clamp-3 mb-4 italic">
                    "{item.prompt}"
                  </p>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.prompt);
                        toast.success('Промт скопирован!');
                      }}
                      className="text-xs font-bold text-[#d946ef] hover:underline flex items-center gap-1"
                    >
                      Копировать
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1 text-white/20">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78v0z" />
                      </svg>
                      <span className="text-[10px]">1.2k</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#16112a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Добавить новый промт</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-white/40 hover:text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Mode Toggle */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      uploadMode === 'file' ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    Загрузить файл
                  </button>
                  <button
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      uploadMode === 'url' ? 'bg-purple-500 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    Вставить ссылку
                  </button>
                </div>

                {/* Video Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Видео-пример</label>
                  
                  {uploadMode === 'file' ? (
                    <div 
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`aspect-video rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
                        newPrompt.videoUrl ? 'border-purple-500/50' : 'border-white/10 hover:border-purple-500/30 bg-white/5'
                      }`}
                    >
                      {newPrompt.videoUrl ? (
                        <video src={newPrompt.videoUrl} className="w-full h-full object-cover" autoPlay muted loop />
                      ) : (
                        <div className="text-center p-6">
                          {uploading ? (
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
                              <div className="text-2xl font-bold text-white mb-1">{uploadProgress}%</div>
                              <div className="text-xs text-white/40 uppercase tracking-widest">Загрузка видео...</div>
                            </div>
                          ) : (
                            <>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-white/20">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                              </svg>
                              <p className="text-sm text-white/40">Нажмите для загрузки видео</p>
                            </>
                          )}
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="video/*" 
                        className="hidden" 
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="https://example.com/video.mp4"
                        value={newPrompt.videoUrl}
                        onChange={e => setNewPrompt(prev => ({ ...prev, videoUrl: e.target.value }))}
                        onBlur={handleUrlBlur}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-purple-500/30 transition-all"
                      />
                      <p className="text-[10px] text-white/30 px-1">
                        * Вставьте прямую ссылку на MP4. Видео будет автоматически перенесено в наше облако.
                      </p>
                      {newPrompt.videoUrl && newPrompt.videoUrl.includes('http') && (
                        <div className="aspect-video rounded-xl overflow-hidden border border-purple-500/20">
                          <video src={newPrompt.videoUrl} className="w-full h-full object-cover" autoPlay muted loop key={newPrompt.videoUrl} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Модель</label>
                  <select 
                    value={newPrompt.model}
                    onChange={e => setNewPrompt(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-purple-500/30 transition-all appearance-none"
                  >
                    {CATEGORIES.filter(c => c !== 'Все').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Prompt Text */}
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Текст промта</label>
                  <textarea 
                    value={newPrompt.prompt}
                    onChange={e => setNewPrompt(prev => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Введите текст промта..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/30 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-white/5 flex gap-3">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleSavePrompt}
                  disabled={uploading}
                  className="flex-1 h-12 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Загрузка...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

