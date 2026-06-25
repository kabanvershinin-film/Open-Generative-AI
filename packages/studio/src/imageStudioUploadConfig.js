import { getMaxImagesForI2IModel } from "./models.js";

export function getUploadPickerMaxImages({
  imageMode = false,
  maxImages = 1,
  selectedModelId = "",
  t2iModels = [],
  i2iModels = [],
} = {}) {
  if (imageMode) {
    return Math.max(1, maxImages || 1);
  }

  if (!selectedModelId) return 1;

  const currentT2I = Array.isArray(t2iModels)
    ? t2iModels.find((model) => model.id === selectedModelId)
    : null;
  if (!currentT2I) return 1;

  const matchedI2I = Array.isArray(i2iModels)
    ? i2iModels.find((model) => model.apiId === currentT2I.apiId)
    : null;
  if (!matchedI2I) return 1;

  return Math.max(1, getMaxImagesForI2IModel(matchedI2I.id));
}
