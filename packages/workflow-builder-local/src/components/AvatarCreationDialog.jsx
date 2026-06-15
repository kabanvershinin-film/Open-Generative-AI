"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const AVATAR_LIBRARY_KEY = 'avatar_library_v1';

function loadAvatarLibrary() {
  try {
    return JSON.parse(localStorage.getItem(AVATAR_LIBRARY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAvatarLibrary(items) {
  try {
    localStorage.setItem(AVATAR_LIBRARY_KEY, JSON.stringify(items));
  } catch {}
}

export default function AvatarCreationDialog({ open, onClose, onCreated }) {
  const [step, setStep] = useState('name'); // 'name' | 'video' | 'uploading' | 'training' | 'done'
  const [displayName, setDisplayName] = useState('');
  const [confName, setConfName] = useState('');
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [uploadId, setUploadId] = useState(null);
  const [uploadUrls, setUploadUrls] = useState([]);
  const [rolePic, setRolePic] = useState(null);
  const fileRef = useRef(null);
  const cancelPollRef = useRef(false);

  const reset = () => {
    cancelPollRef.current = true;
    setStep('name');
    setDisplayName('');
    setConfName('');
    setVideo(null);
    setVideoPreview(null);
    setBusy(false);
    setStatusText('');
    setUploadId(null);
    setUploadUrls([]);
    setRolePic(null);
  };

  const startUpload = async () => {
    if (!displayName.trim() || !video) {
      toast.error('Введите имя и выберите видео');
      return;
    }
    const generatedConfName = `avatar_${Date.now()}`;
    setConfName(generatedConfName);
    cancelPollRef.current = false;
    setBusy(true);
    setStep('uploading');
    setStatusText('Инициализация загрузки…');
    try {
      // Step 1: Init part upload
      const initResp = await fetch('/api/digital-avatar/init-part-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confName: generatedConfName,
          roleShowName: displayName.trim(),
          type: 1,
          fileSuffix: 'mp4'
        }),
      });
      const initJson = await initResp.json();
      if (!initResp.ok) throw new Error(initJson.error || 'Ошибка инициализации');

      setUploadId(initJson.UploadId);
      setUploadUrls(initJson.UploadUrls || []);
      setStatusText('Загрузка видео по частям…');

      // Step 2: Split video into chunks and upload (10MB each)
      const chunkSize = 10 * 1024 * 1024; // 10MB
      const file = video;
      const totalChunks = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        if (cancelPollRef.current) return;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        // Convert chunk to base64
        const base64Chunk = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result || '').split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(chunk);
        });

        // Upload chunk
        const partResp = await fetch('/api/digital-avatar/video-part-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadUrl: initJson.UploadUrls[i],
            partData: base64Chunk,
            partNumber: i + 1
          }),
        });
        const partJson = await partResp.json();
        if (!partResp.ok) throw new Error(partJson.error || 'Ошибка загрузки части');
        
        setStatusText(`Загружено ${i + 1} из ${totalChunks} частей…`);
      }

      // Step 3: Complete upload
      setStatusText('Завершение загрузки…');
      const completeResp = await fetch('/api/digital-avatar/video-complete-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: initJson.UploadId,
          confName: generatedConfName
        }),
      });
      const completeJson = await completeResp.json();
      if (!completeResp.ok) throw new Error(completeJson.error || 'Ошибка завершения загрузки');

      // Step 4: Start training
      setStatusText('Начало обучения…');
      const trainResp = await fetch('/api/digital-avatar/init-train-digime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confName: generatedConfName,
          callbackUrl: `${window.location.origin}/api/digital-avatar/callback`
        }),
      });
      const trainJson = await trainResp.json();
      if (!trainResp.ok) throw new Error(trainJson.error || 'Ошибка начала обучения');

      // Step 5: Poll training status
      setStep('training');
      await pollTrainingStatus(generatedConfName);
    } catch (e) {
      toast.error(e.message || 'Ошибка');
      setBusy(false);
      setStep('name');
    }
  };

  const pollTrainingStatus = async (confName) => {
    for (let i = 0; i < 120; i++) { // Max 10 minutes (5 seconds per poll)
      if (cancelPollRef.current) return;
      await new Promise(r => setTimeout(r, 5000));
      try {
        const infoResp = await fetch('/api/digital-avatar/digime-training-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confName }),
        });
        const infoJson = await infoResp.json();
        if (infoJson.State === 2) { // Ready
          setRolePic(infoJson.RolePic);
          setStep('done');
          setBusy(false);
          
          // Save to library
          const newAvatar = {
            id: confName,
            name: displayName.trim(),
            rolePic: infoJson.RolePic,
            prePic: infoJson.PrePic,
            addedAt: Date.now()
          };
          const library = loadAvatarLibrary();
          saveAvatarLibrary([newAvatar, ...library]);
          
          onCreated?.(confName, displayName.trim(), infoJson.RolePic);
          toast.success('Аватар создан!');
          return;
        }
        if (infoJson.State === 3) { // Failed
          throw new Error('Обучение не удалось');
        }
        setStatusText(`Обучение… ${Math.min(i * 5, 600)} сек`);
      } catch {}
    }
    toast.error('Обучение слишком долгое, попробуйте позже.');
    setStep('name');
  };

  const onPickVideo = (file) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Нужно видео');
      return;
    }
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleClose = useCallback(() => {
    if (busy) return;
    reset();
    onClose();
  }, [busy, onClose]);

  useEffect(() => { if (!open) reset(); }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#0c0d0f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Создание цифрового аватара</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={busy}
            className="text-white/40 hover:text-white disabled:opacity-40"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5">
          {['name', 'video', 'training', 'done'].map((s) => {
            const order = ['name', 'video', 'uploading', 'training', 'done'];
            const active = order.indexOf(step) >= order.indexOf(s);
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${active ? 'bg-purple-600' : 'bg-white/10'}`}
              />
            );
          })}
        </div>

        {/* Step 1: Name */}
        {step === 'name' && (
          <>
            <p className="text-xs text-white/60 leading-relaxed">
              Создайте цифровой аватар с помощью видео. Загрузите 5–10 минутное видео с вашим лицом (анфас, хорошее освещение).
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/40">Имя аватара</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Например: Мой аватар"
                className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-purple-500/50"
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setStep('video')}
                disabled={!displayName.trim()}
                className="flex-1 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 text-white font-medium text-sm transition-all"
              >
                Далее
              </button>
            </div>
          </>
        )}

        {/* Step 2: Video */}
        {step === 'video' && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('name')}
                disabled={busy}
                className="h-10 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors"
              >
                Назад
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickVideo(f); e.target.value = ''; }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-video bg-white/5 border border-dashed border-white/20 hover:border-purple-500/50 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
            >
              {videoPreview ? (
                <video src={videoPreview} controls className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-white/40">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-xs">Нажми, чтобы выбрать видео</span>
                </div>
              )}
            </div>
            <button
              onClick={startUpload}
              disabled={!video}
              className="w-full h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <span className="animate-spin inline-block">◌</span>
                  {statusText}
                </>
              ) : (
                'Создать аватар'
              )}
            </button>
          </>
        )}

        {/* Step 3: Uploading or Training */}
        {(step === 'uploading' || step === 'training') && (
          <div className="py-6 text-center space-y-3">
            <span className="animate-spin inline-block text-purple-400 text-5xl">◌</span>
            <p className="text-sm text-white">{statusText}</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Аватар «{displayName}» создан!</p>
            {rolePic && (
              <img src={rolePic} alt="Аватар" className="w-20 h-20 rounded-xl object-cover mx-auto border border-white/10" />
            )}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-purple-400 truncate flex-1">{confName}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(confName); toast.success('Скопировано!'); }}
                className="text-white/60 hover:text-purple-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-white/60">Теперь можно использовать этот аватар в Seedance 2.0.</p>
            <button
              onClick={handleClose}
              className="w-full h-10 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-medium text-sm transition-all"
            >
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
