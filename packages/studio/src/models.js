// Memefast models catalog
// platform: "unified" → POST /v1/video/create + GET /v1/video/task/{id}
// platform: "kling"   → POST /v1/kling/videos + GET /v1/kling/videos/{id}
// platform: "luma"    → POST /v1/luma/generations + GET /v1/luma/generations/{id}
// platform: "sora"    → POST /v1/video/generations + GET /v1/video/generations/{id}
// platform: "minimax" → POST /v1/video_generation + GET /v1/query/video_generation?task_id=
// platform: "runway"  → POST /v1/runway/image-to-video + GET /v1/runway/tasks/{id}

// ── Routing strategy (memefast model-name suffix) ────────────────────────────
// Appended to the model name as "model:suffix". Lets the client pick a routing
// strategy. Applies to all memefast APIs (image generation, video tasks).
export const routingOptions = ["default", "nitro", "floor", "stable"];
export const routingLabels = {
  default: "Авто",
  nitro: "Быстрее",
  floor: "Дешевле",
  stable: "Стабильнее",
};

// Aspect-ratio options shared by the Gemini image model (Nano Banana 2).
const GEMINI_AR = ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2", "4:5", "5:4", "1:4", "4:1", "1:8", "8:1", "21:9"];
const GPT_AR = ["1:1", "16:9", "9:16", "3:2", "2:3"];
const GPT_IMAGE_SIZE = ["1K", "2K"];

// ── Image generation (text → image) via POST /v1/images/generations ──────────
export const _t2iModelsAll = [
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_AR, default: "1:1" },
      imageSize: { enum: GPT_IMAGE_SIZE, default: "1K" },
      quality: { enum: ["auto", "high", "medium", "low"], default: "auto" },
      format: { enum: ["jpeg", "png", "webp"], default: "jpeg" },
    },
  },
  {
    id: "gemini-3.1-flash-image-preview",
    name: "Nano Banana 2",
    apiId: "gemini-3.1-flash-image-preview",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_AR, default: "1:1" },
      imageSize: { enum: ["1K", "2K", "4K", "512"], default: "1K" },
    },
  },
  {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    apiId: "gemini-3-pro-image-preview",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_AR, default: "1:1" },
      imageSize: { enum: ["1K", "2K", "4K", "512"], default: "1K" },
    },
  },
];

// ── Image-to-image ────────────────────────────────────────────────────────────
export const _i2iModelsAll = [
  {
    id: "gpt-image-2-edit",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    editEndpoint: true,
    acceptsImage: true,
    maxImages: 16,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_AR, default: "1:1" },
      imageSize: { enum: GPT_IMAGE_SIZE, default: "1K" },
      quality: { enum: ["auto", "high", "medium", "low"], default: "auto" },
      format: { enum: ["jpeg", "png", "webp"], default: "jpeg" },
      background: { enum: ["auto", "transparent", "opaque"], default: "auto" },
      moderation: { enum: ["auto", "low"], default: "auto" },
    },
  },
  {
    id: "gemini-3.1-flash-image-preview-edit",
    name: "Nano Banana 2",
    apiId: "gemini-3.1-flash-image-preview",
    acceptsImage: true,
    maxImages: 14,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_AR, default: "1:1" },
      imageSize: { enum: ["1K", "2K", "4K", "512"], default: "1K" },
    },
  },
  {
    id: "gemini-3-pro-image-preview-edit",
    name: "Nano Banana Pro",
    apiId: "gemini-3-pro-image-preview",
    acceptsImage: true,
    maxImages: 8,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_AR, default: "1:1" },
      imageSize: { enum: ["1K", "2K", "4K", "512"], default: "1K" },
    },
  },
];

// ── Text-to-video ────────────────────────────────────────────────────────────
export const _t2vModelsAll = [
  {
    id: "seedance-2.0-t2v",
    name: "Seedance 2.0",
    apiId: "seedance-pro-t2v",
    platform: "unified",
    provider: "ark",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "adaptive", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "1080p", "480p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" },
      seed: { type: "integer", title: "Seed (для повторения результатов)", default: -1 },
      return_last_frame: { type: "boolean", title: "Возвращать последний кадр", default: false }
    }
  },
  {
    id: "seedance-2.0-mini-t2v",
    name: "Seedance 2.0 Mini",
    apiId: "doubao-seedance-2-0-mini-260615",
    platform: "unified",
    provider: "ark",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "adaptive", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "480p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "seedance-2.0-fast-t2v",
    name: "Seedance 2.0 Fast",
    apiId: "seedance-pro-t2v-fast",
    platform: "unified",
    provider: "ark",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "adaptive", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "480p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" }
    }
  },
];

export const t2vModels = _t2vModelsAll.filter((m) => m.id.startsWith("seedance-2.0-"));

// ── Image-to-video ────────────────────────────────────────────────────────────
export const _i2vModelsAll = [
  {
    id: "seedance-2.0-i2v",
    name: "Seedance 2.0 (фото→видео)",
    apiId: "seedance-pro-i2v",
    platform: "unified",
    provider: "ark",
    imageField: "image_url",
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "adaptive", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "1080p", "480p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" },
      seed: { type: "integer", title: "Seed (для повторения результатов)", default: -1 },
      return_last_frame: { type: "boolean", title: "Возвращать последний кадр", default: false }
    }
  },
  {
    id: "seedance-2.0-mini-i2v",
    name: "Seedance 2.0 Mini (фото→видео)",
    apiId: "doubao-seedance-2-0-mini-260615",
    platform: "unified",
    provider: "ark",
    imageField: "image_url",
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "adaptive", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "480p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "seedance-2.0-fast-i2v",
    name: "Seedance 2.0 Fast (фото→видео)",
    apiId: "seedance-pro-i2v-fast",
    platform: "unified",
    provider: "ark",
    imageField: "image_url",
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "adaptive", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "480p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" }
    }
  },
];

export const i2vModels = _i2vModelsAll.filter((m) => m.id.startsWith("seedance-2.0-"));

// ── Video-to-video ────────────────────────────────────────────────────────────
export const v2vModels = [];

// ── LipSync ───────────────────────────────────────────────────────────────────
export const lipsyncModels = [];
export const imageLipSyncModels = [];
export const videoLipSyncModels = [];

// ── Audio (TTS) via POST /v1/audio/speech ─────────────────────────────────────
export const _audioModelsAll = [
  {
    id: "gpt-4o-mini-tts",
    name: "GPT-4o Mini TTS",
    apiId: "gpt-4o-mini-tts",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "sage", "ash"], default: "alloy" }
    }
  },
  {
    id: "tts-1-hd",
    name: "TTS HD",
    apiId: "tts-1-hd",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" }
    }
  },
  {
    id: "tts-1",
    name: "TTS Standard",
    apiId: "tts-1",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" }
    }
  }
];

// ── Default exports for backwards compatibility ──────────────────────────────
export const t2iModels = _t2iModelsAll;
export const i2iModels = _i2iModelsAll;
export const audioModels = _audioModelsAll;

// ── Studio getters ────────────────────────────────────────────────────────────
export const getT2iModels = (isAdmin) => t2iModels;
export const getI2iModels = (isAdmin) => i2iModels;
export const getT2vModels = (isAdmin) => t2vModels;
export const getI2vModels = (isAdmin) => i2vModels;
export const getV2vModels = (isAdmin) => v2vModels;

// ── Getter helpers ────────────────────────────────────────────────────────────
export const getModelById        = (id) => t2iModels.find(m => m.id === id) || i2iModels.find(m => m.id === id);
export const getI2IModelById     = (id) => i2iModels.find(m => m.id === id);
export const getVideoModelById   = (id) => [...t2vModels, ...i2vModels].find(m => m.id === id);
export const getI2VModelById     = (id) => i2vModels.find(m => m.id === id);
export const getV2VModelById     = (id) => v2vModels.find(m => m.id === id);
export const getLipSyncModelById = (id) => lipsyncModels.find(m => m.id === id);
export const getAudioModelById   = (id) => audioModels.find(m => m.id === id);

// ── ImageStudio helpers ───────────────────────────────────────────────────────
export const getAspectRatiosForModel = (id) => {
  const m = t2iModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || [];
};
export const getResolutionsForModel = (id) => {
  const m = t2iModels.find(x => x.id === id);
  return m?.inputs?.size?.enum || [];
};
export const getQualityFieldForModel = (id) => {
  const m = t2iModels.find(x => x.id === id);
  if (m?.inputs?.size?.enum) return 'size';
  return null;
};
export const getAspectRatiosForI2IModel = (id) => {
  const m = i2iModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || [];
};
export const getResolutionsForI2IModel = (id) => {
  const m = i2iModels.find(x => x.id === id);
  return m?.inputs?.size?.enum || [];
};
export const getQualityFieldForI2IModel = (id) => {
  const m = i2iModels.find(x => x.id === id);
  if (m?.inputs?.size?.enum) return 'size';
  return null;
};

// Generic input-option helpers — work for both t2i and i2i models. Used by
// ImageStudio to render the extra parameter dropdowns (quality, format,
// background, moderation) exactly like the memefast playground.
export const getImageInputOptions = (id, field) => {
  const m = t2iModels.find(x => x.id === id) || i2iModels.find(x => x.id === id);
  return m?.inputs?.[field]?.enum || [];
};
export const getImageInputDefault = (id, field) => {
  const m = t2iModels.find(x => x.id === id) || i2iModels.find(x => x.id === id);
  return m?.inputs?.[field]?.default ?? null;
};

export const getMaxImagesForI2IModel    = (id) => {
  const m = i2iModels.find(x => x.id === id);
  return m?.maxImages || 1;
};
export const getEffectsForI2IModel      = (id) => [];
export const getDefaultEffectForI2IModel = (id) => null;

// ── VideoStudio helpers ───────────────────────────────────────────────────────
const VIDEO_RESOLUTIONS = ["720p", "1080p", "480p"];
const VIDEO_DURATIONS = [5, 10];

const isVeoModel = (m) => (m?.apiId || "").startsWith("veo");

const genericResolutions = (m) => {
  if (!m) return [];
  if (m.inputs?.resolution?.enum) return m.inputs.resolution.enum;
  if (m.platform === "unified" && !isVeoModel(m)) return VIDEO_RESOLUTIONS;
  return [];
};
const genericDurations = (m) => {
  if (!m) return [];
  if (m.inputs?.duration?.enum) return m.inputs.duration.enum;
  if ((m.platform === "unified" && !isVeoModel(m)) || m.platform === "sora") return VIDEO_DURATIONS;
  return [];
};

export const getAspectRatiosForVideoModel = (id) => {
  const m = t2vModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || ["16:9", "9:16", "1:1"];
};
export const getDurationsForModel = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return genericDurations(m);
};
export const getResolutionsForVideoModel = (id) => {
  return genericResolutions(t2vModels.find(x => x.id === id));
};
export const getAspectRatiosForI2VModel = (id) => {
  const m = i2vModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || ["16:9", "9:16", "1:1"];
};
export const getDurationsForI2VModel = (id) => {
  return genericDurations(i2vModels.find(x => x.id === id));
};
export const getResolutionsForI2VModel = (id) => {
  return genericResolutions(i2vModels.find(x => x.id === id));
};
export const getEffectsForI2VModel       = (id) => [];
export const getDefaultEffectForI2VModel = (id) => null;
export const getModesForModel            = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.mode?.enum || [];
};

// ── LipSync helpers ───────────────────────────────────────────────────────────
export const getResolutionsForLipSyncModel = (id) => [];
