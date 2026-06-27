import test from "node:test";
import assert from "node:assert/strict";

import {
  buildVideoGalleryDedupeKey,
  getVideoHistoryEntryKey,
  mergeVideoHistoryEntries,
  removeVideoHistoryEntry,
  upsertVideoHistoryEntry,
} from "./videoHistory.js";

test("buildVideoGalleryDedupeKey строит стабильный ключ для видео", () => {
  assert.strictEqual(buildVideoGalleryDedupeKey("task-123"), "mf-video:task-123");
  assert.strictEqual(buildVideoGalleryDedupeKey("mf-video:task-123"), "mf-video:task-123");
  assert.strictEqual(buildVideoGalleryDedupeKey("", "req-456"), "mf-video:req-456");
  assert.strictEqual(buildVideoGalleryDedupeKey("", null, undefined), "");
});

test("getVideoHistoryEntryKey предпочитает dedupeKey перед id и url", () => {
  assert.strictEqual(
    getVideoHistoryEntryKey({
      dedupeKey: "mf-video:req-1",
      id: "gen-1",
      url: "https://cdn.example.com/video.mp4",
    }),
    "mf-video:req-1",
  );

  assert.strictEqual(
    getVideoHistoryEntryKey({
      dedupe_key: "mf-video:req-2",
      id: "gen-2",
    }),
    "mf-video:req-2",
  );
});

test("mergeVideoHistoryEntries схлопывает дубли по dedupeKey и оставляет первую запись", () => {
  const entries = mergeVideoHistoryEntries([
    {
      id: "local-gen",
      url: "https://cdn.example.com/raw.mp4",
      dedupeKey: "mf-video:req-123",
    },
    {
      id: "gallery-entry",
      url: "https://tos.example.com/final.mp4",
      dedupe_key: "mf-video:req-123",
    },
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
    },
  ], Infinity);

  assert.deepStrictEqual(entries, [
    {
      id: "local-gen",
      url: "https://cdn.example.com/raw.mp4",
      dedupeKey: "mf-video:req-123",
    },
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
    },
  ]);
});

test("upsertVideoHistoryEntry заменяет старую запись с тем же dedupeKey новой", () => {
  const entries = upsertVideoHistoryEntry([
    {
      id: "old-entry",
      url: "https://cdn.example.com/raw.mp4",
      dedupeKey: "mf-video:req-123",
    },
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
    },
  ], {
    id: "new-entry",
    url: "https://tos.example.com/final.mp4",
    dedupe_key: "mf-video:req-123",
  }, Infinity);

  assert.deepStrictEqual(entries, [
    {
      id: "new-entry",
      url: "https://tos.example.com/final.mp4",
      dedupe_key: "mf-video:req-123",
    },
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
    },
  ]);
});

test("removeVideoHistoryEntry удаляет все копии одной записи по dedupeKey", () => {
  const entries = removeVideoHistoryEntry([
    {
      id: "local-gen",
      url: "https://cdn.example.com/raw.mp4",
      dedupeKey: "mf-video:req-123",
    },
    {
      id: "gallery-entry",
      url: "https://tos.example.com/final.mp4",
      dedupe_key: "mf-video:req-123",
    },
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
    },
  ], {
    id: "gallery-entry",
    url: "https://tos.example.com/final.mp4",
    dedupe_key: "mf-video:req-123",
  });

  assert.deepStrictEqual(entries, [
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
    },
  ]);
});
