export function isDurableImageHistoryUrl(url) {
  if (typeof url !== "string") return false;
  const value = url.trim();
  if (!value) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("/")) return true;
  if (/^https?:\/\/[^/]+\.volces\.com\//i.test(value)) return true;
  return false;
}

export function sanitizePersistedImageHistoryEntries(entries = []) {
  return (Array.isArray(entries) ? entries : [])
    .filter(Boolean)
    .filter((entry) => isDurableImageHistoryUrl(entry?.url));
}

export function mergeImageHistoryEntries(primary, secondary = []) {
  const seenIds = new Set();
  const seenUrls = new Set();
  const merged = [];

  for (const entry of [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]) {
    if (!entry?.url) continue;
    const keyId = entry.id || null;
    const keyUrl = entry.url;
    if ((keyId && seenIds.has(keyId)) || seenUrls.has(keyUrl)) continue;
    if (keyId) seenIds.add(keyId);
    seenUrls.add(keyUrl);
    merged.push(entry);
  }

  return merged
    .sort((a, b) => new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0))
    .slice(0, 50);
}

export function excludeImageHistoryEntry(entries, entry) {
  const targetId = entry?.id || null;
  const targetUrl = typeof entry?.url === "string" ? entry.url : "";

  return (Array.isArray(entries) ? entries : []).filter((item) => {
    if (!item) return false;
    if (targetId && item.id === targetId) return false;
    if (targetUrl && item.url === targetUrl) return false;
    return true;
  });
}
