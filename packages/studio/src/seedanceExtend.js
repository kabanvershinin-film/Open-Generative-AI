const EXTEND_MODEL_NAMES = {
  "seedance-2.0-t2v": "Seedance 2.0",
  "seedance-2.0-mini-t2v": "Seedance 2.0 Mini",
  "seedance-2.0-fast-t2v": "Seedance 2.0 Fast",
};

export const EXTEND_VIDEO_NAME = "Видео для продления";

export function getSeedanceExtendTargetModel(modelId) {
  const value = String(modelId || "");

  if (value === "seedance-2.0-fast-t2v" || value === "seedance-2.0-fast-i2v") {
    return "seedance-2.0-fast-t2v";
  }
  if (value === "seedance-2.0-mini-t2v" || value === "seedance-2.0-mini-i2v") {
    return "seedance-2.0-mini-t2v";
  }
  if (value === "seedance-2.0-t2v" || value === "seedance-2.0-i2v") {
    return "seedance-2.0-t2v";
  }

  if (/doubao-seedance-2-0-fast/i.test(value)) return "seedance-2.0-fast-t2v";
  if (/doubao-seedance-2-0-mini/i.test(value)) return "seedance-2.0-mini-t2v";
  if (/doubao-seedance-2-0/i.test(value)) return "seedance-2.0-t2v";
  if (/seedance-2\.0-fast/i.test(value)) return "seedance-2.0-fast-t2v";
  if (/seedance-2\.0-mini/i.test(value)) return "seedance-2.0-mini-t2v";
  if (/seedance-2\.0/i.test(value)) return "seedance-2.0-t2v";

  return "";
}

export function buildSeedanceExtendSession(entry) {
  const videoUrl = typeof entry?.url === "string" ? entry.url.trim() : "";
  const modelId = getSeedanceExtendTargetModel(entry?.model);

  return {
    ready: !!videoUrl && !!modelId,
    modelId,
    modelName: EXTEND_MODEL_NAMES[modelId] || "Seedance 2.0",
    videoUrl: videoUrl || null,
    videoName: videoUrl ? EXTEND_VIDEO_NAME : null,
  };
}
