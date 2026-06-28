export function isDurableImageHistoryUrl(url) {
  if (typeof url !== "string") return false;
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("/")) return true;
  if (/^https?:\/\/[^/]+\.volces\.com\//i.test(value)) return true;
  return false;
}

export function getImageHistoryEntryDedupeKey(entry) {
  const value = entry?.dedupe_key ?? entry?.dedupeKey ?? "";
  return typeof value === "string" ? value.trim() : "";
}

export function isSameImageHistoryEntry(existing, incoming) {
  const existingDedupeKey = getImageHistoryEntryDedupeKey(existing);
  const incomingDedupeKey = getImageHistoryEntryDedupeKey(incoming);

  if (existingDedupeKey && incomingDedupeKey && existingDedupeKey === incomingDedupeKey) {
    return true;
  }

  if (existing?.id && incoming?.id && existing.id === incoming.id) {
    return true;
  }

  const existingUrl = typeof existing?.url === "string" ? existing.url : "";
  const incomingUrl = typeof incoming?.url === "string" ? incoming.url : "";
  if (existingUrl && incomingUrl && existingUrl === incomingUrl) {
    return true;
  }

  return false;
}

function getEntryTime(entry) {
  const value = Date.parse(entry?.timestamp || entry?.created_at || 0);
  return Number.isFinite(value) ? value : 0;
}

function mergeImageHistoryEntryPair(existing, incoming) {
  const existingTime = getEntryTime(existing);
  const incomingTime = getEntryTime(incoming);
  const preferIncoming = incomingTime >= existingTime;
  const newer = preferIncoming ? incoming : existing;
  const older = preferIncoming ? existing : incoming;

  return {
    ...older,
    ...newer,
    prompt: typeof newer?.prompt === "string" && newer.prompt.trim()
      ? newer.prompt
      : (typeof older?.prompt === "string" ? older.prompt : ""),
    restoreState: newer?.restoreState && typeof newer.restoreState === "object"
      ? newer.restoreState
      : older?.restoreState,
  };
}

export function sanitizePersistedImageHistoryEntries(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .filter((entry) => isDurableImageHistoryUrl(entry?.url));
}

export function mergeImageHistoryEntries(primary, secondary = []) {
  const merged = [];

  for (const entry of [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]) {
    if (!entry?.url) continue;
    const matchIndex = merged.findIndex((item) => isSameImageHistoryEntry(item, entry));
    if (matchIndex === -1) {
      merged.push(entry);
      continue;
    }
    merged[matchIndex] = mergeImageHistoryEntryPair(merged[matchIndex], entry);
  }

  return merged
    .sort((a, b) => new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0))
    .slice(0, 50);
}

export function excludeImageHistoryEntry(entries, entry) {
  return (Array.isArray(entries) ? entries : []).filter((item) => {
    if (!item) return false;
    return !isSameImageHistoryEntry(item, entry);
  });
}
