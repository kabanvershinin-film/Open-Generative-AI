function hasSelectedValue(value) {
  return value !== undefined && value !== null && !(typeof value === "string" && value === "");
}

export function pickCompatibleControlValue(options = [], currentValue, defaultValue) {
  if (!Array.isArray(options) || options.length === 0) return null;

  if (hasSelectedValue(currentValue) && options.includes(currentValue)) {
    return currentValue;
  }

  if (hasSelectedValue(defaultValue) && options.includes(defaultValue)) {
    return defaultValue;
  }

  return options[0];
}
