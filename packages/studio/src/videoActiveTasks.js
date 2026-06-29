import {
  buildVideoGalleryDedupeKey,
  getVideoHistoryEntryKey,
} from "./videoHistory.js";

export function getVideoActiveTaskKey(task) {
  const explicit = typeof task?.dedupeKey === "string" ? task.dedupeKey.trim() : "";
  if (explicit) return explicit;
  return (
    buildVideoGalleryDedupeKey(task?.requestId) ||
    buildVideoGalleryDedupeKey(task?.taskId || task?.arkTaskId) ||
    buildVideoGalleryDedupeKey(task?.generationId) ||
    buildVideoGalleryDedupeKey(task?.pendingId) ||
    buildVideoGalleryDedupeKey(task?.id) ||
    ""
  );
}

export function getVisibleVideoActiveTasks(activeTasks = [], history = []) {
  const historyKeys = new Set(
    (Array.isArray(history) ? history : [])
      .map((entry) => getVideoHistoryEntryKey(entry))
      .filter(Boolean),
  );

  return (Array.isArray(activeTasks) ? activeTasks : []).filter((task) => {
    if (!task || task.status === "error") return true;
    const taskKey = getVideoActiveTaskKey(task);
    if (!taskKey) return true;
    return !historyKeys.has(taskKey);
  });
}
