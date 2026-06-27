import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGalleryViewerHtml,
  downloadGalleryEntry,
  getGalleryEntryFilename,
  openGalleryEntry,
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

test("openGalleryEntry открывает viewer через object URL вместо прямой ссылки", async (t) => {
  const writes = [];
  const openCalls = [];
  const popup = {
    document: {
      open() {},
      write(html) {
        writes.push(html);
      },
      close() {},
    },
    addEventListener() {},
    location: { href: "about:blank" },
  };

  global.window = {
    open: (...args) => {
      openCalls.push(args);
      return popup;
    },
  };
  let requestedUrl = "";
  global.fetch = async (url) => {
    requestedUrl = url;
    return {
    ok: true,
    blob: async () => new Blob(["video-bytes"], { type: "video/mp4" }),
    };
  };
  global.URL = {
    createObjectURL: () => "blob:gallery-video",
    revokeObjectURL() {},
  };

  await openGalleryEntry({
    type: "video",
    model: "seedance-2.0-mini-t2v",
    url: "https://cdn.example.com/media/result.mp4",
  });

  assert.equal(writes.length >= 2, true);
  assert.deepStrictEqual(openCalls[0], ["about:blank", "_blank"]);
  assert.strictEqual(
    requestedUrl,
    "/api/workflow/proxy-download?url=https%3A%2F%2Fcdn.example.com%2Fmedia%2Fresult.mp4",
  );
  assert.match(writes[writes.length - 1], /src="blob:gallery-video"/);
  assert.doesNotMatch(writes[writes.length - 1], /src="https:\/\/cdn\.example\.com\/media\/result\.mp4"/);
});

test("downloadGalleryEntry скачивает через прокси", async () => {
  let requestedUrl = "";
  const appended = [];
  const clicked = [];
  global.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      blob: async () => new Blob(["video-bytes"], { type: "video/mp4" }),
    };
  };
  global.URL = {
    createObjectURL: () => "blob:download-video",
    revokeObjectURL() {},
  };
  global.document = {
    body: {
      appendChild(node) {
        appended.push(node);
      },
    },
    createElement() {
      return {
        click() {
          clicked.push(true);
        },
        remove() {},
        style: {},
      };
    },
  };

  await downloadGalleryEntry({
    id: "vid-123",
    type: "video",
    model: "seedance-2.0-mini-t2v",
    url: "https://cdn.example.com/media/result.mp4",
  });

  assert.strictEqual(
    requestedUrl,
    "/api/workflow/proxy-download?url=https%3A%2F%2Fcdn.example.com%2Fmedia%2Fresult.mp4",
  );
  assert.strictEqual(appended.length, 1);
  assert.strictEqual(clicked.length, 1);
});
