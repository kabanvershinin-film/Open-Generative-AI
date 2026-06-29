const DEFAULT_VIDEO_HISTORY_LIMIT = 30;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getVideoEntryDedupeKey(entry = {}) {
  return (
    normalizeString(entry?.dedupeKey) ||
    normalizeString(entry?.dedupe_key) ||
    ""
  );
}

export function buildVideoGalleryDedupeKey(...candidates) {
  const raw = candidates.map((value) => normalizeString(value)).find(Boolean);
  if (!raw) return "";
  return raw.startsWith("mf-video:") ? raw : `mf-video:${raw}`;
}

export function buildVideoPendingDedupeKey({
  requestId,
  taskId,
  pendingId,
  generationId,
} = {}) {
  const generation = normalizeString(generationId);
  if (generation) return buildVideoGalleryDedupeKey(generation);

  const request = normalizeString(requestId);
  const task = normalizeString(taskId);
  if (request && task) return buildVideoGalleryDedupeKey(`${request}:${task}`);
  if (request) return buildVideoGalleryDedupeKey(request);
  if (task) return buildVideoGalleryDedupeKey(task);

  const pending = normalizeString(pendingId);
  if (pending) return buildVideoGalleryDedupeKey(pending);

  return "";
}

export function getVideoHistoryEntryKey(entry = {}) {
  return (
    getVideoEntryDedupeKey(entry) ||
    normalizeString(entry?.id) ||
    normalizeString(entry?.url) ||
    ""
  );
}

export function mergeVideoHistoryEntries(entries = [], limit = DEFAULT_VIDEO_HISTORY_LIMIT) {
  const source = Array.isArray(entries) ? entries : [];
  const seen = new Set();
  const merged = [];

  source.forEach((entry) => {
    if (!entry) return;
    const key = getVideoHistoryEntryKey(entry);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(entry);
  });

  return Number.isFinite(limit) ? merged.slice(0, limit) : merged;
}

export function upsertVideoHistoryEntry(entries = [], entry, limit = DEFAULT_VIDEO_HISTORY_LIMIT) {
  if (!entry) return mergeVideoHistoryEntries(entries, limit);
  return mergeVideoHistoryEntries([entry, ...(Array.isArray(entries) ? entries : [])], limit);
}

export function removeVideoHistoryEntry(entries = [], entry) {
  const source = Array.isArray(entries) ? entries : [];
  const targetKey = getVideoHistoryEntryKey(entry);
  const targetId = normalizeString(entry?.id);
  const targetUrl = normalizeString(entry?.url);

  return source.filter((item) => {
    if (!item) return false;
    if (targetKey && getVideoHistoryEntryKey(item) === targetKey) return false;
    if (targetId && normalizeString(item?.id) === targetId) return false;
    if (targetUrl && normalizeString(item?.url) === targetUrl) return false;
    return true;
  });
}
