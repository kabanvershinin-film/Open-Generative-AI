function normalizeImageValue(image) {
  if (!image) return null;
  if (typeof image === "string") return { url: image };
  if (image.url) return { ...image };
  return null;
}

function isAssetUri(value) {
  return typeof value === "string" && value.startsWith("asset://");
}

function dedupeImages(images) {
  const seen = new Set();
  const result = [];
  for (const image of images) {
    if (!image?.url) continue;
    const key = image.url;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(image);
  }
  return result;
}

export function buildSeedanceWorkflowImages({ connectedImages = [], connectedFaceAssets = [], imageUrl }) {
  const normalizedImages = connectedImages
    .map((image) => normalizeImageValue(image))
    .filter(Boolean);

  const finalImages = [];

  finalImages.push(
    ...connectedFaceAssets
      .map((face) => (face?.uri ? { url: face.uri, thumbnail: face.thumbnail || null } : null))
      .filter(Boolean)
  );
  finalImages.push(...normalizedImages);

  const normalizedImageUrl = normalizeImageValue(imageUrl);
  if (normalizedImageUrl) {
    finalImages.push(normalizedImageUrl);
  }

  return dedupeImages(finalImages);
}

export function ensureSeedanceFaceTags(prompt, images) {
  const faceCount = images.filter((image) => isAssetUri(image?.url)).length;
  if (faceCount === 0) return prompt || "";

  const tagsToAdd = [];
  for (let index = 1; index <= faceCount; index += 1) {
    const tag = `图片${index}`;
    const tagRegex = new RegExp(tag, "i");
    if (!tagRegex.test(prompt || "")) {
      tagsToAdd.push(tag);
    }
  }

  if (tagsToAdd.length === 0) return prompt || "";
  return `${prompt || ""}${prompt ? " " : ""}${tagsToAdd.join(" ")}`;
}

export function buildSeedanceWorkflowBody({
  model,
  fast,
  prompt,
  connectedImages = [],
  connectedFaceAssets = [],
  uniqueVideos = [],
  uniqueAudios = [],
  formValues = {},
}) {
  const finalImages = buildSeedanceWorkflowImages({
    connectedImages,
    connectedFaceAssets,
    imageUrl: formValues.image_url,
  });

  return {
    fast,
    model: model || undefined,
    prompt: ensureSeedanceFaceTags(prompt || formValues.prompt || "", finalImages),
    image_urls: finalImages.length > 0 ? finalImages : undefined,
    video_url: uniqueVideos[0] || formValues.video_url || undefined,
    video_urls: uniqueVideos.length > 1 ? uniqueVideos.slice(1) : undefined,
    audio_url: uniqueAudios[0] || formValues.audio_url || undefined,
    audio_urls: uniqueAudios.length > 1 ? uniqueAudios.slice(1) : undefined,
    resolution: formValues.resolution || undefined,
    ratio: formValues.aspect_ratio || formValues.ratio || undefined,
    duration: formValues.duration || undefined,
    seed: Number.isFinite(Number(formValues.seed)) && Number(formValues.seed) >= 0
      ? Number(formValues.seed)
      : undefined,
    return_last_frame: typeof formValues.return_last_frame === "boolean"
      ? formValues.return_last_frame
      : undefined,
    generate_audio: formValues.generate_audio !== false,
  };
}
