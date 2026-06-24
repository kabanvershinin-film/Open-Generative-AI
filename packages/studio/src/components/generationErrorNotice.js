export function isInsufficientFundsError(message) {
  const normalized = String(message || "").trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes("недостаточно средств") ||
    normalized.includes("недостаточно денег") ||
    normalized.includes("insufficient funds") ||
    normalized.includes("insufficient balance")
  );
}

export function formatGenerationErrorNotice(message) {
  const text = String(message || "").trim();
  if (!text) return null;

  if (isInsufficientFundsError(text)) {
    return {
      tone: "warning",
      title: "Недостаточно средств",
      description: `${text} Пополните счет и повторите генерацию.`,
    };
  }

  return {
    tone: "error",
    title: "Ошибка генерации",
    description: text,
  };
}
