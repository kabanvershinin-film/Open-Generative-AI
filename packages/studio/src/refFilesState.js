function normalizeRefFile(file) {
  if (!file || typeof file !== "object") return null;
  const kind = file.kind === "video" || file.kind === "audio" ? file.kind : "image";
  const url = typeof file.url === "string" && file.url.trim() ? file.url.trim() : null;
  const name = typeof file.name === "string" && file.name.trim() ? file.name.trim() : `${kind}-ref`;
  const uploading = !!file.uploading && !url;
  const progress = uploading ? Math.max(0, Math.min(99, Number(file.progress) || 0)) : 100;

  return {
    id: file.id || `ref_${kind}_${Math.random().toString(36).slice(2, 8)}`,
    url,
    kind,
    name,
    uploading,
    progress,
  };
}

export function normalizePersistedRefFiles(refFiles) {
  return (Array.isArray(refFiles) ? refFiles : [])
    .map((file) => normalizeRefFile(file))
    .filter((file) => file && file.url && !file.uploading);
}

export function serializeRefFilesForPersistence(refFiles) {
  return normalizePersistedRefFiles(refFiles).map((file) => ({
    id: file.id,
    url: file.url,
    kind: file.kind,
    name: file.name,
    uploading: false,
    progress: 100,
  }));
}
