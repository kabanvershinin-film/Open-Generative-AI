import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "react-hot-toast";
import { FiUpload } from "react-icons/fi";
import { MdVideocam } from "react-icons/md";
import { useStore } from "reactflow";
import axios from "axios";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import { IoImageOutline, IoTrashOutline } from "react-icons/io5";
import { stableStringify } from "./utility";

const UploadNode = ({ id, data, formValues, setFormValues, selectedModel, loading, uploadType, acceptType }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageMetadata, setImageMetadata] = useState({ width: 0, height: 0, size: null });
  const [isMobileUploadUi, setIsMobileUploadUi] = useState(false);
  const videoRef = useRef(null);
  const prevFormValues = useRef(formValues);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const applyMatch = () => setIsMobileUploadUi(mediaQuery.matches);
    applyMatch();
    mediaQuery.addEventListener?.("change", applyMatch);
    return () => mediaQuery.removeEventListener?.("change", applyMatch);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e);
  };

  const handleFileUpload = (e) => {
    let file = null;

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    } else {
      return;
    }

    const fileName = (file.name || "").toLowerCase();
    const isAcceptedFile =
      acceptType === "image"
        ? file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|heic|heif)$/i.test(fileName)
        : acceptType === "video"
          ? file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(fileName)
          : file.type.startsWith("audio/") || /\.(mp3|wav|webm|m4a|ogg)$/i.test(fileName);

    const type = file.type.startsWith("video") ? "video_url" : file.type.startsWith("image") ? "image_url": "audio_url";
    
    if (!isAcceptedFile) {
      const typeRus = acceptType === "image" ? "изображение" : acceptType === "video" ? "видео" : "аудио";
      toast.error(`Пожалуйста, загрузите корректный файл (${typeRus})`);
      return;
    };

    setUploading(true);
    axios.get("/api/upload-file", {
      params: { filename: file.name, type: file.type }
    })
    .then((response) => {
      const { putUrl, publicUrl } = response.data;

      axios.put(putUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      })
      .then(() => {
        setFormValues(prev => ({ ...prev, [type]: publicUrl }));

        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      })
    })
    .catch((error) => {
      console.error("Upload failed", error);
      toast.error("Ошибка загрузки.", error?.response?.data);
      setUploading(false);
      setUploadProgress(0);
    })
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }; 

  const acceptAttr =
    acceptType === "image"
      ? "image/*,.heic,.heif"
      : acceptType === "video"
        ? "video/*,.mov,.m4v"
        : "audio/*,.m4a,.ogg";

  const handleTextChange = (e) => {
    const textValue = e.target.value;
    setFormValues(prev => ({ ...prev, prompt: textValue }));
  };

  const handleWorkflowInputChange = (e) => {
    const workflowInputValue = e.target.checked;
    setFormValues(prev => ({ ...prev, is_workflow_input: workflowInputValue }));
  };

  const removeData = () => {
    const key = acceptType === "image" ? "image_url": acceptType === "video" ? "video_url": "audio_url";
    setFormValues(prev => ({ ...prev, [key]: null }))
  };

  const imageUrl = acceptType === "image" ? (formValues.image_url || null) : null;

  // Probe image dimensions / size only when the URL actually changes. Keeping
  // this in its own effect (keyed on the URL, not `data`) is what stops the
  // HEAD-request flood that exhausted the browser (ERR_INSUFFICIENT_RESOURCES).
  useEffect(() => {
    if (acceptType !== "image") return;
    if (!imageUrl) { setImageMetadata({ width: 0, height: 0, size: null }); return; }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setImageMetadata(prev => ({ ...prev, width: img.naturalWidth, height: img.naturalHeight }));
    };
    img.src = imageUrl;

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      fetch(imageUrl, { method: 'HEAD' })
        .then(res => {
          if (cancelled) return;
          const size = res.headers.get('content-length');
          setImageMetadata(prev => ({
            ...prev,
            size: size ? (parseInt(size) / (1024 * 1024)).toFixed(2) + ' MB' : null,
          }));
        })
        .catch(() => { if (!cancelled) setImageMetadata(prev => ({ ...prev, size: null })); });
    }

    return () => { cancelled = true; };
  }, [imageUrl, acceptType]);

  // Propagate this node's value to the parent. `data` is intentionally NOT a
  // dependency: the parent recreates the node's `data` object on every
  // onDataChange, so depending on it re-ran this effect forever (the source of
  // the white-screen React #185 loop). A stable, key-order-independent compare
  // ensures we only emit when the content really changed.
  useEffect(() => {
    let outputs, resultUrl;
    if (acceptType === "image") {
      resultUrl = formValues.image_url || null;
      outputs = [{ type: "image_url", value: resultUrl }];
    } else if (acceptType === "video") {
      resultUrl = formValues.video_url || null;
      outputs = [{ type: "video_url", value: resultUrl }];
    } else if (acceptType === "audio") {
      resultUrl = formValues.audio_url || null;
      outputs = [{ type: "audio_url", value: resultUrl }];
    } else {
      resultUrl = formValues.prompt || "";
      outputs = [{ type: "text", value: resultUrl }];
    }

    if (stableStringify(prevFormValues.current) === stableStringify(formValues)) return;
    prevFormValues.current = formValues;

    data?.onDataChange?.(id, { selectedModel, formValues, loading, outputs, resultUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, selectedModel, loading, id, acceptType]);

  const hasFileUrl = formValues?.image_url || formValues?.video_url || formValues?.audio_url;
  const textareaRef = useRef(null);

  // Референс-теги: если этот текст-нод кормит видео/изображение-ноду, к которой
  // подключён Персонаж, показываем кликабельный чип @Имя с миниатюрой лица.
  // Клик вставляет @Имя в промпт (как в Студии Креаторов).
  const rfEdges = useStore((s) => s.edges);
  const rfNodes = useStore((s) => s.nodeInternals);
  const characterTags = useMemo(() => {
    if (uploadType !== "text") return [];
    const nodesArr = rfNodes ? Array.from(rfNodes.values()) : [];
    // Ноды, которые кормит этот текст-нод (его промпт).
    const fedTargets = rfEdges.filter((e) => e.source === id).map((e) => e.target);
    const targetSet = new Set(
      fedTargets.filter((tid) => {
        const n = nodesArr.find((nn) => nn.id === tid);
        return n?.type === "videoNode" || n?.type === "imageNode" || n?.type === "skylarkNode";
      })
    );
    if (!targetSet.size) return [];
    // Персонаж-ноды, подключённые к тем же целям.
    const charIds = new Set(
      rfEdges
        .filter((e) => targetSet.has(e.target))
        .map((e) => e.source)
        .filter((sid) => nodesArr.find((nn) => nn.id === sid)?.type === "characterNode")
    );
    const isUrl = (v) => 
      typeof v === "string" && 
      v.length > 5 && 
      (v.startsWith("http") || v.startsWith("data:image/")) && 
      !v.startsWith("asset://");

    const tags = [];
    for (const cid of charIds) {
      const cnode = nodesArr.find((nn) => nn.id === cid);
      const fv = cnode?.data?.formValues || {};
      const name = (fv.character_name || "лицо").trim();
      
      // Превью лица: фото персонажа, иначе любой пригодный URL из его полей.
      let thumb =
        (isUrl(fv.character_photo) ? fv.character_photo : null) ||
        (isUrl(fv.face_thumbnail) ? fv.face_thumbnail : null) ||
        (isUrl(fv.image_url) ? fv.image_url : null) ||
        (isUrl(fv.face_asset) ? fv.face_asset : null);
      if (!thumb) {
        for (const tid of targetSet) {
          if (!rfEdges.some((e) => e.source === cid && e.target === tid)) continue;
          const tnode = nodesArr.find((nn) => nn.id === tid);
          const tt = tnode?.data?.formValues?.face_thumbnail;
          if (isUrl(tt)) { thumb = tt; break; }
        }
      }
      tags.push({ id: cid, name, thumb: thumb || null });
    }
    return tags;
  }, [rfEdges, rfNodes, id, uploadType]);

  // Image/video tags: если этот текст-нод кормит видео/изображение-ноду, к которой
  // подключен любая Image/Video/Character/Audio-нода, показываем кликабельные чипы с превью.
  const imageTags = useMemo(() => {
    if (uploadType !== "text") return [];
    const nodesArr = rfNodes ? Array.from(rfNodes.values()) : [];
    const fedTargets = rfEdges.filter((e) => e.source === id).map((e) => e.target);
    const targetSet = new Set(
      fedTargets.filter((tid) => {
        const n = nodesArr.find((nn) => nn.id === tid);
        return n?.type === "videoNode" || n?.type === "imageNode" || n?.type === "skylarkNode";
      })
    );
    if (!targetSet.size) return [];
    const out = [];
    const seen = new Set();
    const counters = { images: 0, video: 0, audio: 0 };
    for (const e of rfEdges) {
      if (!targetSet.has(e.target) || e.source === id || seen.has(e.source)) continue;
      seen.add(e.source);
      const n = nodesArr.find((nn) => nn.id === e.source);
      if (!n) continue;
      const d = n.data || {};
      const fvN = d.formValues || {};
      const rawThumb = fvN.character_photo || d.thumbnail || d.previewUrl || d.resultUrl
        || (Array.isArray(d.outputs) && d.outputs[0]?.value) || fvN.image_url || fvN.video_url;
      const url = (typeof rawThumb === "string" && !rawThumb.startsWith("asset://") && !rawThumb.startsWith("data:image/svg")) ? rawThumb : undefined;
      if (n.type === "characterNode") {
        counters.images += 1;
        out.push({ id: n.id, label: `图片${counters.images}`, kind: "character", url, name: (fvN.character_name || "角色").trim(), isVideo: false });
      } else if (n.type === "videoNode") {
        counters.video += 1;
        out.push({ id: n.id, label: `视频${counters.video}`, kind: "video", url, isVideo: true });
      } else if (n.type === "audioNode") {
        counters.audio += 1;
        out.push({ id: n.id, label: `音频${counters.audio}`, kind: "audio", url, isVideo: false });
      } else if (n.type === "imageNode") {
        counters.images += 1;
        out.push({ id: n.id, label: `图片${counters.images}`, kind: "images", url, isVideo: false });
      }
    }
    return out;
  }, [rfEdges, rfNodes, id, uploadType]);

  const insertImageTag = (tag) => {
    const token = tag + " ";
    const ta = textareaRef.current;
    const cur = formValues?.prompt || "";
    if (!ta) {
      setFormValues((prev) => ({ ...prev, prompt: cur + token }));
      return;
    }
    const start = ta.selectionStart ?? cur.length;
    const end = ta.selectionEnd ?? cur.length;
    const next = cur.slice(0, start) + token + cur.slice(end);
    setFormValues((prev) => ({ ...prev, prompt: next }));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertCharTag = (name) => {
    const token = "@" + String(name || "лицо").trim().replace(/\s+/g, "_") + " ";
    const ta = textareaRef.current;
    const cur = formValues?.prompt || "";
    if (!ta) {
      setFormValues((prev) => ({ ...prev, prompt: cur + token }));
      return;
    }
    const start = ta.selectionStart ?? cur.length;
    const end = ta.selectionEnd ?? cur.length;
    const next = cur.slice(0, start) + token + cur.slice(end);
    setFormValues((prev) => ({ ...prev, prompt: next }));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(scrollHeight, 240)}px`;
    }
  }, [formValues?.prompt]);

  return (
    <div className="flex flex-col w-full flex-1 overflow-hidden rounded-b-2xl h-full">
      <div className="flex flex-col items-center justify-center w-full h-full flex-1">
        {uploadType === "text" ? (
          <div className="flex flex-col w-full h-full gap-1.5">
            {imageTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 nodrag">
                {imageTags.map((t) => (
                  <button
                    key={`${t.id}-${t.label}`}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => insertImageTag(t.label)}
                    title={`Вставить ${t.label} в промпт`}
                    className="flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 transition-colors"
                  >
                    {t.url ? (
                      t.isVideo ? (
                        <video
                          src={t.url}
                          className="w-6 h-6 rounded object-cover flex-shrink-0"
                          muted
                          preload="none"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <img
                          src={t.url}
                          alt={t.label}
                          className="w-6 h-6 rounded object-cover flex-shrink-0"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )
                    ) : (
                      <span className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-[11px] flex-shrink-0">
                        {t.kind === "video" ? "🎬" : t.kind === "audio" ? "🎵" : t.kind === "character" ? "🧑" : "🖼"}
                      </span>
                    )}
                    <span className="text-[10px]">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              className="bg-transparent border border-gray-800 w-full h-full max-h-96 p-2 text-xs text-white resize-none overflow-y-auto custom-scrollbar"
              placeholder="Введите текстовый промпт здесь..."
              value={formValues?.prompt || ""}
              onChange={handleTextChange}
            />
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center w-full h-full relative" 
            onDragOver={handleDragOver} onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col justify-center gap-2 w-full h-full max-w-[95%]">
                <h4 className="text-xs text-white">Загрузка... {uploadProgress}%</h4>
                <div className="w-full bg-gray-100 rounded h-1 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            ) : hasFileUrl ? (
              <div className="flex-1 w-full h-full group z-0">
                {formValues?.video_url ? (
                  <div className="relative w-full h-full">
                    <VideoPlayer 
                      src={formValues?.video_url}
                      accentColor="#f97316"
                    />
                  </div>
                ) : formValues?.image_url ? (
                  <div className="relative w-full h-full group/image">
                    <img
                      src={formValues?.image_url}
                      alt="Uploaded"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-white/50 uppercase tracking-tighter font-semibold">Разрешение</span>
                          <span className="text-xs text-white font-medium tabular-nums">
                            {imageMetadata.width} × {imageMetadata.height}
                          </span>
                        </div>
                        {imageMetadata.size && (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-white/50 uppercase tracking-tighter font-semibold">Размер файла</span>
                            <span className="text-xs text-white font-medium tabular-nums">{imageMetadata.size}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative group/audio flex flex-col items-center justify-center">
                    <AudioPlayer 
                      nodeId={id}
                      src={formValues?.audio_url} 
                      className="flex flex-col items-center justify-center px-5 py-4 w-full h-full relative group transition-all duration-500 select-none bg-black/10 rounded-b-2xl"
                    />
                  </div>
                )}
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  className="text-white hover:text-red-500 bg-black/40 hover:bg-black cursor-pointer absolute left-4 top-4 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={removeData}
                >
                  &#10005;
                </button>
              </div>
            ) : (
              isMobileUploadUi ? (
                <div
                  style={{ minHeight: 200 }}
                  className="flex flex-col items-center justify-center gap-3 text-gray-400 border border-dashed border-gray-600 rounded-lg p-4 w-full flex-1 h-full"
                >
                  <FiUpload size={20} />
                  <span className="text-xs capitalize">Загрузить {acceptType === "image" ? "изображение" : acceptType === "video" ? "видео" : "аудио"}</span>
                  <span className="text-[11px] text-gray-500 text-center">
                    На телефоне используйте выбор файла или камеру. Перетаскивание можно не использовать.
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 min-h-11 px-4 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
                    >
                      Выбрать файл
                    </button>
                    {acceptType === "image" && (
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 min-h-11 px-4 rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
                      >
                        Камера
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptAttr}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {acceptType === "image" && (
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept={acceptAttr}
                      capture="environment"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  )}
                </div>
              ) : (
                <label 
                  style={{ minHeight: 200 }} 
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-400 border border-dashed border-gray-600 rounded-lg p-4 w-full flex-1 hover:bg-gray-700/50 h-full"
                >
                  <FiUpload size={20} />
                  <span className="text-xs capitalize">Загрузить {acceptType === "image" ? "изображение" : acceptType === "video" ? "видео" : "аудио"}</span>
                  <span className="text-xs text-gray-500">Подсказка: перетащите файл(ы) сюда.</span>
                  <input
                    type="file"
                    accept={acceptAttr}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadNode;
