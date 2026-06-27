import test from "node:test";
import assert from "node:assert/strict";

import {
  addSelectedUploadEntry,
  appendUploadUrls,
  replaceSelectedUploadEntry,
  getDisplayUploadUrls,
} from "../components/uploadPreviewState.js";

test("addSelectedUploadEntry добавляет локальный preview только пока есть свободный слот", () => {
  const first = addSelectedUploadEntry([], { url: "blob:one", localUrl: "blob:one" }, 1);
  const second = addSelectedUploadEntry(first, { url: "blob:two", localUrl: "blob:two" }, 1);

  assert.deepStrictEqual(first.map((entry) => entry.url), ["blob:one"]);
  assert.deepStrictEqual(second.map((entry) => entry.url), ["blob:one"]);
});

test("replaceSelectedUploadEntry заменяет локальный preview на постоянный URL", () => {
  const result = replaceSelectedUploadEntry(
    [{ url: "blob:one", localUrl: "blob:one", pending: true }],
    "blob:one",
    { url: "https://cdn.example.com/one.png", pending: false },
  );

  assert.deepStrictEqual(result, [
    { url: "https://cdn.example.com/one.png", localUrl: "blob:one", pending: false },
  ]);
});

test("getDisplayUploadUrls отдаёт preview раньше боевых URL", () => {
  assert.deepStrictEqual(
    getDisplayUploadUrls(["blob:one"], ["https://cdn.example.com/one.png"]),
    ["blob:one"],
  );
  assert.deepStrictEqual(
    getDisplayUploadUrls([], ["https://cdn.example.com/one.png"]),
    ["https://cdn.example.com/one.png"],
  );
});

test("appendUploadUrls мгновенно добавляет новые preview URL c учётом лимита", () => {
  assert.deepStrictEqual(
    appendUploadUrls(
      ["https://cdn.example.com/one.png"],
      ["blob:two", "blob:three"],
      3,
    ),
    ["https://cdn.example.com/one.png", "blob:two", "blob:three"],
  );
});

test("appendUploadUrls в одиночном режиме сразу заменяет текущий preview", () => {
  assert.deepStrictEqual(
    appendUploadUrls(
      ["https://cdn.example.com/one.png"],
      ["blob:new"],
      1,
    ),
    ["blob:new"],
  );
});
