import test from "node:test";
import assert from "node:assert/strict";

import {
  appendUploadUrls,
  getDisplayUploadUrls,
  normalizeUploadUrls,
  removeUploadUrl,
  replaceUploadUrl,
} from "../uploadPreviewState.js";

test("normalizeUploadUrls приводит строку и массив к единому виду", () => {
  assert.deepStrictEqual(normalizeUploadUrls("https://cdn.example.com/a.png"), [
    "https://cdn.example.com/a.png",
  ]);
  assert.deepStrictEqual(normalizeUploadUrls(["", "https://cdn.example.com/b.png"]), [
    "https://cdn.example.com/b.png",
  ]);
  assert.deepStrictEqual(normalizeUploadUrls(null), []);
});

test("getDisplayUploadUrls предпочитает быстрый preview во время загрузки", () => {
  assert.deepStrictEqual(
    getDisplayUploadUrls(["blob:preview-1"], ["https://cdn.example.com/a.png"]),
    ["blob:preview-1"],
  );
  assert.deepStrictEqual(
    getDisplayUploadUrls([], ["https://cdn.example.com/a.png"]),
    ["https://cdn.example.com/a.png"],
  );
});

test("appendUploadUrls добавляет preview и уважает лимит", () => {
  assert.deepStrictEqual(
    appendUploadUrls(["https://cdn.example.com/a.png"], ["blob:preview-1"], 2),
    ["https://cdn.example.com/a.png", "blob:preview-1"],
  );
  assert.deepStrictEqual(
    appendUploadUrls(["https://cdn.example.com/a.png"], ["blob:preview-1"], 1),
    ["blob:preview-1"],
  );
});

test("replaceUploadUrl подменяет preview на итоговый url", () => {
  assert.deepStrictEqual(
    replaceUploadUrl(["https://cdn.example.com/a.png", "blob:preview-1"], "blob:preview-1", "https://cdn.example.com/b.png"),
    ["https://cdn.example.com/a.png", "https://cdn.example.com/b.png"],
  );
});

test("removeUploadUrl убирает зависший preview после ошибки", () => {
  assert.deepStrictEqual(
    removeUploadUrl(["https://cdn.example.com/a.png", "blob:preview-1"], "blob:preview-1"),
    ["https://cdn.example.com/a.png"],
  );
});
