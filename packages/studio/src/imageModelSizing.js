export const GEMINI_IMAGE_ASPECT_RATIOS = [
  "1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2",
  "4:5", "5:4", "1:4", "4:1", "1:8", "8:1", "21:9",
];

export const GPT_IMAGE_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "3:2", "2:3"];
export const GPT_IMAGE_SIZE_PRESETS = ["1K", "2K"];
export const GEMINI_IMAGE_SIZE_PRESETS = ["1K", "2K", "4K", "512"];

export function computeGptImageSize(aspectRatio, imageSize = "1K") {
  const preset = typeof imageSize === "string" && imageSize.includes("x") ? imageSize : (imageSize || "1K");
  if (typeof preset === "string" && preset.includes("x")) return preset;

  const sizes = {
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

  return sizes[preset]?.[aspectRatio] || sizes["1K"][aspectRatio] || "1024x1024";
}
