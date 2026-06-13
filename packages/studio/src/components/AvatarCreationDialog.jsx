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
  const [step, setStep] = useState('name'); // 'name' | 'choice' | 'media' | 'uploading' | 'training' | 'processing' | 'done'
  const [mode, setMode] = useState('video'); // 'video' | 'photo' | 'seedance_ark'
  const [displayName, setDisplayName] = useState('');
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [assetUri, setAssetUri] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const fileRef = useRef(null);
  const cancelPollRef = useRef(false);

  const reset = () => {
    cancelPollRef.current = true;
    setStep('name');
    setDisplayName('');
    setMode('video');
    setVideo(null);
    setVideoPreview(null);
    setPhoto(null);
    setPhotoPreview(null);
    setBusy(false);
    setStatusText('');
    setResourceId('');
    setAssetUri('');
    setPreviewImage(null);
  };

  const uploadVideoToStorage = async (file) => {
    console.log('[AvatarCreationDialog] uploadVideoToStorage - file:', file);
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    const base64Data = await base64Promise;

    console.log('[AvatarCreationDialog] Sending to /api/upload-file');
    const uploadResp = await fetch('/api/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    });
    const uploadJson = await uploadResp.json().catch((err) => {
      console.error('[AvatarCreationDialog] uploadResp.json error:', err);
      return {};
    });
    console.log('[AvatarCreationDialog] uploadResp.ok:', uploadResp.ok, 'uploadJson:', uploadJson);
    if (!uploadResp.ok || !uploadJson.url) {
      throw new Error(uploadJson.error || 'Не удалось загрузить видео в хранилище');
    }

    return uploadJson.url;
  };

  const uploadImageToStorage = async (file) => {
    console.log('[AvatarCreationDialog] uploadImageToStorage - file:', file);
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    const base64Data = await base64Promise;

    console.log('[AvatarCreationDialog] Sending to /api/upload-file, base64Data length:', base64Data.length);
    const uploadResp = await fetch('/api/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    });
    const uploadJson = await uploadResp.json().catch((err) => {
      console.error('[AvatarCreationDialog] uploadResp.json error:', err);
      return {};
    });
    console.log('[AvatarCreationDialog] uploadResp.ok:', uploadResp.ok, 'uploadJson:', uploadJson);
    if (!uploadResp.ok || !uploadJson.url) {
      throw new Error(uploadJson.error || 'Не удалось загрузить фото в хранилище');
    }

    return uploadJson.url;
  };

  const waitForVid = async (videoUrl) => {
    const submitResp = await fetch('/api/digital-avatar/url-to-vid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    });
    const submitJson = await submitResp.json().catch(() => ({}));
    if (!submitResp.ok || !submitJson.taskId) {
      throw new Error(submitJson.error || 'Не удалось отправить видео на обработку');
    }

    for (let i = 0; i < 60; i++) {
      if (cancelPollRef.current) return null;
      setStatusText(`Подготовка видео для аватара… ${i + 1}/60`);
      await new Promise((r) => setTimeout(r, 5000));

      const statusResp = await fetch('/api/digital-avatar/url-to-vid-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: submitJson.taskId }),
      });
      const statusJson = await statusResp.json().catch(() => ({}));
      if (!statusResp.ok) {
        throw new Error(statusJson.error || 'Не удалось проверить статус видео');
      }
      if (statusJson.done && statusJson.vid) {
        return statusJson.vid;
      }
      if (statusJson.status === 'failed') {
        throw new Error('Преобразование видео в vid завершилось с ошибкой');
      }
    }

    throw new Error('Слишком долго ждём видео cloud id (vid)');
  };

  const pollTrainingStatus = async (taskId) => {
    for (let i = 0; i < 120; i++) {
      if (cancelPollRef.current) return;
      await new Promise((r) => setTimeout(r, 5000));

      const infoResp = await fetch('/api/digital-avatar/digime-training-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const infoJson = await infoResp.json().catch(() => ({}));
      if (!infoResp.ok) {
        throw new Error(infoJson.error || 'Не удалось проверить статус обучения');
      }

      if (infoJson.state === 2 && infoJson.assetUri) {
        const newAvatar = {
          id: infoJson.resourceId,
          name: displayName.trim(),
          assetUri: infoJson.assetUri,
          thumbnail: infoJson.frontendPic || null,
          rolePic: infoJson.frontendPic || null,
          addedAt: Date.now(),
        };

        const library = loadAvatarLibrary();
        const nextLibrary = [
          newAvatar,
          ...library.filter((item) => item.id !== newAvatar.id && item.assetUri !== newAvatar.assetUri),
        ];
        saveAvatarLibrary(nextLibrary);

        setResourceId(infoJson.resourceId || '');
        setAssetUri(infoJson.assetUri || '');
        setPreviewImage(infoJson.frontendPic || null);
        setStep('done');
        setBusy(false);
        onCreated?.(newAvatar);
        toast.success('Аватар создан!');
        return;
      }

      if (infoJson.state === 3 || infoJson.status === 'failed') {
        throw new Error('Обучение аватара завершилось с ошибкой');
      }

      const progress = Number(infoJson.progress || 0);
      setStatusText(`Обучение аватара… ${progress > 0 ? `${progress}%` : `${i + 1}/120`}`);
    }

    throw new Error('Обучение слишком долгое, попробуйте позже');
  };

  const pollPhotoStatus = async (taskId) => {
    for (let i = 0; i < 60; i++) {
      if (cancelPollRef.current) return;
      await new Promise((r) => setTimeout(r, 3000));

      const statusResp = await fetch('/api/digital-avatar/photo-to-avatar-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const statusJson = await statusResp.json().catch(() => ({}));
      if (!statusResp.ok) {
        throw new Error(statusJson.error || 'Не удалось проверить статус создания аватара');
      }

      if (statusJson.done && statusJson.resourceId) {
        const newAvatar = {
          id: statusJson.resourceId,
          name: displayName.trim(),
          assetUri: statusJson.assetUri,
          thumbnail: statusJson.frontendPic || photoPreview,
          rolePic: statusJson.frontendPic || photoPreview,
          addedAt: Date.now(),
        };

        const library = loadAvatarLibrary();
        const nextLibrary = [
          newAvatar,
          ...library.filter((item) => item.id !== newAvatar.id && item.assetUri !== newAvatar.assetUri),
        ];
        saveAvatarLibrary(nextLibrary);

        setResourceId(statusJson.resourceId || '');
        setAssetUri(statusJson.assetUri || '');
        setPreviewImage(statusJson.frontendPic || photoPreview);
        setStep('done');
        setBusy(false);
        onCreated?.(newAvatar);
        toast.success('Аватар создан!');
        return;
      }

      if (statusJson.status === 'failed') {
        throw new Error('Создание аватара из фото завершилось с ошибкой');
      }

      setStatusText(`Создаём аватар из фото… ${i + 1}/60`);
    }

    throw new Error('Создание аватара слишком долгое, попробуйте позже');
  };

  const startUpload = async () => {
    if (!displayName.trim() || (!video && !photo)) {
      toast.error('Введите имя и выберите медиа');
      return;
    }

    cancelPollRef.current = false;
    setBusy(true);
    setStep('uploading');

    try {
      if (mode === 'video') {
        setStatusText('Загрузка видео…');
        const publicVideoUrl = await uploadVideoToStorage(video);
        if (cancelPollRef.current) return;

        const vid = await waitForVid(publicVideoUrl);
        if (!vid) return;

        setStep('training');
        setStatusText('Запуск обучения аватара…');

        const trainResp = await fetch('/api/digital-avatar/init-train-digime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vid }),
        });
        const trainJson = await trainResp.json().catch(() => ({}));
        if (!trainResp.ok || !trainJson.taskId) {
          throw new Error(trainJson.error || 'Не удалось запустить обучение аватара');
        }

        await pollTrainingStatus(trainJson.taskId);
      } else {
        setStatusText('Загрузка фото…');
        const publicImageUrl = await uploadImageToStorage(photo);
        if (cancelPollRef.current) return;

        const submitResp = await fetch('/api/digital-avatar/photo-to-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: publicImageUrl }),
        });
        const submitJson = await submitResp.json().catch(() => ({}));
        if (!submitResp.ok || !submitJson.taskId) {
          throw new Error(submitJson.error || 'Не удалось отправить фото на обработку');
        }

        await pollPhotoStatus(submitJson.taskId);
      }
    } catch (e) {
      toast.error(e.message || 'Ошибка');
      setBusy(false);
      setStep('media');
    }
  };

  const onPickVideo = (file) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Нужно видео');
      return;
    }
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const onPickPhoto = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Нужно фото');
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
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
          {['name', 'media', 'training', 'done'].map((s) => {
            const order = ['name', 'choice', 'media', 'uploading', 'training', 'processing', 'done'];
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
              Создайте цифровой аватар с помощью видео (более точный) или фото (быстрый вариант).
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
              onClick={() => setStep('choice')}
              disabled={!displayName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all"
            >
              Далее
            </button>
          </>
        )}

        {/* Step 2: Choice (Video or Photo) */}
        {step === 'choice' && (
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
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setMode('video'); setStep('media'); }}
                className={`p-4 rounded-xl border transition-all ${mode === 'video' ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <div className="text-white font-medium text-sm mb-1">Из видео</div>
                <div className="text-white/50 text-xs">Более точный (Visual API)</div>
              </button>
              <button
                onClick={() => { setMode('photo'); setStep('media'); }}
                className={`p-4 rounded-xl border transition-all ${mode === 'photo' ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <div className="text-white font-medium text-sm mb-1">Из фото</div>
                <div className="text-white/50 text-xs">Быстрый (Visual API)</div>
              </button>
            </div>
          </>
        )}

        {/* Step 3: Media (Video or Photo) */}
        {step === 'media' && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('choice')}
                disabled={busy}
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors"
              >
                Назад
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={mode === 'video' ? 'video/*' : 'image/*'}
              className="hidden"
              onChange={(e) => { 
                const f = e.target.files?.[0]; 
                if (f) {
                  if (mode === 'video') onPickVideo(f);
                  else onPickPhoto(f);
                } 
                e.target.value = ''; 
              }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className={`w-full ${mode === 'video' ? 'aspect-video' : 'aspect-square max-h-64 mx-auto'} bg-white/5 border border-dashed border-white/20 hover:border-purple-500 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors`}
            >
              {mode === 'video' ? (
                videoPreview ? (
                  <video src={videoPreview} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-white/40">
                    <FaUpload className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Нажми чтобы выбрать видео</span>
                  </div>
                )
              ) : (
                photoPreview ? (
                  <img src={photoPreview} alt="Предпросмотр" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-white/40">
                    <FaUpload className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Нажми чтобы выбрать фото</span>
                  </div>
                )
              )}
            </div>
            <button
              onClick={startUpload}
              disabled={mode === 'video' ? !video : !photo}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {busy ? <FaSpinner className="h-4 w-4 animate-spin" /> : null}
              {busy ? statusText : 'Создать аватар'}
            </button>
          </>
        )}

        {/* Step 3: Uploading or Training or Processing */}
        {(step === 'uploading' || step === 'training' || step === 'processing') && (
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
            {previewImage && (
              <img src={previewImage} alt="Аватар" className="w-24 h-24 rounded-xl object-cover mx-auto border border-white/10" />
            )}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-purple-400 truncate flex-1">{assetUri || resourceId}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(assetUri || resourceId); toast.success('Скопировано'); }}
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
