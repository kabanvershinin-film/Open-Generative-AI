'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getUserBalance } from '../packages/studio/src/muapi/user.js';

const ImageStudio = dynamic(() => import('../packages/studio/src/components/ImageStudio.jsx'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-app-bg flex items-center justify-center text-slate-500 dark:text-white/20">Загрузка студии фото...</div>
});

const VideoStudio = dynamic(() => import('../packages/studio/src/components/VideoStudio.jsx'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-app-bg flex items-center justify-center text-slate-500 dark:text-white/20">Загрузка студии видео...</div>
});

const WorkflowStudio = dynamic(() => import('../packages/studio/src/components/WorkflowStudio.jsx'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-app-bg flex items-center justify-center text-slate-500 dark:text-white/20">Загрузка процессов...</div>
});

const GalleryStudio = dynamic(() => import('../packages/studio/src/components/GalleryStudio.jsx'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-app-bg flex items-center justify-center text-slate-500 dark:text-white/20">Загрузка галереи...</div>
});

const PromptStudioTab = dynamic(() => import('../packages/studio/src/components/PromptStudio.jsx'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-app-bg flex items-center justify-center text-slate-500 dark:text-white/20">Загрузка базы промтов...</div>
});

import axios from 'axios';
import ApiKeyModal from './ApiKeyModal';

const TABS = [
  { id: 'image',   label: 'Студия фото' },
  { id: 'video',   label: 'Студия видео' },
  { id: 'workflows', label: 'Процессы' },
  { id: 'gallery', label: 'Галерея' },
  { id: 'prompts', label: 'База промтов' },
];

const STORAGE_KEY = 'muapi_key';

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = useMemo(
    () => (Array.isArray(params?.slug) ? params.slug : []),
    [params?.slug]
  );
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  // Helper to extract workflow details precisely from either route structure
  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) {
        return { id: idFromParams, tab: tabFromParams || null };
    }
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId } = getWorkflowInfo();

  // Initialize activeTab from URL slug/params or default to 'image'
  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('design-agent')) return 'design-agent';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && TABS.find(t => t.id === firstSegment)) return firstSegment;
    return 'image';
  };
  
  const [apiKey, setApiKey] = useState(null);
  const [activeTab, setActiveTab] = useState(getInitialTab());

  const [balance, setBalance] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  // Generation State — driven purely by ImageStudio (which stays mounted across tabs).
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync tab from the *actual* URL (window.location) when Next.js navigation occurs.
  // Reading pathname instead of slug avoids stale-params bugs from replaceState.
  useEffect(() => {
    const path = window.location.pathname;
    const after = path.startsWith('/studio') ? path.slice('/studio'.length) : path;
    const segments = after.split('/').filter(Boolean);
    const first = segments[0];

    if (!first) { setActiveTab('image'); return; }
    if (first === 'workflows' || first === 'workflow') { setActiveTab('workflows'); return; }
    if (first === 'agents')       { setActiveTab('agents');       return; }
    if (first === 'design-agent') { setActiveTab('design-agent'); return; }
    if (first === 'apps')         { setActiveTab('apps');         return; }
    if (TABS.find(t => t.id === first)) { setActiveTab(first); return; }
    setActiveTab('image');
  }, [slug]);

  const handleTabChange = (tabId) => {
    // If we're leaving a workflow builder or design agent, do a single hard
    // navigation to the target tab. The builder mutates global CSS, so a full
    // load is needed to clear it — and it also gets us out of the builder route.
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    const fromDesignAgent = sessionStorage.getItem("fromDesignAgent");
    if ((fromBuilder && tabId !== 'workflows') || (fromDesignAgent && tabId !== 'design-agent')) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      sessionStorage.removeItem("fromDesignAgent");
      window.location.href = `/studio/${tabId}`;
      return;
    }

    setActiveTab(tabId);
    // router.replace keeps Next.js params in sync without adding a history entry.
    // Within [[...slug]] the same page component handles all tab URLs, so no remount.
    router.replace(`/studio/${tabId}`, { scroll: false });
  };

  // Auto-hide header when inside a specific workflow view or design agent
  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    const isDesignAgent = activeTab === 'design-agent';
    
    if (isEditingWorkflow || isDesignAgent) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [activeTab, urlWorkflowId, idFromParams]);

  const fetchBalance = useCallback(async (key) => {
    try {
      const data = await getUserBalance(key);
      setBalance(data.balance);
    } catch (err) {
      console.error('Balance fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    const envKey = process.env.NEXT_PUBLIC_MUAPI_KEY;
    const keyToUse = stored || envKey;
    if (keyToUse) {
      setApiKey(keyToUse);
      fetchBalance(keyToUse);
      document.cookie = `muapi_key=${keyToUse}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [fetchBalance]);

  const handleKeySave = useCallback((key) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    fetchBalance(key);
    document.cookie = `muapi_key=${key}; path=/; max-age=31536000; SameSite=Lax`;
  }, [fetchBalance]);

  const handleKeyChange = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
    setBalance(null);
    document.cookie = "muapi_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }, []);

  // Inject API key into all outgoing Axios requests (prop-based approach)
  // We use an interceptor to be selective and NOT send the key to external domains like S3
  useEffect(() => {
    // Safety: Clear any global defaults that might have been set previously
    delete axios.defaults.headers.common['x-api-key'];

    if (!apiKey) return;

    const interceptorId = axios.interceptors.request.use((config) => {
      const isRelative = config.url.startsWith('/') || !config.url.startsWith('http');
      const isInternalProxy = config.url.includes('/api/mf') || config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/v1');

      if (isRelative || isInternalProxy) {
        config.headers['Authorization'] = `Bearer ${apiKey}`;
      }

      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [apiKey]);

  // Poll for balance every 30 seconds if key is present
  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => fetchBalance(apiKey), 30000);
    return () => clearInterval(interval);
  }, [apiKey, fetchBalance]);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the container itself, not moving between children
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setDroppedFiles(files);
    }
  }, []);

  const handleFilesHandled = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  if (!hasMounted) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-white dark:from-[#0a0714] dark:to-[#050308]">
      <div className="animate-spin text-primary text-3xl">◌</div>
    </div>
  );

  if (!apiKey) {
    return <ApiKeyModal onSave={handleKeySave} />;
  }

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden text-slate-900 dark:text-white relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-fuchsia-500/10 dark:bg-[#d946ef]/10 backdrop-blur-md border-4 border-dashed border-fuchsia-400/40 dark:border-[#d946ef]/50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-white/90 dark:bg-[#0f0c18] p-8 rounded-3xl border border-fuchsia-200 dark:border-purple-500/20 shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pulse">
            <div className="w-20 h-20 bg-gradient-to-r from-[#a855f7] to-[#d946ef] rounded-2xl flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-slate-900 dark:text-white">Перетащите файлы сюда</span>
              <span className="text-sm text-slate-500 dark:text-white/40">Изображения, видео или аудио</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {isHeaderVisible && (
        <header className="flex-shrink-0 h-14 border-b border-slate-200/80 dark:border-purple-500/10 flex items-center justify-between px-6 bg-white/75 dark:bg-black/15 backdrop-blur-xl z-40 gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block text-slate-900 dark:text-white/90">Сапог AI</span>
          </div>

          {/* Center: Navigation Container with fade edges */}
          <div className="flex-1 min-w-0 mx-4 sm:mx-6 relative overflow-hidden h-full flex items-center justify-start lg:justify-center">
            {/* Fade Left Overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-slate-50/90 to-transparent dark:from-[#0a0714] dark:via-[#0a0714]/90 dark:to-transparent pointer-events-none z-10 block lg:hidden" />
            
            <nav className="flex items-center gap-4 overflow-x-auto scrollbar-none w-full lg:w-auto h-full px-4 lg:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative text-[13px] font-medium transition-all duration-300 whitespace-nowrap px-1 flex-shrink-0 flex items-center h-full ${
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white/90'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#a855f7] to-[#d946ef] rounded-full shadow-[0_0_12px_rgba(217,70,239,0.5)]" />
                  )}
                </button>
              ))}
            </nav>
            
            {/* Fade Right Overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-slate-50/90 to-transparent dark:from-[#0a0714] dark:via-[#0a0714]/90 dark:to-transparent pointer-events-none z-10 block lg:hidden" />
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0 flex items-center gap-4">
          </div>
        </header>
      )}

      {/* Studio Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* ImageStudio and VideoStudio stay mounted always (hidden when inactive)
            so an in-progress generation keeps running without recovery re-mounts. */}
        <div className={`absolute inset-0 ${activeTab === 'image' ? '' : 'hidden'}`}>
          <ImageStudio apiKey={apiKey} droppedFiles={activeTab === 'image' ? droppedFiles : null} onFilesHandled={handleFilesHandled} onGeneratingChange={setIsGenerating} />
        </div>
        <div className={`absolute inset-0 ${activeTab === 'video' ? '' : 'hidden'}`}>
          <VideoStudio apiKey={apiKey} droppedFiles={activeTab === 'video' ? droppedFiles : null} onFilesHandled={handleFilesHandled} />
        </div>
        {activeTab === 'workflows' && <WorkflowStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'gallery' && <GalleryStudio apiKey={apiKey} />}
        {activeTab === 'prompts' && <PromptStudioTab apiKey={apiKey} />}

        {/* Generation indicator overlay - visible across all tabs */}
        {isGenerating && (
          <div className="fixed top-24 right-6 z-[110] animate-fade-in pointer-events-none">
            <div className="bg-white/92 dark:bg-[#0f0c18]/95 border border-fuchsia-200 dark:border-purple-500/25 rounded-xl p-4 shadow-2xl flex flex-col items-center gap-3 min-w-[240px] backdrop-blur-xl">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#a855f7] to-[#d946ef] p-1 animate-spin shadow-lg shadow-purple-500/20">
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#0f0c18] flex items-center justify-center">
                    <span className="text-xl text-primary">◌</span>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Генерирую...</h4>
                  <p className="text-xs text-slate-500 dark:text-white/40">Подождите</p>
                </div>
              </div>
              <div className="w-full space-y-1">
                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#d946ef] animate-pulse" style={{ width: "100%" }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-white/30 text-center leading-tight">
                может занять до минуты
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
          <div className="bg-white dark:bg-[#0f0c18] border border-slate-200 dark:border-purple-500/20 rounded-xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Настройки</h2>
            <p className="text-slate-500 dark:text-white/40 text-[13px] mb-8">
              Управление параметрами студии и аутентификацией.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-purple-500/10 rounded-md p-4">
                <label className="block text-xs font-bold text-slate-500 dark:text-white/30 mb-2">
                   Активный API-ключ
                </label>
                <div className="text-[13px] font-mono text-slate-700 dark:text-white/80">
                  {apiKey.slice(0, 8)}••••••••••••••••
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleKeyChange}
                className="flex-1 h-10 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all border border-red-500/10"
              >
                Сменить ключ
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 h-10 rounded-md bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold transition-all border border-slate-200 dark:border-white/10"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
