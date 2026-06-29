const DEFAULT_VIDEO_HISTORY_LIMIT = 30;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pickFilledValue(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      const normalized = value.trim();
      if (normalized) return normalized;
      continue;
    }
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
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

export function mergeVideoHistorySourceEntry(localEntry = {}, remoteEntry = {}) {
  const local = normalizeVideoHistoryEntry(localEntry);
  const remote = normalizeVideoHistoryEntry(remoteEntry);

  return {
    ...remote,
    ...local,
    id: pickFilledValue(remote?.id, local?.id),
    url: pickFilledValue(remote?.url, local?.url),
    preview_url: pickFilledValue(remote?.preview_url, local?.preview_url),
    thumbnail: pickFilledValue(remote?.thumbnail, local?.thumbnail),
    last_frame_url: pickFilledValue(remote?.last_frame_url, local?.last_frame_url),
    first_frame_url: pickFilledValue(remote?.first_frame_url, local?.first_frame_url),
    prompt: pickFilledValue(remote?.prompt, local?.prompt),
    model: pickFilledValue(remote?.model, local?.model),
    aspect_ratio: pickFilledValue(remote?.aspect_ratio, local?.aspect_ratio),
    resolution: pickFilledValue(remote?.resolution, local?.resolution),
    duration: pickFilledValue(remote?.duration, local?.duration),
    created_at: pickFilledValue(remote?.created_at, local?.created_at),
    timestamp: pickFilledValue(remote?.timestamp, local?.timestamp),
    dedupeKey: pickFilledValue(local?.dedupeKey, remote?.dedupeKey),
    dedupe_key: pickFilledValue(remote?.dedupe_key, local?.dedupe_key),
    restoreState: local?.restoreState || remote?.restoreState,
  };
}

export function mergeVideoHistorySources(
  localEntries = [],
  remoteEntries = [],
  limit = DEFAULT_VIDEO_HISTORY_LIMIT,
) {
  const local = mergeVideoHistoryEntries(localEntries, Infinity);
  const remote = mergeVideoHistoryEntries(remoteEntries, Infinity);
  const order = [];
  const mergedByKey = new Map();

  local.forEach((entry) => {
    const key = getVideoHistoryEntryKey(entry);
    if (!key || mergedByKey.has(key)) return;
    order.push(key);
    mergedByKey.set(key, entry);
  });

  remote.forEach((entry) => {
    const key = getVideoHistoryEntryKey(entry);
    if (!key) return;
    if (mergedByKey.has(key)) {
      mergedByKey.set(key, mergeVideoHistorySourceEntry(mergedByKey.get(key), entry));
      return;
    }
    order.push(key);
    mergedByKey.set(key, entry);
  });

  const result = order.map((key) => mergedByKey.get(key)).filter(Boolean);
  return Number.isFinite(limit) ? result.slice(0, limit) : result;
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
