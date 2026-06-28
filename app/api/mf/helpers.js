export function buildImageChargeMeta(pathParts, model, data) {
  return {
    source: 'fixed',
    model,
    path: `/${Array.isArray(pathParts) ? pathParts.join('/') : ''}`,
    usage: data?.usage ?? null,
  };
}

export function buildMfImageGalleryDedupeKey(imageUrl) {
  const value = typeof imageUrl === 'string' ? imageUrl.trim() : '';
  return value ? `mf-image:${value}` : '';
}
