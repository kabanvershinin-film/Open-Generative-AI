const DEFAULT_TITLES = {
  user_registered: "Новый пользователь",
  generation_failed: "Ошибка генерации",
  billing_failed: "Проблема со списанием",
  client_error: "Ошибка клиента",
  gallery_save_failed: "Не удалось сохранить результат",
};

function createEventKey(type, userId, dedupeKey) {
  const suffix = dedupeKey
    ? String(dedupeKey)
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${type}:${userId || "anon"}:${suffix}`;
}

export function getAdminNotificationTitle(type, fallbackTitle = "") {
  const normalizedType = String(type || "").trim();
  if (fallbackTitle) return String(fallbackTitle).trim();
  return DEFAULT_TITLES[normalizedType] || "Событие";
}

export function isIncidentNotification(type) {
  return String(type || "") !== "user_registered";
}

export function getAdminNotificationSeverity(type) {
  switch (String(type || "")) {
    case "billing_failed":
      return "danger";
    case "generation_failed":
    case "client_error":
    case "gallery_save_failed":
      return "warning";
    case "user_registered":
      return "info";
    default:
      return "neutral";
  }
}

export function getAdminNotificationTypeLabel(type) {
  switch (String(type || "")) {
    case "user_registered":
      return "Регистрация";
    case "generation_failed":
      return "Генерация";
    case "billing_failed":
      return "Биллинг";
    case "client_error":
      return "Клиент";
    case "gallery_save_failed":
      return "Галерея";
    default:
      return "Событие";
  }
}

export function sanitizeAdminNotificationPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};

  const sanitized = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;
    if (typeof value === "string") {
      sanitized[key] = value.slice(0, 1000);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 20).map((item) => (
        typeof item === "string" ? item.slice(0, 300) : item
      ));
      continue;
    }
    if (typeof value === "object") {
      sanitized[key] = sanitizeAdminNotificationPayload(value);
    }
  }
  return sanitized;
}

export function buildAdminNotificationRecord({
  type,
  title,
  message,
  user,
  payload,
  dedupeKey,
}) {
  const normalizedType = String(type || "").trim() || "client_error";
  const normalizedMessage = String(message || "").trim() || "Неизвестная ошибка";
  const normalizedPayload = sanitizeAdminNotificationPayload(payload);
  const userId = user?.id || null;
  const email = user?.email || normalizedPayload.email || null;
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || normalizedPayload.full_name || null;

  return {
    event_key: createEventKey(normalizedType, userId, dedupeKey),
    type: normalizedType,
    title: getAdminNotificationTitle(normalizedType, title),
    message: normalizedMessage.slice(0, 1000),
    user_id: userId,
    email,
    full_name: fullName,
    payload: normalizedPayload,
  };
}
