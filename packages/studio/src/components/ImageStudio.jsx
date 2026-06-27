"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { generateImage, generateI2I } from "../muapi/image.js";
import { optimizeImageUploadFile, validateImageReferenceUploadFile } from "../muapi/files.js";
import { uploadFile, persistImageToTOS } from "../muapi/assets.js";
import { getUserWorkflows } from "../muapi/workflows.js";
import {
  getT2iModels,
  getI2iModels,
  getAspectRatiosForModel,
  getResolutionsForModel,
  getQualityFieldForModel,
  getAspectRatiosForI2IModel,
  getResolutionsForI2IModel,
  getQualityFieldForI2IModel,
  getMaxImagesForI2IModel,
  getEffectsForI2IModel,
  getDefaultEffectForI2IModel,
  getImageInputOptions,
  getImageInputDefault,
  routingOptions,
  routingLabels,
} from "../models.js";
import { useModelConfig } from "../useModelConfig.js";
import { formatGenerationErrorNotice } from "./generationErrorNotice.js";
import { saveMediaToGallery } from "./gallerySave.js";
import { excludeImageHistoryEntry, mergeImageHistoryEntries } from "./imageHistory.js";
import { getUploadPickerMaxImages } from "../imageStudioUploadConfig.js";
import {
  addSelectedUploadEntry,
  replaceSelectedUploadEntry,
  getDisplayUploadUrls,
} from "./uploadPreviewState.js";

// ─── helpers ────────────────────────────────────────────────────────────────

async function downloadImage(url, filename) {
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

const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/tiff,.jpg,.jpeg,.png,.tif,.tiff,.raw,.cr2,.cr3,.nef,.arw,.dng,.orf,.raf,.rw2,.pef,.srw";

// ─── UploadButton (inline picker) ───────────────────────────────────────────

function UploadButton({ apiKey, maxImages, onSelect, onPreviewChange, onClear, onUploadStateChange, initialUrls = [] }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMobileUploadUi, setIsMobileUploadUi] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]); // [{url, thumbnail}]
  const [uploadHistory, setUploadHistory] = useState([]); // [{id, name, url, thumbnail}]
  const [lastUploadProgress, setLastUploadProgress] = useState(0);
  const selectedEntriesRef = useRef([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    selectedEntriesRef.current = selectedEntries;
  }, [selectedEntries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const applyMatch = () => setIsMobileUploadUi(mediaQuery.matches);
    applyMatch();
    mediaQuery.addEventListener?.("change", applyMatch);
    return () => mediaQuery.removeEventListener?.("change", applyMatch);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [panelOpen]);

  // Sync initialUrls from parent (e.g. restored from localStorage)
  useEffect(() => {
    const nextUrls = Array.isArray(initialUrls) ? initialUrls : [];
    const currentUrls = selectedEntriesRef.current.map((entry) => entry?.url).filter(Boolean);
    const isSame =
      nextUrls.length === currentUrls.length
      && nextUrls.every((url) => currentUrls.includes(url));

    if (isSame) return;

    const newEntries = nextUrls.map((url) => ({ url }));
    setSelectedEntries(newEntries);
    selectedEntriesRef.current = newEntries;

    if (nextUrls.length === 0) return;

    setUploadHistory((prev) => {
      const existingUrls = prev.map((entry) => entry.url);
      const missing = nextUrls
        .filter((url) => !existingUrls.includes(url))
        .map((url) => ({ id: `restored-${url}`, name: "Restored Image", url, progress: 100 }));
      return [...missing, ...prev];
    });
  }, [initialUrls]);

  // When maxImages changes, trim excess selections
  useEffect(() => {
    if (selectedEntries.length > maxImages) {
      const trimmed = selectedEntries.slice(0, maxImages);
      setSelectedEntries(trimmed);
      if (trimmed.length === 0) onClear?.();
    }
    if (fileInputRef.current) {
      fileInputRef.current.multiple = maxImages > 1;
    }
  }, [maxImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const fireOnSelect = useCallback(
    (entries) => {
      if (!entries.length) return;
      const urls = entries.map((e) => e.url);
      onSelect({ url: urls[0], urls, thumbnail: entries[0].url });
    },
    [onSelect],
  );

  const fireOnPreviewChange = useCallback(
    (entries) => {
      if (!entries.length) return;
      const urls = entries.map((entry) => entry.url);
      onPreviewChange?.({
        url: urls[0],
        urls,
        thumbnail: entries[0].localUrl || entries[0].url,
      });
    },
    [onPreviewChange],
  );

  const commitSelection = useCallback(
    (entries) => {
      if (!entries.length) return;
      if (entries.some((entry) => entry?.pending || String(entry?.url || "").startsWith("blob:"))) {
        fireOnPreviewChange(entries);
        return;
      }
      fireOnSelect(entries);
    },
    [fireOnPreviewChange, fireOnSelect],
  );

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = "";

    const invalid = files.find((file) => {
      try {
        validateImageReferenceUploadFile(file);
        return false;
      } catch {
        return true;
      }
    });
    if (invalid) {
      alert(
        `Формат файла не поддерживается: ${invalid.name || "без имени"}. Поддерживаются JPG, PNG, TIFF и RAW до 50 МБ.`,
      );
      return;
    }

    setUploading(true);
    onUploadStateChange?.(true);
    try {
      const toUpload =
        maxImages === 1
          ? files.slice(0, 1)
          : files.slice(0, maxImages - selectedEntries.length || 1);

      await Promise.all(
        toUpload.map(async (file) => {
          const id = Date.now().toString() + Math.random();

          const objectUrl = URL.createObjectURL(file);
          const placeholder = { id, name: file.name, url: objectUrl, localUrl: objectUrl, progress: 0, pending: true };
          setUploadHistory((prev) => [placeholder, ...prev]);

          const previewEntry = { url: objectUrl, localUrl: objectUrl, pending: true };
          const previewSelected = addSelectedUploadEntry(selectedEntriesRef.current, previewEntry, maxImages);
          if (previewSelected !== selectedEntriesRef.current) {
            selectedEntriesRef.current = previewSelected;
            setSelectedEntries(previewSelected);
            fireOnPreviewChange(previewSelected);
            if (maxImages === 1) {
              setPanelOpen(false);
            }
          }

          try {
            const processedFile = await optimizeImageUploadFile(file);
            const uploadedUrl = await uploadFile(apiKey, processedFile, (pct) => {
              setLastUploadProgress(pct);
              setUploadHistory((prev) =>
                prev.map((h) => (h.id === id ? { ...h, progress: pct } : h)),
              );
            });

            // Update history with real URL and Mark as 100%
            setUploadHistory((prev) =>
              prev.map((h) => {
                if (h.id === id) {
                  return { ...h, url: uploadedUrl, progress: 100, pending: false };
                }
                return h;
              }),
            );

            const uploadedSelected = replaceSelectedUploadEntry(
              selectedEntriesRef.current,
              objectUrl,
              { url: uploadedUrl, pending: false },
            );
            selectedEntriesRef.current = uploadedSelected;
            setSelectedEntries(uploadedSelected);

            if (uploadedSelected.some((entry) => entry.url === uploadedUrl)) {
              fireOnPreviewChange(uploadedSelected);
              commitSelection(uploadedSelected);
            }

            if (placeholder.localUrl && placeholder.localUrl !== uploadedUrl) {
              URL.revokeObjectURL(placeholder.localUrl);
            }
          } catch (err) {
            console.error("[UploadButton] Upload failed for", file.name, err);
            setUploadHistory((prev) => prev.filter((h) => h.id !== id));
            const nextSelected = selectedEntriesRef.current.filter((entry) => entry?.url !== objectUrl);
            selectedEntriesRef.current = nextSelected;
            setSelectedEntries(nextSelected);
            if (nextSelected.length === 0) onClear?.();
            else fireOnPreviewChange(nextSelected);
            if (placeholder.localUrl) URL.revokeObjectURL(placeholder.localUrl);
            throw err;
          }
        }),
      );
    } catch (err) {
      alert(`Ошибка загрузки изображения: ${err.message}`);
    } finally {
      setUploading(false);
      setLastUploadProgress(0);
      onUploadStateChange?.(false);
    }
  };

  const handleCellClick = (entry) => {
    const selIdx = selectedEntries.findIndex((e) => e.url === entry.url);
    const isSelected = selIdx !== -1;
    const atMax =
      maxImages > 1 && !isSelected && selectedEntries.length >= maxImages;
    if (atMax) return;

    if (maxImages === 1) {
      const newSelected = [{ url: entry.url, localUrl: entry.localUrl, pending: entry.pending }];
      setSelectedEntries(newSelected);
      selectedEntriesRef.current = newSelected;
      commitSelection(newSelected);
      setPanelOpen(false);
    } else {
      let next;
      if (isSelected) {
        next = selectedEntries.filter((_, i) => i !== selIdx);
        if (next.length === 0) onClear?.();
      } else {
        next = [
          ...selectedEntries,
          { url: entry.url, localUrl: entry.localUrl, pending: entry.pending },
        ];
      }
      setSelectedEntries(next);
      selectedEntriesRef.current = next;
      if (next.length > 0) fireOnPreviewChange(next);
    }
  };

  const handleRemoveFromHistory = (e, entry) => {
    e.stopPropagation();
    if (entry.localUrl) URL.revokeObjectURL(entry.localUrl);
    setUploadHistory((prev) => prev.filter((h) => h.id !== entry.id));

    const next = selectedEntries.filter((s) => s.url !== entry.url);
    if (next.length !== selectedEntries.length) {
      setSelectedEntries(next);
      selectedEntriesRef.current = next;
      if (next.length === 0) onClear?.();
      else fireOnPreviewChange(next);
    }
  };

  const handleDone = (e) => {
    e.stopPropagation();
    commitSelection(selectedEntries);
    setPanelOpen(false);
  };

  const reset = () => {
    setSelectedEntries([]);
    setPanelOpen(false);
  };

  // expose reset via ref pattern — parent calls reset() directly
  // (handled by parent through uploadedImageUrls state reset)

  const isMulti = maxImages > 1;
  const count = selectedEntries.length;
  const hasSelection = count > 0;

  // Trigger icon content
  let triggerContent;
  if (hasSelection || uploading) {
    const mainEntry = selectedEntries[0] || uploadHistory[0];
    const canAddMore = isMulti && count < maxImages;
    let badge;
    if (uploading && !hasSelection) {
      badge = (
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
              strokeDashoffset={88 - (88 * lastUploadProgress) / 100}
              className="text-primary transition-all duration-300"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-primary leading-none">
            {lastUploadProgress}%
          </span>
        </div>
      );
    } else if (count > 1) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <span className="text-[9px] font-black text-black leading-none">
            {count}
          </span>
        </div>
      );
    } else if (canAddMore) {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-white/80 rounded-full flex items-center justify-center px-0.5 border border-primary/60">
          <span className="text-[9px] font-black text-black leading-none">
            +
          </span>
        </div>
      );
    } else {
      badge = (
        <div className="absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5">
          <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    triggerContent = (
      <>
        {uploading && hasSelection && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
            <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin mb-0.5" />
            <span className="text-[8px] font-black text-primary">
              {lastUploadProgress}%
            </span>
          </div>
        )}
        {count > 1 ? (
          <div className="relative w-full h-full p-1.5 flex items-center justify-center">
            {/* Bottom Image */}
            {selectedEntries[1]?.url && (
              <div className="absolute top-1 left-1 w-6 h-6 rounded-md border border-black/40 overflow-hidden shadow-lg rotate-[-8deg] translate-x-[-1px] translate-y-[-1px]">
                <img
                  src={selectedEntries[1].localUrl || selectedEntries[1].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* Top Image */}
            {selectedEntries[0]?.url && (
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-sm border-[1.5px] border-black/60 overflow-hidden shadow-2xl z-10 rotate-[4deg] translate-x-[1px] translate-y-[1px]">
                <img
                  src={selectedEntries[0].localUrl || selectedEntries[0].url}
                  alt=""
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    uploading && hasSelection ? "blur-[2px] opacity-60" : "opacity-100"
                  }`}
                />
              </div>
            )}
          </div>
        ) : mainEntry?.url ? (
          <img
            src={mainEntry.localUrl || mainEntry.url}
            alt=""
            className={`w-full h-full object-cover transition-all duration-300 ${
              uploading && hasSelection ? "blur-[2px] scale-110 opacity-60" : "blur-0 scale-100 opacity-100"
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 animate-pulse">
            <div className="w-4 h-4 rounded-full border border-primary/20 border-t-primary animate-spin mb-0.5" />
            <span className="text-[8px] font-black text-primary">
              {lastUploadProgress}%
            </span>
          </div>
        )}
        {!uploading && badge}
      </>
    );
  } else {
    triggerContent = (
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
    );
  }

  const triggerTitle = hasSelection
    ? count > 1
      ? `${count} из ${maxImages} изображений выбрано — нажмите для управления`
      : isMulti
        ? `1 изображение выбрано — нажмите чтобы добавить ещё (до ${maxImages})`
        : "Референс"
    : isMulti
      ? `Добавьте до ${maxImages} изображений`
      : "Референс";

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        multiple={isMulti}
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        title={triggerTitle}
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((o) => !o);
        }}
        className={`shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden mt-1.5 bg-white/5 hover:bg-white/10 group ${
          isMobileUploadUi ? "w-12 h-12" : "w-10 h-10"
        } ${
          hasSelection
            ? "border-primary/60 hover:border-primary/40"
            : "border-white/10 hover:border-primary/40"
        }`}
      >
        {triggerContent}
      </button>

      {/* Panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-50 bottom-[calc(100%+8px)] bg-[#111] rounded-xl p-3 shadow-4xl border border-white/10 ${
            isMobileUploadUi
              ? "left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-[26rem]"
              : "left-0 w-96"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-secondary">
                Референсные изображения
              </span>
              {isMulti && (
                <span className="text-[9px] text-muted">
                  Выберите до {maxImages} изображений
                </span>
              )}
            </div>
            <div className={`flex items-center gap-2 ${isMobileUploadUi ? "flex-wrap justify-end" : ""}`}>
              {isMulti && hasSelection && (
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
                >
                  ✓ Готово ({count})
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  fileInputRef.current?.click();
                }}
                className={`flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all border border-primary/20 ${
                  isMobileUploadUi ? "min-h-11 px-4 rounded-xl" : "px-3 py-1.5 rounded-full"
                }`}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isMulti ? "Загрузить файлы" : "Загрузить новые"}
              </button>
              {isMobileUploadUi && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPanelOpen(false);
                    cameraInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 min-h-11 px-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-xl text-xs font-bold transition-all border border-purple-400/20"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Камера
                </button>
              )}
            </div>
          </div>

          {/* Grid or empty state */}
          {uploadHistory.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 opacity-40">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-secondary"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-secondary">Нет загрузок</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
              {uploadHistory.map((entry) => {
                const selIdx = selectedEntries.findIndex(
                  (e) => e.url === entry.url,
                );
                const isSelected = selIdx !== -1;
                const atMax =
                  isMulti && !isSelected && selectedEntries.length >= maxImages;

                return (
                  <div
                    key={entry.id}
                    title={entry.name}
                    onClick={() => entry.url && handleCellClick(entry)}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer group/cell aspect-square transition-all ${
                      isSelected
                        ? "border-primary shadow-glow"
                        : "border-white/10 hover:border-white/30"
                    } ${atMax ? "opacity-40 cursor-not-allowed" : ""} ${!entry.url ? "cursor-wait" : ""}`}
                  >
                    {entry.url ? (
                      <img
                        src={entry.url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-1" />
                        <span className="text-[10px] font-black text-primary">
                          {entry.progress}%
                        </span>
                      </div>
                    )}

                    {/* Hover overlay with delete */}
                    {entry.url && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-end justify-end p-1">
                        <button
                          type="button"
                          title="Удалить из истории"
                          onClick={(e) => handleRemoveFromHistory(e, entry)}
                          className="w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center transition-colors"
                        >
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Selection badge */}
                    {isSelected && (
                      <div className="absolute top-1 left-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1">
                        {isMulti ? (
                          <span className="text-[10px] font-black text-black">
                            {selIdx + 1}
                          </span>
                        ) : (
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="4"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom bar for multi-select */}
          {isMulti && hasSelection && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-secondary">
                {count} из {maxImages} выбрано
              </span>
              <button
                type="button"
                onClick={handleDone}
                className="px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
              >
                Использовать выбранные
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ModelDropdown ────────────────────────────────────────────────────────────

function ModelDropdown({ models, selectedModel, onSelect, onClose, isAdmin }) {
  const [search, setSearch] = useState("");

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2 h-full max-h-[60vh]">
      <div className="border-b border-white/5 shrink-0">
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
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 focus:outline-none"
          />
        </div>
      </div>
      <div className="text-xs font-medium text-secondary py-2 shrink-0">
        Доступные модели
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={(e) => {
              if (m.disabled && !isAdmin) return;
              e.stopPropagation();
              onSelect(m);
              onClose();
            }}
            className={`flex items-center justify-between p-3.5 ${(!m.disabled || isAdmin) ? "hover:bg-white/5 cursor-pointer" : "opacity-50 cursor-not-allowed"} rounded-lg transition-all border border-transparent ${(!m.disabled || isAdmin) && "hover:border-white/5"} ${
              selectedModel === m.id && (!m.disabled || isAdmin) ? "bg-white/5 border-white/5" : ""
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 ${
                  m.disabled && !isAdmin ? "bg-gray-500/10 text-gray-400" :
                  m.family === "kontext"
                    ? "bg-blue-500/10 text-blue-400"
                    : m.family === "effects"
                      ? "bg-purple-500/10 text-purple-400"
                      : "bg-primary/10 text-primary"
                } border border-white/5 rounded-full flex items-center justify-center font-bold text-xs shadow-inner uppercase`}
              >
                {m.name.charAt(0)}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-xs font-bold ${m.disabled && !isAdmin ? "text-gray-400" : "text-white"} tracking-tight`}>
                  {m.name}
                </span>
              </div>
            </div>
            {selectedModel === m.id && (!m.disabled || isAdmin) && (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Russian labels for image parameter values (API keeps the raw value) ──────
// Photo formats (jpeg/png/webp) are intentionally NOT translated.
const QUALITY_LABELS = { auto: "Авто", high: "Высокое", medium: "Среднее", low: "Низкое" };
const BACKGROUND_LABELS = { auto: "Авто", transparent: "Прозрачный", opaque: "Непрозрачный" };
const MODERATION_LABELS = { auto: "Авто", low: "Низкая" };

// ─── SimpleDropdown ───────────────────────────────────────────────────────────

function SimpleDropdown({ title, options, selected, onSelect, onClose, labels }) {
  return (
    <>
      <div className="text-xs font-medium text-muted pb-2 border-b border-white/5 mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <div
            key={opt}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(opt);
              onClose();
            }}
            className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md cursor-pointer transition-all group"
          >
            <span className="text-xs font-bold text-white opacity-80 group-hover:opacity-100">
              {labels?.[opt] || opt}
            </span>
            {selected === opt && (
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
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageStudio({
  apiKey,
  isAdmin = false,
  onGenerationComplete,
  onHistoryChange,
  onGeneratingChange,
  historyItems,
  droppedFiles,
  onFilesHandled,
}) {
  // Get models with config
  const { t2iModels, i2iModels, loading } = useModelConfig();
  
  const PERSIST_KEY = "mf_image_studio_persistent";
  const PERSIST_REFS_KEY = "mf_image_studio_refs";
  const PERSIST_RECENT_RESULTS_KEY = "mf_image_studio_recent_results";
  const PENDING_KEY = "mf_image_studio_pending";
  const PENDING_RESULT_KEY = "mf_image_studio_pending_result";

  const sanitizeHistoryForStorage = useCallback((entries) => {
    return (Array.isArray(entries) ? entries : [])
      .filter(Boolean)
      .map((entry) => ({
        id: entry.id,
        url: typeof entry.url === "string" ? entry.url : null,
        prompt: typeof entry.prompt === "string" ? entry.prompt.slice(0, 500) : "",
        model: entry.model || null,
        aspect_ratio: entry.aspect_ratio || null,
        timestamp: entry.timestamp || null,
      }))
      .filter((entry) => !!entry.url)
      .slice(0, 20);
  }, []);

  const writeRefsState = useCallback((urls) => {
    try {
      localStorage.setItem(
        PERSIST_REFS_KEY,
        JSON.stringify({ uploadedImageUrls: Array.isArray(urls) ? urls : [] }),
      );
    } catch (err) {
      console.warn("Failed to save ImageStudio refs:", err?.message);
    }
  }, []);

  const writePersistentState = useCallback((state) => {
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      try {
        const reduced = { ...state, localHistory: (state.localHistory || []).slice(0, 8) };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(reduced));
        return true;
      } catch (err2) {
        try {
          const minimal = { ...state, localHistory: [] };
          localStorage.removeItem(PERSIST_KEY);
          localStorage.setItem(PERSIST_KEY, JSON.stringify(minimal));
          return true;
        } catch (err3) {
          console.warn("Failed to save ImageStudio persistence:", err3?.message || err2?.message || err?.message);
          return false;
        }
      }
    }
  }, []);

  const writeRecentResults = useCallback((entries) => {
    try {
      const sanitized = sanitizeHistoryForStorage(entries).slice(0, 12);
      localStorage.setItem(
        PERSIST_RECENT_RESULTS_KEY,
        JSON.stringify({ entries: sanitized, ts: Date.now() }),
      );
    } catch (err) {
      console.warn("Failed to save recent ImageStudio results:", err?.message);
    }
  }, [sanitizeHistoryForStorage]);

  const readRecentResults = useCallback(() => {
    try {
      const raw = localStorage.getItem(PERSIST_RECENT_RESULTS_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data.entries) ? data.entries : [];
    } catch {
      return [];
    }
  }, []);

  const mergeHistoryEntries = useCallback(
    (primary, secondary = []) => mergeImageHistoryEntries(primary, secondary),
    [],
  );

  const upsertPendingResults = useCallback((requestId, entries) => {
    if (!requestId || !Array.isArray(entries) || entries.length === 0) return;
    try {
      const raw = localStorage.getItem(PENDING_RESULT_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const prevEntries =
        data.requestId === requestId && Array.isArray(data.entries) ? data.entries : [];
      const merged = mergeHistoryEntries(entries, prevEntries);
      localStorage.setItem(
        PENDING_RESULT_KEY,
        JSON.stringify({ requestId, entries: merged }),
      );
    } catch {}
  }, [mergeHistoryEntries, PENDING_RESULT_KEY]);

  const removeEntryFromStorageCaches = useCallback((entry) => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        writePersistentState({
          ...data,
          localHistory: excludeImageHistoryEntry(data?.localHistory, entry),
        });
      }
    } catch {}

    try {
      const raw = localStorage.getItem(PERSIST_RECENT_RESULTS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        localStorage.setItem(
          PERSIST_RECENT_RESULTS_KEY,
          JSON.stringify({
            ...data,
            entries: sanitizeHistoryForStorage(excludeImageHistoryEntry(data?.entries, entry)).slice(0, 12),
            ts: Date.now(),
          }),
        );
      }
    } catch {}

    try {
      const raw = localStorage.getItem(PENDING_RESULT_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const nextEntries = excludeImageHistoryEntry(data?.entries, entry);
        if (nextEntries.length > 0) {
          localStorage.setItem(
            PENDING_RESULT_KEY,
            JSON.stringify({ ...data, entries: nextEntries }),
          );
        } else {
          localStorage.removeItem(PENDING_RESULT_KEY);
        }
      }
    } catch {}
  }, [
    PENDING_RESULT_KEY,
    PERSIST_KEY,
    PERSIST_RECENT_RESULTS_KEY,
    sanitizeHistoryForStorage,
    writePersistentState,
  ]);

  const router = useRouter();
  const [workflowPicker, setWorkflowPicker] = useState(null); // { url, prompt } | null
  const [pickerWorkflows, setPickerWorkflows] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  // ── Model / mode state ──────────────────────────────────────────────────
  const [imageMode, setImageMode] = useState(false); // false=t2i, true=i2i
  const defaultModel = t2iModels[0] || i2iModels[0];
  const [selectedModelId, setSelectedModelId] = useState(defaultModel?.id || "");
  const [selectedModelName, setSelectedModelName] = useState(defaultModel?.name || "");
  const [selectedAr, setSelectedAr] = useState(
    defaultModel?.inputs?.aspect_ratio?.default || "1:1",
  );
  const [selectedQuality, setSelectedQuality] = useState(() => {
    if (!defaultModel) return null;
    const resolutions = getResolutionsForModel(defaultModel.id);
    return resolutions[0] || null;
  });
  const [selectedEffect, setSelectedEffect] = useState("");
  const [maxImages, setMaxImages] = useState(1);
  // Extra image parameters (quality / format / background / moderation), mirroring
  // the memefast playground. Each defaults to the model's declared default.
  const [selectedQualityOpt, setSelectedQualityOpt] = useState(
    () => (defaultModel ? getImageInputDefault(defaultModel.id, "quality") : null),
  );
  const [selectedFormat, setSelectedFormat] = useState(
    () => (defaultModel ? getImageInputDefault(defaultModel.id, "format") : null),
  );
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedModeration, setSelectedModeration] = useState(null);
  // Routing strategy suffix (default/nitro/floor/stable) — applies to all models.
  const [selectedRouting, setSelectedRouting] = useState("default");
  // Gemini output resolution (imageConfig.imageSize: 1K/2K/4K/512).
  const [selectedImageSize, setSelectedImageSize] = useState(
    () => (defaultModel ? getImageInputDefault(defaultModel.id, "imageSize") : null),
  );

  // ── Prompt / upload state ───────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [previewImageUrls, setPreviewImageUrls] = useState([]);
  const [referenceUploadsPending, setReferenceUploadsPending] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────
  const [dropdownOpen, setDropdownOpen] = useState(null); // 'model' | 'ar' | 'quality' | null
  const [generating, setGenerating] = useState(false); // Backwards compatibility
  const [generatingPrompt, setGeneratingPrompt] = useState(""); // Backwards compatibility
  const [activeTasks, setActiveTasks] = useState([]); // Array of { id, prompt, model, batchSize, status: 'generating' | 'completed' | 'error' }
  const [generateError, setGenerateError] = useState(null);
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const generateErrorNotice = formatGenerationErrorNotice(generateError);

  // Notify parent when generation state changes (drives the corner indicator).
  // ImageStudio stays mounted across tabs, so this state is always accurate.
  useEffect(() => {
    const hasActiveGenerations = activeTasks.some(task => task.status === 'generating');
    onGeneratingChange?.(hasActiveGenerations);
  }, [activeTasks, onGeneratingChange]);

  // ── Canvas / history state ──────────────────────────────────────────────
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [activeHistoryIdx, setActiveHistoryIdx] = useState(0);
  const [batchSize, setBatchSize] = useState(1);
  const [localHistory, setLocalHistory] = useState([]); // [{id,url,prompt,model,aspect_ratio,timestamp}]

  // Use prop history if provided, otherwise local
  const history = historyItems ?? localHistory;

  // ── Refs ────────────────────────────────────────────────────────────────
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const uploadPickerResetRef = useRef(null); // not used directly — managed via key

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [dropdownOpen]);

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      const refsStored = localStorage.getItem(PERSIST_REFS_KEY);
      const recentStored = readRecentResults();
      const refsData = refsStored ? JSON.parse(refsStored) : {};
      if (stored) {
        const data = JSON.parse(stored);
        if (data.imageMode !== undefined) setImageMode(data.imageMode);
        if (data.selectedModelId) setSelectedModelId(data.selectedModelId);
        if (data.selectedModelName) setSelectedModelName(data.selectedModelName);
        if (data.selectedAr) setSelectedAr(data.selectedAr);
        if (data.selectedQuality) setSelectedQuality(data.selectedQuality);
        if (data.selectedEffect) setSelectedEffect(data.selectedEffect);
        if (data.maxImages) setMaxImages(data.maxImages);
        if (data.prompt) setPrompt(data.prompt);
        if (data.uploadedImageUrls) setUploadedImageUrls(data.uploadedImageUrls);
        if (data.batchSize) setBatchSize(data.batchSize);
        if (data.localHistory) setLocalHistory(data.localHistory);
      }
      if (recentStored.length > 0) {
        setLocalHistory((prev) => mergeHistoryEntries(prev, recentStored));
      }
      if (Array.isArray(refsData.uploadedImageUrls)) {
        setUploadedImageUrls(refsData.uploadedImageUrls);
      }
    } catch (err) {
      console.warn("Failed to load ImageStudio persistence:", err);
    }
  }, [mergeHistoryEntries, readRecentResults]);

  // ── Restore image history from server gallery ─────────────────────────────
  useEffect(() => {
    if (historyItems !== undefined) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/gallery?type=image");
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const entries = Array.isArray(payload.entries) ? payload.entries : [];
        const normalized = entries
          .filter((entry) => entry?.url)
          .map((entry) => ({
            id: entry.id,
            url: entry.url,
            prompt: entry.prompt || "",
            model: entry.model || null,
            aspect_ratio: entry.aspect_ratio || null,
            timestamp: entry.created_at || entry.timestamp || new Date().toISOString(),
          }));
        if (cancelled || normalized.length === 0) return;
        setLocalHistory((prev) => mergeHistoryEntries(prev, normalized));
      } catch (err) {
        console.warn("Failed to restore ImageStudio history from gallery:", err?.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [historyItems, mergeHistoryEntries]);

  // ── Adjust height on load ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      handleTextareaInput();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        writeRefsState(uploadedImageUrls);
        const state = {
          imageMode,
          selectedModelId,
          selectedModelName,
          selectedAr,
          selectedQuality,
          selectedEffect,
          maxImages,
          prompt,
          uploadedImageUrls,
          batchSize,
          localHistory: sanitizeHistoryForStorage(localHistory),
        };
        writePersistentState(state);
      } catch (err) {
        console.warn("Failed to prepare ImageStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [
    imageMode,
    selectedModelId,
    selectedModelName,
    selectedAr,
    selectedQuality,
    selectedEffect,
    maxImages,
    prompt,
    uploadedImageUrls,
    batchSize,
    localHistory,
    sanitizeHistoryForStorage,
    writePersistentState,
    writeRefsState,
  ]);

  // Safety net: if the UI history gets cleared unexpectedly after a successful
  // generation, restore the most recent durable results from a dedicated cache.
  useEffect(() => {
    if (historyItems !== undefined) return;
    if (generating) return;
    if (localHistory.length > 0) return;
    const recent = readRecentResults();
    if (recent.length === 0) return;
    setLocalHistory((prev) => (prev.length > 0 ? prev : mergeHistoryEntries(recent, prev)));
    if (!currentImageUrl && recent[0]?.url) {
      setCurrentImageUrl(recent[0].url);
      setActiveHistoryIdx(0);
    }
  }, [currentImageUrl, generating, historyItems, localHistory.length, mergeHistoryEntries, readRecentResults]);

  // ── Derived: current model lists & helpers ───────────────────────────────
  const currentModels = imageMode ? i2iModels : t2iModels;
  const currentAspectRatios = imageMode && selectedModelId
    ? getAspectRatiosForI2IModel(selectedModelId)
    : selectedModelId ? getAspectRatiosForModel(selectedModelId) : [];
  const currentResolutions = imageMode && selectedModelId
    ? getResolutionsForI2IModel(selectedModelId)
    : selectedModelId ? getResolutionsForModel(selectedModelId) : [];
  const currentQualityField = imageMode && selectedModelId
    ? getQualityFieldForI2IModel(selectedModelId)
    : selectedModelId ? getQualityFieldForModel(selectedModelId) : "";
  const showQualityBtn = currentResolutions.length > 0;
  const currentEffects = imageMode && selectedModelId ? getEffectsForI2IModel(selectedModelId) : [];
  const showEffectBtn = currentEffects.length > 0;

  // Validate selected model exists in current models, reset if not
  useEffect(() => {
    const currentModelIds = currentModels.map(m => m.id);
    if (currentModels.length > 0 && !currentModelIds.includes(selectedModelId)) {
      const firstModel = currentModels[0];
      setSelectedModelId(firstModel.id);
      setSelectedModelName(firstModel.name);
      const ars = imageMode
        ? getAspectRatiosForI2IModel(firstModel.id)
        : getAspectRatiosForModel(firstModel.id);
      const resolutions = imageMode
        ? getResolutionsForI2IModel(firstModel.id)
        : getResolutionsForModel(firstModel.id);
      setSelectedAr(ars[0] || "1:1");
      setSelectedQuality(resolutions[0] || null);
      setSelectedQualityOpt(getImageInputDefault(firstModel.id, "quality"));
      setSelectedFormat(getImageInputDefault(firstModel.id, "format"));
      setSelectedBackground(getImageInputDefault(firstModel.id, "background"));
      setSelectedModeration(getImageInputDefault(firstModel.id, "moderation"));
      setSelectedImageSize(getImageInputDefault(firstModel.id, "imageSize"));
      if (imageMode) {
        const effects = getEffectsForI2IModel(firstModel.id);
        setSelectedEffect(effects.length > 0 ? (getDefaultEffectForI2IModel(firstModel.id) || effects[0]) : "");
      }
    }
  }, [currentModels, selectedModelId, imageMode]);

  // Extra parameter option lists for the current model.
  const currentQualityOptions = selectedModelId ? getImageInputOptions(selectedModelId, "quality") : [];
  const currentFormatOptions = selectedModelId ? getImageInputOptions(selectedModelId, "format") : [];
  const currentBackgroundOptions = selectedModelId ? getImageInputOptions(selectedModelId, "background") : [];
  const currentModerationOptions = selectedModelId ? getImageInputOptions(selectedModelId, "moderation") : [];
  const currentImageSizeOptions = selectedModelId ? getImageInputOptions(selectedModelId, "imageSize") : [];
  const uploadPickerMaxImages = useMemo(
    () =>
      getUploadPickerMaxImages({
        imageMode,
        maxImages,
        selectedModelId,
        t2iModels,
        i2iModels,
        getMaxImagesForModel: getMaxImagesForI2IModel,
      }),
    [imageMode, maxImages, selectedModelId, t2iModels, i2iModels],
  );

  const ensureImageModeForUploads = useCallback(() => {
    if (imageMode || !selectedModelId) return;
    const currentT2I = t2iModels.find((m) => m.id === selectedModelId);
    const matchedI2I =
      (currentT2I && i2iModels.find((m) => m.apiId === currentT2I.apiId)) ||
      i2iModels[0];
    if (!matchedI2I) return;

    const ars = getAspectRatiosForI2IModel(matchedI2I.id);
    const resolutions = getResolutionsForI2IModel(matchedI2I.id);
    const effects = getEffectsForI2IModel(matchedI2I.id);
    setImageMode(true);
    setSelectedModelId(matchedI2I.id);
    setSelectedModelName(matchedI2I.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSelectedQualityOpt(getImageInputDefault(matchedI2I.id, "quality"));
    setSelectedFormat(getImageInputDefault(matchedI2I.id, "format"));
    setSelectedBackground(getImageInputDefault(matchedI2I.id, "background"));
    setSelectedModeration(getImageInputDefault(matchedI2I.id, "moderation"));
    setSelectedImageSize(getImageInputDefault(matchedI2I.id, "imageSize"));
    setSelectedEffect(effects.length > 0 ? (getDefaultEffectForI2IModel(matchedI2I.id) || effects[0]) : "");
    setMaxImages(getMaxImagesForI2IModel(matchedI2I.id));
  }, [i2iModels, imageMode, selectedModelId, t2iModels]);

  const handleUploadPreviewChange = useCallback(
    ({ url, urls }) => {
      const newUrls = urls || [url];
      setPreviewImageUrls(newUrls);
      if (newUrls.length > 0) ensureImageModeForUploads();
    },
    [ensureImageModeForUploads],
  );

  const handleUploadSelect = useCallback(
    ({ url, urls }) => {
      const newUrls = urls || [url];
      setUploadedImageUrls(newUrls);
      setPreviewImageUrls(newUrls);
      if (newUrls.length > 0) ensureImageModeForUploads();
    },
    [ensureImageModeForUploads],
  );

  const processDroppedImages = useCallback(async (files) => {
    const invalid = files.find((file) => {
      try {
        validateImageReferenceUploadFile(file);
        return false;
      } catch {
        return true;
      }
    });
    if (invalid) {
      alert(
        `Формат файла не поддерживается: ${invalid.name || "без имени"}. Поддерживаются JPG, PNG, TIFF и RAW до 50 МБ.`
      );
      return;
    }

    setGenerating(true); // Show as generating/busy
    try {
      const toUpload =
        uploadPickerMaxImages === 1 ? files.slice(0, 1) : files.slice(0, uploadPickerMaxImages);
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          try {
            const processedFile = await optimizeImageUploadFile(file);
            return await uploadFile(apiKey, processedFile);
          } catch (err) {
            console.error(
              "[ImageStudio] Drop upload failed for",
              file.name,
              err
            );
            throw err;
          }
        })
      );

      handleUploadSelect({ urls });
    } catch (err) {
      alert(`Ошибка загрузки изображения: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }, [apiKey, handleUploadSelect, uploadPickerMaxImages]);

  // ── Handle Dropped Files ────────────────────────────────────────────────
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const imageFiles = droppedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        processDroppedImages(imageFiles);
      }
      onFilesHandled?.();
    }
  }, [droppedFiles, onFilesHandled, processDroppedImages]);

  // ── Textarea auto-resize ─────────────────────────────────────────────────
  const handleTextareaInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = window.innerWidth < 768 ? 300 : 400;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
  };

  useEffect(() => {
    handleTextareaInput();
  }, [prompt]);

  // ── Upload picker callbacks ──────────────────────────────────────────────

  const handleUploadClear = useCallback(() => {
    setPreviewImageUrls([]);
    setUploadedImageUrls([]);
    setReferenceUploadsPending(false);
    setImageMode(false);
    const firstT2I = t2iModels[0];
    if (firstT2I) {
      const ars = getAspectRatiosForModel(firstT2I.id);
      const resolutions = getResolutionsForModel(firstT2I.id);
      setSelectedModelId(firstT2I.id);
      setSelectedModelName(firstT2I.name);
      setSelectedAr(ars[0] || "1:1");
      setSelectedQuality(resolutions[0] || null);
      setSelectedQualityOpt(getImageInputDefault(firstT2I.id, "quality"));
      setSelectedFormat(getImageInputDefault(firstT2I.id, "format"));
      setSelectedBackground(getImageInputDefault(firstT2I.id, "background"));
      setSelectedModeration(getImageInputDefault(firstT2I.id, "moderation"));
      setSelectedImageSize(getImageInputDefault(firstT2I.id, "imageSize"));
      setSelectedEffect("");
      setMaxImages(1);
    }
  }, [t2iModels]);

  // ── Model selection ──────────────────────────────────────────────────────
  const handleModelSelect = (m) => {
    const ars = imageMode
      ? getAspectRatiosForI2IModel(m.id)
      : getAspectRatiosForModel(m.id);
    const resolutions = imageMode
      ? getResolutionsForI2IModel(m.id)
      : getResolutionsForModel(m.id);
    setSelectedModelId(m.id);
    setSelectedModelName(m.name);
    setSelectedAr(ars[0] || "1:1");
    setSelectedQuality(resolutions[0] || null);
    setSelectedQualityOpt(getImageInputDefault(m.id, "quality"));
    setSelectedFormat(getImageInputDefault(m.id, "format"));
    setSelectedBackground(getImageInputDefault(m.id, "background"));
    setSelectedModeration(getImageInputDefault(m.id, "moderation"));
    setSelectedImageSize(getImageInputDefault(m.id, "imageSize"));
    if (imageMode) {
      setMaxImages(getMaxImagesForI2IModel(m.id));
      const effects = getEffectsForI2IModel(m.id);
      setSelectedEffect(effects.length > 0 ? (getDefaultEffectForI2IModel(m.id) || effects[0]) : "");
    } else {
      setSelectedEffect("");
    }
  };

  // ── History helpers ──────────────────────────────────────────────────────
  const removeFromHistory = useCallback(async (entry, entryIdx) => {
    const deleteId = entry?.id || "local-media";
    const deleteUrl = typeof entry?.url === "string" ? entry.url : "";
    const previousHistory = Array.isArray(history) ? [...history] : [];
    const previousCurrentImageUrl = currentImageUrl;
    const previousActiveHistoryIdx = activeHistoryIdx;
    const nextEntries = excludeImageHistoryEntry(history, entry);

    if (historyItems !== undefined) {
      onHistoryChange?.(excludeImageHistoryEntry(historyItems, entry));
    } else {
      setLocalHistory((prev) => excludeImageHistoryEntry(prev, entry));
    }

    removeEntryFromStorageCaches(entry);

    if (currentImageUrl === entry?.url) {
      setCurrentImageUrl(nextEntries[0]?.url || null);
      setActiveHistoryIdx(0);
    } else if (entryIdx <= activeHistoryIdx) {
      setActiveHistoryIdx((prev) => Math.max(0, prev - 1));
    }

    toast.success("Удалено");

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
        if (historyItems !== undefined) {
          onHistoryChange?.(previousHistory);
        } else {
          setLocalHistory(previousHistory);
        }
        if (previousCurrentImageUrl) {
          setCurrentImageUrl(previousCurrentImageUrl);
        }
        setActiveHistoryIdx(previousActiveHistoryIdx);
        toast.error(`Не удалось удалить файл: ${err.message || "ошибка"}`);
        return;
      }
    }
  }, [activeHistoryIdx, currentImageUrl, history, historyItems, onHistoryChange, removeEntryFromStorageCaches]);

  const addToHistory = useCallback(
    (entry) => {
      if (!historyItems) {
        setLocalHistory((prev) => [entry, ...prev.slice(0, 49)]);
      }
      setActiveHistoryIdx(0);
      setCurrentImageUrl(entry.url);
    },
    [historyItems],
  );

  // Write a completed result straight into the persisted history in localStorage.
  // This runs even if the React component has been unmounted (e.g. the user
  // navigated to the workflow builder), so the image is never lost — it shows
  // up the next time ImageStudio loads its history.
  const persistEntryToStorage = useCallback((entry) => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      const data = raw ? JSON.parse(raw) : {};
      const prevHistory = Array.isArray(data.localHistory) ? data.localHistory : [];
      // Avoid duplicates by id.
      if (prevHistory.some((e) => e.id === entry.id)) return;
      data.localHistory = sanitizeHistoryForStorage([entry, ...prevHistory]);
      writePersistentState(data);
      writeRecentResults([entry, ...prevHistory]);
    } catch (err) {
      console.warn("persistEntryToStorage failed:", err?.message);
    }
  }, [sanitizeHistoryForStorage, writePersistentState, writeRecentResults]);

  const saveImageToGallery = useCallback(async (url, promptText = "", modelId = "") => {
    if (!url || typeof url !== "string") return null;
    try {
      return await saveMediaToGallery({
        url,
        type: "image",
        model: modelId || "",
        prompt: promptText || "",
      });
    } catch (err) {
      toast.error(`Не удалось сохранить в галерею: ${err.message || "ошибка"}`);
      return null;
    }
  }, []);

  // ── View state ─────────────────────────────────────

  const resetToPrompt = () => {
    setCurrentImageUrl(null);
    setPrompt("");
    setUploadedImageUrls([]);
    setImageMode(false);
    const firstT2I = t2iModels[0];
    if (firstT2I) {
      const ars = getAspectRatiosForModel(firstT2I.id);
      const resolutions = getResolutionsForModel(firstT2I.id);
      setSelectedModelId(firstT2I.id);
      setSelectedModelName(firstT2I.name);
      setSelectedAr(ars[0] || "1:1");
      setSelectedQuality(resolutions[0] || null);
      setSelectedQualityOpt(getImageInputDefault(firstT2I.id, "quality"));
      setSelectedFormat(getImageInputDefault(firstT2I.id, "format"));
      setSelectedBackground(getImageInputDefault(firstT2I.id, "background"));
      setSelectedModeration(getImageInputDefault(firstT2I.id, "moderation"));
      setSelectedImageSize(getImageInputDefault(firstT2I.id, "imageSize"));
      setSelectedEffect("");
      setMaxImages(1);
    }
  };

  // ── Generation ───────────────────────────────────────────────────────────
  // Core generation runner. Takes an explicit params snapshot so it can run
  // both from a user click and from an auto-resume on page reload.
  const runGeneration = useCallback(
    async (snap) => {
      const taskId = snap.requestId;
      const promptTrim = (snap.prompt || "").trim();
      const batch = snap.batchSize || 1;

      // Add task to active tasks and set backwards-compatible states
      // Find model name from model ID for correct display
      const findModelName = (modelId) => {
        const t2iMatch = t2iModels.find(m => m.id === modelId);
        const i2iMatch = i2iModels.find(m => m.id === modelId);
        return (t2iMatch?.name) || (i2iMatch?.name) || modelId;
      };
      
      setActiveTasks(prev => [
        ...prev,
        {
          id: taskId,
          prompt: promptTrim,
          model: snap.selectedModelId,
          modelName: findModelName(snap.selectedModelId),
          batchSize: batch,
          status: 'generating',
          createdAt: Date.now()
        }
      ]);
      setGenerating(true);
      setGeneratingPrompt(promptTrim);
      setGenerateError(null);

      try {
        const results = await Promise.all(
          Array.from({ length: batch }).map(async () => {
            if (snap.imageMode) {
              const genParams = {
                model: snap.selectedModelId,
                images_list: snap.uploadedImageUrls,
                image_url: snap.uploadedImageUrls?.[0],
                aspect_ratio: snap.selectedAr,
              };
              if (promptTrim) genParams.prompt = promptTrim;
              if (snap.qualityField && snap.selectedQuality) {
                genParams[snap.qualityField] = snap.selectedQuality;
              }
              if (snap.selectedQualityOpt) genParams.quality = snap.selectedQualityOpt;
              if (snap.selectedFormat) genParams.format = snap.selectedFormat;
              if (snap.selectedBackground) genParams.background = snap.selectedBackground;
              if (snap.selectedModeration) genParams.moderation = snap.selectedModeration;
              if (snap.selectedImageSize) genParams.imageSize = snap.selectedImageSize;
              if (snap.selectedRouting) genParams.routing = snap.selectedRouting;
              if (snap.effect) genParams.name = snap.effect;
              return await generateI2I(apiKey, genParams);
            } else {
              const genParams = {
                model: snap.selectedModelId,
                prompt: promptTrim,
                aspect_ratio: snap.selectedAr,
              };
              if (snap.qualityField && snap.selectedQuality) {
                genParams[snap.qualityField] = snap.selectedQuality;
              }
              if (snap.selectedQualityOpt) genParams.quality = snap.selectedQualityOpt;
              if (snap.selectedFormat) genParams.format = snap.selectedFormat;
              if (snap.selectedImageSize) genParams.imageSize = snap.selectedImageSize;
              if (snap.selectedRouting) genParams.routing = snap.selectedRouting;
              return await generateImage(apiKey, genParams);
            }
          })
        );

        let added = 0;
        const postProcessTasks = [];
        results.forEach((res) => {
          if (res && res.url) {
            added++;
            const id = res.id || Math.random().toString(36).substring(7);
            const rawUrl = res.url;
            const entry = {
              id,
              url: rawUrl,
              prompt: promptTrim,
              model: snap.selectedModelId,
              aspect_ratio: snap.selectedAr,
              timestamp: new Date().toISOString(),
            };
            // Show the result IMMEDIATELY (raw url / base64) — don't make the user
            // wait for the TOS upload. Display is in-memory only at this point.
            addToHistory(entry);
            // Store the immediate result in the lightweight recent cache only.
            // Even provider http(s) URLs may be temporary, so durable storage
            // happens only after the TOS mirroring step below.
            writeRecentResults([entry, ...history]);
            upsertPendingResults(snap.requestId, [entry]);

            // Do not mark generation as fully complete until the image is saved
            // to a durable URL and written to the gallery. This prevents a fast
            // page refresh from losing freshly generated images.
            postProcessTasks.push((async () => {
              let permUrl = rawUrl;
              try {
                permUrl = await persistImageToTOS(rawUrl);
              } catch {
                permUrl = rawUrl;
              }
              const finalEntry = { ...entry, url: permUrl };
              if (permUrl !== rawUrl) {
                setCurrentImageUrl((cur) => (cur === rawUrl ? permUrl : cur));
                setLocalHistory((prev) =>
                  prev.map((e) => (e.id === id ? finalEntry : e)),
                );
              }
              persistEntryToStorage(finalEntry);
              await saveImageToGallery(finalEntry.url, finalEntry.prompt, finalEntry.model);

              // Write to dedicated result key so the resume-poll can find the entry
              // even if the component was unmounted and the save-effect ran in between.
              upsertPendingResults(snap.requestId, [finalEntry]);

              onGenerationComplete?.({
                url: permUrl,
                model: snap.selectedModelId,
                prompt: promptTrim,
                type: "image",
              });
            })());
          }
        });

        // If the request "succeeded" but produced no usable image, surface it
        // instead of silently showing nothing.
        if (added === 0) {
          try { localStorage.removeItem(PENDING_KEY); } catch {}
          throw new Error("Изображение не получено. Попробуйте другую модель.");
        }

        // Mark task as completed immediately when images are shown
        setActiveTasks(prev => {
          const updated = prev.map(t => 
            t.id === taskId ? { ...t, status: 'completed' } : t
          );
          // Update backwards-compatible generating state right away
          const hasActive = updated.some(t => t.status === 'generating');
          setGenerating(hasActive);
          if (!hasActive) setGeneratingPrompt('');
          return updated;
        });
        // Remove task after short delay
        setTimeout(() => {
          setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        }, 500);

        Promise.allSettled(postProcessTasks)
          .catch(() => {})
          .finally(() => {
            try { localStorage.removeItem(PENDING_KEY); } catch {}
          });
      } catch (e) {
        console.error("[ImageStudio] Generation failed:", e);
        setGenerateError(e.message.slice(0, 120));
        setTimeout(() => setGenerateError(null), 6000);
        // On error there are no TOS IIFEs to remove PENDING_KEY, so do it here.
        try { localStorage.removeItem(PENDING_KEY); } catch {}
        // Mark task as error
        setActiveTasks(prev => {
          const updated = prev.map(t => 
            t.id === taskId ? { ...t, status: 'error' } : t
          );
          // Update backwards-compatible generating state
          const hasActive = updated.some(t => t.status === 'generating');
          setGenerating(hasActive);
          if (!hasActive) setGeneratingPrompt('');
          return updated;
        });
        // Remove task after short delay
        setTimeout(() => {
          setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        }, 2000);
      }
    },
    [apiKey, addToHistory, history, i2iModels, onGenerationComplete, persistEntryToStorage, saveImageToGallery, t2iModels, upsertPendingResults, writeRecentResults],
  );

  const handleGenerate = () => {
    if (referenceUploadsPending) {
      alert("Подождите, пока загрузится изображение.");
      return;
    }

    if (imageMode) {
      if (uploadedImageUrls.length === 0) {
        alert("Пожалуйста, сначала загрузите референсное изображение.");
        return;
      }
    } else {
      if (!prompt.trim()) {
        alert("Пожалуйста, введите запрос для генерации изображения.");
        return;
      }
    }

    const snap = {
      imageMode,
      selectedModelId,
      uploadedImageUrls,
      prompt,
      qualityField: currentQualityField,
      selectedQuality,
      selectedQualityOpt: currentQualityOptions.length > 0 ? selectedQualityOpt : null,
      selectedFormat: currentFormatOptions.length > 0 ? selectedFormat : null,
      selectedBackground: currentBackgroundOptions.length > 0 ? selectedBackground : null,
      selectedModeration: currentModerationOptions.length > 0 ? selectedModeration : null,
      selectedImageSize: currentImageSizeOptions.length > 0 ? selectedImageSize : null,
      selectedRouting,
      effect: showEffectBtn ? selectedEffect : "",
      selectedAr,
      batchSize,
      requestId: Math.random().toString(36).slice(2, 11),
      ts: Date.now(),
    };

    // Persist the in-flight request so it survives a tab switch.
    try { localStorage.removeItem(PENDING_RESULT_KEY); } catch {}
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(snap)); } catch {}

    runGeneration(snap);
  };

  // ── Resume a generation that was interrupted by a tab switch ────────────────
  // When the user navigates away mid-generation and comes back, the original
  // async request keeps running in the background and eventually writes its
  // result to PENDING_RESULT_KEY then removes PENDING_KEY.  We show a spinner
  // and poll every 2 s until we detect that signal, then surface the result.
  useEffect(() => {
    if (!apiKey) return;
    let snap;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      snap = JSON.parse(raw);
    } catch {
      try { localStorage.removeItem(PENDING_KEY); } catch {}
      return;
    }
    // Discard stale or legacy snaps (no requestId = pre-fix format, or > 10 min old).
    if (!snap?.requestId || !snap?.ts || Date.now() - snap.ts > 10 * 60 * 1000) {
      try { localStorage.removeItem(PENDING_KEY); } catch {}
      return;
    }

    if (snap.prompt) setPrompt(snap.prompt);

    const findResults = () => {
      try {
        const rd = JSON.parse(localStorage.getItem(PENDING_RESULT_KEY) || '{}');
        if (rd.requestId !== snap.requestId) return [];
        return Array.isArray(rd.entries) ? rd.entries : [];
      } catch { return []; }
    };

    // If the generation already completed while we were away, just restore it.
    const alreadyDone = findResults();
    if (alreadyDone.length > 0) {
      alreadyDone.forEach((e) => {
        setLocalHistory(prev => prev.some(p => p.id === e.id) ? prev : [e, ...prev.slice(0, 49)]);
        setCurrentImageUrl(e.url);
      });
      setActiveHistoryIdx(0);

      let cancelled = false;
      (async () => {
        try {
          for (const entry of alreadyDone) {
            let permUrl = entry.url;
            try {
              permUrl = await persistImageToTOS(entry.url);
            } catch {
              permUrl = entry.url;
            }
            const finalEntry = { ...entry, url: permUrl };
            if (cancelled) return;
            setLocalHistory((prev) =>
              prev.map((p) => (p.id === entry.id ? finalEntry : p)),
            );
            setCurrentImageUrl((cur) => (cur === entry.url ? permUrl : cur));
            persistEntryToStorage(finalEntry);
            await saveImageToGallery(finalEntry.url, finalEntry.prompt, finalEntry.model);
            upsertPendingResults(snap.requestId, [finalEntry]);
          }
        } finally {
          if (cancelled) return;
          try { localStorage.removeItem(PENDING_RESULT_KEY); } catch {}
          try { localStorage.removeItem(PENDING_KEY); } catch {}
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    // Generation still in flight — add to active tasks and poll for the done signal.
    // Find model name from model ID for correct display
    const findModelName = (modelId) => {
      const t2iMatch = t2iModels.find(m => m.id === modelId);
      const i2iMatch = i2iModels.find(m => m.id === modelId);
      return (t2iMatch?.name) || (i2iMatch?.name) || modelId;
    };
    
    setActiveTasks(prev => {
      const existing = prev.find(t => t.id === snap.requestId);
      const updated = existing ? prev : [...prev, {
        id: snap.requestId,
        prompt: snap.prompt || '',
        model: snap.selectedModelId,
        modelName: findModelName(snap.selectedModelId), // Fallback
        batchSize: snap.batchSize || 1,
        status: 'generating',
        createdAt: snap.ts
      }];
      // Update backwards-compatible states
      const hasActive = updated.some(t => t.status === 'generating');
      setGenerating(hasActive);
      if (hasActive) setGeneratingPrompt(snap.prompt || '');
      return updated;
    });

    let cancelled = false;
    const intervalId = setInterval(() => {
      if (cancelled) return;

      const stillPending = localStorage.getItem(PENDING_KEY);
      if (!stillPending) {
        // PENDING_KEY gone → background task finished writing PENDING_RESULT_KEY.
        clearInterval(intervalId);
        const entries = findResults();
        entries.forEach(e => {
          setLocalHistory(prev => prev.some(p => p.id === e.id) ? prev : [e, ...prev.slice(0, 49)]);
          setCurrentImageUrl(e.url);
        });
        if (entries.length > 0) {
          setActiveHistoryIdx(0);
          try { localStorage.removeItem(PENDING_RESULT_KEY); } catch {}
        }
        // Mark task as completed and remove
        setActiveTasks(prev => {
          const updated = prev.map(t => 
            t.id === snap.requestId ? { ...t, status: 'completed' } : t
          );
          const hasActive = updated.some(t => t.status === 'generating');
          setGenerating(hasActive);
          if (!hasActive) setGeneratingPrompt('');
          return updated;
        });
        setTimeout(() => {
          setActiveTasks(prev => prev.filter(t => t.id !== snap.requestId));
        }, 500);
        return;
      }

      if (Date.now() - snap.ts > 10 * 60 * 1000) {
        clearInterval(intervalId);
        try { localStorage.removeItem(PENDING_KEY); } catch {}
        // Mark task as error and remove
        setActiveTasks(prev => {
          const updated = prev.map(t => 
            t.id === snap.requestId ? { ...t, status: 'error' } : t
          );
          const hasActive = updated.some(t => t.status === 'generating');
          setGenerating(hasActive);
          if (!hasActive) setGeneratingPrompt('');
          return updated;
        });
        setTimeout(() => {
          setActiveTasks(prev => prev.filter(t => t.id !== snap.requestId));
        }, 2000);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, persistEntryToStorage, saveImageToGallery, upsertPendingResults]);

  const placeholderText =
    getDisplayUploadUrls(previewImageUrls, uploadedImageUrls).length > 1
      ? `${getDisplayUploadUrls(previewImageUrls, uploadedImageUrls).length} изображений выбрано — опишите трансформацию (необязательно)`
      : imageMode
        ? "Опишите как трансформировать изображение (необязательно)"
        : "Опишите изображение, которое хотите создать";

  const openWorkflowPicker = async (url, prompt) => {
    setWorkflowPicker({ url, prompt });
    setPickerLoading(true);
    try {
      const data = await getUserWorkflows(apiKey);
      setPickerWorkflows(data || []);
    } catch {
      setPickerWorkflows([]);
    } finally {
      setPickerLoading(false);
    }
  };

  const sendToWorkflow = (wf) => {
    try {
      localStorage.setItem("mf_pending_workflow_image", JSON.stringify({
        url: workflowPicker.url,
        workflowId: wf.id,
      }));
    } catch {}
    setWorkflowPicker(null);
    router.push(`/workflow/${wf.id}/builder`);
  };

  // ── If loading or no models, show appropriate state ─────────────────────────────
  if (loading) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white/40">
        <div className="text-4xl mb-4">⏳</div>
        <div className="text-lg font-medium">Загрузка...</div>
      </div>
    );
  }
  
  if (t2iModels.length === 0 && i2iModels.length === 0) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center text-white/40">
        <div className="text-4xl mb-4">🎬</div>
        <div className="text-lg font-medium">Студия фото временно недоступна</div>
        <div className="text-sm mt-2">Перейдите в Студию видео для генерации</div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-hidden">
      
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {(activeTasks.length > 0 || generating || history.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full pt-4 animate-fade-in-up">
            {/* Generating card(s) — appear first while image(s) are being created */}
            {activeTasks.length > 0 && activeTasks.map((task) => (
              Array.from({ length: task.batchSize }).map((_, i) => (
                <div key={`gen-${task.id}-${i}`} className="relative rounded-lg overflow-hidden border border-primary/40 bg-[#0a0a0a] shadow-xl flex flex-col animate-fade-in-up">
                  {/* Shimmer thumbnail */}
                  <div className="w-full aspect-square bg-gradient-to-br from-black via-primary/5 to-black relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <div className="absolute inset-0" style={{
                      background: "linear-gradient(105deg, transparent 40%, rgba(34,211,238,0.06) 50%, transparent 60%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2s infinite linear",
                    }} />
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <svg className="animate-spin text-primary" width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      <span className="text-[11px] font-semibold text-primary/80 tracking-widest uppercase">Генерация…</span>
                    </div>
                  </div>
                  {/* Card footer */}
                  <div className="p-3 bg-black/80 border-t border-primary/10 flex flex-col gap-2">
                    <p className="text-white/50 text-xs line-clamp-2 leading-relaxed italic">
                      {task.prompt || "Создаётся изображение…"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                        {task.modelName}
                      </span>
                      <span className="text-[10px] text-white/30 animate-pulse">● обработка</span>
                    </div>
                  </div>
                </div>
              ))
            ))}
            {activeTasks.length === 0 && generating && Array.from({ length: batchSize }).map((_, i) => (
              <div key={`gen-compat-${i}`} className="relative rounded-lg overflow-hidden border border-primary/40 bg-[#0a0a0a] shadow-xl flex flex-col animate-fade-in-up">
                {/* Shimmer thumbnail */}
                <div className="w-full aspect-square bg-gradient-to-br from-black via-primary/5 to-black relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                  <div className="absolute inset-0" style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(34,211,238,0.06) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite linear",
                  }} />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <svg className="animate-spin text-primary" width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-[11px] font-semibold text-primary/80 tracking-widest uppercase">Генерация…</span>
                  </div>
                </div>
                {/* Card footer */}
                <div className="p-3 bg-black/80 border-t border-primary/10 flex flex-col gap-2">
                  <p className="text-white/50 text-xs line-clamp-2 leading-relaxed italic">
                    {generatingPrompt || "Создаётся изображение…"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                      {selectedModelName}
                    </span>
                    <span className="text-[10px] text-white/30 animate-pulse">● обработка</span>
                  </div>
                </div>
              </div>
            ))}
            {history.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
              >
                <img
                  src={entry.url}
                  alt={entry.prompt?.substring(0, 30) || "Созданное изображение"}
                  className="w-full aspect-square object-cover bg-black/40 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setFullscreenUrl(entry.url)}
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
                      downloadImage(entry.url, `muapi-${entry.id || idx}.jpg`);
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
                      removeFromHistory(entry, idx);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 hover:text-white transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Отправить в воркфлоу"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWorkflowPicker(entry.url, entry.prompt);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </button>
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
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                      {entry.model?.replace("-", " ")}
                    </span>
                    <span className="text-[10px] text-white/40">{entry.aspect_ratio}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-primary opacity-80"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">
                  ✨
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
              <span className="text-purple-300/50 font-medium text-2xl sm:text-3xl md:text-4xl">НАЧНИТЕ СОЗДАВАТЬ В</span><br />
              <span className="text-purple-300">СТУДИИ ИЗОБРАЖЕНИЙ</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              Опишите сцену, персонажа, настроение или стиль — и наблюдайте как это оживает
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <div 
        className="absolute bottom-4 w-full max-w-[95%] lg:max-w-4xl z-40 animate-fade-in-up" 
        style={{ animationDelay: "0.2s" }}
      >
        <div className="w-full bg-[#0a0a0a] rounded-md border border-white/10 p-4 flex flex-col gap-2 shadow-2xl">
          {/* Top row: upload picker + textarea */}
          <div className="flex items-start gap-2">
            <UploadButton
              apiKey={apiKey}
              maxImages={uploadPickerMaxImages}
              onSelect={handleUploadSelect}
              onPreviewChange={handleUploadPreviewChange}
              onClear={handleUploadClear}
              onUploadStateChange={setReferenceUploadsPending}
              initialUrls={getDisplayUploadUrls(previewImageUrls, uploadedImageUrls)}
            />
            <div className="flex-1 flex items-start gap-2">
              <div className="flex-1 flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onInput={handleTextareaInput}
                placeholder={placeholderText}
                rows={1}
                className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/20 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar"
              />
              </div>
              {prompt.trim() && (
                <div className="relative shrink-0 group">
                  <button
                    type="button"
                    title="Удалить промт"
                    aria-label="Удалить промт"
                    onClick={() => {
                      setPrompt("");
                      textareaRef.current?.focus();
                    }}
                    className="mt-1 w-9 h-9 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white hover:border-red-400 transition-all flex items-center justify-center shadow-lg shadow-red-500/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M18 6L6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                    Удалить промт
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: controls + generate */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-white/[0.03] relative">
            {/* Left controls */}
            <div className="flex items-center gap-2 relative flex-wrap pb-1 md:pb-0">
              {/* Model button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "model" ? null : "model"));
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <div className="w-4 h-4 bg-[#22d3ee] rounded flex items-center justify-center">
                    <span className="text-[9px] font-bold text-black uppercase">G</span>
                  </div>
                  <span className="text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {selectedModelName}
                  </span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {dropdownOpen === "model" && (
                  <div
                    ref={dropdownRef}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-lg p-3 shadow-2xl border border-white/[0.05] w-[calc(100vw-3rem)] max-w-xs"
                  >
                    <ModelDropdown
                      models={currentModels}
                      selectedModel={selectedModelId}
                      onSelect={handleModelSelect}
                      onClose={() => setDropdownOpen(null)}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>

              {/* Aspect ratio button */}
              {currentAspectRatios.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "ar" ? null : "ar"));
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {selectedAr}
                  </span>
                </button>

                {dropdownOpen === "ar" && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/10 min-w-[160px]"
                  >
                    <SimpleDropdown
                      title="Соотношение сторон"
                      options={currentAspectRatios}
                      selected={selectedAr}
                      onSelect={(val) => setSelectedAr(val)}
                      onClose={() => setDropdownOpen(null)}
                    />
                  </div>
                )}
              </div>
              )}

              {/* Quality/resolution button */}
              {showQualityBtn && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "quality" ? null : "quality"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {selectedQuality || currentResolutions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "quality" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                    >
                      <SimpleDropdown
                        title="Разрешение"
                        options={currentResolutions}
                        selected={selectedQuality}
                        onSelect={(val) => setSelectedQuality(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Quality button (auto/high/medium/low) */}
              {currentQualityOptions.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "qualopt" ? null : "qualopt"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {QUALITY_LABELS[selectedQualityOpt || currentQualityOptions[0]] || selectedQualityOpt || currentQualityOptions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "qualopt" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                    >
                      <SimpleDropdown
                        title="Качество"
                        options={currentQualityOptions}
                        selected={selectedQualityOpt}
                        labels={QUALITY_LABELS}
                        onSelect={(val) => setSelectedQualityOpt(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Output resolution button (Gemini imageSize: 1K/2K/4K/512) */}
              {currentImageSizeOptions.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "imageSize" ? null : "imageSize"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {selectedImageSize || currentImageSizeOptions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "imageSize" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                    >
                      <SimpleDropdown
                        title="Разрешение"
                        options={currentImageSizeOptions}
                        selected={selectedImageSize}
                        onSelect={(val) => setSelectedImageSize(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Output format button (jpeg/png/webp) */}
              {currentFormatOptions.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "format" ? null : "format"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors uppercase">
                      {selectedFormat || currentFormatOptions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "format" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                    >
                      <SimpleDropdown
                        title="Формат"
                        options={currentFormatOptions}
                        selected={selectedFormat}
                        onSelect={(val) => setSelectedFormat(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Background mode button (auto/transparent/opaque) — editing only */}
              {currentBackgroundOptions.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "background" ? null : "background"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {BACKGROUND_LABELS[selectedBackground || currentBackgroundOptions[0]] || selectedBackground || currentBackgroundOptions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "background" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                    >
                      <SimpleDropdown
                        title="Фон"
                        options={currentBackgroundOptions}
                        selected={selectedBackground}
                        labels={BACKGROUND_LABELS}
                        onSelect={(val) => setSelectedBackground(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Moderation button (auto/low) — editing only */}
              {currentModerationOptions.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "moderation" ? null : "moderation"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                      {MODERATION_LABELS[selectedModeration || currentModerationOptions[0]] || selectedModeration || currentModerationOptions[0]}
                    </span>
                  </button>

                  {dropdownOpen === "moderation" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                    >
                      <SimpleDropdown
                        title="Модерация"
                        options={currentModerationOptions}
                        selected={selectedModeration}
                        labels={MODERATION_LABELS}
                        onSelect={(val) => setSelectedModeration(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Routing strategy button (default/nitro/floor/stable) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen((o) => (o === "routing" ? null : "routing"));
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                    <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                    {routingLabels[selectedRouting] || selectedRouting}
                  </span>
                </button>

                {dropdownOpen === "routing" && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[160px]"
                  >
                    <SimpleDropdown
                      title="Приоритет"
                      options={routingOptions}
                      selected={selectedRouting}
                      labels={routingLabels}
                      onSelect={(val) => setSelectedRouting(val)}
                      onClose={() => setDropdownOpen(null)}
                    />
                  </div>
                )}
              </div>

              {/* Effect type button */}
              {showEffectBtn && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen((o) => (o === "effect" ? null : "effect"));
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40 text-white">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors max-w-[140px] truncate">
                      {selectedEffect || "Эффект"}
                    </span>
                  </button>

                  {dropdownOpen === "effect" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-[calc(100%+12px)] left-0 z-50 bg-[#0a0a0a] rounded-md p-3 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/[0.05] min-w-[200px]"
                    >
                      <SimpleDropdown
                        title="Тип эффекта"
                        options={currentEffects}
                        selected={selectedEffect}
                        onSelect={(val) => setSelectedEffect(val)}
                        onClose={() => setDropdownOpen(null)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Batch size selector */}
              <div className="flex items-center gap-1 bg-white/[0.03] rounded-md p-1 border border-white/[0.03]">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBatchSize(num)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-[10px] font-black transition-all ${
                      batchSize === num
                        ? "bg-[#22d3ee] text-black shadow-lg shadow-[#22d3ee]/20"
                        : "text-white/40 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={referenceUploadsPending}
              className={`bg-[#22d3ee] text-black px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-[#22d3ee]/10 z-10 hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#22d3ee] disabled:hover:scale-100`}
            >
              <span>{referenceUploadsPending ? "Загрузка..." : "Создать"}</span>
            </button>

            {/* Face Registration moved to Video Studio (bound to Seedance). */}
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

      {/* ── FULLSCREEN IMAGE MODAL ── */}
      {workflowPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setWorkflowPicker(null)} />
          <div className="relative w-full max-w-xs bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-sm font-black text-white mb-1 uppercase tracking-widest">Добавить в воркфлоу</h3>
            <p className="text-white/40 text-xs mb-5">Изображение добавится как входной нод</p>
            {pickerLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-white/10 border-t-[#22d3ee] rounded-full animate-spin" />
              </div>
            ) : pickerWorkflows.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6">Нет воркфлоу</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {pickerWorkflows.map((wf) => (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => sendToWorkflow(wf)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-[#22d3ee]/10 border border-white/5 hover:border-[#22d3ee]/30 transition-all group flex items-center gap-3"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 group-hover:text-[#22d3ee] flex-shrink-0">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span className="text-sm font-bold text-white group-hover:text-[#22d3ee] truncate">{wf.name || "Untitled Workflow"}</span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setWorkflowPicker(null)} className="mt-4 w-full py-2 text-xs text-white/30 hover:text-white transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

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
          <img
            src={fullscreenUrl}
            alt="На весь экран"
            className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
