export const GEMINI_IMAGE_ASPECT_RATIOS = [
  "1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2",
  "4:5", "5:4", "1:4", "4:1", "1:8", "8:1", "21:9",
];

export const GPT_IMAGE_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "3:2", "2:3"];
export const GPT_IMAGE_SIZE_PRESETS = ["1K", "2K"];
export const GEMINI_IMAGE_SIZE_PRESETS = ["1K", "2K", "4K", "512"];
export const SEEDREAM_IMAGE_ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"];
export const SEEDREAM_IMAGE_SIZE_PRESETS = ["2K", "3K", "4K"];

const GPT_IMAGE_SIZES = {
  "1K": {
    "1:1": "1024x1024",
    "16:9": "1536x864",
    "9:16": "864x1536",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
  },
  "2K": {
    "1:1": "2048x2048",
    "16:9": "2048x1152",
    "9:16": "1152x2048",
    "3:2": "2048x1360",
    "2:3": "1360x2048",
  },
};

const SEEDREAM_IMAGE_SIZES = {
  "2K": {
    "1:1": "2048x2048",
    "4:3": "2304x1728",
    "3:4": "1728x2304",
    "16:9": "2848x1600",
    "9:16": "1600x2848",
    "3:2": "2496x1664",
    "2:3": "1664x2496",
    "21:9": "3136x1344",
  },
  "3K": {
    "1:1": "3072x3072",
    "4:3": "3456x2592",
    "3:4": "2592x3456",
    "16:9": "4096x2304",
    "9:16": "2304x4096",
    "3:2": "3744x2496",
    "2:3": "2496x3744",
    "21:9": "4704x2016",
  },
  "4K": {
    "1:1": "4096x4096",
    "4:3": "4704x3520",
    "3:4": "3520x4704",
    "16:9": "5504x3040",
    "9:16": "3040x5504",
    "3:2": "4992x3328",
    "2:3": "3328x4992",
    "21:9": "6240x2656",
  },
};

export function computeGptImageSize(aspectRatio, imageSize = "1K") {
  const preset = typeof imageSize === "string" && imageSize.includes("x") ? imageSize : (imageSize || "1K");
  if (typeof preset === "string" && preset.includes("x")) return preset;
  return GPT_IMAGE_SIZES[preset]?.[aspectRatio] || GPT_IMAGE_SIZES["1K"][aspectRatio] || "1024x1024";
}

export function computeSeedreamImageSize(aspectRatio, imageSize = "2K") {
  const preset = typeof imageSize === "string" && imageSize.includes("x") ? imageSize : (imageSize || "2K");
  if (typeof preset === "string" && preset.includes("x")) return preset;
  return SEEDREAM_IMAGE_SIZES[preset]?.[aspectRatio] || SEEDREAM_IMAGE_SIZES["2K"][aspectRatio] || "2048x2048";
}

export function computeImageGenerationSize(modelInfo, aspectRatio, imageSize) {
  const apiId = String(modelInfo?.apiId || modelInfo?.id || "");
  if (modelInfo?.imageSizing === "seedream" || apiId === "doubao-seedream-5-0-260128") {
    return computeSeedreamImageSize(aspectRatio, imageSize);
  }
  return computeGptImageSize(aspectRatio, imageSize);
}
