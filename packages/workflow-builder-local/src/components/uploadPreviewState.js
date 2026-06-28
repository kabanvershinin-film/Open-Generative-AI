export function normalizeUploadUrls(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim());
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}

export function getDisplayUploadUrls(previewUrls, uploadedValue) {
  const preview = normalizeUploadUrls(previewUrls);
  if (preview.length > 0) return preview;
  return normalizeUploadUrls(uploadedValue);
}

export function appendUploadUrls(currentUrls, nextUrls, maxItems = 1) {
  const current = normalizeUploadUrls(currentUrls);
  const incoming = normalizeUploadUrls(nextUrls);
  const limit = Math.max(1, Number(maxItems) || 1);
  const merged = limit === 1 ? incoming.slice(0, 1) : [...current, ...incoming];
  return [...new Set(merged)].slice(0, limit);
}

export function replaceUploadUrl(currentUrls, previousUrl, nextUrl) {
  const current = normalizeUploadUrls(currentUrls);
  if (!previousUrl || typeof nextUrl !== "string" || !nextUrl.trim()) return current;
  return current.map((url) => (url === previousUrl ? nextUrl : url));
}

export function removeUploadUrl(currentUrls, targetUrl) {
  const current = normalizeUploadUrls(currentUrls);
  if (!targetUrl) return current;
  return current.filter((url) => url !== targetUrl);
}
