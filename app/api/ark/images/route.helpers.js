export function normalizeArkImageField(image) {
  if (Array.isArray(image)) {
    const items = image.filter((value) => typeof value === 'string' && value.trim());
    if (!items.length) return undefined;
    return items.length === 1 ? items[0] : items;
  }
  if (typeof image === 'string' && image.trim()) return image.trim();
  return undefined;
}

export function buildArkImagePayload(body = {}) {
  const imageSetMode = body.sequential_image_generation === 'auto' ? 'auto' : 'disabled';
  const maxImages = Math.max(1, Math.min(15, Number(body?.sequential_image_generation_options?.max_images) || 1));
  const payload = {
    model: String(body.model || '').trim(),
    prompt: typeof body.prompt === 'string' ? body.prompt : '',
    response_format: body.response_format || 'url',
    sequential_image_generation: imageSetMode,
    stream: !!body.stream,
    watermark: body.watermark === undefined ? false : !!body.watermark,
  };

  if (typeof body.size === 'string' && body.size.trim()) payload.size = body.size.trim();
  if (typeof body.output_format === 'string' && body.output_format.trim()) {
    payload.output_format = body.output_format.trim();
  }

  const image = normalizeArkImageField(body.image);
  if (image !== undefined) payload.image = image;
  if (imageSetMode === 'auto') {
    payload.sequential_image_generation_options = { max_images: maxImages };
  }

  return payload;
}

export function extractArkImageError(data, status) {
  return data?.error?.message || data?.error || data?.message || `Ark image error ${status}`;
}
