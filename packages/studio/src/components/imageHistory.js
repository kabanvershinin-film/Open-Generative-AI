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
