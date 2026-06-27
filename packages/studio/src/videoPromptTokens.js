export function buildRefTokenLabel(kind, index, { faceAsset = null, uploadedImageUrl = null } = {}) {
  const word = kind === "image" ? "图片" : kind === "video" ? "视频" : "音频";
  let actualIndex = index;

  if (kind === "image") {
    if (faceAsset) {
      actualIndex += 1;
    }
    if (uploadedImageUrl) {
      if (!faceAsset || uploadedImageUrl !== faceAsset.thumbnail) {
        actualIndex += 1;
      }
    }
  }

  return `${word}${actualIndex}`;
}

export function getRefTokenLabelForFile(refFiles, fileId, options = {}) {
  const index = refFiles.findIndex((file) => file.id === fileId);
  if (index === -1) return null;

  const kind = refFiles[index]?.kind;
  if (!kind) return null;

  const sameKindIndex = refFiles
    .slice(0, index + 1)
    .filter((file) => file?.kind === kind)
    .length;

  return buildRefTokenLabel(kind, sameKindIndex, options);
}

export function insertPromptTokenAtSelection(prompt, token, start, end = start) {
  const safePrompt = String(prompt || "");
  const safeToken = String(token || "").trim();
  const from = Number.isInteger(start) ? start : safePrompt.length;
  const to = Number.isInteger(end) ? end : from;

  if (!safeToken) return safePrompt;
  return safePrompt.slice(0, from) + safeToken + " " + safePrompt.slice(to);
}
