import test from "node:test";
import assert from "node:assert/strict";

import {
  buildVideoGalleryDedupeKey,
  buildVideoPendingDedupeKey,
  getVideoHistoryEntryKey,
  mergeVideoHistoryEntries,
  normalizeVideoHistoryEntry,
  normalizeVideoHistoryUrl,
  removeVideoHistoryEntry,
  upsertVideoHistoryEntry,
} from "./videoHistory.js";

test("buildVideoGalleryDedupeKey строит стабильный ключ для видео", () => {
  assert.strictEqual(buildVideoGalleryDedupeKey("task-123"), "mf-video:task-123");
  assert.strictEqual(buildVideoGalleryDedupeKey("mf-video:task-123"), "mf-video:task-123");
  assert.strictEqual(buildVideoGalleryDedupeKey("", "req-456"), "mf-video:req-456");
  assert.strictEqual(buildVideoGalleryDedupeKey("", null, undefined), "");
});

test("buildVideoPendingDedupeKey использует один и тот же ключ для разных путей восстановления", () => {
  const directKey = buildVideoPendingDedupeKey({
    taskId: "ark-task-123",
    pendingId: "ark-task-123",
    generationId: "gen-1",
  });

  const restoredKey = buildVideoPendingDedupeKey({
    requestId: "",
    taskId: "ark-task-123",
    pendingId: "ark-task-123",
    generationId: "gen-1",
  });

  assert.strictEqual(directKey, "mf-video:ark-task-123");
  assert.strictEqual(restoredKey, directKey);
});

test("getVideoHistoryEntryKey предпочитает dedupeKey, потом url, потом id", () => {
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

  assert.strictEqual(
    getVideoHistoryEntryKey({
      id: "gen-3",
      url: "https://cdn.example.com/video-3.mp4",
    }),
    "https://cdn.example.com/video-3.mp4",
  );
});

test("normalizeVideoHistoryUrl убирает истёкшую TOS-подпись", () => {
  assert.strictEqual(
    normalizeVideoHistoryUrl(
      "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Expires=86400&X-Tos-Signature=deadbeef",
    ),
    "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4",
  );
});

test("normalizeVideoHistoryEntry очищает url и preview у записи истории", () => {
  const entry = normalizeVideoHistoryEntry({
    url: "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4?X-Tos-Expires=86400",
    preview_url: "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.jpg?X-Tos-Expires=86400",
  });

  assert.deepStrictEqual(entry, {
    url: "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4",
    preview_url: "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.jpg",
    thumbnail: undefined,
    last_frame_url: undefined,
    first_frame_url: undefined,
  });
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
      preview_url: undefined,
      thumbnail: undefined,
      last_frame_url: undefined,
      first_frame_url: undefined,
    },
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
      preview_url: undefined,
      thumbnail: undefined,
      last_frame_url: undefined,
      first_frame_url: undefined,
    },
  ]);
});

test("mergeVideoHistoryEntries схлопывает локальный и серверный TOS-url одной записи", () => {
  const entries = mergeVideoHistoryEntries([
    {
      id: "local-gen",
      url: "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4?X-Tos-Expires=86400",
    },
    {
      id: "server-entry",
      url: "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4",
    },
  ], Infinity);

  assert.deepStrictEqual(entries, [
    {
      id: "local-gen",
      url: "https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4",
      preview_url: undefined,
      thumbnail: undefined,
      last_frame_url: undefined,
      first_frame_url: undefined,
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
      preview_url: undefined,
      thumbnail: undefined,
      last_frame_url: undefined,
      first_frame_url: undefined,
    },
    {
      id: "other-entry",
      url: "https://tos.example.com/other.mp4",
      preview_url: undefined,
      thumbnail: undefined,
      last_frame_url: undefined,
      first_frame_url: undefined,
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
