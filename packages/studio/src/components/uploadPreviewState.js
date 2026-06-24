export function addSelectedUploadEntry(entries, entry, maxImages = 1) {
  const current = Array.isArray(entries) ? entries : [];
  if (!entry?.url) return current;
  if (current.some((item) => item?.url === entry.url)) return current;
  if (current.length >= maxImages) return current;
  return [...current, entry];
}

export function replaceSelectedUploadEntry(entries, previousUrl, nextEntry) {
  const current = Array.isArray(entries) ? entries : [];
  if (!previousUrl || !nextEntry?.url) return current;
  return current.map((entry) => {
    if (entry?.url !== previousUrl) return entry;
    return { ...entry, ...nextEntry };
  });
}

export function getDisplayUploadUrls(previewUrls, uploadedUrls) {
  if (Array.isArray(previewUrls) && previewUrls.length > 0) return previewUrls;
  return Array.isArray(uploadedUrls) ? uploadedUrls : [];
}
