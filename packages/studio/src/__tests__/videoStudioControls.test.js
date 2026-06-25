import test from "node:test";
import assert from "node:assert/strict";
import { getDurationsForModel, getResolutionsForVideoModel } from "../models.js";
import { pickCompatibleControlValue } from "../videoStudioControls.js";

test("сохраняет совместимое значение при переключении между моделями Seedance", () => {
  const fastDurations = getDurationsForModel("seedance-2.0-fast-t2v");
  const baseDurations = getDurationsForModel("seedance-2.0-t2v");
  const baseResolutions = getResolutionsForVideoModel("seedance-2.0-t2v");

  assert.ok(fastDurations.includes(15));
  assert.ok(baseDurations.includes(15));
  assert.strictEqual(pickCompatibleControlValue(baseDurations, 15, 5), 15);
  assert.strictEqual(pickCompatibleControlValue(baseResolutions, "480p", "720p"), "480p");
});

test("берёт дефолт модели, если текущее значение новой моделью не поддерживается", () => {
  assert.strictEqual(pickCompatibleControlValue(["720p", "1080p"], "480p", "720p"), "720p");
  assert.strictEqual(pickCompatibleControlValue([4, 5, 6], 15, 5), 5);
});

test("берёт первый вариант, если ни текущее, ни дефолт недоступны", () => {
  assert.strictEqual(pickCompatibleControlValue(["high", "medium"], "low", "auto"), "high");
});

test("возвращает null, если вариантов нет", () => {
  assert.strictEqual(pickCompatibleControlValue([], 15, 5), null);
});
