export async function ensureVideoEntryStoredInTos({
  entry,
  pendingResult,
  persistToGallery,
} = {}) {
  if (!entry || typeof entry !== "object") {
    return { entry: null, source: "none" };
  }

  const persistedEntry =
    (pendingResult?.entry && typeof pendingResult.entry === "object" && pendingResult.entry) ||
    (pendingResult?.task?.entry && typeof pendingResult.task.entry === "object" && pendingResult.task.entry) ||
    null;

  if (persistedEntry?.url) {
    return {
      entry: {
        ...entry,
        ...persistedEntry,
        url: persistedEntry.url,
      },
      source: "pending",
    };
  }

  const savedEntry = await persistToGallery?.(entry).catch(() => null);
  if (savedEntry?.url) {
    return {
      entry: {
        ...entry,
        ...savedEntry,
        url: savedEntry.url,
      },
      source: "gallery",
    };
  }

  return {
    entry,
    source: "local",
  };
}
