import test from "node:test";
import assert from "node:assert/strict";

import { saveMediaToGallery } from "../components/gallerySave.js";

test("saveMediaToGallery отправляет изображение в галерею", async (t) => {
  let request = null;

  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ entry: { id: "img-1", url: "https://cdn.example.com/image.png" } }),
    };
  });

  const entry = await saveMediaToGallery({
    url: "https://cdn.example.com/image.png",
    type: "image",
    model: "gemini",
    prompt: "кот",
  });

  assert.deepStrictEqual(entry, { id: "img-1", url: "https://cdn.example.com/image.png" });
  assert.strictEqual(request.url, "/api/gallery");
  assert.strictEqual(request.options.method, "POST");
  assert.strictEqual(request.options.keepalive, true);
  assert.deepStrictEqual(JSON.parse(request.options.body), {
    url: "https://cdn.example.com/image.png",
    type: "image",
    model: "gemini",
    prompt: "кот",
  });
});

test("saveMediaToGallery отправляет дополнительные поля записи", async (t) => {
  let request = null;

  t.mock.method(globalThis, "fetch", async (url, options = {}) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({ entry: { id: "img-2", url: "https://cdn.example.com/image-2.png" } }),
    };
  });

  await saveMediaToGallery({
    url: "https://cdn.example.com/image-2.png",
    type: "image",
    model: "gpt-image-2",
    prompt: "лиса",
    extra: {
      dedupeKey: "mf-image:req-123",
      aspect_ratio: "16:9",
      restoreState: {
        prompt: "лиса",
        uploadedImageUrls: ["https://cdn.example.com/ref.png"],
      },
    },
  });

  assert.deepStrictEqual(JSON.parse(request.options.body), {
    url: "https://cdn.example.com/image-2.png",
    type: "image",
    model: "gpt-image-2",
    prompt: "лиса",
    dedupeKey: "mf-image:req-123",
    aspect_ratio: "16:9",
    restoreState: {
      prompt: "лиса",
      uploadedImageUrls: ["https://cdn.example.com/ref.png"],
    },
  });
});

test("saveMediaToGallery бросает ошибку сервера", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: "boom" }),
  }));

  await assert.rejects(
    saveMediaToGallery({ url: "https://cdn.example.com/image.png" }),
    /boom/,
  );
});
