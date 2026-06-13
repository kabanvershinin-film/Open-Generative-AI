// Memefast models catalog
// platform: 'unified' → POST /v1/video/create + GET /v1/video/task/{id}
// platform: 'kling'   → POST /v1/kling/videos + GET /v1/kling/videos/{id}
// platform: 'luma'    → POST /v1/luma/generations + GET /v1/luma/generations/{id}
// platform: 'sora'    → POST /v1/video/generations + GET /v1/video/generations/{id}
// platform: 'minimax' → POST /v1/video_generation + GET /v1/query/video_generation?task_id=
// platform: 'runway'  → POST /v1/runway/image2video + GET /v1/runway/tasks/{id}

// ── Routing strategy (memefast model-name suffix) ────────────────────────────
// Appended to the model name as `model:suffix`. Lets the client pick a routing
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

// ── Image generation (text → image) via POST /v1/images/generations ──────────
export const t2iModels = [
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    inputs: {
      prompt: { type: "string" },
      size: { enum: ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "2048x1152", "3840x2160", "2160x3840"], default: "1024x1024" },
      quality: { enum: ["auto", "high", "medium", "low"], default: "auto" },
      format: { enum: ["jpeg", "png", "webp"], default: "jpeg" },
    },
  },
  {
    // Gemini Native API: POST /v1beta/models/gemini-3.1-flash-image-preview:generateContent
    // Routed in muapi via the /gemini.*image/ test → generateGeminiImage().
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
    // Nano Banana Pro — same native Gemini generateContent path as above.
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
export const i2iModels = [
  // editEndpoint: true → uses POST /v1/images/edits (multipart/form-data) instead of /generations
  {
    id: "gpt-image-2-edit",
    name: "GPT Image 2",
    apiId: "gpt-image-2",
    editEndpoint: true,
    inputs: {
      prompt: { type: "string" },
      size: { enum: ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "2048x1152", "3840x2160", "2160x3840"], default: "1024x1024" },
      quality: { enum: ["auto", "high", "medium", "low"], default: "auto" },
      format: { enum: ["jpeg", "png", "webp"], default: "jpeg" },
      background: { enum: ["auto", "transparent", "opaque"], default: "auto" },
      moderation: { enum: ["auto", "low"], default: "auto" },
    },
  },
  {
    // Gemini editing uses the same generateContent endpoint with inline reference
    // images (no editEndpoint flag → routed through generateImage → generateGeminiImage).
    id: "gemini-3.1-flash-image-preview-edit",
    name: "Nano Banana 2",
    apiId: "gemini-3.1-flash-image-preview",
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
    inputs: {
      prompt: { type: "string" },
      aspect_ratio: { enum: GEMINI_AR, default: "1:1" },
      imageSize: { enum: ["1K", "2K", "4K", "512"], default: "1K" },
    },
  },
];

// ── Text-to-video ────────────────────────────────────────────────────────────
const _t2vModelsAll = [
  // ── Seedance (Doubao) ──
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
  {
    id: "seedance-v1.5-pro-t2v",
    name: "Seedance 1.5 Pro",
    apiId: "seedance-v1.5-pro-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-v1.5-pro-t2v-fast",
    name: "Seedance 1.5 Pro Fast",
    apiId: "seedance-v1.5-pro-t2v-fast",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-lite-t2v",
    name: "Seedance Lite",
    apiId: "seedance-lite-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Google Veo (unified format) ──
  {
    id: "veo-3.1",
    name: "Google Veo 3.1",
    apiId: "veo3.1-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "veo-3.1-fast",
    name: "Google Veo 3.1 Fast",
    apiId: "veo3.1-fast-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "veo-3",
    name: "Google Veo 3",
    apiId: "veo-3",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Kling (unified format — new IDs) ──
  {
    id: "kling-v2.6-pro-t2v",
    name: "Kling v2.6 Pro",
    apiId: "kling-v2.6-pro-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-v2.5-turbo-pro-t2v",
    name: "Kling v2.5 Turbo Pro",
    apiId: "kling-v2.5-turbo-pro-t2v",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-o1-text-to-video",
    name: "Kling O1",
    apiId: "kling-o1-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Luma Dream Machine (platform-specific) ──
  {
    id: "luma-dream-machine",
    name: "Luma Dream Machine",
    apiId: "dream-machine",
    platform: "luma",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "4:3", "3:4", "21:9", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      loop: { type: "boolean", default: false, title: "Loop" }
    }
  },
  {
    id: "luma-photon",
    name: "Luma Photon",
    apiId: "photon-1",
    platform: "luma",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "4:3", "3:4", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Minimax Hailuo (unified format) ──
  {
    id: "minimax-hailuo",
    name: "Minimax Hailuo",
    apiId: "minimax-hailuo",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Sora (OpenAI video format) ──
  {
    id: "sora-2",
    name: "Sora 2",
    apiId: "openai-sora-2-text-to-video",
    platform: "sora",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10, 20], default: 10, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "sora",
    name: "Sora",
    apiId: "openai-sora",
    platform: "sora",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  // ── Wan (unified format) ──
  {
    id: "wan2.5-text-to-video",
    name: "Wan 2.5 T2V",
    apiId: "wan2.5-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "wan2.6-text-to-video",
    name: "Wan 2.6 T2V",
    apiId: "wan2.6-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Grok video (unified format) ──
  {
    id: "grok-imagine-text-to-video",
    name: "Grok Imagine",
    apiId: "grok-imagine-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Pixverse (unified format) ──
  {
    id: "pixverse-v5.5",
    name: "Pixverse V5.5",
    apiId: "pixverse-v5.5",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1", "4:3", "3:4"], default: "16:9", title: "Aspect Ratio", type: "string" },
      duration: { enum: [4, 8], default: 4, title: "Duration (s)", type: "int" }
    }
  },
  // ── Hunyuan (unified format) ──
  {
    id: "hunyuan-text-to-video",
    name: "Hunyuan T2V",
    apiId: "hunyuan-text-to-video",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
      id: "hunyuan-fast-text-to-video",
      name: "Hunyuan Fast T2V",
      apiId: "hunyuan-fast-text-to-video",
      platform: "unified",
      inputs: {
        prompt: { type: "string", title: "Prompt" },
        aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
      }
    },
    // ── Omni Flash (ElSpy AI) ──
    {
      id: "omni-flash-t2v",
      name: "Omni Flash",
      apiId: "omni-flash",
      platform: "elspy",
      acceptsImage: true,
      disabled: true,
      comingSoon: true,
      inputs: {
        prompt: { type: "string", title: "Prompt" },
        aspect_ratio: { enum: ["16:9", "9:16"], default: "16:9", title: "Aspect Ratio", type: "string" },
        duration: { enum: [6, 8, 10], default: 6, title: "Duration (s)", type: "int" },
        enhance_prompt: { type: "boolean", default: true, title: "Enhance Prompt" },
        enable_upsample: { type: "boolean", default: false, title: "Video Upsample" }
      }
    },
    // ── Kling-Motion Control V3 (ElSpy AI) ──
    {
      id: "kling-motion-control-v3",
      name: "Kling-Motion Control V3",
      apiId: "kling-motion-control-v3",
      platform: "elspy",
      acceptsImage: true,
      acceptsVideo: true,
      disabled: true,
      comingSoon: true,
      inputs: {
        prompt: { type: "string", title: "Prompt" },
        character_orientation: { enum: ["video", "image"], default: "video", title: "Character Orientation", type: "string" },
        keep_original_sound: { enum: ["yes", "no"], default: "no", title: "Keep Original Audio", type: "string" },
        mode: { enum: ["std", "pro"], default: "std", title: "Generation Mode", type: "string" }
      }
    },
    // ── WAN 2.1 (legacy, keep for backwards compat) ──
  {
    id: "wan2.1-t2v-14b",
    name: "WAN 2.1 T2V",
    apiId: "wan2.1-t2v-14b",
    platform: "unified",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
];

// Video Studio is limited to Seedance 2.0 / 2.0 Fast only — keep just those.
export const t2vModels = _t2vModelsAll.filter((m) => m.id.startsWith("seedance-2.0-") || m.id.startsWith("omni-flash-") || m.id.startsWith("kling-motion-control-"));

// ── Image-to-video ────────────────────────────────────────────────────────────
const _i2vModelsAll = [
  // ── Seedance i2v ──
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
  {
    id: "seedance-v1.5-pro-i2v",
    name: "Seedance 1.5 Pro (фото→видео)",
    apiId: "seedance-v1.5-pro-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "seedance-lite-i2v",
    name: "Seedance Lite (фото→видео)",
    apiId: "seedance-lite-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Veo i2v ──
  {
    id: "veo-3.1-i2v",
    name: "Google Veo 3.1 (фото→видео)",
    apiId: "veo3.1-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  {
    id: "veo-3.1-fast-i2v",
    name: "Google Veo 3.1 Fast (фото→видео)",
    apiId: "veo3.1-fast-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Kling i2v (unified new IDs) ──
  {
    id: "kling-v2.6-pro-i2v",
    name: "Kling v2.6 Pro (фото→видео)",
    apiId: "kling-v2.6-pro-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-v2.5-turbo-pro-i2v",
    name: "Kling v2.5 Turbo Pro (фото→видео)",
    apiId: "kling-v2.5-turbo-pro-i2v",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" }
    }
  },
  {
    id: "kling-o1-image-to-video",
    name: "Kling O1 (фото→видео)",
    apiId: "kling-o1-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" }
    }
  },
  // ── Luma i2v (platform-specific) ──
  {
    id: "luma-dream-machine-i2v",
    name: "Luma Dream Machine (фото→видео)",
    apiId: "dream-machine",
    platform: "luma",
    imageField: "keyframes",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "4:3", "3:4", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Runway (image-to-video only) ──
  {
    id: "runway-gen4-i2v",
    name: "Runway Gen-4 (фото→видео)",
    apiId: "gen4_turbo",
    platform: "runway",
    imageField: "promptImage",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      duration: { enum: [5, 10], default: 5, title: "Duration (s)", type: "int" },
      ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Ratio", type: "string" }
    }
  },
  // ── Hunyuan i2v ──
  {
    id: "hunyuan-image-to-video",
    name: "Hunyuan (фото→видео)",
    apiId: "hunyuan-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Wan i2v ──
  {
    id: "wan2.5-image-to-video",
    name: "Wan 2.5 (фото→видео)",
    apiId: "wan2.5-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Grok i2v ──
  {
    id: "grok-imagine-image-to-video",
    name: "Grok Imagine (фото→видео)",
    apiId: "grok-imagine-image-to-video",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: { enum: ["16:9", "9:16", "1:1"], default: "16:9", title: "Aspect Ratio", type: "string" }
    }
  },
  // ── Pixverse i2v (unified) ──
  {
    id: "pixverse-v5.5-i2v",
    name: "Pixverse V5.5 (фото→видео)",
    apiId: "pixverse-v5.5",
    platform: "unified",
    imageField: "image_url",
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      aspect_ratio: {
        enum: ["16:9", "9:16", "1:1", "4:3", "3:4"],
        default: "16:9", title: "Aspect Ratio", type: "string"
      },
      duration: { enum: [4, 8], default: 4, title: "Duration (s)", type: "int" }
    }
  },
  // ── Wan i2v (unified) ──
  {
      id: "wan2.1-i2v-14b",
      name: "WAN 2.1 (фото→видео)",
      apiId: "wan2.1-i2v-14b",
      platform: "unified",
      imageField: "image_url",
      inputs: {
        prompt: { type: "string", title: "Prompt" },
        aspect_ratio: {
          enum: ["16:9", "9:16", "1:1"],
          default: "16:9", title: "Aspect Ratio", type: "string"
        }
      }
    },
    // ── Omni Flash I2V (ElSpy AI) ──
    {
      id: "omni-flash-i2v",
      name: "Omni Flash (фото→видео)",
      apiId: "omni-flash",
      platform: "elspy",
      imageField: "images",
      acceptsImage: true,
      disabled: true,
      comingSoon: true,
      inputs: {
        prompt: { type: "string", title: "Prompt" },
        aspect_ratio: { enum: ["16:9", "9:16"], default: "16:9", title: "Aspect Ratio", type: "string" },
        duration: { enum: [6, 8, 10], default: 6, title: "Duration (s)", type: "int" },
        enhance_prompt: { type: "boolean", default: true, title: "Enhance Prompt" },
        enable_upsample: { type: "boolean", default: false, title: "Video Upsample" }
      }
    }
];

export const i2vModels = _i2vModelsAll.filter((m) => m.id.startsWith("seedance-2.0-") || m.id.startsWith("omni-flash-"));

// ── Video-to-video ────────────────────────────────────────────────────────────
export const v2vModels = [
  {
    id: "kling-motion-control-v3",
    name: "Kling-Motion Control V3",
    apiId: "kling-motion-control-v3",
    platform: "elspy",
    imageField: "image_url",
    hasPrompt: true,
    promptRequired: true,
    acceptsImage: true,
    acceptsVideo: true,
    disabled: true,
    comingSoon: true,
    inputs: {
      prompt: { type: "string", title: "Prompt" },
      character_orientation: { enum: ["video", "image"], default: "video", title: "Character Orientation", type: "string" },
      keep_original_sound: { enum: ["yes", "no"], default: "no", title: "Keep Original Sound", type: "string" },
      mode: { enum: ["std", "pro"], default: "std", title: "Generation Mode", type: "string" }
    }
  }
];

// ── LipSync ───────────────────────────────────────────────────────────────────
export const lipsyncModels = [];
export const imageLipSyncModels = [];
export const videoLipSyncModels = [];

// ── Audio Studio models ───────────────────────────────────────────────────────
const VOICE_STYLES = ["neutral", "warm", "cinematic", "bright", "soft"];
const VOCAL_GENDERS = ["male", "female", "mixed"];
const AUDIO_QUALITY = ["draft", "standard", "high"];

const audioModelsCatalog = [
  {
    id: "suno-create-music",
    name: "Suno Create Music",
    description: "Создание нового музыкального трека по текстовому запросу с контролем стиля, вокала и общей структуры.",
    apiId: "suno-create-music",
    required: ["prompt"],
    inputs: {
      prompt: { type: "string", title: "Prompt", description: "Опишите настроение, жанр, инструменты, темп и общую идею трека." },
      title: { type: "string", title: "Track Title", placeholder: "Neon Hearts" },
      style: { type: "string", title: "Style / Genre", placeholder: "Cinematic synthwave with emotional female vocals" },
      instrumental: { type: "boolean", title: "Instrumental Only", description: "Отключить вокал и оставить только инструментальную аранжировку.", default: true },
      vocal_gender: { type: "string", title: "Vocal Gender", enum: VOCAL_GENDERS, default: "male" },
      model: { type: "string", title: "Generation Model", enum: ["V4", "V5"], default: "V5" },
      style_weight: { type: "float", title: "Style Weight", minValue: 0, maxValue: 1, step: 0.05, default: 0.3, description: "Насколько строго придерживаться указанного стиля." },
      weirdness_constraint: { type: "float", title: "Creativity", minValue: 0, maxValue: 1, step: 0.05, default: 0.15, description: "Больше значения дают более смелые и необычные аранжировки." },
      audio_weight: { type: "float", title: "Audio Weight", minValue: 0, maxValue: 1, step: 0.05, default: 0, description: "Баланс между текстовым описанием и аудио-референсом, если он есть." },
      negative_tags: { type: "string", title: "Negative Tags", placeholder: "low quality, distortion, crowd noise" },
    },
  },
  {
    id: "suno-remix-music",
    name: "Suno Remix Music",
    description: "Ремикс готового трека с текстовым направлением, меняя энергетику, жанр и подачу.",
    apiId: "suno-remix-music",
    required: ["audio_url", "prompt"],
    inputs: {
      audio_url: { type: "string", field: "audio", title: "Source Audio", description: "Исходный трек для ремикса." },
      prompt: { type: "string", title: "Remix Prompt", description: "Опишите, как должен измениться трек после ремикса." },
      remix_strength: { type: "float", title: "Remix Strength", minValue: 0, maxValue: 1, step: 0.05, default: 0.55, description: "Чем выше значение, тем сильнее отличие от исходного трека." },
      preserve_vocals: { type: "boolean", title: "Preserve Vocals", description: "Стараться сохранить оригинальные вокальные партии.", default: true },
      quality: { type: "string", title: "Quality", enum: AUDIO_QUALITY, default: "standard" },
    },
  },
  {
    id: "suno-extend-music",
    name: "Suno Extend Music",
    description: "Продолжение существующего трека с контролем точки входа и желаемого настроения.",
    apiId: "suno-extend-music",
    required: ["audio_url"],
    inputs: {
      audio_url: { type: "string", field: "audio", title: "Track To Extend", description: "Аудио, которое нужно продолжить." },
      prompt: { type: "string", title: "Continuation Prompt", description: "Опишите, куда должен развиваться трек дальше." },
      continue_at: { type: "float", title: "Continue At (s)", minValue: 0, maxValue: 120, step: 1, default: 30, description: "Секунда, с которой начинается продолжение." },
      extension_length: { type: "int", title: "Extension Length (s)", minValue: 5, maxValue: 90, step: 1, default: 20 },
      instrumental: { type: "boolean", title: "Keep Instrumental", default: false },
    },
  },
  {
    id: "suno-generate-sounds",
    name: "Suno Generate Sounds",
    description: "Генерация коротких саунд-дизайн клипов, эффектов и фоновых текстур по описанию.",
    apiId: "suno-generate-sounds",
    required: ["prompt"],
    inputs: {
      prompt: { type: "string", title: "Sound Prompt", description: "Опишите звук, текстуру или атмосферу, которую нужно создать." },
      duration: { type: "int", title: "Duration (s)", minValue: 1, maxValue: 30, step: 1, default: 8 },
      seamless_loop: { type: "boolean", title: "Loop Friendly", description: "Стараться сделать результат пригодным для зацикливания.", default: false },
      intensity: { type: "string", title: "Intensity", enum: ["low", "medium", "high"], default: "medium" },
    },
  },
  {
    id: "suno-add-vocals",
    name: "Suno Add Vocals",
    description: "Добавление вокальной партии поверх существующей инструментальной основы.",
    apiId: "suno-add-vocals",
    required: ["audio_url", "prompt"],
    inputs: {
      audio_url: { type: "string", field: "audio", title: "Instrumental Track", description: "Инструментал, на который будет наложен вокал." },
      prompt: { type: "string", title: "Lyrics / Vocal Prompt", description: "Текст, тема и подача для вокала." },
      vocal_gender: { type: "string", title: "Vocal Gender", enum: VOCAL_GENDERS, default: "female" },
      vocal_style: { type: "string", title: "Vocal Style", enum: VOICE_STYLES, default: "cinematic" },
      harmonies: { type: "boolean", title: "Add Harmonies", default: false },
    },
  },
  {
    id: "suno-generate-mashup",
    name: "Suno Generate Mashup",
    description: "Объединение нескольких аудио-референсов в новый mashup-трек.",
    apiId: "suno-generate-mashup",
    required: ["audios_list"],
    inputs: {
      audios_list: { type: "array", field: "audios_list", title: "Audio References", description: "Загрузите несколько треков для mashup.", maxItems: 2, items: { type: "string" } },
      prompt: { type: "string", title: "Mashup Direction", description: "Опишите, как нужно свести и смешать загруженные треки." },
      preserve_tempo: { type: "boolean", title: "Preserve Tempo", default: true },
      blend_strength: { type: "float", title: "Blend Strength", minValue: 0, maxValue: 1, step: 0.05, default: 0.5 },
    },
  },
  {
    id: "suno-add-instrumental",
    name: "Suno Add Instrumental",
    description: "Добавление новой инструментальной аранжировки поверх существующего материала.",
    apiId: "suno-add-instrumental",
    required: ["audio_url"],
    inputs: {
      audio_url: { type: "string", field: "audio", title: "Base Audio", description: "Основа, к которой будет добавлен инструментал." },
      prompt: { type: "string", title: "Instrumental Prompt", description: "Опишите инструменты, настроение и характер аранжировки." },
      instrumental_style: { type: "string", title: "Instrumental Style", enum: ["cinematic", "acoustic", "electronic", "orchestral"], default: "cinematic" },
      layer_intensity: { type: "float", title: "Layer Intensity", minValue: 0, maxValue: 1, step: 0.05, default: 0.45 },
    },
  },
  {
    id: "suno-voice-clone",
    name: "Suno Voice Clone",
    description: "Клонирование голоса по одному аудио-референсу с управлением подачей и скоростью.",
    apiId: "suno-voice-clone",
    required: ["audio_url", "prompt"],
    inputs: {
      audio_url: { type: "string", field: "audio", title: "Voice Reference", description: "Пример голоса для клонирования." },
      prompt: { type: "string", title: "Speech Text", description: "Текст, который должен быть озвучен клонированным голосом." },
      tone: { type: "string", title: "Tone", enum: ["natural", "dramatic", "friendly", "calm"], default: "natural" },
      speed: { type: "float", title: "Speed", minValue: 0.5, maxValue: 1.5, step: 0.05, default: 1 },
    },
  },
  {
    id: "minimax-voice-clone",
    name: "Minimax Voice Clone",
    description: "Голосовой клон MiniMax по аудио-референсу и текстовому запросу.",
    apiId: "minimax-voice-clone",
    required: ["audio_url", "prompt"],
    inputs: {
      audio_url: { type: "string", field: "audio", title: "Voice Sample", description: "Референс для клонирования голоса." },
      prompt: { type: "string", title: "Speech Text", description: "Текст для генерации речи." },
      speed: { type: "float", title: "Speed", minValue: 0.5, maxValue: 1.5, step: 0.05, default: 1 },
      voice_style: { type: "string", title: "Voice Style", enum: VOICE_STYLES, default: "neutral" },
    },
  },
  {
    id: "minimax-speech-2.6-hd",
    name: "Minimax Speech 2.6 HD",
    description: "Высококачественная speech-модель MiniMax для детализированной озвучки.",
    apiId: "minimax-speech-2.6-hd",
    required: ["prompt"],
    inputs: {
      prompt: { type: "string", title: "Speech Text", description: "Текст для озвучивания." },
      voice: { type: "string", title: "Voice", enum: ["alloy", "nova", "sage", "onyx"], default: "alloy" },
      emotion: { type: "string", title: "Emotion", enum: ["neutral", "happy", "serious", "sad"], default: "neutral" },
      speed: { type: "float", title: "Speed", minValue: 0.5, maxValue: 2, step: 0.05, default: 1 },
    },
  },
  {
    id: "minimax-speech-2.6-turbo",
    name: "Minimax Speech 2.6 Turbo",
    description: "Быстрая speech-модель MiniMax для оперативной генерации речи.",
    apiId: "minimax-speech-2.6-turbo",
    required: ["prompt"],
    inputs: {
      prompt: { type: "string", title: "Speech Text", description: "Текст для озвучивания." },
      voice: { type: "string", title: "Voice", enum: ["alloy", "nova", "sage", "onyx"], default: "alloy" },
      emotion: { type: "string", title: "Emotion", enum: ["neutral", "happy", "serious", "sad"], default: "neutral" },
      speed: { type: "float", title: "Speed", minValue: 0.5, maxValue: 2, step: 0.05, default: 1 },
    },
  },
  {
    id: "mmaudio-v2-text-to-audio",
    name: "MMAudio V2 Text To Audio",
    description: "Генерация атмосферного аудио и sound design по текстовому описанию.",
    apiId: "mmaudio-v2-text-to-audio",
    required: ["prompt"],
    inputs: {
      prompt: { type: "string", title: "Prompt", description: "Опишите сцену, атмосферу, текстуру и характер звучания." },
      duration: { type: "int", title: "Duration (s)", minValue: 1, maxValue: 30, step: 1, default: 10 },
      guidance_scale: { type: "float", title: "Guidance", minValue: 1, maxValue: 10, step: 0.5, default: 5 },
      negative_prompt: { type: "string", title: "Negative Prompt", placeholder: "harsh clipping, distortion, crowd noise" },
    },
  },
];

export const studioVisibleAudioModels = [
  "suno-create-music",
  "suno-remix-music",
  "suno-extend-music",
  "suno-generate-sounds",
  "suno-add-vocals",
  "suno-generate-mashup",
  "suno-add-instrumental",
  "suno-voice-clone",
  "minimax-voice-clone",
  "minimax-speech-2.6-hd",
  "minimax-speech-2.6-turbo",
  "mmaudio-v2-text-to-audio",
];

export const audioModels = audioModelsCatalog.filter((m) => studioVisibleAudioModels.includes(m.id));

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
  return m?.inputs?.quality?.enum ? 'quality' : null;
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
  return m?.inputs?.quality?.enum ? 'quality' : null;
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

export const getMaxImagesForI2IModel    = (id) => 1;
export const getEffectsForI2IModel      = (id) => [];
export const getDefaultEffectForI2IModel = (id) => null;

// ── VideoStudio helpers ───────────────────────────────────────────────────────
// Generic capabilities for video models. The unified /v1/video/create endpoint
// forwards `resolution` and `duration`; the sora endpoint forwards `duration`.
// Veo (fixed length / resolution baked into the model id), Luma and Runway are
// excluded from the generic controls.
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

export const getCharacterOrientationForModel = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.character_orientation?.enum || [];
};

export const getKeepOriginalSoundForModel = (id) => {
  const m = [...t2vModels, ...i2vModels].find(x => x.id === id);
  return m?.inputs?.keep_original_sound?.enum || [];
};

// ── LipSync helpers ───────────────────────────────────────────────────────────
export const getResolutionsForLipSyncModel = (id) => [];
