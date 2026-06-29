import test from "node:test";
import assert from "node:assert/strict";

import {
  getVideoPreviewLoadPolicy,
  MAX_CONCURRENT_HISTORY_PREVIEWS,
  VIDEO_HISTORY_PAGE_SIZE,
  VIDEO_HISTORY_PRELOAD,
  VIDEO_HISTORY_PREVIEW_ROOT_MARGIN,
  VIDEO_HISTORY_PREVIEW_SLOT_TIMEOUT_MS,
} from "./videoPreviewPolicy.js";

test("getVideoPreviewLoadPolicy возвращает консервативные настройки загрузки превью", () => {
  const policy = getVideoPreviewLoadPolicy();

  assert.equal(VIDEO_HISTORY_PAGE_SIZE, 12);
  assert.equal(MAX_CONCURRENT_HISTORY_PREVIEWS, 2);
  assert.equal(VIDEO_HISTORY_PREVIEW_ROOT_MARGIN, "200px 0px");
  assert.equal(VIDEO_HISTORY_PREVIEW_SLOT_TIMEOUT_MS, 1500);
  assert.equal(VIDEO_HISTORY_PRELOAD, "auto");
  assert.equal(policy.historyPageSize, 12);
  assert.equal(policy.maxConcurrentPreviews, 2);
  assert.equal(policy.preload, "auto");
  assert.equal(policy.observerOptions.rootMargin, "200px 0px");
  assert.equal(policy.releaseTimeoutMs, 1500);
  assert.equal(policy.shouldAttemptVideoFallback, true);
});

test("getVideoPreviewLoadPolicy не включает video fallback если есть готовое image preview", () => {
  const policy = getVideoPreviewLoadPolicy({ hasImagePreview: true });

  assert.equal(policy.shouldAttemptVideoFallback, false);
});
