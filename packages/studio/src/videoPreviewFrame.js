export function getVideoPreviewSeekTime(duration) {
  const numericDuration = Number(duration) || 0;
  if (numericDuration <= 0) return 0.05;

  return Math.min(
    Math.max(numericDuration * 0.15, 0.35),
    Math.max(numericDuration - 0.1, 0.05),
    1.5,
  );
}
