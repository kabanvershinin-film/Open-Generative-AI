import test from "node:test";
import assert from "node:assert/strict";

import { getVideoActiveTaskKey, getVisibleVideoActiveTasks } from "./videoActiveTasks.js";

test("getVideoActiveTaskKey строит ключ по requestId или taskId", () => {
  assert.strictEqual(
    getVideoActiveTaskKey({ requestId: "req-1" }),
    "mf-video:req-1",
  );
  assert.strictEqual(
    getVideoActiveTaskKey({ id: "local-1", requestId: "req-2" }),
    "mf-video:req-2",
  );
  assert.strictEqual(
    getVideoActiveTaskKey({ taskId: "ark-1" }),
    "mf-video:ark-1",
  );
  assert.strictEqual(
    getVideoActiveTaskKey({ id: "local-2" }),
    "mf-video:local-2",
  );
});

test("getVisibleVideoActiveTasks скрывает generating-задачу если готовое видео уже в истории", () => {
  const tasks = [
    { id: "task-1", status: "generating", requestId: "req-1", prompt: "кот" },
    { id: "task-2", status: "generating", requestId: "req-2", prompt: "самолет" },
    { id: "task-3", status: "error", requestId: "req-1", prompt: "ошибка" },
  ];
  const history = [
    { id: "entry-1", url: "https://bucket.example.com/final.mp4", dedupeKey: "mf-video:req-1" },
  ];

  const result = getVisibleVideoActiveTasks(tasks, history);

  assert.deepStrictEqual(result, [
    { id: "task-2", status: "generating", requestId: "req-2", prompt: "самолет" },
    { id: "task-3", status: "error", requestId: "req-1", prompt: "ошибка" },
  ]);
});
