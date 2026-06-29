const DEFAULT_VIDEO_HISTORY_LIMIT = 30;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeVideoHistoryUrl(value) {
  const url = normalizeString(value);
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const hasTosSignature = [...parsed.searchParams.keys()].some((key) =>
      String(key).toLowerCase().startsWith("x-tos-"),
    );
    if (!hasTosSignature) return url;
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

export function normalizeVideoHistoryEntry(entry = {}) {
  if (!entry || typeof entry !== "object") return entry;
  return {
    ...entry,
    url: normalizeVideoHistoryUrl(entry?.url) || entry?.url,
    preview_url: normalizeVideoHistoryUrl(entry?.preview_url) || entry?.preview_url,
    thumbnail: normalizeVideoHistoryUrl(entry?.thumbnail) || entry?.thumbnail,
    last_frame_url: normalizeVideoHistoryUrl(entry?.last_frame_url) || entry?.last_frame_url,
    first_frame_url: normalizeVideoHistoryUrl(entry?.first_frame_url) || entry?.first_frame_url,
  };
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
  const task = normalizeString(taskId);
  if (task) return buildVideoGalleryDedupeKey(task);

  const pending = normalizeString(pendingId);
  if (pending) return buildVideoGalleryDedupeKey(pending);

  const generation = normalizeString(generationId);
  if (generation) return buildVideoGalleryDedupeKey(generation);

  const request = normalizeString(requestId);
  if (request) return buildVideoGalleryDedupeKey(request);

  return "";
}

export function getVideoHistoryEntryKey(entry = {}) {
  const normalizedEntry = normalizeVideoHistoryEntry(entry);
  return (
    getVideoEntryDedupeKey(normalizedEntry) ||
    normalizeString(normalizedEntry?.url) ||
    normalizeString(normalizedEntry?.id) ||
    ""
  );
}

export function mergeVideoHistoryEntries(entries = [], limit = DEFAULT_VIDEO_HISTORY_LIMIT) {
  const source = Array.isArray(entries) ? entries : [];
  const seen = new Set();
  const merged = [];

  source.forEach((entry) => {
    if (!entry) return;
    const normalizedEntry = normalizeVideoHistoryEntry(entry);
    const key = getVideoHistoryEntryKey(normalizedEntry);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(normalizedEntry);
  });

  return Number.isFinite(limit) ? merged.slice(0, limit) : merged;
}

export function upsertVideoHistoryEntry(entries = [], entry, limit = DEFAULT_VIDEO_HISTORY_LIMIT) {
  if (!entry) return mergeVideoHistoryEntries(entries, limit);
  return mergeVideoHistoryEntries([entry, ...(Array.isArray(entries) ? entries : [])], limit);
}

export function removeVideoHistoryEntry(entries = [], entry) {
  const source = Array.isArray(entries) ? entries : [];
  const normalizedEntry = normalizeVideoHistoryEntry(entry);
  const targetKey = getVideoHistoryEntryKey(normalizedEntry);
  const targetId = normalizeString(normalizedEntry?.id);
  const targetUrl = normalizeString(normalizedEntry?.url);

  return source.filter((item) => {
    if (!item) return false;
    if (targetKey && getVideoHistoryEntryKey(item) === targetKey) return false;
    if (targetId && normalizeString(item?.id) === targetId) return false;
    if (targetUrl && normalizeString(item?.url) === targetUrl) return false;
    return true;
  });
}
