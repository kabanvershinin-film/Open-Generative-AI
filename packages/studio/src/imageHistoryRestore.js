function normalizeUrlList(urls) {
  return (Array.isArray(urls) ? urls : [])
    .filter((url) => typeof url === "string" && url.trim())
    .map((url) => String(url));
}

export function buildImageHistoryRestoreState({
  imageMode,
  imageSetMode,
  imageSetMaxImages,
  selectedModelId,
  selectedModelName,
  selectedAr,
  selectedQuality,
  selectedQualityOpt,
  selectedFormat,
  selectedBackground,
  selectedModeration,
  selectedImageSize,
  selectedRouting,
  selectedEffect,
  maxImages,
  batchSize,
  prompt,
  uploadedImageUrls,
}) {
  return {
    imageMode: !!imageMode,
    imageSetMode: !!imageSetMode,
    imageSetMaxImages: Math.max(1, Number(imageSetMaxImages) || 1),
    selectedModelId: selectedModelId || "",
    selectedModelName: selectedModelName || "",
    selectedAr: selectedAr || null,
    selectedQuality: selectedQuality || null,
    selectedQualityOpt: selectedQualityOpt || null,
    selectedFormat: selectedFormat || null,
    selectedBackground: selectedBackground || null,
    selectedModeration: selectedModeration || null,
    selectedImageSize: selectedImageSize || null,
    selectedRouting: selectedRouting || "default",
    selectedEffect: selectedEffect || "",
    maxImages: Math.max(1, Number(maxImages) || 1),
    batchSize: Math.max(1, Number(batchSize) || 1),
    prompt: typeof prompt === "string" ? prompt : "",
    uploadedImageUrls: normalizeUrlList(uploadedImageUrls),
  };
}

export function getImageHistoryRestoreState(entry) {
  const restoreState = entry?.restoreState && typeof entry.restoreState === "object"
    ? entry.restoreState
    : {};

  return {
    imageMode: !!restoreState.imageMode,
    imageSetMode: !!restoreState.imageSetMode,
    imageSetMaxImages: Math.max(1, Number(restoreState.imageSetMaxImages) || 1),
    selectedModelId: restoreState.selectedModelId || entry?.model || "",
    selectedModelName: restoreState.selectedModelName || "",
    selectedAr: restoreState.selectedAr || entry?.aspect_ratio || null,
    selectedQuality: restoreState.selectedQuality || null,
    selectedQualityOpt: restoreState.selectedQualityOpt || null,
    selectedFormat: restoreState.selectedFormat || null,
    selectedBackground: restoreState.selectedBackground || null,
    selectedModeration: restoreState.selectedModeration || null,
    selectedImageSize: restoreState.selectedImageSize || null,
    selectedRouting: restoreState.selectedRouting || "default",
    selectedEffect: restoreState.selectedEffect || "",
    maxImages: Math.max(1, Number(restoreState.maxImages) || 1),
    batchSize: Math.max(1, Number(restoreState.batchSize) || 1),
    prompt: typeof restoreState.prompt === "string"
      ? restoreState.prompt
      : (typeof entry?.prompt === "string" ? entry.prompt : ""),
    uploadedImageUrls: normalizeUrlList(restoreState.uploadedImageUrls),
  };
}
