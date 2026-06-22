function round2(value) {
  return Math.round(value * 100) / 100;
}

export const SEEDANCE2_RATES = {
  standard: { sd: { noVideo: 46, withVideo: 28 }, hd: { noVideo: 51, withVideo: 31 } },
  fast: { sd: { noVideo: 37, withVideo: 22 }, hd: { noVideo: 41, withVideo: 25 } },
};

export const SEEDANCE2_DIMS = {
  "480p": [864, 496],
  "720p": [1280, 720],
  "1080p": [1920, 1080],
};

export function isSeedance2Model(model) {
  return /doubao-seedance-2-0/.test(String(model || ""));
}

export function seedance2RateCny(model, resolution, hasVideoInput) {
  if (!isSeedance2Model(model)) return 0;
  const variant = String(model || "").includes("fast") ? "fast" : "standard";
  const tier = resolution === "1080p" ? "hd" : "sd";
  const rate = SEEDANCE2_RATES[variant][tier];
  return hasVideoInput ? rate.withVideo : rate.noVideo;
}

export function rubFromTokensValue(tokens, rateCny, cnyToRub, markup = 1) {
  if (!(tokens > 0) || !(rateCny > 0) || !(cnyToRub > 0) || !(markup > 0)) return 0;
  return round2((tokens / 1_000_000) * rateCny * cnyToRub * markup);
}
