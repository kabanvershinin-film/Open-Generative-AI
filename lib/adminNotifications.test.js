import test from "node:test";
import assert from "node:assert";

import {
  buildAdminNotificationRecord,
  getAdminNotificationSeverity,
  getAdminNotificationTypeLabel,
  isIncidentNotification,
  sanitizeAdminNotificationPayload,
} from "./adminNotifications.js";

test("buildAdminNotificationRecord заполняет поля инцидента и dedupe key", () => {
  const record = buildAdminNotificationRecord({
    type: "generation_failed",
    message: "Ошибка генерации видео",
    dedupeKey: "video-generate:123",
    user: {
      id: "user-1",
      email: "user@example.com",
      user_metadata: { full_name: "Тестовый Пользователь" },
    },
    payload: {
      studio: "video",
      model: "seedance-2.0-t2v",
      error: "No video URL returned by API",
    },
  });

  assert.strictEqual(record.type, "generation_failed");
  assert.strictEqual(record.title, "Ошибка генерации");
  assert.strictEqual(record.user_id, "user-1");
  assert.strictEqual(record.email, "user@example.com");
  assert.strictEqual(record.full_name, "Тестовый Пользователь");
  assert.strictEqual(record.event_key, "generation_failed:user-1:video-generate:123");
  assert.deepStrictEqual(record.payload, {
    studio: "video",
    model: "seedance-2.0-t2v",
    error: "No video URL returned by API",
  });
});

test("sanitizeAdminNotificationPayload отбрасывает неподходящие значения", () => {
  assert.deepStrictEqual(
    sanitizeAdminNotificationPayload({
      ok: true,
      count: 3,
      text: "abc",
      nested: { error: "boom" },
      skip: undefined,
      list: ["a", "b"],
    }),
    {
      ok: true,
      count: 3,
      text: "abc",
      nested: { error: "boom" },
      list: ["a", "b"],
    },
  );
});

test("helpers корректно различают регистрации и инциденты", () => {
  assert.strictEqual(isIncidentNotification("user_registered"), false);
  assert.strictEqual(isIncidentNotification("billing_failed"), true);
  assert.strictEqual(getAdminNotificationSeverity("billing_failed"), "danger");
  assert.strictEqual(getAdminNotificationTypeLabel("generation_failed"), "Генерация");
});
