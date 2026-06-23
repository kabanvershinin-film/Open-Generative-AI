function normalizeImageValue(image) {
  if (!image) return null;
  if (typeof image === "string") return { url: image };
  if (image.url) return { ...image };
  return null;
}

function dedupeImages(images) {
  const seen = new Set();
  const result = [];
  for (const image of images) {
    if (!image?.url) continue;
    const key = `${image.url}::${image.face_asset || ""}`;
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

  if (connectedFaceAssets.length > 0) {
    const pairedCount = Math.min(normalizedImages.length, connectedFaceAssets.length);

    for (let index = 0; index < pairedCount; index += 1) {
      finalImages.push({
        ...normalizedImages[index],
        face_asset: connectedFaceAssets[index].uri,
      });
    }

    if (normalizedImages.length > pairedCount) {
      finalImages.push(...normalizedImages.slice(pairedCount));
    }

    if (connectedFaceAssets.length > pairedCount) {
      for (const face of connectedFaceAssets.slice(pairedCount)) {
        finalImages.push({
          url: face.thumbnail || face.uri,
          face_asset: face.uri,
        });
      }
    }
  } else {
    finalImages.push(...normalizedImages);
  }

  const normalizedImageUrl = normalizeImageValue(imageUrl);
  if (normalizedImageUrl) {
    finalImages.push(normalizedImageUrl);
  }

  return dedupeImages(finalImages);
}

export function ensureSeedanceFaceTags(prompt, images) {
  const faceCount = images.filter((image) => image?.face_asset).length;
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
    prompt: ensureSeedanceFaceTags(prompt || formValues.prompt || "", finalImages),
    image_urls: finalImages.length > 0 ? finalImages : undefined,
    video_url: uniqueVideos[0] || formValues.video_url || undefined,
    video_urls: uniqueVideos.length > 1 ? uniqueVideos.slice(1) : undefined,
    audio_url: uniqueAudios[0] || formValues.audio_url || undefined,
    audio_urls: uniqueAudios.length > 1 ? uniqueAudios.slice(1) : undefined,
    resolution: formValues.resolution || undefined,
    ratio: formValues.aspect_ratio || formValues.ratio || undefined,
    duration: formValues.duration || undefined,
    face_asset: connectedFaceAssets.length === 1 ? connectedFaceAssets[0].uri : undefined,
  };
}
