import test from "node:test";
import assert from "node:assert/strict";

import {
  computeGptImageSize,
  computeImageGenerationSize,
  computeSeedreamImageSize,
} from "./imageModelSizing.js";

test("computeGptImageSize сохраняет существующий мэппинг GPT", () => {
  assert.strictEqual(computeGptImageSize("16:9", "1K"), "1536x864");
  assert.strictEqual(computeGptImageSize("2:3", "2K"), "1360x2048");
});

test("computeSeedreamImageSize мапит пресеты Seedream 5.0 Lite по документации", () => {
  assert.strictEqual(computeSeedreamImageSize("1:1", "2K"), "2048x2048");
  assert.strictEqual(computeSeedreamImageSize("16:9", "3K"), "4096x2304");
  assert.strictEqual(computeSeedreamImageSize("9:16", "4K"), "3040x5504");
});

test("computeImageGenerationSize выбирает мэппинг по модели", () => {
  assert.strictEqual(
    computeImageGenerationSize({ apiId: "doubao-seedream-5-0-260128", imageSizing: "seedream" }, "21:9", "2K"),
    "3136x1344",
  );
  assert.strictEqual(
    computeImageGenerationSize({ apiId: "gpt-image-2" }, "3:2", "2K"),
    "2048x1360",
  );
});
