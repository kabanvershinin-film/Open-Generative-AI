import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizePersistedRefFiles,
  serializeRefFilesForPersistence,
} from "./refFilesState.js";

test("normalizePersistedRefFiles отбрасывает зависшие незавершённые загрузки после обновления", () => {
  const files = normalizePersistedRefFiles([
    { id: "ready-image", url: "https://cdn.example.com/cat.png", kind: "image", name: "cat.png", uploading: false, progress: 100 },
    { id: "stuck-upload", url: null, kind: "video", name: "broken.mp4", uploading: true, progress: 88 },
    { id: "ready-audio", url: "https://cdn.example.com/voice.mp3", kind: "audio", name: "voice.mp3", uploading: false, progress: 100 },
  ]);

  assert.deepStrictEqual(files, [
    { id: "ready-image", url: "https://cdn.example.com/cat.png", kind: "image", name: "cat.png", uploading: false, progress: 100 },
    { id: "ready-audio", url: "https://cdn.example.com/voice.mp3", kind: "audio", name: "voice.mp3", uploading: false, progress: 100 },
  ]);
});

test("serializeRefFilesForPersistence сохраняет только готовые референсы без runtime-полей", () => {
  const files = serializeRefFilesForPersistence([
    { id: "ready-video", url: "https://cdn.example.com/ref.mp4", kind: "video", name: "ref.mp4", uploading: false, progress: 100, cancel: () => {} },
    { id: "uploading-image", url: null, kind: "image", name: "ref.png", uploading: true, progress: 3, cancel: () => {} },
  ]);

  assert.deepStrictEqual(files, [
    { id: "ready-video", url: "https://cdn.example.com/ref.mp4", kind: "video", name: "ref.mp4", uploading: false, progress: 100 },
  ]);
});
