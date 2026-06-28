import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_IMAGE_BATCH_SIZE,
  MAX_IMAGE_BATCH_SIZE,
  normalizeImageBatchSize,
} from "./imageBatching.js";

test("normalizeImageBatchSize возвращает 1 по умолчанию для пустых значений", () => {
  assert.strictEqual(normalizeImageBatchSize(), DEFAULT_IMAGE_BATCH_SIZE);
  assert.strictEqual(normalizeImageBatchSize(null), DEFAULT_IMAGE_BATCH_SIZE);
  assert.strictEqual(normalizeImageBatchSize(""), DEFAULT_IMAGE_BATCH_SIZE);
});

test("normalizeImageBatchSize ограничивает размер партии допустимым диапазоном", () => {
  assert.strictEqual(normalizeImageBatchSize(0), DEFAULT_IMAGE_BATCH_SIZE);
  assert.strictEqual(normalizeImageBatchSize(1), 1);
  assert.strictEqual(normalizeImageBatchSize(2), 2);
  assert.strictEqual(normalizeImageBatchSize(99), MAX_IMAGE_BATCH_SIZE);
});

test("normalizeImageBatchSize округляет дробные значения вниз", () => {
  assert.strictEqual(normalizeImageBatchSize(2.9), 2);
});
