"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaSpinner,
  FaUpload,
  FaCheck,
  FaCopy,
  FaUserCircle
} from 'react-icons/fa';

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
  const [trainingStatus, setTrainingStatus] = useState(null);
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
    setTrainingStatus(null);
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
          setTrainingStatus('ready');
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
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaUserCircle className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Создание цифрового аватара</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={busy}
            className="text-white/40 hover:text-white disabled:opacity-40"
          >
            <FaTimes className="h-5 w-5" />
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
                className={`h-1 flex-1 rounded-full ${active ? 'bg-purple-500' : 'bg-white/10'}`}
              />
            );
          })}
        </div>

        {/* Step 1: Name */}
        {step === 'name' && (
          <>
            <p className="text-xs text-white/60 leading-relaxed">
              Создайте цифровой аватар с помощью видео. Загрузите 5-10 минутное видео с вашим лицом (анфас, хорошее освещение).
            </p>
            <div>
              <label className="block text-xs text-white/50 mb-1">Имя аватара</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Например: Мой аватар"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={() => setStep('video')}
              disabled={!displayName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
            >
              Далее
            </button>
          </>
        )}

        {/* Step 2: Video */}
        {step === 'video' && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('name')}
                disabled={busy}
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors"
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
              className="w-full aspect-video bg-white/5 border border-dashed border-white/20 hover:border-purple-500 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
            >
              {videoPreview ? (
                <video src={videoPreview} controls className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-white/40">
                  <FaUpload className="h-6 w-6 mx-auto mb-1" />
                  <span className="text-xs">Нажми чтобы выбрать видео</span>
                </div>
              )}
            </div>
            <button
              onClick={startUpload}
              disabled={!video}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {busy ? <FaSpinner className="h-4 w-4 animate-spin" /> : null}
              {busy ? statusText : 'Создать аватар'}
            </button>
          </>
        )}

        {/* Step 3: Uploading or Training */}
        {(step === 'uploading' || step === 'training') && (
          <div className="py-6 text-center space-y-3">
            <FaSpinner className="h-10 w-10 animate-spin text-purple-400 mx-auto" />
            <p className="text-sm text-white">{statusText}</p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <FaCheck className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm font-medium text-white">Аватар «{displayName}» создан!</p>
            {rolePic && (
              <img src={rolePic} alt="Аватар" className="w-24 h-24 rounded-xl object-cover mx-auto border border-white/10" />
            )}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-purple-400 truncate flex-1">{confName}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(confName); toast.success('Скопировано'); }}
                className="text-white/60 hover:text-purple-400"
              >
                <FaCopy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-white/50">Теперь можно использовать этот аватар в Seedance 2.0.</p>
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-medium rounded-xl transition-colors"
            >
              Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
