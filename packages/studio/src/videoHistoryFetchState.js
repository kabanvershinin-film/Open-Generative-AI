export function resolveVideoHistoryFetchFailure({
  reset = false,
  existingEntriesCount = 0,
  error,
} = {}) {
  const message =
    (typeof error?.message === "string" && error.message.trim()) ||
    "Ошибка загрузки истории";

  return {
    remoteHistoryError: reset || existingEntriesCount === 0 ? message : null,
  };
}
