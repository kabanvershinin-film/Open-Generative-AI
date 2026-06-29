import test from "node:test";
import assert from "node:assert/strict";

import { getVideoPreviewSeekTime } from "./videoPreviewFrame.js";

test("getVideoPreviewSeekTime возвращает безопасную позднюю точку кадра", () => {
  assert.equal(getVideoPreviewSeekTime(0), 0.05);
  assert.equal(getVideoPreviewSeekTime(1), 0.35);
  assert.equal(getVideoPreviewSeekTime(5), 0.75);
  assert.equal(getVideoPreviewSeekTime(30), 1.5);
});
