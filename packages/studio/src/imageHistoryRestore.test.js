import test from "node:test";
import assert from "node:assert/strict";

import {
  buildImageHistoryRestoreState,
  getImageHistoryRestoreState,
} from "./imageHistoryRestore.js";

test("buildImageHistoryRestoreState сохраняет промпт, модель и все референсы", () => {
  const state = buildImageHistoryRestoreState({
    imageMode: true,
    imageSetMode: true,
    imageSetMaxImages: 5,
    selectedModelId: "gpt-image-2",
    selectedModelName: "GPT Image 2",
    selectedAr: "16:9",
    selectedQuality: "1536x864",
    selectedQualityOpt: "high",
    selectedFormat: "png",
    selectedBackground: "opaque",
    selectedModeration: "low",
    selectedImageSize: "2K",
    selectedRouting: "nitro",
    selectedEffect: "cinematic",
    maxImages: 4,
    batchSize: 2,
    prompt: "рыжий кот",
    uploadedImageUrls: [
      "https://cdn.example.com/ref-1.png",
      "https://cdn.example.com/ref-2.png",
      "",
    ],
  });

  assert.deepStrictEqual(state, {
    imageMode: true,
    imageSetMode: true,
    imageSetMaxImages: 5,
    selectedModelId: "gpt-image-2",
    selectedModelName: "GPT Image 2",
    selectedAr: "16:9",
    selectedQuality: "1536x864",
    selectedQualityOpt: "high",
    selectedFormat: "png",
    selectedBackground: "opaque",
    selectedModeration: "low",
    selectedImageSize: "2K",
    selectedRouting: "nitro",
    selectedEffect: "cinematic",
    maxImages: 4,
    batchSize: 2,
    prompt: "рыжий кот",
    uploadedImageUrls: [
      "https://cdn.example.com/ref-1.png",
      "https://cdn.example.com/ref-2.png",
    ],
  });
});

test("getImageHistoryRestoreState использует снимок восстановления и fallback из записи", () => {
  const state = getImageHistoryRestoreState({
    model: "gemini-3.1-flash-image-preview",
    prompt: "старый промпт",
    aspect_ratio: "1:1",
    restoreState: {
      imageMode: true,
      imageSetMode: true,
      imageSetMaxImages: 3,
      selectedModelId: "gemini-3-pro-image-preview-edit",
      selectedAr: "3:4",
      prompt: "новый промпт",
      uploadedImageUrls: ["https://cdn.example.com/reference.png"],
    },
  });

  assert.deepStrictEqual(state, {
    imageMode: true,
    imageSetMode: true,
    imageSetMaxImages: 3,
    selectedModelId: "gemini-3-pro-image-preview-edit",
    selectedModelName: "",
    selectedAr: "3:4",
    selectedQuality: null,
    selectedQualityOpt: null,
    selectedFormat: null,
    selectedBackground: null,
    selectedModeration: null,
    selectedImageSize: null,
    selectedRouting: "default",
    selectedEffect: "",
    maxImages: 1,
    batchSize: 1,
    prompt: "новый промпт",
    uploadedImageUrls: ["https://cdn.example.com/reference.png"],
  });
});
