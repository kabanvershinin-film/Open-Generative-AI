import test from "node:test";
import assert from "node:assert/strict";

import { ensureVideoEntryStoredInTos } from "./videoTosPersistence.js";

test("ensureVideoEntryStoredInTos предпочитает entry из pendingResult", async () => {
  const result = await ensureVideoEntryStoredInTos({
    entry: {
      id: "gen-1",
      url: "https://cdn.example.com/raw.mp4",
      prompt: "кот",
    },
    pendingResult: {
      entry: {
        id: "gallery-1",
        url: "https://bucket.tos-cn-beijing.volces.com/users/user-1/videos/final.mp4",
        created_at: "2026-06-29T18:00:00.000Z",
      },
    },
    persistToGallery: async () => {
      throw new Error("не должен вызываться");
    },
  });

  assert.deepStrictEqual(result, {
    source: "pending",
    entry: {
      id: "gallery-1",
      url: "https://bucket.tos-cn-beijing.volces.com/users/user-1/videos/final.mp4",
      prompt: "кот",
      created_at: "2026-06-29T18:00:00.000Z",
    },
  });
});

test("ensureVideoEntryStoredInTos делает fallback в прямое сохранение галереи", async () => {
  const calls = [];
  const result = await ensureVideoEntryStoredInTos({
    entry: {
      id: "gen-2",
      url: "https://cdn.example.com/raw.mp4",
      prompt: "самолет",
    },
    pendingResult: null,
    persistToGallery: async (entry) => {
      calls.push(entry);
      return {
        id: "gallery-2",
        url: "https://bucket.tos-cn-beijing.volces.com/users/user-1/videos/final-2.mp4",
      };
    },
  });

  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(result, {
    source: "gallery",
    entry: {
      id: "gallery-2",
      url: "https://bucket.tos-cn-beijing.volces.com/users/user-1/videos/final-2.mp4",
      prompt: "самолет",
    },
  });
});

test("ensureVideoEntryStoredInTos сохраняет локальный url если TOS не ответил", async () => {
  const result = await ensureVideoEntryStoredInTos({
    entry: {
      id: "gen-3",
      url: "https://cdn.example.com/raw.mp4",
    },
    pendingResult: null,
    persistToGallery: async () => null,
  });

  assert.deepStrictEqual(result, {
    source: "local",
    entry: {
      id: "gen-3",
      url: "https://cdn.example.com/raw.mp4",
    },
  });
});
