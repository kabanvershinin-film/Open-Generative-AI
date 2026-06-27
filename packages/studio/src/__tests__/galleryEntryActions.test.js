import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGalleryViewerHtml,
  getGalleryEntryFilename,
} from "../components/galleryEntryActions.js";

test("getGalleryEntryFilename собирает понятное имя файла по записи галереи", () => {
  const filename = getGalleryEntryFilename({
    id: "vid-123",
    type: "video",
    model: "seedance-2.0-mini-t2v",
    url: "https://cdn.example.com/media/result.mp4?token=1",
  });

  assert.strictEqual(filename, "seedance-2.0-mini-t2v-vid-123.mp4");
});

test("buildGalleryViewerHtml рендерит video viewer вместо прямой ссылки на файл", () => {
  const html = buildGalleryViewerHtml({
    type: "video",
    model: "seedance-2.0-mini-t2v",
    url: "https://cdn.example.com/media/result.mp4",
    prompt: "кот играет на гитаре",
  });

  assert.match(html, /<video[^>]+src="https:\/\/cdn\.example\.com\/media\/result\.mp4"[^>]+controls/);
  assert.match(html, /кот играет на гитаре/);
  assert.doesNotMatch(html, /download=/);
});

test("buildGalleryViewerHtml рендерит image viewer для фото", () => {
  const html = buildGalleryViewerHtml({
    type: "image",
    model: "gpt-image-2",
    url: "https://cdn.example.com/media/result.png",
  });

  assert.match(html, /<img[^>]+src="https:\/\/cdn\.example\.com\/media\/result\.png"/);
});
