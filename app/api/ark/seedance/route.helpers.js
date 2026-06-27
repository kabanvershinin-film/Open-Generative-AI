export function parseEndpoints(envValue, fallback) {
  const list = String(envValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return list.length > 0 ? list : fallback;
}

export function createRoundRobinPicker(fullEndpoints, fastEndpoints, initialIndex = { full: 0, fast: 0 }) {
  const state = {
    full: initialIndex.full || 0,
    fast: initialIndex.fast || 0,
  };

  return function pickEndpoint(fast) {
    const pool = fast ? fastEndpoints : fullEndpoints;
    const key = fast ? "fast" : "full";
    if (!pool.length) return null;
    const endpoint = pool[state[key] % pool.length];
    state[key] = (state[key] + 1) % pool.length;
    return endpoint;
  };
}

export function createSinglePoolPicker(endpoints, initialIndex = 0) {
  let index = initialIndex || 0;

  return function pickEndpoint() {
    if (!endpoints.length) return null;
    const endpoint = endpoints[index % endpoints.length];
    index = (index + 1) % endpoints.length;
    return endpoint;
  };
}

export function normalizeArkResolution(resolution, fast) {
  const normalized = String(resolution || "").toLowerCase();
  if (!normalized) return undefined;
  if (fast && normalized === "1080p") return "720p";
  return normalized;
}

export function clampArkDuration(duration) {
  if (duration == null || duration === "") return undefined;
  return Math.max(4, Math.min(15, Number(duration) || 5));
}

export function buildArkSubmitPayload({
  model,
  content,
  generateAudio = true,
  resolution,
  ratio,
  duration,
  seed,
  returnLastFrame,
  fast = false,
}) {
  const payload = {
    model,
    content,
    generate_audio: generateAudio,
    watermark: false,
  };

  const normalizedResolution = normalizeArkResolution(resolution, fast);
  const normalizedDuration = clampArkDuration(duration);

  if (normalizedResolution) payload.resolution = normalizedResolution;
  if (ratio) payload.ratio = ratio;
  if (normalizedDuration !== undefined) payload.duration = normalizedDuration;
  if (seed !== undefined && seed !== null) payload.seed = seed;
  if (returnLastFrame !== undefined && returnLastFrame !== null) {
    payload.return_last_frame = returnLastFrame;
  }

  return payload;
}
