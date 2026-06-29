export const VIDEO_HISTORY_PAGE_SIZE = 12;
export const MAX_CONCURRENT_HISTORY_PREVIEWS = 2;
export const VIDEO_HISTORY_PREVIEW_ROOT_MARGIN = "200px 0px";
export const VIDEO_HISTORY_PREVIEW_SLOT_TIMEOUT_MS = 1500;
export const VIDEO_HISTORY_PRELOAD = "metadata";

export function getVideoPreviewLoadPolicy({ hasImagePreview = false } = {}) {
  return {
    historyPageSize: VIDEO_HISTORY_PAGE_SIZE,
    maxConcurrentPreviews: MAX_CONCURRENT_HISTORY_PREVIEWS,
    observerOptions: {
      rootMargin: VIDEO_HISTORY_PREVIEW_ROOT_MARGIN,
      threshold: 0.01,
    },
    preload: VIDEO_HISTORY_PRELOAD,
    releaseTimeoutMs: VIDEO_HISTORY_PREVIEW_SLOT_TIMEOUT_MS,
    shouldAttemptVideoFallback: !hasImagePreview,
  };
}
