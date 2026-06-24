"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  generateVideo,
  generateI2V,
  processV2V,
  uploadFile,
  pollArkTask,
  listPendingGenerations,
  savePendingGeneration,
  updatePendingGeneration,
  resumeVideoGeneration,
} from "../muapi.js";
import {
  getT2vModels,
  getI2vModels,
  getV2vModels,
  getAspectRatiosForVideoModel,
  getDurationsForModel,
  getResolutionsForVideoModel,
  getAspectRatiosForI2VModel,
  getDurationsForI2VModel,
  getResolutionsForI2VModel,
  getEffectsForI2VModel,
  getDefaultEffectForI2VModel,
  getModesForModel,
  getCharacterOrientationForModel,
  getKeepOriginalSoundForModel,
} from "../models.js";
import { useModelConfig } from "../useModelConfig.js";
import FaceRegistrationDialog from "./FaceRegistrationDialog.jsx";
import FaceAssetDialog from "./FaceAssetDialog.jsx";
import { buildSeedanceStudioPayload, validateFaceAsset } from "../videoAssetPayload.js";
import { formatGenerationErrorNotice } from "./generationErrorNotice.js";

// ── tiny helpers ──────────────────────────────────────────────────────────────
const HISTORY_PAGE_SIZE = 18;
const MAX_CONCURRENT_HISTORY_PREVIEWS = 3;
let activeHistoryPreviewLoads = 0;
const pendingHistoryPreviewLoads = [];

function acquireHistoryPreviewSlot() {
  return new Promise((resolve) => {
    const grant = () => {
      activeHistoryPreviewLoads += 1;
      let released = false;
      resolve(() => {
        if (released) return;
        released = true;
        activeHistoryPreviewLoads = Math.max(0, activeHistoryPreviewLoads - 1);
        pendingHistoryPreviewLoads.shift()?.();
      });
    };
    if (activeHistoryPreviewLoads < MAX_CONCURRENT_HISTORY_PREVIEWS) grant();
    else pendingHistoryPreviewLoads.push(grant);
  });
}

function getFirstFramePreviewUrl(entry) {
  return entry?.preview_url || entry?.thumbnail || null;
}

function getQualitiesForModel(modelList, modelId) {
  const model = modelList.find((m) => m.id === modelId);
  return model?.inputs?.quality?.enum || [];
}

async function reportAdminIncident(payload) {
  try {
    await fetch("/api/admin/notifications/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      keepalive: true,
    });
  } catch {
    // Мониторинг не должен ломать пользовательский сценарий.
  }
}

async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

// ── SVG icons (kept inline to avoid extra deps) ───────────────────────────────

const CheckSvg = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#22d3ee"
    strokeWidth="4"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const VideoIconSvg = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const VideoReadySvg = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-primary"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    <polyline points="7 10 10 13 15 8" stroke="#22d3ee" strokeWidth="2.5" />
  </svg>
);

function LazyVideoFirstFramePreview({ entry, onOpen }) {
  const previewUrl = getFirstFramePreviewUrl(entry);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (previewUrl || !entry?.url || typeof IntersectionObserver === "undefined") return;
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const observer = new IntersectionObserver((items) => {
      if (!items.some((item) => item.isIntersecting)) return;
      observer.disconnect();
      acquireHistoryPreviewSlot().then((release) => {
        if (cancelled) {
          release();
          return;
        }
        setShouldLoadVideo(true);
        window.setTimeout(release, 5000);
      });
    }, { rootMargin: "600px 0px", threshold: 0.01 });
    observer.observe(root);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [entry?.url, previewUrl]);

  return (
    <button
      ref={rootRef}
      type="button"
      className="w-full aspect-video bg-black/40 cursor-pointer hover:opacity-80 transition-opacity relative flex items-center justify-center overflow-hidden"
      onClick={onOpen}
      title="Открыть видео"
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : shouldLoadVideo && !videoError ? (
        <video
          src={entry.url}
          className="absolute inset-0 w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
          controls={false}
          onLoadedMetadata={(e) => {
            try { e.currentTarget.currentTime = 0.05; } catch {}
          }}
          onCanPlay={(e) => e.currentTarget.pause()}
          onError={() => setVideoError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-black to-cyan-950/20" />
      )}
      <span className="relative z-10 w-14 h-14 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}

// ── Dropdown components ───────────────────────────────────────────────────────

function DropdownItem({ label, selected, onClick }) {
  return (
    <div
      className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group"
      onClick={onClick}
    >
      <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100 capitalize">
        {label}
      </span>
      {selected && <CheckSvg />}
    </div>
  );
}

function ModelDropdown({ imageMode, selectedModel, onSelect, onClose, t2vModels, i2vModels, v2vModels, isAdmin }) {
  const [search, setSearch] = useState("");

  const generationModels = imageMode ? i2vModels : t2vModels;

  const lf = search.toLowerCase();
  const filteredMain = generationModels.filter(
    (m) => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf),
  );
  const filteredV2V = v2vModels.filter(
    (m) => m.name.toLowerCase().includes(lf) || m.id.toLowerCase().includes(lf),
  );

  const getIconColor = (m, isV2V) => {
    if (isV2V) return "bg-orange-500/10 text-orange-400";
    if (m.id.includes("kling")) return "bg-blue-500/10 text-blue-400";
    if (m.id.includes("veo")) return "bg-purple-500/10 text-purple-400";
    if (m.id.includes("sora")) return "bg-rose-500/10 text-rose-400";
    return "bg-primary/10 text-primary";
  };

  const renderItem = (m, isV2V = false) => (
    <div
      key={m.id}
      className={`flex items-center justify-between p-3.5 ${(!m.disabled || isAdmin) ? "hover:bg-white/5 cursor-pointer" : "opacity-50 cursor-not-allowed"} rounded-2xl transition-all border border-transparent ${(!m.disabled || isAdmin) && "hover:border-white/5"} ${selectedModel === m.id && (!m.disabled || isAdmin) ? "bg-white/5 border-white/5" : ""}`}
      onClick={(e) => {
        if (m.disabled && !isAdmin) return;
        e.stopPropagation();
        onSelect(m, isV2V);
        onClose();
      }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-10 h-10 ${m.disabled && !isAdmin ? "bg-gray-500/10 text-gray-400" : getIconColor(m, isV2V)} border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase`}
        >
          {m.name.charAt(0)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className={`text-xs font-bold ${m.disabled && !isAdmin ? "text-gray-400" : "text-white"} tracking-tight`}>
            {m.name}
          </span>
          {m.comingSoon && (
            <span className="text-[9px] text-gray-500">Скоро</span>
          )}
          {isV2V && !m.comingSoon && (
            <span className="text-[9px] text-orange-400/70">
              {m.imageField ? "Загрузите видео и изображение" : "Загрузите видео"}
            </span>
          )}
        </div>
      </div>
      {selectedModel === m.id && (!m.disabled || isAdmin) && <CheckSvg />}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="px-2 pb-3 mb-2 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Поиск моделей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
          />
        </div>
      </div>
      <div className="text-xs font-bold text-secondary px-3 py-2 shrink-0">
        Видеомодели
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {filteredMain.map((m) => renderItem(m, false))}
        {filteredV2V.length > 0 && (
          <>
            <div className="text-xs font-bold text-orange-400/70 px-3 py-2 mt-1 border-t border-white/5">
              Видеоинструменты
            </div>
            {filteredV2V.map((m) => renderItem(m, true))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Control button ────────────────────────────────────────────────────────────

function ControlBtn({ icon, label, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap"
    >
      {icon}
      <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">
        {label}
      </span>
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-20 group-hover:opacity-100 transition-opacity"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

// ── Dropdown panel ─────────────────────────────────────────────────────────────
// Rendered inside a `relative` wrapper div; floats above the anchor button.

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoStudio({
  apiKey,
  isAdmin = false,
  onGenerationComplete,
  historyItems,
  droppedFiles,
  onFilesHandled,
}) {
  // Get models with config
  const { t2vModels, i2vModels, v2vModels, loading } = useModelConfig();
  
  const PERSIST_KEY = "mf_video_studio_persistent";
  const ARK_TASK_KEY = "mf_video_active_ark_task";
  const PENDING_KEY = "mf_video_studio_pending";
  const PENDING_RESULT_KEY = "mf_video_studio_pending_result";

  // ── mode state ──
  const [imageMode, setImageMode] = useState(false); // i2v
  const [v2vMode, setV2vMode] = useState(false);

  // ── model / params ──
  const defaultModel = t2vModels[0] || i2vModels[0] || { id: "", name: "", inputs: {} };
  const [selectedModel, setSelectedModel] = useState(defaultModel.id);
  const [selectedModelName, setSelectedModelName] = useState(defaultModel.name);
  const [selectedAr, setSelectedAr] = useState(
    defaultModel.inputs?.aspect_ratio?.default || "16:9",
  );
  const [selectedDuration, setSelectedDuration] = useState(
    defaultModel.inputs?.duration?.default || 5,
  );
  const [selectedResolution, setSelectedResolution] = useState(
    defaultModel.inputs?.resolution?.default || "",
  );
  const [selectedQuality, setSelectedQuality] = useState(
    defaultModel.inputs?.quality?.default || "",
  );
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("");
  const [selectedCharacterOrientation, setSelectedCharacterOrientation] = useState("");
  const [selectedKeepOriginalSound, setSelectedKeepOriginalSound] = useState("");
  const [seed, setSeed] = useState(-1); // -1 = random
  const [returnLastFrame, setReturnLastFrame] = useState(false);

  // ── upload progress ──
  const [imageProgress, setImageProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  // ── control visibility ──
  const [showAr, setShowAr] = useState(true);
  const [showDuration, setShowDuration] = useState(true);
  const [showResolution, setShowResolution] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showMode, setShowMode] = useState(false);
  const [showEffect, setShowEffect] = useState(false);
  const [showCharacterOrientation, setShowCharacterOrientation] = useState(false);
  const [showKeepOriginalSound, setShowKeepOriginalSound] = useState(false);

  // ── uploads ──
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedEndImageUrl, setUploadedEndImageUrl] = useState(null);
  const [endImageUploading, setEndImageUploading] = useState(false);
  const [endImageProgress, setEndImageProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadedVideoName, setUploadedVideoName] = useState(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [uploadedAudioName, setUploadedAudioName] = useState(null);

  // ── Seedance 2.0 multimodal reference files (image 1-9 / video 1-3 / audio 1-3) ──
  // Each: { id, url, kind: 'image'|'video'|'audio', name, uploading, progress }
  const [refFiles, setRefFiles] = useState([]);

  // ── Registered face/character for Seedance (asset://… + display name) ──
  const [faceRegOpen, setFaceRegOpen] = useState(false);   // register a new face
  const [facePickOpen, setFacePickOpen] = useState(false); // pick an existing asset
  const [faceAsset, setFaceAsset] = useState(null); // { uri, name, thumbnail } | null

  // ── generation / canvas ──
  const [activeTasks, setActiveTasks] = useState([]); // Array of { id, prompt, model, bill, status: 'generating'|'done'|'error', url, error }
  const generating = activeTasks.some(t => t.status === 'generating');

  const addTask = useCallback((task) => {
    setActiveTasks(prev => {
      const existing = prev.find(t => t.id === task.id);
      if (existing) {
        // Если задача уже существует, обновляем её, но сохраняем статус
        return prev.map(t => t.id === task.id ? { ...t, ...task } : t);
      }
      // Если задачи нет, добавляем новую
      return [{ ...task, status: 'generating', timestamp: new Date().toISOString() }, ...prev];
    });
  }, []);

  const updateTask = useCallback((id, updates) => {
    setActiveTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTask = useCallback((id) => {
    setActiveTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const generateErrorNotice = formatGenerationErrorNotice(generateError);
  const [canvasUrl, setCanvasUrl] = useState(null);
  const [canvasModel, setCanvasModel] = useState(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [lastGenerationId, setLastGenerationId] = useState(null);
  const [lastGenerationModel, setLastGenerationModel] = useState(null);

  // ── history ──
  const [localHistory, setLocalHistory] = useState([]);
  const [remoteHistory, setRemoteHistory] = useState([]);
  const [remoteHistoryNextCursor, setRemoteHistoryNextCursor] = useState(null);
  const [remoteHistoryError, setRemoteHistoryError] = useState(null);
  const [isLoadingRemoteHistory, setIsLoadingRemoteHistory] = useState(false);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);

  // ── dropdown ──
  const [openDropdown, setOpenDropdown] = useState(null); // 'model'|'ar'|'duration'|'resolution'|'quality'|'mode'|'character_orientation'|'keep_original_sound'|null

  // ── prompt ──
  const [prompt, setPrompt] = useState("");
  const [promptDisabled, setPromptDisabled] = useState(false);

  // ── refs ──
  const isMountedRef = useRef(true);
  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);
  const containerRef = useRef(null);
  const historyScrollRef = useRef(null);
  const remoteHistoryLoadingRef = useRef(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const endImageFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const refFileInputRef = useRef(null);
  const resultVideoRef = useRef(null);
  const hasRestored = useRef(false);

  // ── derived data ──
  // Merge localHistory and remoteHistory, local has priority
  const history = useMemo(() => {
    if (historyItems) return historyItems;
    const seen = new Set();
    const merged = [];
    // Add local entries first (priority for new generations)
    [...localHistory].reverse().forEach(entry => {
      const key = entry.id || entry.url;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.unshift(entry);
      }
    });
    // Then add remote entries that aren't already in local
    remoteHistory.forEach(entry => {
      const key = entry.id || entry.url;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(entry);
      }
    });
    return merged;
  }, [historyItems, localHistory, remoteHistory]);

  const getCurrentModels = useCallback(() => {
    if (v2vMode) return v2vModels;
    return imageMode ? i2vModels : t2vModels;
  }, [imageMode, v2vMode]);

  const getCurrentAspectRatios = useCallback(
    (id) =>
      imageMode
        ? getAspectRatiosForI2VModel(id)
        : getAspectRatiosForVideoModel(id),
    [imageMode],
  );

  const getCurrentDurations = useCallback(
    (id) =>
      imageMode ? getDurationsForI2VModel(id) : getDurationsForModel(id),
    [imageMode],
  );

  const getCurrentResolutions = useCallback(
    (id) =>
      imageMode
        ? getResolutionsForI2VModel(id)
        : getResolutionsForVideoModel(id),
    [imageMode],
  );

  const getCurrentModel = useCallback(
    () => getCurrentModels().find((m) => m.id === selectedModel),
    [getCurrentModels, selectedModel],
  );

  const isMotionControlSelection = useCallback(
    (modelId, isV2v) => {
      if (!isV2v) return false;
      const m = v2vModels.find((x) => x.id === modelId);
      return !!m?.imageField;
    },
    [],
  );

  // ── update controls when model/mode changes ──────────────────────────────
  const applyControlsForModel = useCallback(
    (modelId, isImageMode, isV2vMode) => {
      if (isV2vMode) {
        setShowAr(false);
        setShowDuration(false);
        setShowResolution(false);
        setShowQuality(false);
        setShowMode(false);
        setShowEffect(false);
        return;
      }

      const modelList = isImageMode ? i2vModels : t2vModels;
      const model = modelList.find((m) => m.id === modelId);

      const ars = isImageMode
        ? getAspectRatiosForI2VModel(modelId)
        : getAspectRatiosForVideoModel(modelId);
      if (ars.length > 0) {
        setSelectedAr(ars[0]);
        setShowAr(true);
      } else {
        setShowAr(false);
      }

      const durations = isImageMode
        ? getDurationsForI2VModel(modelId)
        : getDurationsForModel(modelId);
      if (durations.length > 0) {
        setSelectedDuration(durations[0]);
        setShowDuration(true);
      } else {
        setShowDuration(false);
      }

      const resolutions = isImageMode
        ? getResolutionsForI2VModel(modelId)
        : getResolutionsForVideoModel(modelId);
      if (resolutions.length > 0) {
        setSelectedResolution(resolutions[0]);
        setShowResolution(true);
      } else {
        setShowResolution(false);
      }

      const qualities = getQualitiesForModel(modelList, modelId);
      if (qualities.length > 0) {
        setSelectedQuality(model?.inputs?.quality?.default || qualities[0]);
        setShowQuality(true);
      } else {
        setSelectedQuality("");
        setShowQuality(false);
      }

      const modes = getModesForModel(modelId);
      if (modes.length > 0) {
        setSelectedMode(model?.inputs?.mode?.default || modes[0]);
        setShowMode(true);
      } else {
        setSelectedMode("");
        setShowMode(false);
      }

      const effects = isImageMode ? getEffectsForI2VModel(modelId) : [];
      if (effects.length > 0) {
        setSelectedEffect(getDefaultEffectForI2VModel(modelId) || effects[0]);
        setShowEffect(true);
      } else {
        setSelectedEffect("");
        setShowEffect(false);
      }

      // Check for character_orientation and keep_original_sound in model inputs
      if (model?.inputs?.character_orientation?.enum?.length > 0) {
        setSelectedCharacterOrientation(model.inputs.character_orientation.default || model.inputs.character_orientation.enum[0]);
        setShowCharacterOrientation(true);
      } else {
        setSelectedCharacterOrientation("");
        setShowCharacterOrientation(false);
      }

      if (model?.inputs?.keep_original_sound?.enum?.length > 0) {
        setSelectedKeepOriginalSound(model.inputs.keep_original_sound.default || model.inputs.keep_original_sound.enum[0]);
        setShowKeepOriginalSound(true);
      } else {
        setSelectedKeepOriginalSound("");
        setShowKeepOriginalSound(false);
      }
    },
    [],
  );

  // ── State for cost display ───────────────────────────────────────────────
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [isLoadingCost, setIsLoadingCost] = useState(false);

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
        const stored = localStorage.getItem(PERSIST_KEY);
        if (stored) {
          let data = JSON.parse(stored);
          
          // Fix old invalid selectedModel
          if (data.selectedModel === "seedance-2.0-fast") {
            data.selectedModel = "seedance-2.0-fast-t2v";
            data.selectedModelName = "Seedance 2.0 Fast";
          }
          
          if (data.imageMode !== undefined) setImageMode(data.imageMode);
          if (data.v2vMode !== undefined) setV2vMode(data.v2vMode);
          
          // Validate selectedModel exists in current models
          const currentModels = data.v2vMode ? v2vModels : (data.imageMode ? i2vModels : t2vModels);
          const validModel = data.selectedModel && currentModels.find(m => m.id === data.selectedModel);
          if (validModel) {
            setSelectedModel(data.selectedModel);
            setSelectedModelName(data.selectedModelName || validModel.name);
          } else {
            // Reset to default model if stored one is invalid
            setSelectedModel(defaultModel.id);
            setSelectedModelName(defaultModel.name);
          }
          
          if (data.selectedAr) setSelectedAr(data.selectedAr);
          if (data.selectedDuration) setSelectedDuration(data.selectedDuration);
          if (data.selectedResolution) setSelectedResolution(data.selectedResolution);
          if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
          if (data.selectedMode) setSelectedMode(data.selectedMode);
          if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
          if (data.selectedCharacterOrientation) setSelectedCharacterOrientation(data.selectedCharacterOrientation);
          if (data.selectedKeepOriginalSound) setSelectedKeepOriginalSound(data.selectedKeepOriginalSound);
          if (data.uploadedImageUrl) setUploadedImageUrl(data.uploadedImageUrl);
          if (data.uploadedVideoUrl) setUploadedVideoUrl(data.uploadedVideoUrl);
          if (data.uploadedVideoName) setUploadedVideoName(data.uploadedVideoName);
          if (data.prompt) setPrompt(data.prompt);
          if (data.localHistory) setLocalHistory(data.localHistory);
          if (data.seed !== undefined) setSeed(data.seed);
          if (data.returnLastFrame !== undefined) setReturnLastFrame(data.returnLastFrame);

          // Update control visibility based on restored model/mode
          applyControlsForModel(
            data.selectedModel || defaultModel.id,
            !!data.imageMode,
            !!data.v2vMode
          );
      }
    } catch (err) {
      console.warn("Failed to load VideoStudio persistence:", err);
    } finally {
      hasRestored.current = true;
    }
  }, [applyControlsForModel, defaultModel.id, imageMode]);

  // ── Adjust height on load ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        const el = textareaRef.current;
        el.style.height = "auto";
        const maxH = window.innerWidth < 768 ? 150 : 250;
        el.style.height = Math.min(el.scrollHeight, maxH) + "px";
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          imageMode,
          v2vMode,
          selectedModel,
          selectedModelName,
          selectedAr,
          selectedDuration,
          selectedResolution,
          selectedQuality,
          selectedMode,
          selectedEffect,
          selectedCharacterOrientation,
          selectedKeepOriginalSound,
          uploadedImageUrl,
          uploadedVideoUrl,
          uploadedVideoName,
          prompt,
          localHistory,
          seed,
          returnLastFrame,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save VideoStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [
    imageMode,
    v2vMode,
    selectedModel,
    selectedModelName,
    selectedAr,
    selectedDuration,
    selectedResolution,
    selectedQuality,
    selectedMode,
    selectedEffect,
    selectedCharacterOrientation,
    selectedKeepOriginalSound,
    uploadedImageUrl,
    uploadedVideoUrl,
    uploadedVideoName,
    prompt,
    localHistory,
    seed,
    returnLastFrame,
  ]);

  // ── Fetch remote history from /api/gallery in pages ───────────────────────
  const fetchRemoteHistory = useCallback(async ({ reset = false } = {}) => {
    if (!apiKey || remoteHistoryLoadingRef.current) return;
    const cursor = reset ? 0 : remoteHistoryNextCursor;
    if (!reset && cursor == null && remoteHistory.length > 0) return;

    remoteHistoryLoadingRef.current = true;
    setIsLoadingRemoteHistory(true);
    setRemoteHistoryError(null);
    try {
      const response = await fetch(`/api/gallery?type=video&limit=${HISTORY_PAGE_SIZE}&cursor=${cursor || 0}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: reset ? "no-cache" : "default",
      });
      if (!response.ok) throw new Error(`Gallery ${response.status}`);
      const data = await response.json();
      const nextEntries = Array.isArray(data.entries) ? data.entries : [];
      setRemoteHistory((prev) => {
        const base = reset ? [] : prev;
        const seen = new Set(base.map((e) => e.id || e.url));
        const merged = [...base];
        nextEntries.forEach((entry) => {
          const key = entry.id || entry.url;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(entry);
          }
        });
        return merged;
      });
      setRemoteHistoryNextCursor(data.nextCursor ?? null);
    } catch (err) {
      console.warn("Failed to fetch remote history:", err);
      setRemoteHistoryError(err.message || "Ошибка загрузки истории");
    } finally {
      remoteHistoryLoadingRef.current = false;
      setIsLoadingRemoteHistory(false);
    }
  }, [apiKey, remoteHistory.length, remoteHistoryNextCursor]);

  useEffect(() => {
    setRemoteHistory([]);
    setRemoteHistoryNextCursor(null);
    fetchRemoteHistory({ reset: true });
  }, [apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleHistoryScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (!el || isLoadingRemoteHistory || remoteHistoryNextCursor == null) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 900) {
      fetchRemoteHistory();
    }
  }, [fetchRemoteHistory, isLoadingRemoteHistory, remoteHistoryNextCursor]);

  // ── Derived UI values ────────────────────────────────────────────────────

  const processDroppedImage = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Изображение превышает лимит 10 МБ.");
      return;
    }
    setImageUploading(true);
    setImageProgress(0);
    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setImageProgress(pct);
      });
      setUploadedImageUrl(url);
      setUploadedVideoUrl(null);
      setUploadedVideoName(null);
      setV2vMode(false);
      if (!imageMode) {
        const currentT2V = t2vModels.find((m) => m.id === selectedModel);
        const sibling = currentT2V?.family
          ? i2vModels.find((m) => m.family === currentT2V.family)
          : null;
        const target = sibling || i2vModels[0];
        setImageMode(true);
        setSelectedModel(target.id);
        setSelectedModelName(target.name);
        applyControlsForModel(target.id, true, false);
      }
      setPromptDisabled(false);
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setImageUploading(false);
      setImageProgress(0);
    }
  };

  const processDroppedVideo = async (file) => {
    const multimodal = getCurrentModel()?.acceptsVideo;
    if (v2vModels.length === 0 && !multimodal) {
      alert("Обработка видео на входе пока не поддерживается.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Видео превышает лимит 50 МБ.");
      return;
    }
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setVideoProgress(pct);
      });
      setUploadedVideoUrl(url);
      setUploadedVideoName(file.name);
      // Multimodal models keep the current model — video is just an extra input.
      if (multimodal) {
        setPromptDisabled(false);
        return;
      }
      if (imageMode) {
        setUploadedImageUrl(null);
        setImageMode(false);
      }
      setV2vMode(true);
      const firstV2V = v2vModels[0];
      setSelectedModel(firstV2V.id);
      setSelectedModelName(firstV2V.name);
      applyControlsForModel(firstV2V.id, false, true);
      setPrompt("");
      setPromptDisabled(true);
    } catch (err) {
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
    }
  };

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      const videoFiles = droppedFiles.filter(f => f.type.startsWith('video/'));
      
      if (videoFiles.length > 0) {
        processDroppedVideo(videoFiles[0]);
      } else if (imageFiles.length > 0) {
        processDroppedImage(imageFiles[0]);
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImage, processDroppedVideo]);

  // Initialise controls for default model on mount
  useEffect(() => {
    if (hasRestored.current) return;
    applyControlsForModel(defaultModel.id, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [openDropdown]);

  // ── textarea auto-resize ──────────────────────────────────────────────────
  const handlePromptInput = (e) => {
    const el = e.target;
    const savedScrollTop = el.scrollTop;
    const savedScrollLeft = el.scrollLeft;
    setPrompt(e.target.value);
    el.style.height = "auto";
    const maxH = window.innerWidth < 768 ? 300 : 400;
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
    el.scrollTop = savedScrollTop;
    el.scrollLeft = savedScrollLeft;
    
    // Sync scroll with highlight div
    const highlightDiv = el.parentElement?.querySelector('div.pointer-events-none');
    if (highlightDiv) {
      highlightDiv.scrollTop = savedScrollTop;
      highlightDiv.scrollLeft = savedScrollLeft;
    }
  };

  // ── image upload ─────────────────────────────────────────────────────────
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Изображение превышает лимит 10 МБ.");
      return;
    }
    setImageUploading(true);
    setImageProgress(0);

    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setImageProgress(pct);
      });
      setUploadedImageUrl(url);

      // Motion-control v2v: image is a second input, not a mode switch
      if (isMotionControlSelection(selectedModel, v2vMode)) {
        setPromptDisabled(false);
      } else {
        // Clear v2v if active
        setUploadedVideoUrl(null);
        setUploadedVideoName(null);
        setV2vMode(false);

        if (!imageMode) {
          const currentT2V = t2vModels.find((m) => m.id === selectedModel);
          const sibling = currentT2V?.family
            ? i2vModels.find((m) => m.family === currentT2V.family)
            : null;
          const target = sibling || i2vModels[0];
          setImageMode(true);
          setSelectedModel(target.id);
          setSelectedModelName(target.name);
          applyControlsForModel(target.id, true, false);
        }
        setPromptDisabled(false);
      }
    } catch (err) {
      console.error("[VideoStudio] Image upload failed:", err);
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setImageUploading(false);
      setImageProgress(0);
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    }
  };

  const clearImageUpload = () => {
    setUploadedImageUrl(null);
    setUploadedEndImageUrl(null);
    // Motion-control v2v: keep model and video; just drop the image
    if (isMotionControlSelection(selectedModel, v2vMode)) return;
    setImageMode(false);
    const first = t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };

  // ── end-frame upload (FLF i2v models) ──────────────────────────────────────
  const handleEndImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Изображение превышает лимит 10 МБ.");
      return;
    }
    setEndImageUploading(true);
    setEndImageProgress(0);
    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setEndImageProgress(pct);
      });
      setUploadedEndImageUrl(url);
    } catch (err) {
      alert(`End frame upload failed: ${err.message}`);
    } finally {
      setEndImageUploading(false);
      setEndImageProgress(0);
      if (endImageFileInputRef.current) endImageFileInputRef.current.value = "";
    }
  };

  const clearEndImage = () => setUploadedEndImageUrl(null);

  // ── Seedance 2.0 multimodal reference uploads (multiple image/video/audio) ──
  const refKindOf = (file) =>
    file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : null;

  // Per-kind label + ordinal for the @reference chip, e.g. 图片1, 视频2, 音频1.
  // Note: faceAsset is always mapped to 图片1 if present.
  const refLabel = (kind, index) => {
    const word = kind === "image" ? "图片" : kind === "video" ? "视频" : "音频";
    
    let actualIndex = index;
    if (kind === "image") {
      // Character is always 图片1 in muapi.js if it exists.
      if (faceAsset) {
        actualIndex += 1;
      }
      // Main uploaded image is 图片2 (if character exists) or 图片1.
      if (uploadedImageUrl) {
        // muapi.js skips uploadedImageUrl if it's the same as faceAsset.thumbnail
        if (!faceAsset || uploadedImageUrl !== faceAsset.thumbnail) {
          actualIndex += 1;
        }
      }
    }
    
    return `${word}${actualIndex}`;
  };

  // Compress image before upload to reduce file size and speed up upload
  const compressImage = async (file) => {
    if (!file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1920;
          const maxHeight = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.85 // Quality 85% - good balance between size and quality
          );
        };
      };
    });
  };

  const handleRefFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (refFileInputRef.current) refFileInputRef.current.value = "";

    // Upload all files in parallel
    const uploadPromises = files.map(async (file) => {
      const kind = refKindOf(file);
      if (!kind) {
        alert(`Файл ${file.name}: поддерживаются только изображения, видео и аудио.`);
        return;
      }
      const limitMb = kind === "image" ? 10 : 100;
      if (file.size > limitMb * 1024 * 1024) {
        alert(`Файл ${file.name} превышает лимит ${limitMb} МБ.`);
        return;
      }
      
      // Compress image to speed up upload
      const processedFile = kind === "image" ? await compressImage(file) : file;
      
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      let uploadAborted = false;
      let xhr = null;

      setRefFiles((prev) => [
        ...prev,
        { 
          id, 
          url: null, 
          kind, 
          name: file.name, 
          uploading: true, 
          progress: 0,
          cancel: () => {
            uploadAborted = true;
            if (xhr) xhr.abort();
            setRefFiles((prev) => prev.filter((f) => f.id !== id));
          }
        },
      ]);
      try {
        // Get a presigned PUT URL from the server, then PUT the file directly
        // from the browser to TOS — no Vercel body size limit applies.
        const presignRes = await fetch(
          `/api/upload-file?filename=${encodeURIComponent(processedFile.name)}&type=${encodeURIComponent(processedFile.type || 'application/octet-stream')}`,
        );
        if (uploadAborted) return;
        if (!presignRes.ok) throw new Error('Не удалось получить URL загрузки');
        const { putUrl, publicUrl } = await presignRes.json();

        await new Promise((resolve, reject) => {
          if (uploadAborted) return reject(new Error('aborted'));
          xhr = new XMLHttpRequest();
          xhr.open('PUT', putUrl);
          xhr.setRequestHeader('Content-Type', processedFile.type || 'application/octet-stream');
          xhr.upload.onprogress = (e) => {
            if (uploadAborted) return;
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setRefFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: pct } : f)));
            }
          };
          xhr.onload = () => {
            if (uploadAborted) return;
            xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`TOS PUT ${xhr.status}`));
          };
          xhr.onerror = () => {
            if (uploadAborted) return;
            reject(new Error('Ошибка сети при загрузке'));
          };
          xhr.send(processedFile);
        });
        if (uploadAborted) return;
        setRefFiles((prev) => prev.map((f) => (f.id === id ? { ...f, url: publicUrl, uploading: false, progress: 100 } : f)));
      } catch (err) {
        if (err.message === 'aborted') return;
        console.error("[VideoStudio] Reference upload failed:", err);
        setRefFiles((prev) => prev.filter((f) => f.id !== id));
        alert(`Не удалось загрузить ${file.name}: ${err.message}`);
      }
    });

    await Promise.all(uploadPromises);
  };

  const removeRefFile = (id) => setRefFiles((prev) => prev.filter((f) => f.id !== id));

  // Insert the @reference token into the prompt at the caret (or append).
  const insertRefToken = (token) => {
    const el = textareaRef.current;
    if (!el) {
      setPrompt((prev) => (prev ? prev + " " : "") + token + " ");
      return;
    }
    const savedScrollTop = el.scrollTop;
    const savedScrollLeft = el.scrollLeft;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    
    // Обновляем текст
    setPrompt((prev) => prev.slice(0, start) + token + " " + prev.slice(end));
    
    // Восстанавливаем прокрутку сразу и повторно через requestAnimationFrame
    const restoreScroll = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.scrollTop = savedScrollTop;
        textarea.scrollLeft = savedScrollLeft;
        textarea.focus();
        const pos = start + token.length + 1;
        textarea.setSelectionRange(pos, pos);
      }
    };
    restoreScroll();
    requestAnimationFrame(restoreScroll);
    setTimeout(restoreScroll, 0);
  };

  // Function to escape HTML special characters
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Function to highlight tags in text
  const renderHighlightedPrompt = () => {
    if (!prompt) return "";
    const tagRegex = /(图片\d+|视频\d+|音频\d+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = tagRegex.exec(prompt)) !== null) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(prompt.slice(lastIndex, match.index)));
      }
      parts.push(`<span class="bg-blue-500/20 text-blue-300 rounded px-0 py-0">${escapeHtml(match[0])}</span>`);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < prompt.length) {
      parts.push(escapeHtml(prompt.slice(lastIndex)));
    }
    return parts.join("");
  };

  // ── video upload ─────────────────────────────────────────────────────────
  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("Видео превышает лимит 50 МБ.");
      return;
    }
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      const url = await uploadFile(apiKey, file, (pct) => {
        setVideoProgress(pct);
      });
      setUploadedVideoUrl(url);
      setUploadedVideoName(file.name);

      // Multimodal models (e.g. Seedance 2.0) take video as an extra conditioning
      // input alongside text/image — keep the current model, don't switch to v2v.
      if (getCurrentModel()?.acceptsVideo) {
        setPromptDisabled(false);
      } else if (isMotionControlSelection(selectedModel, v2vMode)) {
        // Already in motion-control mode — keep model and image, allow prompt
        setPromptDisabled(false);
      } else {
        // Default v2v flow (e.g. watermark remover) — auto-pick the first v2v model
        if (imageMode) {
          setUploadedImageUrl(null);
          setImageMode(false);
        }
        setV2vMode(true);
        const firstV2V = v2vModels[0];
        setSelectedModel(firstV2V.id);
        setSelectedModelName(firstV2V.name);
        applyControlsForModel(firstV2V.id, false, true);
        setPrompt("");
        setPromptDisabled(true);
      }
    } catch (err) {
      console.error("[VideoStudio] Video upload failed:", err);
      alert(`Video upload failed: ${err.message}`);
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    }
  };

  const clearVideoUpload = () => {
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    // For multimodal models the video is just an optional input — keep the model.
    if (getCurrentModel()?.acceptsVideo) {
      setPromptDisabled(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
      return;
    }
    setV2vMode(false);
    const first = t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
  };

  const handleAudioFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("Аудио превышает лимит 50 МБ.");
      return;
    }
    setAudioUploading(true);
    setAudioProgress(0);
    try {
      const url = await uploadFile(apiKey, file, (pct) => setAudioProgress(pct));
      setUploadedAudioUrl(url);
      setUploadedAudioName(file.name);
    } catch (err) {
      console.error("[VideoStudio] Audio upload failed:", err);
      alert(`Audio upload failed: ${err.message}`);
    } finally {
      setAudioUploading(false);
      setAudioProgress(0);
      if (audioFileInputRef.current) audioFileInputRef.current.value = "";
    }
  };

  const clearAudioUpload = () => {
    setUploadedAudioUrl(null);
    setUploadedAudioName(null);
    if (audioFileInputRef.current) audioFileInputRef.current.value = "";
  };

  // ── model selection from dropdown ─────────────────────────────────────────
  const handleModelSelect = useCallback(
    (m, isV2V) => {
      if (isV2V) {
        setV2vMode(true);
        setImageMode(false);
        const isMC = !!m.imageField;
        if (!isMC) {
          // Single-input v2v (watermark remover etc.) — drop any image
          setUploadedImageUrl(null);
        }
        setSelectedModel(m.id);
        setSelectedModelName(m.name);
        applyControlsForModel(m.id, false, true);
        if (isMC) {
          // Motion-control: prompt is editable, video+image are needed
          setPromptDisabled(false);
        } else {
          setPrompt("");
          setPromptDisabled(true);
        }
      } else {
        if (v2vMode) {
          setV2vMode(false);
          setUploadedVideoUrl(null);
          setUploadedVideoName(null);
          setPromptDisabled(false);
        }
        setSelectedModel(m.id);
        setSelectedModelName(m.name);
        applyControlsForModel(m.id, imageMode, false);
      }
    },
    [v2vMode, imageMode, applyControlsForModel],
  );

  // Write a completed entry directly to PERSIST_KEY even when unmounted.
  const persistVideoEntryToStorage = useCallback((entry) => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(data.localHistory) ? data.localHistory : [];
      if (prev.some((e) => e.id === entry.id)) return;
      data.localHistory = [entry, ...prev].slice(0, 30);
      localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
    } catch {}
  }, []);

  const replaceVideoEntryUrl = useCallback((entryId, nextUrl) => {
    if (!entryId || !nextUrl) return;
    setLocalHistory((prev) =>
      prev.map((item) => (item.id === entryId ? { ...item, url: nextUrl } : item)),
    );
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(data.localHistory) ? data.localHistory : [];
      data.localHistory = prev.map((item) =>
        item.id === entryId ? { ...item, url: nextUrl } : item,
      );
      localStorage.setItem(PERSIST_KEY, JSON.stringify(data));
    } catch {}
    try {
      const raw = localStorage.getItem(PENDING_RESULT_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (data?.entry?.id === entryId) {
        data.entry.url = nextUrl;
        localStorage.setItem(PENDING_RESULT_KEY, JSON.stringify(data));
      }
    } catch {}
  }, []);

  const persistVideoToGallery = useCallback(async (entry) => {
    if (!entry?.url) return null;
    try {
      const r = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        keepalive: true,
        body: JSON.stringify({
          url: entry.url,
          type: "video",
          model: entry.model,
          prompt: entry.prompt || "",
        }),
      });
      const payload = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error("Не удалось сохранить в галерею: " + (payload.error || r.status), { duration: 4000 });
        return null;
      }
      const permanentUrl = payload?.entry?.url;
      if (permanentUrl && permanentUrl !== entry.url) {
        replaceVideoEntryUrl(entry.id, permanentUrl);
        setCanvasUrl((prev) => (prev === entry.url ? permanentUrl : prev));
      }
      return payload?.entry || null;
    } catch (e) {
      toast.error("Не удалось сохранить в галерею: " + (e.message || "ошибка"), { duration: 4000 });
      return null;
    }
  }, [apiKey, replaceVideoEntryUrl]);

  // ── add to local history ──────────────────────────────────────────────────
  const addToLocalHistory = useCallback((entry) => {
    setLocalHistory((prev) => {
      const key = entry.id || entry.url;
      // Skip duplicates
      const existing = prev.find(e => (e.id || e.url) === key);
      if (existing) return prev;
      // Add new entry at start
      return [entry, ...prev].slice(0, 30);
    });
    setActiveHistoryIdx(0);
  }, []);

  const deleteHistoryEntry = useCallback(async (entry, entryIdx) => {
    const deleteId = entry?.id || "local-media";
    const deleteUrl = typeof entry?.url === "string" ? entry.url : "";

    if (deleteUrl) {
      try {
        const response = await fetch(`/api/gallery/${encodeURIComponent(deleteId)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: deleteUrl }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }
      } catch (err) {
        toast.error(`Не удалось удалить видео: ${err.message || "ошибка"}`, { duration: 4000 });
        return;
      }
    }

    setLocalHistory((prev) => prev.filter((item) => item?.id !== entry?.id && item?.url !== entry?.url));
    setRemoteHistory((prev) => prev.filter((item) => item?.id !== entry?.id && item?.url !== entry?.url));

    const nextHistory = history.filter((_, idx) => idx !== entryIdx);
    if (canvasUrl === entry?.url) {
      const nextEntry = nextHistory[0] || null;
      setCanvasUrl(nextEntry?.url || null);
      setCanvasModel(nextEntry?.model || null);
      setShowCanvas(!!nextEntry);
      setActiveHistoryIdx(0);
    }

    toast.success("Удалено", { duration: 2000 });
  }, [canvasUrl, history]);

  // ── show result in canvas ─────────────────────────────────────────────────
  const showVideoInCanvas = useCallback((url, model) => {
    setCanvasUrl(url);
    setCanvasModel(model);
    setShowCanvas(true);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;

    const restorePending = async () => {
      let tasks = [];
      try {
        tasks = await listPendingGenerations({ studio: "video", statuses: ["pending", "running"] });
      } catch {
        return;
      }

      for (const task of tasks) {
        if (cancelled) return;
        const tempId = task.id || task.task_id || task.request_id || `pending_${Date.now()}`;
        addTask({ id: tempId, prompt: task.prompt, model: task.model });
        try {
          const res = task.provider === "ark"
            ? await pollArkTask(task.task_id, task.bill)
            : await resumeVideoGeneration(apiKey, task);
          if (!res?.url) throw new Error("API не вернул ссылку на видео");

          const nextEntry = {
            id: res.id || task.request_id || task.task_id || tempId,
            url: res.url,
            prompt: task.prompt || "",
            model: task.model,
            aspect_ratio: task.meta?.aspect_ratio || null,
            duration: task.meta?.duration || null,
            timestamp: new Date().toISOString(),
            last_frame_url: res.last_frame_url || null,
          };
          const updateResult = await updatePendingGeneration({
            ...task,
            status: "completed",
            entry: nextEntry,
          }).catch(() => null);
          const finalUrl = updateResult?.entry?.url || updateResult?.task?.entry?.url || nextEntry.url;
          const finalEntry = { ...nextEntry, url: finalUrl };

          if (cancelled) return;
          if (task.model?.startsWith("seedance-2.0")) {
            setLastGenerationId(finalEntry.id);
            setLastGenerationModel(task.model);
          }
          addToLocalHistory(finalEntry);
          persistVideoEntryToStorage(finalEntry);
          showVideoInCanvas(finalEntry.url, task.model);
          fetchRemoteHistory({ reset: true });
          if (onGenerationComplete) {
            onGenerationComplete({
              url: finalEntry.url,
              model: task.model,
              prompt: finalEntry.prompt,
              type: "video",
            });
          }
        } catch (e) {
          if (!cancelled) {
            updatePendingGeneration({
              ...task,
              status: "failed",
              error: e.message || "Ошибка генерации",
            }).catch(() => {});
          }
        } finally {
          if (!cancelled) removeTask(tempId);
        }
      }
    };

    restorePending();
    return () => { cancelled = true; };
  }, [apiKey, addTask, removeTask, addToLocalHistory, persistVideoEntryToStorage, showVideoInCanvas, fetchRemoteHistory, onGenerationComplete]);

  // ── resume an ARK task that survived navigation ───────────────────────────
  // If the user navigated away mid-generation the polling promise kept running
  // in the background, but the React state was lost. On remount we check
  // localStorage for an in-progress taskId and resume polling so the result
  // is captured when the task finishes.
  useEffect(() => {
    let stored;
    try { stored = JSON.parse(localStorage.getItem(ARK_TASK_KEY)); } catch {}
    if (!stored?.taskId) return;

    // Cancelled becomes true when this component instance unmounts. Any async
    // operations that complete after unmount skip UI updates and gallery saves,
    // preventing duplicate saves when the user navigates back and forth while
    // a generation is in progress (each mount would otherwise start a new poll
    // and all of them would fire gallery saves when the task eventually finishes).
    let cancelled = false;

    const showResult = (url, genId, billingError = null) => {
      if (cancelled) return;
      localStorage.removeItem(ARK_TASK_KEY);
      setLastGenerationId(genId);
      setLastGenerationModel(stored.model);
      const entry = {
        id: genId, url, prompt: stored.prompt || "",
        model: stored.model, aspect_ratio: stored.aspect_ratio,
        duration: stored.duration, timestamp: new Date().toISOString(),
      };
      addToLocalHistory(entry);
      persistVideoEntryToStorage(entry);
      showVideoInCanvas(url, stored.model);
      persistVideoToGallery(entry).then(() => {
        fetchRemoteHistory({ reset: true }); // Refresh remote history after saving to gallery, bypassing cache
      });
      if (billingError) {
        reportAdminIncident({
          type: "billing_failed",
          message: billingError,
          dedupeKey: `video-billing:${genId || stored.taskId || "unknown"}`,
          payload: {
            studio: "video",
            provider: "ark",
            phase: "resume",
            model: stored.model,
            taskId: stored.taskId || null,
            generationId: genId || null,
            prompt: stored.prompt || "",
            billing_error: billingError,
          },
        });
      }
    };

    // Task already finished while we were away — show result immediately.
    if (stored.status === "done" && stored.resultUrl) {
      showResult(stored.resultUrl, stored.genId || stored.taskId);
      return () => { cancelled = true; };
    }

    // Task still in progress — resume polling.
    const tempId = stored.taskId || `recovered_${Date.now()}`;
    addTask({ id: tempId, prompt: stored.prompt, model: stored.model });

    pollArkTask(stored.taskId, stored.bill)
      .then((res) => showResult(res.url, res.id || stored.taskId, res.billing_error || null))
      .catch((e) => {
        if (cancelled) return;
        localStorage.removeItem(ARK_TASK_KEY);
        reportAdminIncident({
          type: "generation_failed",
          message: e.message || "Ошибка восстановления генерации",
          dedupeKey: `video-resume-ark:${stored.taskId || tempId}`,
          payload: {
            studio: "video",
            provider: "ark",
            phase: "resume_poll",
            model: stored.model,
            taskId: stored.taskId || null,
            bill: stored.bill || null,
            error: e.message || "Ошибка генерации",
          },
        });
        setGenerateError(e.message?.slice(0, 80) || "Ошибка генерации");
        updateTask(tempId, { status: 'error', error: e.message });
        setTimeout(() => {
          setGenerateError(null);
          removeTask(tempId);
        }, 4000);
      })
      .finally(() => { 
        if (!cancelled) removeTask(tempId); 
      });

    return () => { cancelled = true; };
  }, [addTask, updateTask, removeTask, addToLocalHistory, persistVideoEntryToStorage, showVideoInCanvas, persistVideoToGallery, fetchRemoteHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── resume a non-ARK Memefast generation after a tab switch ───────────────
  useEffect(() => {
    let snap;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      snap = JSON.parse(raw);
    } catch {
      try { localStorage.removeItem(PENDING_KEY); } catch {}
      return;
    }
    if (!snap?.requestId || !snap?.ts || Date.now() - snap.ts > 10 * 60 * 1000) {
      try { localStorage.removeItem(PENDING_KEY); } catch {}
      return;
    }

    if (snap.prompt) setPrompt(snap.prompt);

    const findResult = () => {
      try {
        const rd = JSON.parse(localStorage.getItem(PENDING_RESULT_KEY) || '{}');
        if (rd.requestId !== snap.requestId) return null;
        return rd.entry || null;
      } catch { return null; }
    };

    const restore = (entry) => {
      setLocalHistory(prev => prev.some(p => p.id === entry.id) ? prev : [entry, ...prev].slice(0, 30));
      setActiveHistoryIdx(0);
      showVideoInCanvas(entry.url, entry.model);
      try { localStorage.removeItem(PENDING_RESULT_KEY); } catch {}
      try { localStorage.removeItem(PENDING_KEY); } catch {}
    };

    const alreadyDone = findResult();
    if (alreadyDone) { restore(alreadyDone); return; }

    const tempId = snap.requestId || `pending_${Date.now()}`;
    addTask({ id: tempId, prompt: snap.prompt, model: snap.model });

    let cancelled = false;
    const intervalId = setInterval(() => {
      if (cancelled) return;
      if (!localStorage.getItem(PENDING_KEY)) {
        clearInterval(intervalId);
        const entry = findResult();
        if (entry) restore(entry);
        if (!cancelled) removeTask(tempId);
        return;
      }
      if (Date.now() - snap.ts > 10 * 60 * 1000) {
        clearInterval(intervalId);
        try { localStorage.removeItem(PENDING_KEY); } catch {}
        if (!cancelled) removeTask(tempId);
      }
    }, 2000);

    return () => { cancelled = true; clearInterval(intervalId); };
  }, [addTask, removeTask, showVideoInCanvas]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── generate ──────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const currentModel = getCurrentModel();
    const isExtendMode = currentModel?.requiresRequestId;
    const trimmedPrompt = prompt.trim();

    // Validations
    if (currentModel?.provider === "ark") {
      if (refFiles.some((f) => f.uploading)) {
        alert("Подождите, файлы ещё загружаются.");
        return;
      }
      const readyRefs = refFiles.filter((f) => f.url);
      if (!trimmedPrompt && readyRefs.length === 0) {
        alert("Введите запрос или загрузите хотя бы один файл.");
        return;
      }
    } else if (v2vMode) {
      if (!uploadedVideoUrl) {
        alert("Пожалуйста, сначала загрузите видео.");
        return;
      }
      if (currentModel?.imageField && !uploadedImageUrl) {
        alert("Пожалуйста, загрузите референсное изображение для управления движением.");
        return;
      }
      if (currentModel?.promptRequired && !trimmedPrompt) {
        alert("Пожалуйста, опишите желаемое движение.");
        return;
      }
    } else if (isExtendMode) {
      if (!lastGenerationId) {
        alert("Генерация Seedance 2.0 не найдена. Сначала создайте видео.");
        return;
      }
    } else if (imageMode) {
      if (!uploadedImageUrl) {
        alert("Please upload a start frame image first.");
        return;
      }
    } else {
      if (!trimmedPrompt) {
        alert("Пожалуйста, введите запрос для создания видео.");
        return;
      }
    }

    const taskId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const taskModel = selectedModel;
    const taskPrompt = trimmedPrompt;
    
    addTask({ 
      id: taskId, 
      prompt: taskPrompt, 
      model: taskModel,
      aspect_ratio: selectedAr,
      duration: selectedDuration
    });

    setGenerateError(null);

    // ── Internal async executor ──
    const execute = async () => {
      let pendingTaskPromise = null;
      let pendingTaskId = null;
      let pendingExternalId = null;
      let pendingBill = null;
      const basePendingTask = {
        studio: "video",
        type: "video",
        model: taskModel,
        prompt: taskPrompt,
        meta: {
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          resolution: selectedResolution || null,
        },
      };

      try {
        // ── Seedance 2.0 (Ark) multimodal path ──
        if (currentModel?.provider === "ark") {
          const isI2V = i2vModels.some((m) => m.id === taskModel);
          const params = buildSeedanceStudioPayload({
            model: taskModel,
            prompt: taskPrompt,
            aspectRatio: selectedAr,
            uploadedImageUrl,
            uploadedVideoUrl,
            uploadedAudioUrl,
            refFiles,
            faceAsset,
            isI2V,
            seed,
            returnLastFrame,
          });
          params.onTaskId = (arkTaskId, bill) => {
            updateTask(taskId, { arkTaskId, bill });
            pendingExternalId = arkTaskId;
            pendingBill = bill;
            pendingTaskPromise = savePendingGeneration({
              ...basePendingTask,
              id: arkTaskId,
              provider: "ark",
              task_id: arkTaskId,
              bill,
              status: "running",
            }).then((task) => {
              pendingTaskId = task?.id || arkTaskId;
              return task;
            }).catch(() => null);
          };
          console.info("[VideoStudio] Seedance asset payload", {
            model: taskModel,
            assetRefs: (params.image_urls || []).filter((item) => String((typeof item === "string" ? item : item?.url) || "").startsWith("asset://")).length,
            imageRefs: [params.image_url, ...(params.image_urls || [])].filter(Boolean).length,
            videoRefs: [params.video_url, ...(params.video_urls || [])].filter(Boolean).length,
            audioRefs: [params.audio_url, ...(params.audio_urls || [])].filter(Boolean).length,
          });
          const durations = getCurrentDurations(taskModel);
          if (durations.length > 0) params.duration = selectedDuration;
          const resolutions = getCurrentResolutions(taskModel);
          if (resolutions.length > 0) params.resolution = selectedResolution;

          const res = isI2V
            ? await generateI2V(apiKey, params)
            : await generateVideo(apiKey, params);
          
          if (!res?.url) throw new Error("No video URL returned by API");

          const genId = res.id || Date.now().toString();
          if (pendingTaskPromise) await pendingTaskPromise;
          
          const entry = {
            id: genId, 
            url: res.url, 
            prompt: taskPrompt,
            model: taskModel, 
            aspect_ratio: selectedAr,
            duration: selectedDuration, 
            timestamp: new Date().toISOString(),
            seed: seed !== -1 ? seed : undefined,
            last_frame_url: res.last_frame_url,
          };
          
          if (isMountedRef.current) {
            setLastGenerationId(genId);
            setLastGenerationModel(taskModel);
            addToLocalHistory(entry);
            persistVideoEntryToStorage(entry);
            showVideoInCanvas(res.url, taskModel);
            const pendingResult = pendingTaskId
              ? await updatePendingGeneration({
                ...basePendingTask,
                id: pendingTaskId,
                provider: "ark",
                task_id: pendingExternalId || pendingTaskId,
                bill: pendingBill,
                status: "completed",
                entry,
              }).catch(() => null)
              : null;
            const finalUrl = pendingResult?.entry?.url || pendingResult?.task?.entry?.url || entry.url;
            if (finalUrl !== entry.url) {
              replaceVideoEntryUrl(entry.id, finalUrl);
              setCanvasUrl((prev) => (prev === entry.url ? finalUrl : prev));
            } else if (!pendingTaskId) {
              persistVideoToGallery(entry).then(() => {
                fetchRemoteHistory({ reset: true });
              });
            }
            fetchRemoteHistory({ reset: true });
            if (onGenerationComplete)
              onGenerationComplete({ url: finalUrl, model: taskModel, prompt: taskPrompt, type: "video" });
          }
          removeTask(taskId);
          return;
        }

        // ── Non-Ark path ──
        let res;
        if (v2vMode) {
          const v2vParams = {
            model: taskModel,
            video_url: uploadedVideoUrl,
          };
          v2vParams.onRequestId = (requestId) => {
            pendingExternalId = requestId;
            pendingTaskPromise = savePendingGeneration({
              ...basePendingTask,
              id: requestId,
              provider: currentModel?.platform || currentModel?.provider || "unified",
              request_id: requestId,
              status: "running",
            }).then((task) => {
              pendingTaskId = task?.id || requestId;
              return task;
            }).catch(() => null);
          };
          if (currentModel?.imageField && uploadedImageUrl) {
            v2vParams.image_url = uploadedImageUrl;
          }
          if (currentModel?.hasPrompt && taskPrompt) {
            v2vParams.prompt = taskPrompt;
          }
          res = await processV2V(apiKey, v2vParams);
        } else if (imageMode) {
          const i2vParams = { model: taskModel, image_url: uploadedImageUrl };
          i2vParams.onRequestId = (requestId) => {
            pendingExternalId = requestId;
            pendingTaskPromise = savePendingGeneration({
              ...basePendingTask,
              id: requestId,
              provider: currentModel?.platform || currentModel?.provider || "unified",
              request_id: requestId,
              status: "running",
            }).then((task) => {
              pendingTaskId = task?.id || requestId;
              return task;
            }).catch(() => null);
          };
          if (taskPrompt) i2vParams.prompt = taskPrompt;
          i2vParams.aspect_ratio = selectedAr;
          const i2vModel = i2vModels.find((m) => m.id === taskModel);
          if (uploadedEndImageUrl && i2vModel?.lastImageField) {
            i2vParams.last_image = uploadedEndImageUrl;
          }
          const durations = getDurationsForI2VModel(taskModel);
          if (durations.length > 0) i2vParams.duration = selectedDuration;
          const resolutions = getResolutionsForI2VModel(taskModel);
          if (resolutions.length > 0) i2vParams.resolution = selectedResolution;
          if (selectedQuality) i2vParams.quality = selectedQuality;
          if (selectedMode) i2vParams.mode = selectedMode;
          if (showEffect && selectedEffect) i2vParams.name = selectedEffect;
          const i2vModelObj = i2vModels.find((m) => m.id === taskModel);
          if (i2vModelObj?.acceptsVideo && uploadedVideoUrl) i2vParams.video_url = uploadedVideoUrl;
          if (i2vModelObj?.acceptsAudio && uploadedAudioUrl) i2vParams.audio_url = uploadedAudioUrl;

          res = await generateI2V(apiKey, i2vParams);
        } else {
          const params = { model: taskModel };
          params.onRequestId = (requestId) => {
            pendingExternalId = requestId;
            pendingTaskPromise = savePendingGeneration({
              ...basePendingTask,
              id: requestId,
              provider: currentModel?.platform || currentModel?.provider || "unified",
              request_id: requestId,
              status: "running",
            }).then((task) => {
              pendingTaskId = task?.id || requestId;
              return task;
            }).catch(() => null);
          };
          if (taskPrompt) params.prompt = taskPrompt;
          if (isExtendMode) {
            params.request_id = lastGenerationId;
          } else {
            params.aspect_ratio = selectedAr;
          }
          const durations = getDurationsForModel(taskModel);
          if (durations.length > 0) params.duration = selectedDuration;
          const resolutions = getResolutionsForVideoModel(taskModel);
          if (resolutions.length > 0) params.resolution = selectedResolution;
          if (selectedQuality) params.quality = selectedQuality;
          if (selectedMode) params.mode = selectedMode;
          if (selectedCharacterOrientation) params.character_orientation = selectedCharacterOrientation;
          if (selectedKeepOriginalSound) params.keep_original_sound = selectedKeepOriginalSound;
          const t2vModelObj = t2vModels.find((m) => m.id === taskModel);
          if (t2vModelObj?.acceptsImage && uploadedImageUrl) params.image_url = uploadedImageUrl;
          if (t2vModelObj?.acceptsVideo && uploadedVideoUrl) params.video_url = uploadedVideoUrl;
          if (t2vModelObj?.acceptsAudio && uploadedAudioUrl) params.audio_url = uploadedAudioUrl;

          res = await generateVideo(apiKey, params);
        }

        if (!res?.url) throw new Error("No video URL returned by API");
        if (pendingTaskPromise) await pendingTaskPromise;

        const genId = res.id || Date.now().toString();
        const entry = {
          id: genId,
          url: res.url,
          prompt: (v2vMode && !currentModel?.hasPrompt) ? "" : taskPrompt,
          model: taskModel,
          aspect_ratio: selectedAr,
          duration: selectedDuration,
          timestamp: new Date().toISOString(),
        };

        if (isMountedRef.current) {
          if (taskModel.startsWith("seedance-2.0")) {
            setLastGenerationId(genId);
            setLastGenerationModel(taskModel);
          } else {
            setLastGenerationId(null);
            setLastGenerationModel(null);
          }
          addToLocalHistory(entry);
          persistVideoEntryToStorage(entry);
          const pendingResult = pendingTaskId
            ? await updatePendingGeneration({
              ...basePendingTask,
              id: pendingTaskId,
              provider: currentModel?.platform || currentModel?.provider || "unified",
              request_id: pendingExternalId || pendingTaskId,
              status: "completed",
              entry,
            }).catch(() => null)
            : null;
          const finalUrl = pendingResult?.entry?.url || pendingResult?.task?.entry?.url || entry.url;
          if (finalUrl !== entry.url) {
            replaceVideoEntryUrl(entry.id, finalUrl);
          } else if (!pendingTaskId) {
            persistVideoToGallery(entry).then(() => {
              fetchRemoteHistory({ reset: true });
            });
          }
          fetchRemoteHistory({ reset: true });
          showVideoInCanvas(finalUrl, taskModel);
          if (onGenerationComplete)
            onGenerationComplete({
              url: finalUrl,
              model: taskModel,
              prompt: entry.prompt,
              type: "video",
            });
        }
        removeTask(taskId);
      } catch (e) {
        console.error("[VideoStudio]", e);
        reportAdminIncident({
          type: "generation_failed",
          message: e.message || "Ошибка генерации",
          dedupeKey: `video-generate:${taskId}`,
          payload: {
            studio: "video",
            provider: currentModel?.provider || currentModel?.platform || "unknown",
            phase: "generate",
            model: taskModel,
            taskId,
            prompt: taskPrompt,
            aspect_ratio: selectedAr,
            duration: selectedDuration,
            resolution: selectedResolution,
            error: e.message || "Ошибка генерации",
          },
        });
        setGenerateError(e.message?.slice(0, 80) || "Ошибка генерации");
        updateTask(taskId, { status: 'error', error: e.message });
        setTimeout(() => {
          setGenerateError(null);
          removeTask(taskId);
        }, 4000);
        if (pendingTaskPromise) {
          await pendingTaskPromise.catch(() => null);
        }
        if (pendingTaskId) {
          updatePendingGeneration({
            ...basePendingTask,
            id: pendingTaskId,
            provider: currentModel?.provider === "ark" ? "ark" : currentModel?.platform || currentModel?.provider || "unified",
            request_id: currentModel?.provider === "ark" ? null : (pendingExternalId || pendingTaskId),
            task_id: currentModel?.provider === "ark" ? (pendingExternalId || pendingTaskId) : null,
            bill: currentModel?.provider === "ark" ? pendingBill : null,
            status: "failed",
            error: e.message || "Ошибка генерации",
          }).catch(() => {});
        }
      }
    };

    execute();

    // Clear inputs for next generation
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setUploadedImageUrl(null);
    setUploadedEndImageUrl(null);
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setUploadedAudioUrl(null);
    setUploadedAudioName(null);
    setRefFiles([]);
    // Keep the current model and modes as is for convenience
  }, [
    apiKey,
    prompt,
    v2vMode,
    imageMode,
    selectedModel,
    selectedAr,
    selectedDuration,
    selectedResolution,
    selectedQuality,
    selectedMode,
    selectedEffect,
    showEffect,
    uploadedImageUrl,
    uploadedVideoUrl,
    uploadedAudioUrl,
    uploadedEndImageUrl,
    refFiles,
    faceAsset,
    lastGenerationId,
    getCurrentModel,
    getCurrentDurations,
    getCurrentResolutions,
    addToLocalHistory,
    persistVideoEntryToStorage,
    persistVideoToGallery,
    seed,
    returnLastFrame,
    showVideoInCanvas,
    onGenerationComplete,
    addTask,
    updateTask,
    removeTask,
    fetchRemoteHistory,
    i2vModels,
    t2vModels,
    selectedCharacterOrientation,
    selectedKeepOriginalSound
  ]);

  // ── reset to prompt bar ───────────────────────────────────────────────────
  const resetToPromptBar = useCallback(() => {
    setShowCanvas(false);
  }, []);

  const handleNewPrompt = useCallback(() => {
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrl(null);
    setImageMode(false);
    setUploadedVideoUrl(null);
    setUploadedVideoName(null);
    setV2vMode(false);
    const first = t2vModels[0];
    setSelectedModel(first.id);
    setSelectedModelName(first.name);
    applyControlsForModel(first.id, false, false);
    setPromptDisabled(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [resetToPromptBar, applyControlsForModel]);

  const handleExtend = useCallback(() => {
    if (!lastGenerationId) return;
    resetToPromptBar();
    setPrompt("");
    setUploadedImageUrl(null);
    setImageMode(false);
    setSelectedModel("seedance-v2.0-extend");
    setSelectedModelName("Seedance 2.0 Extend");
    applyControlsForModel("seedance-v2.0-extend", false, false);
    setPromptDisabled(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [lastGenerationId, resetToPromptBar, applyControlsForModel]);

  // ── derived UI values ────────────────────────────────────────────────────
  const isSeedance2Canvas =
    canvasModel === "seedance-v2.0-t2v" || canvasModel === "seedance-v2.0-i2v";
  const currentModelObj = getCurrentModel();
  const isExtendMode = currentModelObj?.requiresRequestId;
  // Seedance 2.0 (Ark) supports multimodal references — show the dedicated uploader.
  const isSeedanceArk = currentModelObj?.provider === "ark";

  // ── Calculate estimated cost when parameters change ──────────────────────
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      const calculateCost = async () => {
        // Вычисляем isSeedanceArk внутри useEffect, чтобы не зависеть от него
        const currentModel = getCurrentModel();
        const isArk = currentModel?.provider === "ark";
        const isElSpy = currentModel?.platform === "elspy";
        
        console.log("[calculateCost] Starting...", { selectedModel, isArk, isElSpy, selectedDuration, selectedResolution });
        if (!isArk && !isElSpy) {
          console.log("[calculateCost] Not Seedance Ark or ElSpy, clearing cost");
          setEstimatedCost(null);
          return;
        }

        setIsLoadingCost(true);
        try {
          let pricingModelId;
          if (isArk) {
            const modelMap = {
              "seedance-2.0-t2v": "doubao-seedance-2-0-260128",
              "seedance-2.0-fast-t2v": "doubao-seedance-2-0-fast-260128",
              "seedance-2.0-i2v": "doubao-seedance-2-0-260128",
              "seedance-2.0-fast-i2v": "doubao-seedance-2-0-fast-260128"
            };
            pricingModelId = modelMap[selectedModel] || "doubao-seedance-2-0-260128";
          } else if (selectedModel === "kling-motion-control-v3") {
            // Kling-Motion Control: используем 'kling-motion-control' как pricing model id (если есть, иначе 'kling-motion-control-v3'
            pricingModelId = "kling-motion-control";
          } else {
            // Omni Flash и другие модели
            pricingModelId = "omni-flash";
          }

          const hasVideoInput = refFiles.some(f => f.kind === "video");
          const requestBody = {
            category: "video",
            model: pricingModelId,
            params: {
              duration: selectedDuration || 5,
              resolution: selectedResolution || "720p",
              video_url: hasVideoInput ? "exists" : undefined,
              generate_audio: true // Seedance 2.0 по умолчанию генерирует аудио
            }
          };
          console.log("[calculateCost] Request body:", requestBody);

          const response = await fetch("/api/calculate-price", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
            signal: abortController.signal
          });

          console.log("[calculateCost] Response status:", response.status);

          if (response.ok && isMounted) {
            const data = await response.json();
            console.log("[calculateCost] Response data:", data);
            setEstimatedCost(data.cost);
          } else {
            console.log("[calculateCost] Response not OK, clearing cost");
            setEstimatedCost(null);
          }
        } catch (err) {
          if (err.name === "AbortError") {
            console.log("[calculateCost] Request was aborted");
            return;
          }
          console.error("Failed to calculate cost:", err);
          if (isMounted) {
            setEstimatedCost(null);
          }
        } finally {
          if (isMounted) {
            setIsLoadingCost(false);
          }
        }
      };
      calculateCost();
    }, 300); // 300ms debounce
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [selectedModel, selectedDuration, selectedResolution, refFiles, imageMode, v2vMode, getCurrentModel]);

  const promptPlaceholder = isSeedanceArk
    ? "Используйте теги, чтобы ссылаться на файлы. Напр.: возьми движение из 视频1, создай видео с персонажами из 图片2 и 图片3."
    : v2vMode
    ? currentModelObj?.imageField
      ? currentModelObj?.promptRequired
        ? "Опишите движение"
        : "Опишите движение (необязательно)"
      : "Видео готово — нажмите Создать для удаления водяного знака"
    : imageMode
      ? "Опишите движение или эффект (необязательно)"
      : isExtendMode
        ? "Необязательно: опишите как продолжить видео..."
        : "Опишите видео, которое хотите создать";

  const toggleDropdown = (type) => (e) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  // ── If loading or no models, show appropriate state ───────────────────────
  if (loading) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white/40">
        <div className="text-4xl mb-4">⏳</div>
        <div className="text-lg font-medium">Загрузка...</div>
      </div>
    );
  }
  
  if (t2vModels.length === 0 && i2vModels.length === 0 && v2vModels.length === 0) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white/40">
        <div className="text-4xl mb-4">🎬</div>
        <div className="text-lg font-medium">Студия видео временно недоступна</div>
        <div className="text-sm mt-2">Попробуйте позже</div>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden"
    >
      {/* ── CENTRAL GALLERY AREA ── */}
      <div
        ref={historyScrollRef}
        onScroll={handleHistoryScroll}
        className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2"
      >
        {(activeTasks.length > 0 || history.length > 0 || isLoadingRemoteHistory) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up">
            {/* Active generation cards */}
            {activeTasks.map((task) => (
              <div key={task.id} className={`relative rounded-lg overflow-hidden border ${task.status === 'error' ? 'border-red-500/40' : 'border-primary/40'} bg-[#0a0a0a] shadow-xl flex flex-col animate-fade-in-up`}>
                {/* Shimmer thumbnail area */}
                <div className="w-full aspect-video bg-gradient-to-br from-black via-primary/5 to-black relative flex items-center justify-center overflow-hidden">
                  {/* Animated glow */}
                  <div className={`absolute inset-0 ${task.status === 'error' ? 'bg-red-500/5' : 'bg-primary/5 animate-pulse'}`} />
                  {task.status !== 'error' && (
                    <div className="absolute inset-0"
                      style={{
                        background: "linear-gradient(105deg, transparent 40%, rgba(34,211,238,0.06) 50%, transparent 60%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 2s infinite linear",
                      }}
                    />
                  )}
                  {/* Status Indicator */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    {task.status === 'error' ? (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ) : (
                      <svg className="animate-spin text-primary" width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    )}
                    <span className={`text-[11px] font-semibold ${task.status === 'error' ? 'text-red-500' : 'text-primary/80'} tracking-widest uppercase`}>
                      {task.status === 'error' ? 'Ошибка' : 'Генерация…'}
                    </span>
                  </div>
                </div>
                {/* Card footer */}
                <div className="p-3 bg-black/80 border-t border-primary/10 flex flex-col gap-2">
                  <p className="text-white/50 text-xs line-clamp-2 leading-relaxed italic">
                    {task.prompt || "Создаётся видео…"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                      {task.model?.replace(/-/g, " ")}
                    </span>
                    {task.status === 'error' ? (
                      <span className="text-[10px] text-red-400 truncate max-w-[100px]">{task.error || 'Сбой'}</span>
                    ) : (
                      <span className="text-[10px] text-white/30 animate-pulse">● обработка</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoadingRemoteHistory && activeTasks.length === 0 && localHistory.length === 0 && (
              <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl flex flex-col items-center justify-center aspect-video">
                <svg className="animate-spin text-primary" width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="text-[11px] font-semibold text-primary/80 tracking-widest uppercase mt-2">Загрузка истории…</span>
              </div>
            )}
            {history.map((entry, idx) => {
              const isSeedance2 = (entry.model?.startsWith("seedance-v2.0-") || entry.model?.startsWith("seedance-2.0-"));
              return (
                <div
                  key={entry.id || idx}
                  className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
                  style={{ contentVisibility: "auto", containIntrinsicSize: "360px 260px" }}
                >
                  <LazyVideoFirstFramePreview
                    entry={entry}
                    onOpen={() => setFullscreenUrl(entry.url)}
                  />
                  
                  {/* Overlay actions */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title="На весь экран"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullscreenUrl(entry.url);
                      }}
                      className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Скачать"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(entry.url, `video-${entry.id || idx}.mp4`);
                      }}
                      className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Удалить"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryEntry(entry, idx);
                      }}
                      className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-all border border-white/10"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                    {isSeedance2 && (
                      <button
                        type="button"
                        title="Расширить видео с помощью Seedance 2.0 Extend"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLastGenerationId(entry.id);
                          handleExtend();
                        }}
                        className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Prompt & Details */}
                  <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                    <div className="flex items-start gap-1.5">
                      <p className="text-white/70 text-xs line-clamp-3 leading-relaxed flex-1" title={entry.prompt}>
                        {entry.prompt || "Запрос не указан"}
                      </p>
                      {entry.prompt && (
                        <button
                          type="button"
                          title="Скопировать промпт"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(entry.prompt).then(() => {
                              setCopiedPromptId(entry.id || idx);
                              setTimeout(() => setCopiedPromptId(null), 1500);
                            }).catch(() => {});
                          }}
                          className="shrink-0 p-1 rounded-md text-white/30 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          {copiedPromptId === (entry.id || idx) ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                      <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 whitespace-nowrap">
                        {entry.model?.replace("-", " ")}
                      </span>
                      <div className="flex gap-2">
                        {entry.resolution && (
                          <span className="text-[10px] text-white/40">{entry.resolution}</span>
                        )}
                        {entry.duration && (
                          <span className="text-[10px] text-white/40">{entry.duration}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {(remoteHistoryError || isLoadingRemoteHistory || remoteHistoryNextCursor != null) && (
              <div className="col-span-full flex justify-center py-4">
                {remoteHistoryError ? (
                  <button
                    type="button"
                    onClick={() => fetchRemoteHistory()}
                    className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 text-xs hover:bg-red-500/20 transition-colors"
                  >
                    Ошибка загрузки истории. Повторить
                  </button>
                ) : isLoadingRemoteHistory ? (
                  <span className="text-[11px] font-semibold text-primary/70 tracking-widest uppercase">Загрузка ещё…</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => fetchRemoteHistory()}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white/60 text-xs hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    Загрузить ещё
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-80">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">✨</div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
              <span className="text-purple-300/50 font-medium text-2xl sm:text-3xl md:text-4xl">НАЧНИТЕ СОЗДАВАТЬ В</span><br />
              <span className="text-purple-300">ВИДЕОСТУДИИ</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              Оживляйте изображения в потрясающие ИИ-видео с эффектами движения
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <div className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="w-full bg-[#0a0a0a] backdrop-blur-3xl rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl">
          {/* Registered face chip — the generated video keeps this face */}
          {isSeedanceArk && faceAsset && (
            <div className="flex flex-wrap gap-2 px-1 pb-1">
              <div
                className="group relative flex items-center gap-1.5 h-8 pl-2 pr-2 rounded-lg border text-[11px] font-medium border-purple-500/40 bg-purple-500/10 text-purple-200 cursor-pointer hover:border-purple-500/80 transition-all"
                title={`Лицо «${faceAsset.name}» привязано к Seedance. Кликните, чтобы добавить в промпт`}
                onClick={() => insertRefToken("图片1")}
              >
                {faceAsset.thumbnail ? (
                  <img src={faceAsset.thumbnail} alt="" className="w-5 h-5 rounded-full object-cover border border-purple-500/30" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
                <span className="whitespace-nowrap max-w-[140px] truncate">{faceAsset.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFaceAsset(null); }}
                  className="ml-0.5 text-white/40 hover:text-red-400 transition-colors"
                  title="Убрать лицо"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {/* Seedance 2.0 reference chips — click to insert @reference into prompt */}
          {isSeedanceArk && (
            <div className="flex flex-wrap gap-2 px-1 pb-1">
              {(() => {
                const chips = [];
                let imageCount = 0;
                let videoCount = 0;
                let audioCount = 0;

                // Helper to get label
                const getLabel = (kind) => {
                  const word = kind === "image" ? "图片" : kind === "video" ? "视频" : "音频";
                  let count = kind === "image" ? imageCount : kind === "video" ? videoCount : audioCount;
                  count += 1;
                  if (kind === "image") {
                    if (faceAsset) count += 1;
                  }
                  return `${word}${count}`;
                };

                // Add uploadedImageUrl chip
                if (uploadedImageUrl) {
                  imageCount += 1;
                  const label = getLabel("image");
                  chips.push(
                    <div
                      key="uploaded-image"
                      className="group relative flex items-center gap-1.5 h-8 pl-1.5 pr-2 rounded-lg border border-primary/30 bg-primary/5 text-white/80 hover:border-primary/60 cursor-pointer transition-all"
                      title={`Изображение — вставить ${label} в промпт`}
                      onClick={() => insertRefToken(label)}
                    >
                      <img src={uploadedImageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                      <span className="whitespace-nowrap">{label}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearImageUpload(); }}
                        className="ml-0.5 text-white/40 hover:text-red-400 transition-colors"
                        title="Удалить изображение"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                }

                // Add uploadedVideoUrl chip
                if (uploadedVideoUrl) {
                  videoCount += 1;
                  const label = getLabel("video");
                  chips.push(
                    <div
                      key="uploaded-video"
                      className="group relative flex items-center gap-1.5 h-8 pl-1.5 pr-2 rounded-lg border border-primary/30 bg-primary/5 text-white/80 hover:border-primary/60 cursor-pointer transition-all"
                      title={`Видео — вставить ${label} в промпт`}
                      onClick={() => insertRefToken(label)}
                    >
                      <video src={uploadedVideoUrl} muted className="w-5 h-5 rounded object-cover" />
                      <span className="whitespace-nowrap">{label}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearVideoUpload(); }}
                        className="ml-0.5 text-white/40 hover:text-red-400 transition-colors"
                        title="Удалить видео"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                }

                // Add uploadedAudioUrl chip
                if (uploadedAudioUrl) {
                  audioCount += 1;
                  const label = getLabel("audio");
                  chips.push(
                    <div
                      key="uploaded-audio"
                      className="group relative flex items-center gap-1.5 h-8 pl-1.5 pr-2 rounded-lg border border-primary/30 bg-primary/5 text-white/80 hover:border-primary/60 cursor-pointer transition-all"
                      title={`Аудио — вставить ${label} в промпт`}
                      onClick={() => insertRefToken(label)}
                    >
                      <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[9px]">🎵</span>
                      <span className="whitespace-nowrap">{label}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearAudioUpload(); }}
                        className="ml-0.5 text-white/40 hover:text-red-400 transition-colors"
                        title="Удалить аудио"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                }

                // Add refFiles chips
                const counters = { image: imageCount, video: videoCount, audio: audioCount };
                refFiles.forEach((f) => {
                  counters[f.kind] += 1;
                  const word = f.kind === "image" ? "图片" : f.kind === "video" ? "视频" : "音频";
                  let count = counters[f.kind];
                  if (f.kind === "image" && faceAsset) count += 1;
                  const label = `${word}${count}`;

                  chips.push(
                    <div
                      key={f.id}
                      className={`group relative flex items-center gap-1.5 h-8 pl-1.5 pr-2 rounded-lg border text-[11px] font-medium transition-all ${f.uploading ? "border-white/10 bg-white/5 text-white/40" : "border-primary/30 bg-primary/5 text-white/80 hover:border-primary/60 cursor-pointer"}`}
                      title={f.uploading ? `${f.name} — загрузка ${f.progress}%` : `${f.name} — вставить ${label} в промпт`}
                      onClick={() => !f.uploading && insertRefToken(label)}
                    >
                      {f.kind === "image" && f.url ? (
                        <img src={f.url} alt="" className="w-5 h-5 rounded object-cover" />
                      ) : (
                        <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[9px]">
                          {f.kind === "video" ? "🎬" : f.kind === "audio" ? "🎵" : "🖼"}
                        </span>
                      )}
                      <span className="whitespace-nowrap">{f.uploading ? `${f.progress}%` : label}</span>
                      {f.uploading ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); f.cancel?.(); }}
                          className="ml-0.5 text-white/40 hover:text-red-400 transition-colors"
                          title="Отменить загрузку"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeRefFile(f.id); }}
                          className="ml-0.5 text-white/40 hover:text-red-400 transition-colors"
                          title="Удалить"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                });

                return chips;
              })()}
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
            {/* Seedance 2.0 multimodal reference uploader — image/video/audio, multiple */}
            {isSeedanceArk && (
              <div className="relative">
                <input
                  ref={refFileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  multiple
                  className="hidden"
                  onChange={handleRefFilesChange}
                />
                <button
                  type="button"
                  title="Загрузить изображения / видео / аудио (можно несколько)"
                  onClick={() => refFileInputRef.current?.click()}
                  className="h-10 px-3 shrink-0 rounded-full border bg-white/[0.03] border-white/[0.06] hover:bg-white/10 hover:border-primary/40 transition-all flex items-center gap-2 group"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/50 group-hover:text-primary transition-colors">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className="text-[11px] font-medium text-white/50 group-hover:text-primary transition-colors whitespace-nowrap">
                    Изображения/видео/аудио
                  </span>
                </button>
              </div>
            )}

            {!isSeedanceArk && (<>
            {/* Image upload button */}
            <div className="relative">
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <button
                type="button"
                title={
                  uploadedImageUrl
                    ? "Очистить изображение"
                    : "Загрузить изображение для Image-to-Video"
                }
                onClick={() =>
                  uploadedImageUrl
                    ? clearImageUpload()
                    : imageFileInputRef.current?.click()
                }
                className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedImageUrl ? "border-primary/60 bg-primary/5" : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
              >
                {imageUploading ? (
                  <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                    <svg className="w-8 h-8 -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * imageProgress) / 100}
                        className="text-primary transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-primary leading-none">
                      {imageProgress}%
                    </span>
                  </div>
                ) : null}

                {uploadedImageUrl ? (
                  <img
                    src={uploadedImageUrl}
                    alt=""
                    className={`w-full h-full object-cover rounded-full ${imageUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                  />
                ) : (
                  !imageUploading && (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white/40 group-hover:text-primary transition-colors"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )
                )}
              </button>
            </div>

            {/* End-frame upload button (FLF i2v models only) */}
            {imageMode && i2vModels.find((m) => m.id === selectedModel)?.lastImageField && (
              <div className="relative">
                <input
                  ref={endImageFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEndImageFileChange}
                />
                <button
                  type="button"
                  title={uploadedEndImageUrl ? "Очистить конечный кадр" : "Загрузить конечный кадр (необязательно)"}
                  onClick={() =>
                    uploadedEndImageUrl
                      ? clearEndImage()
                      : endImageFileInputRef.current?.click()
                  }
                  className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedEndImageUrl ? "border-primary/60 bg-primary/5" : "bg-white/5 border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
                >
                  {endImageUploading ? (
                    <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                      <svg className="w-8 h-8 -rotate-90">
                        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="transparent"
                          strokeDasharray={88}
                          strokeDashoffset={88 - (88 * endImageProgress) / 100}
                          className="text-primary transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-black text-primary leading-none">
                        {endImageProgress}%
                      </span>
                    </div>
                  ) : null}

                  {uploadedEndImageUrl ? (
                    <img
                      src={uploadedEndImageUrl}
                      alt=""
                      className={`w-full h-full object-cover rounded-full ${endImageUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                    />
                  ) : (
                    !endImageUploading && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 group-hover:text-primary transition-colors">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )
                  )}
                  <span className="absolute top-0.5 left-0.5 px-1 h-3.5 bg-black/60 rounded-md text-[7px] font-black text-primary leading-none flex items-center justify-center pointer-events-none">
                    END
                  </span>
                </button>
              </div>
            )}

            {/* Video upload button — shown for v2v models or multimodal models
                (e.g. Seedance 2.0) that accept a video as an extra input. */}
            {(v2vModels.length > 0 || currentModelObj?.acceptsVideo) && (
            <div className="relative">
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoFileChange}
              />
              <button
                type="button"
                title={
                  uploadedVideoUrl
                    ? `${uploadedVideoName} — click to clear`
                    : "Upload video to remove watermark"
                }
                onClick={() =>
                  uploadedVideoUrl
                    ? clearVideoUpload()
                    : videoFileInputRef.current?.click()
                }
                className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedVideoUrl ? "border-primary/60 bg-white/5" : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
              >
                {videoUploading ? (
                  <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                    <svg className="w-8 h-8 -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * videoProgress) / 100}
                        className="text-primary transition-all duration-300"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-black text-primary leading-none">
                      {videoProgress}%
                    </span>
                  </div>
                ) : uploadedVideoUrl ? (
                  <video
                    src={uploadedVideoUrl}
                    className={`w-full h-full object-cover rounded-full ${videoUploading ? "opacity-40 blur-[2px]" : "opacity-100"}`}
                    muted
                  />
                ) : (
                  <VideoIconSvg className="text-white/40 group-hover:text-primary transition-colors" />
                )}
              </button>
            </div>
            )}

            {/* Audio upload button — for multimodal models (e.g. Seedance 2.0). */}
            {currentModelObj?.acceptsAudio && (
            <div className="relative">
              <input
                ref={audioFileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioFileChange}
              />
              <button
                type="button"
                title={
                  uploadedAudioUrl
                    ? `${uploadedAudioName} — нажмите, чтобы очистить`
                    : "Загрузить аудио (необязательно)"
                }
                onClick={() =>
                  uploadedAudioUrl
                    ? clearAudioUpload()
                    : audioFileInputRef.current?.click()
                }
                className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedAudioUrl ? "border-primary/60 bg-white/5" : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
              >
                {audioUploading ? (
                  <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                    <span className="text-[9px] font-black text-primary leading-none">
                      {audioProgress}%
                    </span>
                  </div>
                ) : (
                  <svg
                    className={`w-5 h-5 ${uploadedAudioUrl ? "text-primary" : "text-white/40 group-hover:text-primary"} transition-colors`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                )}
              </button>
            </div>
            )}
            </>)}

            {/* Prompt textarea */}
            <div className="flex-1 flex flex-col gap-1 relative">
              {/* Actual textarea */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptInput}
                placeholder={promptPlaceholder}
                disabled={promptDisabled}
                rows={1}
                className="relative z-10 w-full bg-transparent border-none text-white caret-white text-sm placeholder:text-white/10 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar disabled:opacity-40"
              />
            </div>
          </div>

          {/* Extend banner */}
          {isExtendMode && (
            <div className="flex items-center gap-2 px-3 py-1.5 mx-3 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary/80 font-medium tracking-tight">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <span>Расширение предыдущей генерации Seedance 2.0</span>
            </div>
          )}

          {/* Bottom row: controls + generate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative">
            <div className="flex items-center gap-2 relative flex-wrap pb-1 md:pb-0">
              {/* Model btn */}
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown("model")}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <div className="w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center shadow-lg shadow-[#22d3ee]/10">
                    <span className="text-[9px] font-bold text-black uppercase">
                      V
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {selectedModelName}
                  </span>
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-20 group-hover:opacity-100 transition-opacity"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {openDropdown === "model" && (
                  <div
                    ref={dropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-[1.5rem] p-3 shadow-2xl border border-white/[0.05] w-[calc(100vw-3rem)] max-w-xs"
                  >
                    <ModelDropdown
                      imageMode={imageMode}
                      selectedModel={selectedModel}
                      onSelect={handleModelSelect}
                      onClose={() => setOpenDropdown(null)}
                      t2vModels={t2vModels}
                      i2vModels={i2vModels}
                      v2vModels={v2vModels}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>

              {/* Aspect ratio btn */}
              {showAr && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("ar")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {selectedAr}
                    </span>
                  </button>
                  {openDropdown === "ar" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] max-h-80 overflow-y-auto custom-scrollbar min-w-[160px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Соотношение сторон
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentAspectRatios(selectedModel).map((r) => (
                          <div
                            key={r}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAr(r);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white transition-opacity">
                              {r}
                            </span>
                            {selectedAr === r && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Effect btn */}
              {showEffect && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("effect")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors max-w-[140px] truncate">
                      {selectedEffect || "Effect"}
                    </span>
                  </button>
                  {openDropdown === "effect" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] max-h-80 overflow-y-auto custom-scrollbar min-w-[200px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Тип эффекта
                      </div>
                      <div className="flex flex-col gap-1">
                        {getEffectsForI2VModel(selectedModel).map((eff) => (
                          <div
                            key={eff}
                            className="flex items-center justify-between p-2 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEffect(eff);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white">
                              {eff}
                            </span>
                            {selectedEffect === eff && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Duration btn */}
              {showDuration && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("duration")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {selectedDuration}s
                    </span>
                  </button>
                  {openDropdown === "duration" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/10 min-w-[140px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Длительность
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentDurations(selectedModel).map((d) => (
                          <div
                            key={d}
                            className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDuration(d);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-xs font-semibold text-white/70 group-hover/opt:text-white">
                              {d}s
                            </span>
                            {selectedDuration === d && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution btn */}
              {showResolution && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleDropdown("resolution")}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="opacity-40 text-white"
                    >
                      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {selectedResolution || "720p"}
                    </span>
                  </button>
                  {openDropdown === "resolution" && (
                    <div
                      ref={dropdownRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 shadow-2xl border border-white/[0.05] min-w-[140px]"
                    >
                      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2">
                        Разрешение
                      </div>
                      <div className="flex flex-col gap-1">
                        {getCurrentResolutions(selectedModel).map((r) => (
                          <div
                            key={r}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded cursor-pointer transition-all group/opt"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedResolution(r);
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="text-[11px] font-semibold text-white/70 group-hover/opt:text-white">
                              {r}
                            </span>
                            {selectedResolution === r && <CheckSvg />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Return last frame toggle */}
              {isSeedanceArk && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setReturnLastFrame(!returnLastFrame)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all border ${returnLastFrame ? "bg-primary/20 border-primary/40" : "bg-white/[0.03] border-white/[0.03] hover:bg-white/[0.06]"} group whitespace-nowrap`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={returnLastFrame ? "text-primary" : "opacity-40 text-white"}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className={`text-[11px] font-semibold ${returnLastFrame ? "text-primary" : "text-white/70"} group-hover:text-[#22d3ee] transition-colors`}>
                      Последний кадр
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Face registration — only for Seedance (binds a face to the video) */}
            {isSeedanceArk && (
              <button
                type="button"
                onClick={() => setFacePickOpen(true)}
                title="Выбрать или добавить лицо для Seedance"
                className={`h-9 px-3 rounded-md font-medium text-sm transition-all border flex items-center gap-2 ${faceAsset ? "bg-purple-600/30 border-purple-500/50 text-purple-100" : "bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-300 border-purple-500/30"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {faceAsset ? faceAsset.name : "Лицо"}
              </button>
            )}

            <div className="flex items-center gap-3 justify-end">
              {/* Cost estimate */}
              {isSeedanceArk && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-md border border-white/[0.03] whitespace-nowrap">
                  {isLoadingCost ? (
                    <span className="text-white/40 animate-pulse text-xs font-medium">Расчет...</span>
                  ) : estimatedCost != null && estimatedCost > 0 ? (
                    <span className="text-[#22d3ee] font-medium text-xs">
                      ≈ {estimatedCost.toFixed(2)} ₽
                    </span>
                  ) : (
                    <span className="text-white/30 text-xs font-medium">Бесплатно</span>
                  )}
                </div>
              )}

              {/* Generate button */}
              <button
                type="button"
                onClick={handleGenerate}
                className="bg-[#22d3ee] text-black px-4 py-2 rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Создать</span>
              </button>
            </div>
            {generateErrorNotice && (
              <div
                className={`flex items-start gap-3 rounded-md border px-3 py-2 text-xs ${
                  generateErrorNotice.tone === "warning"
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
                    : "border-red-400/30 bg-red-500/10 text-red-100"
                }`}
              >
                <div className="pt-0.5">
                  {generateErrorNotice.tone === "warning" ? "!" : "×"}
                </div>
                <div className="min-w-0">
                  <div className="font-bold">{generateErrorNotice.title}</div>
                  <div className="mt-1 break-words opacity-90">
                    {generateErrorNotice.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN VIDEO MODAL ── */}
      {fullscreenUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenUrl(null);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <video 
            src={fullscreenUrl} 
            controls 
            autoPlay 
            loop 
            className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── FACE ASSET PICKER (select an existing asset or add one by id) ── */}
      <FaceAssetDialog
        open={facePickOpen}
        onClose={() => setFacePickOpen(false)}
        onSelect={(assetUri, name, thumb, meta = {}) => {
          const validated = validateFaceAsset({ uri: assetUri, name, thumbnail: thumb, status: meta.status });
          if (!validated.ok) {
            console.warn("[VideoStudio] Rejected face asset", { assetUri, name, reason: validated.error });
            alert(validated.error);
            return;
          }
          setFaceAsset(validated.asset);
          // Character is always 图片1 in muapi.js.
          insertRefToken("图片1");
        }}
        onRegisterNew={() => setFaceRegOpen(true)}
      />

      {/* ── FACE REGISTRATION DIALOG (binds a face to Seedance) ── */}
      <FaceRegistrationDialog
        open={faceRegOpen}
        onClose={() => setFaceRegOpen(false)}
        onRegistered={(assetUri, displayName, photo) => {
          setFaceAsset({ uri: assetUri, name: displayName, thumbnail: photo || null });
          insertRefToken("图片1");
        }}
      />
    </div>
  );
}
