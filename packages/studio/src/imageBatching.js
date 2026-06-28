export const DEFAULT_IMAGE_BATCH_SIZE = 1;
export const MAX_IMAGE_BATCH_SIZE = 4;

export function normalizeImageBatchSize(value, max = MAX_IMAGE_BATCH_SIZE) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_IMAGE_BATCH_SIZE;
  const normalizedMax = Math.max(DEFAULT_IMAGE_BATCH_SIZE, Number(max) || MAX_IMAGE_BATCH_SIZE);
  return Math.max(DEFAULT_IMAGE_BATCH_SIZE, Math.min(normalizedMax, Math.floor(numeric)));
}
