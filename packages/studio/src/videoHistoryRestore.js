function deriveFileName(url, fallback) {
  const raw = String(url || "").trim();
  if (!raw) return fallback;
  try {
    const pathname = new URL(raw).pathname || "";
    const name = pathname.split("/").pop() || "";
    return name || fallback;
  } catch {
    const name = raw.split("?")[0].split("/").pop() || "";
    return name || fallback;
  }
}

function normalizeFaceAsset(faceAsset) {
  if (!faceAsset?.uri) return null;
  return {
    uri: String(faceAsset.uri),
    name: faceAsset.name || String(faceAsset.uri).replace(/^asset:\/\//, "").slice(0, 16),
    thumbnail: faceAsset.thumbnail || null,
    status: faceAsset.status || "",
  };
}

function normalizeRefFile(file, index = 0) {
  if (!file?.url || !file?.kind) return null;
  return {
    id: file.id || `restored_${index}`,
    url: String(file.url),
    kind: file.kind,
    name: file.name || deriveFileName(file.url, `${file.kind}-${index + 1}`),
    uploading: false,
    progress: 100,
  };
}

export function buildVideoHistoryRestoreState({
  prompt,
  selectedModel,
  imageMode,
  v2vMode,
  selectedAr,
  selectedDuration,
  selectedResolution,
  selectedQuality,
  selectedMode,
  selectedEffect,
  selectedCharacterOrientation,
  selectedKeepOriginalSound,
  uploadedImageUrl,
  uploadedEndImageUrl,
  uploadedVideoUrl,
  uploadedVideoName,
  uploadedAudioUrl,
  uploadedAudioName,
  refFiles,
  faceAsset,
  seed,
  returnLastFrame,
}) {
  return {
    prompt: typeof prompt === "string" ? prompt : "",
    selectedModel: selectedModel || "",
    imageMode: !!imageMode,
    v2vMode: !!v2vMode,
    selectedAr: selectedAr || null,
    selectedDuration: selectedDuration ?? null,
    selectedResolution: selectedResolution || null,
    selectedQuality: selectedQuality || "",
    selectedMode: selectedMode || "",
    selectedEffect: selectedEffect || "",
    selectedCharacterOrientation: selectedCharacterOrientation || "",
    selectedKeepOriginalSound: selectedKeepOriginalSound || "",
    uploadedImageUrl: uploadedImageUrl || null,
    uploadedEndImageUrl: uploadedEndImageUrl || null,
    uploadedVideoUrl: uploadedVideoUrl || null,
    uploadedVideoName: uploadedVideoName || deriveFileName(uploadedVideoUrl, "video"),
    uploadedAudioUrl: uploadedAudioUrl || null,
    uploadedAudioName: uploadedAudioName || deriveFileName(uploadedAudioUrl, "audio"),
    refFiles: (Array.isArray(refFiles) ? refFiles : [])
      .filter((file) => file?.url && !file?.uploading)
      .map((file, index) => normalizeRefFile(file, index))
      .filter(Boolean),
    faceAsset: normalizeFaceAsset(faceAsset),
    seed: Number.isFinite(Number(seed)) ? Number(seed) : -1,
    returnLastFrame: !!returnLastFrame,
  };
}

export function getVideoHistoryRestoreState(entry) {
  const restoreState = entry?.restoreState && typeof entry.restoreState === "object"
    ? entry.restoreState
    : {};

  return {
    prompt: typeof restoreState.prompt === "string"
      ? restoreState.prompt
      : (typeof entry?.prompt === "string" ? entry.prompt : ""),
    selectedModel: restoreState.selectedModel || entry?.model || "",
    imageMode: !!restoreState.imageMode,
    v2vMode: !!restoreState.v2vMode,
    selectedAr: restoreState.selectedAr || entry?.aspect_ratio || null,
    selectedDuration: restoreState.selectedDuration ?? entry?.duration ?? null,
    selectedResolution: restoreState.selectedResolution || entry?.resolution || null,
    selectedQuality: restoreState.selectedQuality || "",
    selectedMode: restoreState.selectedMode || "",
    selectedEffect: restoreState.selectedEffect || "",
    selectedCharacterOrientation: restoreState.selectedCharacterOrientation || "",
    selectedKeepOriginalSound: restoreState.selectedKeepOriginalSound || "",
    uploadedImageUrl: restoreState.uploadedImageUrl || null,
    uploadedEndImageUrl: restoreState.uploadedEndImageUrl || entry?.last_frame_url || null,
    uploadedVideoUrl: restoreState.uploadedVideoUrl || null,
    uploadedVideoName: restoreState.uploadedVideoName || deriveFileName(restoreState.uploadedVideoUrl, "video"),
    uploadedAudioUrl: restoreState.uploadedAudioUrl || null,
    uploadedAudioName: restoreState.uploadedAudioName || deriveFileName(restoreState.uploadedAudioUrl, "audio"),
    refFiles: (Array.isArray(restoreState.refFiles) ? restoreState.refFiles : [])
      .map((file, index) => normalizeRefFile(file, index))
      .filter(Boolean),
    faceAsset: normalizeFaceAsset(restoreState.faceAsset),
    seed: Number.isFinite(Number(restoreState.seed))
      ? Number(restoreState.seed)
      : (Number.isFinite(Number(entry?.seed)) ? Number(entry.seed) : -1),
    returnLastFrame: typeof restoreState.returnLastFrame === "boolean"
      ? restoreState.returnLastFrame
      : !!entry?.return_last_frame,
  };
}
