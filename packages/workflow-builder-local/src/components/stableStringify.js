export function stableStringify(obj) {
  const normalize = (value) => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
          acc[key] = normalize(value[key]);
          return acc;
        }, {});
    }
    return value;
  };

  try {
    return JSON.stringify(normalize(obj));
  } catch {
    return "";
  }
}
