import test from "node:test";
import assert from "node:assert/strict";

import { buildImageGenerationStartState } from "./imageGenerationStart.js";

test("buildImageGenerationStartState сохраняет промпт в снимке и очищает поле ввода", () => {
  const { snap, nextPrompt } = buildImageGenerationStartState(
    {
      imageMode: false,
      selectedModelId: "seedream-5.0-lite",
      uploadedImageUrls: [],
      prompt: "собака на велике",
      currentQualityField: "resolution",
      selectedQuality: "2k",
      currentQualityOptions: ["low", "high"],
      selectedQualityOpt: "high",
      currentFormatOptions: ["jpeg"],
      selectedFormat: "jpeg",
      currentBackgroundOptions: [],
      selectedBackground: "auto",
      currentModerationOptions: [],
      selectedModeration: "auto",
      currentImageSizeOptions: ["1024x1024"],
      selectedImageSize: "1024x1024",
      imageSetSupported: true,
      imageSetMode: true,
      effectiveImageSetMaxImages: 4,
      selectedRouting: "default",
      showEffectBtn: false,
      selectedEffect: "none",
      selectedAr: "1:1",
      batchSize: 2,
    },
    {
      requestId: "req-1",
      ts: 123,
    },
  );

  assert.strictEqual(nextPrompt, "");
  assert.equal(snap.prompt, "собака на велике");
  assert.equal(snap.requestId, "req-1");
  assert.equal(snap.ts, 123);
  assert.equal(snap.batchSize, 2);
  assert.equal(snap.imageSetMode, true);
  assert.equal(snap.imageSetMaxImages, 4);
});
