import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRefTokenLabel,
  getRefTokenLabelForFile,
  insertPromptTokenAtSelection,
} from "../videoPromptTokens.js";

test("buildRefTokenLabel учитывает персонажа и основное изображение", () => {
  assert.strictEqual(buildRefTokenLabel("image", 1), "图片1");
  assert.strictEqual(buildRefTokenLabel("image", 1, { faceAsset: { thumbnail: "https://cdn.example.com/face.jpg" } }), "图片2");
  assert.strictEqual(
    buildRefTokenLabel("image", 1, {
      faceAsset: { thumbnail: "https://cdn.example.com/face.jpg" },
      uploadedImageUrl: "https://cdn.example.com/main.jpg",
    }),
    "图片3",
  );
  assert.strictEqual(buildRefTokenLabel("video", 2), "视频2");
  assert.strictEqual(buildRefTokenLabel("audio", 1), "音频1");
});

test("getRefTokenLabelForFile возвращает тег по позиции файла в списке", () => {
  const refFiles = [
    { id: "a", kind: "image" },
    { id: "b", kind: "video" },
    { id: "c", kind: "image" },
  ];

  assert.strictEqual(getRefTokenLabelForFile(refFiles, "a"), "图片1");
  assert.strictEqual(getRefTokenLabelForFile(refFiles, "b"), "视频1");
  assert.strictEqual(
    getRefTokenLabelForFile(refFiles, "c", {
      faceAsset: { thumbnail: "https://cdn.example.com/face.jpg" },
      uploadedImageUrl: "https://cdn.example.com/main.jpg",
    }),
    "图片4",
  );
  assert.strictEqual(getRefTokenLabelForFile(refFiles, "missing"), null);
});

test("insertPromptTokenAtSelection вставляет тег в нужную позицию", () => {
  assert.strictEqual(
    insertPromptTokenAtSelection("сцена с камерой", "图片2", 6, 6),
    "сцена 图片2 с камерой",
  );
  assert.strictEqual(
    insertPromptTokenAtSelection("сцена с 图片1", "视频1", 8, 11),
    "сцена с 视频1 ",
  );
  assert.strictEqual(
    insertPromptTokenAtSelection("", "音频1"),
    "音频1 ",
  );
});
