// Memefast models catalog
// platform: "unified" → POST /v1/video/create + GET /v1/video/task/{id}
// platform: "tokengo" → POST /v1/media/generate (TokenGo async video)
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

import {
  GEMINI_IMAGE_ASPECT_RATIOS,
  GEMINI_IMAGE_SIZE_PRESETS,
  GPT_IMAGE_ASPECT_RATIOS,
  GPT_IMAGE_SIZE_PRESETS,
  SEEDREAM_IMAGE_ASPECT_RATIOS,
  SEEDREAM_IMAGE_SIZE_PRESETS,
} from "./imageModelSizing.js";

// ── Extended aspect-ratio sets for newer TokenGo models ──────────────────────
const GPT_IMAGE_26_ASPECT_RATIOS = ["1:1", "auto", "3:2", "2:3", "4:3", "3:4", "5:4", "4:5", "16:9", "9:16", "21:9", "9:21"];
const SEEDREAM_55_ASPECT_RATIOS  = ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "5:4", "4:5", "21:9"];
const SEEDREAM_50_ASPECT_RATIOS  = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9", "2:1", "1:2", "3:1", "1:3", "9:21"];

// ── Image generation (text → image) via POST /v1/images/generations ──────────
export const _t2iModelsAll = [
  // ── Legacy memefast / ARK models (kept for backward compatibility) ──────────
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GPT_IMAGE_SIZE_PRESETS, default: "1K" },
      quality: { enum: ["auto", "high", "medium", "low"], default: "auto" },
      format: { enum: ["jpeg", "png", "webp"], default: "jpeg" },
      background: { enum: ["auto", "opaque"], default: "auto" },
      moderation: { enum: ["auto", "low"], default: "auto" },
    },
  },
  {
    id: "seedream-5.0-lite",
    name: "Seedream 5.0 Lite",
    apiId: "doubao-seedream-5-0-260128",
    provider: "ark",
    imageSizing: "seedream",
    supportsImageSet: true,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: SEEDREAM_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: SEEDREAM_IMAGE_SIZE_PRESETS, default: "2K" },
      format: { enum: ["jpeg", "png"], default: "jpeg" },
    },
  },
  {
    id: "gemini-3.1-flash-image-preview",
    name: "Nano Banana 2",
    apiId: "gemini-3.1-flash-image-preview",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
    },
  },
  {
    id: "gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    apiId: "gemini-3-pro-image-preview",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
    },
  },

  // ── GPT Image 2.x (TokenGo direct) ─────────────────────────────────────────
  {
    id: "gpt-image-2.6-sunburst",
    name: "GPT Image 2.6 Sunburst",
    apiId: "gpt-image-2.6-sunburst",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_26_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1K", "2K", "4K"], default: "1K" },
      quality: { enum: ["low", "medium", "high", "xhigh", "max"], default: "low" },
      output_format: { enum: ["jpeg", "png", "gif", "svg"], default: "jpeg" },
      moderation: { enum: ["low", "auto"], default: "low" },
    },
  },
  {
    id: "gpt-image-2.6-flare",
    name: "GPT Image 2.6 Flare",
    apiId: "gpt-image-2.6-flare",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_26_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1K", "2K", "4K"], default: "1K" },
      quality: { enum: ["low", "medium", "high", "xhigh", "max"], default: "low" },
      output_format: { enum: ["jpeg", "png", "gif", "svg"], default: "jpeg" },
      moderation: { enum: ["low", "auto"], default: "low" },
    },
  },
  {
    id: "gpt-image-2.5-sunburst",
    name: "GPT Image 2.5 Sunburst",
    apiId: "gpt-image-2.5-sunburst",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_26_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1K", "2K", "4K"], default: "4K" },
      quality: { enum: ["low", "medium", "high", "xhigh", "max"], default: "low" },
      output_format: { enum: ["jpeg", "png"], default: "jpeg" },
      moderation: { enum: ["low", "auto"], default: "low" },
    },
  },
  {
    id: "gpt-image-2.5-flare",
    name: "GPT Image 2.5 Flare",
    apiId: "gpt-image-2.5-flare",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_26_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1K", "2K", "4K"], default: "1K" },
      quality: { enum: ["low", "medium", "high", "xhigh", "max"], default: "low" },
      output_format: { enum: ["jpeg", "png"], default: "jpeg" },
      moderation: { enum: ["low", "auto"], default: "low" },
    },
  },
  {
    id: "gpt-image-2-official",
    name: "GPT Image 2 Official",
    apiId: "gpt-image-2-official",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GPT_IMAGE_SIZE_PRESETS, default: "1K" },
      quality: { enum: ["auto", "high", "medium", "low"], default: "auto" },
      format: { enum: ["jpeg", "png", "webp"], default: "jpeg" },
    },
  },

  // ── Gemini / Nano Banana (TokenGo direct) ───────────────────────────────────
  {
    id: "gemini-3.1-flash-image",
    name: "Nano Banana 2.1",
    apiId: "gemini-3.1-flash-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
    },
  },
  {
    id: "gemini-3-pro-image",
    name: "Nano Banana Pro+",
    apiId: "gemini-3-pro-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
    },
  },
  {
    id: "gemini-3.1-flash-lite-image",
    name: "Nano Banana Lite",
    apiId: "gemini-3.1-flash-lite-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
    },
  },
  {
    id: "gemini-nano-banana-2.1-image",
    name: "Nano Banana 2.1 (Ultra)",
    apiId: "gemini-nano-banana-2.1-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
    },
  },

  // ── Seedream 5.x/4.x (TokenGo direct) ──────────────────────────────────────
  {
    id: "doubao-seedream-5-5",
    name: "Seedream 5.5",
    apiId: "doubao-seedream-5-5",
    inputs: {
      prompt: { type: "string" },
      size: { enum: SEEDREAM_55_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["2k"], default: "2k" },
    },
  },
  {
    id: "doubao-seedream-5-0-pro",
    name: "Seedream 5.0 Pro",
    apiId: "doubao-seedream-5-0-pro",
    inputs: {
      prompt: { type: "string" },
      size: { enum: SEEDREAM_55_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1k", "2k"], default: "2k" },
    },
  },
  {
    id: "doubao-seedream-5-0",
    name: "Seedream 5.0",
    apiId: "doubao-seedream-5-0",
    inputs: {
      prompt: { type: "string" },
      size: { enum: SEEDREAM_50_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["2k", "4k"], default: "2k" },
    },
  },
  {
    id: "doubao-seedream-4-5",
    name: "Seedream 4.5",
    apiId: "doubao-seedream-4-5",
    inputs: {
      prompt: { type: "string" },
      size: { enum: SEEDREAM_50_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["2k", "4k"], default: "2k" },
    },
  },

  // ── MiniMax / Kling / Qwen image models ─────────────────────────────────────
  {
    id: "minimax-h3-image",
    name: "MiniMax H3 Image",
    apiId: "minimax-h3-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:1", "1:2"], default: "1:1" },
    },
  },
  {
    id: "kling-image-4.0",
    name: "Kling Image 4.0",
    apiId: "kling-image-4.0",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:1", "1:2"], default: "1:1" },
    },
  },
  {
    id: "kling-image-o3",
    name: "Kling Image O3",
    apiId: "kling-image-o3",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16"], default: "1:1" },
    },
  },
  {
    id: "qwen-image-3.0",
    name: "Qwen Image 3.0",
    apiId: "qwen-image-3.0",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:1", "1:2"], default: "1:1" },
    },
  },
  {
    id: "muse-image",
    name: "Muse Image",
    apiId: "muse-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16"], default: "1:1" },
    },
  },

  // ── Grok / Flux / WAN image models ──────────────────────────────────────────
  {
    id: "grok-imagine-image-2.0",
    name: "Grok Image 2.0",
    apiId: "grok-imagine-image-2.0",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16"], default: "1:1" },
    },
  },
  {
    id: "grok-imagine-image",
    name: "Grok Image",
    apiId: "grok-imagine-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16"], default: "1:1" },
    },
  },
  {
    id: "flux-3",
    name: "Flux 3",
    apiId: "flux-3",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"], default: "1:1" },
    },
  },
  {
    id: "flux-2",
    name: "Flux 2",
    apiId: "flux-2",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"], default: "1:1" },
    },
  },
  {
    id: "flux-kontext",
    name: "Flux Kontext",
    apiId: "flux-kontext",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16"], default: "1:1" },
    },
  },
  {
    id: "wan2.7-image",
    name: "WAN 2.7 Image",
    apiId: "wan2.7-image",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16"], default: "1:1" },
    },
  },

  // ── Midjourney ───────────────────────────────────────────────────────────────
  {
    id: "mj_imagine",
    name: "Midjourney Imagine",
    apiId: "mj_imagine",
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"], default: "1:1" },
    },
  },
];

// ── Image-to-image ────────────────────────────────────────────────────────────
export const _i2iModelsAll = [
  // Legacy / ARK models
  {
    id: "gpt-image-2-edit",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    editEndpoint: true,
    acceptsImage: true,
    maxImages: 16,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GPT_IMAGE_SIZE_PRESETS, default: "1K" },
      quality: { enum: ["auto", "high", "medium", "low"], default: "auto" },
      format: { enum: ["jpeg", "png", "webp"], default: "jpeg" },
      background: { enum: ["auto", "opaque"], default: "auto" },
      moderation: { enum: ["auto", "low"], default: "auto" },
    },
  },
  {
    id: "seedream-5.0-lite-edit",
    name: "Seedream 5.0 Lite",
    apiId: "doubao-seedream-5-0-260128",
    provider: "ark",
    imageSizing: "seedream",
    supportsImageSet: true,
    acceptsImage: true,
    maxImages: 14,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: SEEDREAM_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: SEEDREAM_IMAGE_SIZE_PRESETS, default: "2K" },
      format: { enum: ["jpeg", "png"], default: "jpeg" },
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
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
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
      aspect_ratio: { enum: GEMINI_IMAGE_ASPECT_RATIOS, default: "1:1" },
      imageSize: { enum: GEMINI_IMAGE_SIZE_PRESETS, default: "1K" },
    },
  },
  // TokenGo direct edit models
  {
    id: "gpt-image-2.6-sunburst-edit",
    name: "GPT Image 2.6 Sunburst",
    apiId: "gpt-image-2.6-sunburst",
    acceptsImage: true,
    maxImages: 16,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_26_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1K", "2K", "4K"], default: "1K" },
      quality: { enum: ["low", "medium", "high", "xhigh", "max"], default: "low" },
      output_format: { enum: ["jpeg", "png"], default: "jpeg" },
    },
  },
  {
    id: "gpt-image-2.5-sunburst-edit",
    name: "GPT Image 2.5 Sunburst",
    apiId: "gpt-image-2.5-sunburst",
    acceptsImage: true,
    maxImages: 16,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GPT_IMAGE_26_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1K", "2K", "4K"], default: "4K" },
      quality: { enum: ["low", "medium", "high", "xhigh", "max"], default: "low" },
      output_format: { enum: ["jpeg", "png"], default: "jpeg" },
    },
  },
  {
    id: "doubao-seedream-5-5-edit",
    name: "Seedream 5.5",
    apiId: "doubao-seedream-5-5",
    acceptsImage: true,
    maxImages: 10,
    inputs: {
      prompt: { type: "string" },
      size: { enum: SEEDREAM_55_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["2k"], default: "2k" },
    },
  },
  {
    id: "doubao-seedream-5-0-pro-edit",
    name: "Seedream 5.0 Pro",
    apiId: "doubao-seedream-5-0-pro",
    acceptsImage: true,
    maxImages: 10,
    inputs: {
      prompt: { type: "string" },
      size: { enum: SEEDREAM_55_ASPECT_RATIOS, default: "1:1" },
      resolution: { enum: ["1k", "2k"], default: "2k" },
    },
  },
  {
    id: "flux-kontext-edit",
    name: "Flux Kontext",
    apiId: "flux-kontext",
    acceptsImage: true,
    maxImages: 4,
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: ["1:1", "4:3", "3:4", "16:9", "9:16"], default: "1:1" },
    },
  },
];

// ── Text-to-video (TokenGo /v1/media/generate) ───────────────────────────────
export const _t2vModelsAll = [
  // ── ARK / Seedance legacy ────────────────────────────────────────────────────
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
      seed: { type: "integer", title: "Seed", default: -1 },
      return_last_frame: { type: "boolean", title: "Return last frame", default: false },
    },
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
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" },
    },
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
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" },
    },
  },

  // ── Seedance 2.5 (TokenGo direct) ───────────────────────────────────────────
  {
    id: "seedance-2-5",
    name: "Seedance 2.5",
    apiId: "seedance-2-5",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p", "1080p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["t2v", "first-frame", "reference", "first-last", "edit", "extend"], default: "t2v", title: "Mode", type: "string" },
    },
  },
  {
    id: "seedance-2-5-promo",
    name: "Seedance 2.5 Promo",
    apiId: "seedance-2-5-promo",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p", "1080p", "4k"], default: "480p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 29, 30], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["t2v", "first-frame", "reference", "first-last", "edit", "extend"], default: "t2v", title: "Mode", type: "string" },
    },
  },

  // ── Seedance 2.0 (TokenGo direct) ───────────────────────────────────────────
  {
    id: "seedance-2-0-official",
    name: "Seedance 2.0 Official",
    apiId: "seedance-2-0-official",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p", "1080p", "4k"], default: "480p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 7, 8, 9, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["t2v", "first-frame", "reference", "first-last", "edit", "extend"], default: "t2v", title: "Mode", type: "string" },
    },
  },
  {
    id: "seedance-2-0-promo",
    name: "Seedance 2.0 Promo",
    apiId: "seedance-2-0-promo",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "9:16", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p", "1080p", "4k"], default: "480p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], default: 4, title: "Duration (s)", type: "int" },
      mode: { enum: ["t2v", "first-frame", "reference", "first-last", "edit", "extend"], default: "t2v", title: "Mode", type: "string" },
    },
  },

  // ── Veo (Google) ─────────────────────────────────────────────────────────────
  {
    id: "veo-4-omni",
    name: "Veo 4 Omni",
    apiId: "veo-4-omni",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 6, 7, 8], default: 8, title: "Duration (s)", type: "int" },
    },
  },
  {
    id: "veo-3.1",
    name: "Veo 3.1",
    apiId: "veo-3.1",
    platform: "tokengo",
    acceptsImage: false,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 6, 7, 8], default: 8, title: "Duration (s)", type: "int" },
    },
  },

  // ── Kling ────────────────────────────────────────────────────────────────────
  {
    id: "kling-v4",
    name: "Kling v4",
    apiId: "kling-v4",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "1080p", "4k"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [3, 4, 5, 6, 7, 8, 9, 10, 15, 20], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame", "first-last", "reference"], default: "text-to-video", title: "Mode", type: "string" },
      quality: { enum: ["standard", "flash"], default: "standard", title: "Quality", type: "string" },
    },
  },
  {
    id: "kling-v3",
    name: "Kling v3",
    apiId: "kling-v3",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p", "1080p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame", "reference"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },
  {
    id: "kling-3.0-turbo",
    name: "Kling 3.0 Turbo",
    apiId: "kling-3.0-turbo",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },

  // ── MiniMax / Hailuo ─────────────────────────────────────────────────────────
  {
    id: "minimax-h3",
    name: "MiniMax H3",
    apiId: "minimax-h3",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["768p", "2k"], default: "2k", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 7, 8, 9, 10, 12, 15], default: 4, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame", "first-last", "reference"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },
  {
    id: "minimax-hailuo-2-3",
    name: "Hailuo 2.3",
    apiId: "minimax-hailuo-2-3",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 6, 7, 8, 9, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },

  // ── Grok / Omni ──────────────────────────────────────────────────────────────
  {
    id: "grok-imagine-1.5",
    name: "Grok Imagine 1.5",
    apiId: "grok-imagine-1.5",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p", "1080p"], default: "480p", title: "Resolution", type: "string" },
      duration: { enum: [4, 6, 8, 10, 12, 15], default: 4, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame", "reference", "first-last"], default: "first-frame", title: "Mode", type: "string" },
    },
  },
  {
    id: "grok-imagine-video",
    name: "Grok Imagine 1.0",
    apiId: "grok-imagine-video",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p"], default: "480p", title: "Resolution", type: "string" },
      duration: { enum: [3, 4, 5, 6, 8, 10, 12, 15], default: 3, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame", "reference", "extend"], default: "first-frame", title: "Mode", type: "string" },
    },
  },
  {
    id: "omni-flash-1-2",
    name: "Omni Flash 1.2",
    apiId: "omni-flash-1-2",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [3, 5, 7, 10], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },

  // ── Wan / Flux / PixVerse / Vidu ─────────────────────────────────────────────
  {
    id: "wan-3-0",
    name: "WAN 3.0",
    apiId: "wan-3-0",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    acceptsAudio: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p", "1080p"], default: "480p", title: "Resolution", type: "string" },
      duration: { enum: [4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30], default: 4, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame", "first-last", "reference"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },
  {
    id: "flux-3-video",
    name: "Flux 3 Video",
    apiId: "flux-3-video",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
    },
  },
  {
    id: "pixverse-c1",
    name: "PixVerse C1",
    apiId: "pixverse-c1",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["480p", "720p", "1080p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [3, 5, 8], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },
  {
    id: "pixverse-v6",
    name: "PixVerse v6",
    apiId: "pixverse-v6",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [3, 5, 8], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },
  {
    id: "muse-video",
    name: "Muse Video",
    apiId: "muse-video",
    platform: "tokengo",
    acceptsImage: true,
    acceptsVideo: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["720p"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 60], default: 10, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame", "first-last", "reference"], default: "reference", title: "Mode", type: "string" },
    },
  },
  {
    id: "viduq4",
    name: "Vidu Q4",
    apiId: "viduq4",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16"], default: "16:9", title: "Aspect Ratio", type: "string" },
      resolution: { enum: ["540p", "720p", "1080p", "2k", "4k"], default: "720p", title: "Resolution", type: "string" },
      duration: { enum: [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["first-frame", "reference"], default: "reference", title: "Mode", type: "string" },
    },
  },
  {
    id: "viduq3",
    name: "Vidu Q3",
    apiId: "viduq3",
    platform: "tokengo",
    acceptsImage: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [3, 5, 8], default: 5, title: "Duration (s)", type: "int" },
      mode: { enum: ["text-to-video", "first-frame"], default: "text-to-video", title: "Mode", type: "string" },
    },
  },
];

// t2vModels: all video models (legacy + TokenGo)
export const t2vModels = _t2vModelsAll;

// ── Image-to-video ────────────────────────────────────────────────────────────
export const _i2vModelsAll = [
  // Legacy ARK Seedance i2v
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
      seed: { type: "integer", title: "Seed", default: -1 },
      return_last_frame: { type: "boolean", title: "Return last frame", default: false },
    },
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
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" },
    },
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
      duration: { enum: [4, 5, 6, 8, 10, 12, 15], default: 5, title: "Duration (s)", type: "int" },
    },
  },
];

export const i2vModels = _i2vModelsAll;

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
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "sage", "ash"], default: "alloy" },
    },
  },
  {
    id: "tts-1-hd",
    name: "TTS HD",
    apiId: "tts-1-hd",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" },
    },
  },
  {
    id: "tts-1",
    name: "TTS Standard",
    apiId: "tts-1",
    inputs: {
      voice: { enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"], default: "alloy" },
    },
  },
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

export const getCharacterOrientationForModel = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.character_orientation?.enum || [];
};
export const getKeepOriginalSoundForModel = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.keep_original_sound?.enum || [];
};
export const getAudioModelById   = (id) => audioModels.find(m => m.id === id);

// ── ImageStudio helpers ───────────────────────────────────────────────────────
export const getAspectRatiosForModel = (id) => {
  const m = t2iModels.find(x => x.id === id);
  return m?.inputs?.aspect_ratio?.enum || m?.inputs?.size?.enum || [];
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
  return m?.inputs?.aspect_ratio?.enum || m?.inputs?.size?.enum || [];
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
// ImageStudio to render the extra parameter dropdowns.
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
