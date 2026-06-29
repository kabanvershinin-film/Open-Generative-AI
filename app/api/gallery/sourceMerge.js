function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getEntryIdentity(entry = {}) {
  return {
    dedupeKey: normalizeString(entry?.dedupe_key || entry?.dedupeKey),
    url: normalizeString(entry?.url),
    id: normalizeString(entry?.id),
  };
}

function inferCreatedAtFromTosUrl(url) {
  const normalized = normalizeString(url);
  if (!normalized) return null;
  try {
    const pathname = new URL(normalized).pathname;
    const filename = pathname.split('/').pop() || '';
    const match = filename.match(/^(\d{13})_[a-z0-9]+\.[a-z0-9]+$/i);
    if (!match) return null;
    const timestamp = Number(match[1]);
    if (!Number.isFinite(timestamp)) return null;
    return new Date(timestamp).toISOString();
  } catch {
    return null;
  }
}

export function buildGalleryEntriesFromCompletedTasks(tasks = [], normalizeUrl = (value) => value) {
  const list = Array.isArray(tasks) ? tasks : [];
  return list
    .map((task) => {
      const entry = task?.entry && typeof task.entry === 'object' ? task.entry : null;
      const rawUrl = normalizeString(entry?.url);
      if (!rawUrl) return null;
      return {
        id: normalizeString(entry?.id) || normalizeString(task?.id) || null,
        type: normalizeString(entry?.type) || normalizeString(task?.type) || 'video',
        url: normalizeUrl(rawUrl),
        preview_url: normalizeUrl(normalizeString(entry?.preview_url)) || undefined,
        thumbnail: normalizeUrl(normalizeString(entry?.thumbnail)) || undefined,
        last_frame_url: normalizeUrl(normalizeString(entry?.last_frame_url)) || undefined,
        first_frame_url: normalizeUrl(normalizeString(entry?.first_frame_url)) || undefined,
        model: normalizeString(entry?.model) || normalizeString(task?.model) || '',
        prompt: normalizeString(entry?.prompt) || normalizeString(task?.prompt) || '',
        dedupe_key: normalizeString(entry?.dedupe_key || entry?.dedupeKey) || undefined,
        created_at: entry?.created_at || task?.updated_at || task?.created_at || new Date().toISOString(),
      };
    })
    .filter(Boolean);
}

export function buildGalleryEntriesFromTosMediaUrls(urls = [], normalizeUrl = (value) => value) {
  const list = Array.isArray(urls) ? urls : [];
  return list
    .map((rawUrl) => normalizeUrl(normalizeString(rawUrl)))
    .filter((url) => url && /\.(mp4|mov|webm)(?:$|\?)/i.test(url))
    .map((url, index) => ({
      id: `tos-media-${index}-${Buffer.from(url).toString('base64url').slice(0, 16)}`,
      type: 'video',
      url,
      model: '',
      prompt: '',
      created_at: inferCreatedAtFromTosUrl(url) || new Date(0).toISOString(),
    }));
}

export function mergeGalleryEntriesWithFallback(entries = [], fallbackEntries = []) {
  const primary = Array.isArray(entries) ? entries.filter(Boolean) : [];
  const fallback = Array.isArray(fallbackEntries) ? fallbackEntries.filter(Boolean) : [];

  const seenDedupe = new Set();
  const seenUrl = new Set();
  const seenId = new Set();

  primary.forEach((entry) => {
    const identity = getEntryIdentity(entry);
    if (identity.dedupeKey) seenDedupe.add(identity.dedupeKey);
    if (identity.url) seenUrl.add(identity.url);
    if (identity.id) seenId.add(identity.id);
  });

  const merged = [...primary];
  fallback.forEach((entry) => {
    const identity = getEntryIdentity(entry);
    if (identity.dedupeKey && seenDedupe.has(identity.dedupeKey)) return;
    if (identity.url && seenUrl.has(identity.url)) return;
    if (identity.id && seenId.has(identity.id)) return;
    if (identity.dedupeKey) seenDedupe.add(identity.dedupeKey);
    if (identity.url) seenUrl.add(identity.url);
    if (identity.id) seenId.add(identity.id);
    merged.push(entry);
  });

  return merged;
}
