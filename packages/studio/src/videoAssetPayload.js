export const SEEDANCE_FACE_TAG = "图片1";

export function normalizeAssetUri(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (raw.startsWith("asset://")) return raw;
  if (/^asset-[A-Za-z0-9_-]+$/.test(raw)) return `asset://${raw}`;
  return null;
}

export function isSupportedFaceThumbnail(value) {
  if (!value) return true;
  const raw = String(value).trim();
  return /^https?:\/\//i.test(raw) || /^data:image\/(png|jpe?g|webp);base64,/i.test(raw);
}

export function validateFaceAsset(asset) {
  const uri = normalizeAssetUri(asset?.uri || asset?.assetUri || asset?.id);
  if (!uri) {
    return { ok: false, error: "Некорректный ID ассета: ожидается asset://… или asset-…" };
  }
  if (!isSupportedFaceThumbnail(asset?.thumbnail)) {
    return { ok: false, error: "Превью ассета должно быть HTTP(S) URL или data:image png/jpeg/webp." };
  }
  const status = String(asset?.status || "").toLowerCase();
  if (status && !["active", "ready", "succeeded", "success", "completed"].includes(status)) {
    return { ok: false, error: `Ассет ещё не готов к генерации: ${asset.status}` };
  }
  return {
    ok: true,
    asset: {
      uri,
      name: asset?.name || uri.replace(/^asset:\/\//, "").slice(0, 16),
      thumbnail: asset?.thumbnail || null,
      status: asset?.status || "",
    },
  };
}

export function ensureFaceAssetPromptTag(prompt, faceAsset, tag = SEEDANCE_FACE_TAG) {
  let finalPrompt = String(prompt || "").trim();
  const validation = faceAsset ? validateFaceAsset(faceAsset) : { ok: true };
  if (!faceAsset || !validation.ok) return finalPrompt;

  if (new RegExp(tag, "i").test(finalPrompt)) return finalPrompt;

  const name = String(validation.asset.name || "").trim();
  if (name && finalPrompt.includes(name)) {
    return finalPrompt.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), tag);
  }
  return (finalPrompt ? `${finalPrompt} ` : "") + tag;
}

export function buildSeedanceStudioPayload({
  model,
  prompt,
  aspectRatio,
  uploadedImageUrl,
  uploadedVideoUrl,
  uploadedAudioUrl,
  refFiles = [],
  faceAsset,
  isI2V = false,
  seed,
  returnLastFrame,
}) {
  const readyRefs = refFiles.filter((f) => f?.url && !f.uploading);
  const faceValidation = faceAsset ? validateFaceAsset(faceAsset) : { ok: true, asset: null };
  if (faceAsset && !faceValidation.ok) {
    throw new Error(faceValidation.error);
  }

  return {
    model,
    prompt: ensureFaceAssetPromptTag(prompt, faceValidation.asset),
    aspect_ratio: aspectRatio,
    // first_frame_image больше не используем автоматически
    video_url: uploadedVideoUrl || undefined,
    audio_url: uploadedAudioUrl || undefined,
    image_urls: [
      ...(faceValidation.asset ? [{ url: faceValidation.asset.uri }] : []),
      ...(uploadedImageUrl ? [uploadedImageUrl] : []),
      ...readyRefs.filter((f) => f.kind === "image").map((f) => f.url),
    ],
    video_urls: readyRefs.filter((f) => f.kind === "video").map((f) => f.url),
    audio_urls: readyRefs.filter((f) => f.kind === "audio").map((f) => f.url),
    is_i2v: isI2V,
    seed: seed !== undefined ? seed : undefined,
    return_last_frame: returnLastFrame !== undefined ? returnLastFrame : undefined,
  };
}
