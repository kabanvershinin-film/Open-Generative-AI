import test from "node:test";
import assert from "node:assert/strict";
import { getUploadPickerMaxImages } from "../imageStudioUploadConfig.js";

const t2iModels = [
  { id: "gpt-image-2", apiId: "gpt-image-2" },
  { id: "single-only", apiId: "single-only" },
];

const i2iModels = [
  { id: "gpt-image-2-edit", apiId: "gpt-image-2", maxImages: 16 },
];

test("до первой загрузки использует лимит связанной i2i-модели", () => {
  const maxImages = getUploadPickerMaxImages({
    imageMode: false,
    maxImages: 1,
    selectedModelId: "gpt-image-2",
    t2iModels,
    i2iModels,
  });

  assert.strictEqual(maxImages, 16);
});

test("в imageMode сохраняет уже активный лимит редактирования", () => {
  const maxImages = getUploadPickerMaxImages({
    imageMode: true,
    maxImages: 14,
    selectedModelId: "gpt-image-2-edit",
    t2iModels,
    i2iModels,
  });

  assert.strictEqual(maxImages, 14);
});

test("без i2i-пары оставляет одиночный выбор", () => {
  const maxImages = getUploadPickerMaxImages({
    imageMode: false,
    maxImages: 1,
    selectedModelId: "single-only",
    t2iModels,
    i2iModels,
  });

  assert.strictEqual(maxImages, 1);
});
