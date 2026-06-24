export function buildImageChargeMeta(pathParts, model, data) {
  return {
    source: 'fixed',
    model,
    path: `/${Array.isArray(pathParts) ? pathParts.join('/') : ''}`,
    usage: data?.usage ?? null,
  };
}
