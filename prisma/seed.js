const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Plans
    await prisma.plan.upsert({ where: { code: 'basic' },    update: {}, create: { code: 'basic',    name: 'Базовая',    priceRub: 100000, credits: 2000,  durationDays: 30, sortOrder: 1 } });
    await prisma.plan.upsert({ where: { code: 'extended' }, update: {}, create: { code: 'extended', name: 'Расширенная', priceRub: 300000, credits: 6000,  durationDays: 30, sortOrder: 2 } });
    await prisma.plan.upsert({ where: { code: 'studio' },   update: {}, create: { code: 'studio',   name: 'Студийная',  priceRub: 500000, credits: 10000, durationDays: 30, sortOrder: 3 } });

    // Replace all AI models with the full TokenGo catalog (https://tokengo.love)
    await prisma.aiModel.deleteMany({});

    const models = [
        // ── CHAT models (sortOrder 1–99) ─────────────────────────────────────────
        // GPT series
        { key: 'gpt-6.2-astra',           name: 'GPT 6.2 Astra',          mediaType: 'text', creditsPerUnit: 10, sortOrder: 1  },
        { key: 'gpt-6.2-sol',             name: 'GPT 6.2 Sol',             mediaType: 'text', creditsPerUnit: 10, sortOrder: 2  },
        { key: 'gpt-6.1-terra',           name: 'GPT 6.1 Terra',           mediaType: 'text', creditsPerUnit: 8,  sortOrder: 3  },
        { key: 'gpt-6.1-sol',             name: 'GPT 6.1 Sol',             mediaType: 'text', creditsPerUnit: 8,  sortOrder: 4  },
        { key: 'gpt-6-astra',             name: 'GPT 6 Astra',             mediaType: 'text', creditsPerUnit: 8,  sortOrder: 5  },
        { key: 'gpt-6-sol',               name: 'GPT 6 Sol',               mediaType: 'text', creditsPerUnit: 8,  sortOrder: 6  },
        { key: 'gpt-6-luna',              name: 'GPT 6 Luna',              mediaType: 'text', creditsPerUnit: 6,  sortOrder: 7  },
        { key: 'gpt-5.6-sol',             name: 'GPT 5.6 Sol',             mediaType: 'text', creditsPerUnit: 6,  sortOrder: 8  },
        { key: 'gpt-5.6-terra',           name: 'GPT 5.6 Terra',           mediaType: 'text', creditsPerUnit: 5,  sortOrder: 9  },
        { key: 'gpt-5.6-luna',            name: 'GPT 5.6 Luna',            mediaType: 'text', creditsPerUnit: 5,  sortOrder: 10 },
        { key: 'gpt-5.5',                 name: 'GPT 5.5',                 mediaType: 'text', creditsPerUnit: 4,  sortOrder: 11 },
        { key: 'gpt-5.4',                 name: 'GPT 5.4',                 mediaType: 'text', creditsPerUnit: 3,  sortOrder: 12 },
        { key: 'gpt-5.4-mini',            name: 'GPT 5.4 Mini',            mediaType: 'text', creditsPerUnit: 2,  sortOrder: 13 },
        { key: 'gpt-5.4-nano',            name: 'GPT 5.4 Nano',            mediaType: 'text', creditsPerUnit: 1,  sortOrder: 14 },
        { key: 'gpt-5.3-codex',           name: 'GPT 5.3 Codex',           mediaType: 'text', creditsPerUnit: 3,  sortOrder: 15 },
        { key: 'codex-auto-review',        name: 'Codex Auto Review',       mediaType: 'text', creditsPerUnit: 2,  sortOrder: 16 },
        // Claude series
        { key: 'claude-opus-5-5',         name: 'Claude Opus 5.5',         mediaType: 'text', creditsPerUnit: 10, sortOrder: 20 },
        { key: 'claude-opus-5',           name: 'Claude Opus 5',           mediaType: 'text', creditsPerUnit: 8,  sortOrder: 21 },
        { key: 'claude-opus-4-8',         name: 'Claude Opus 4.8',         mediaType: 'text', creditsPerUnit: 6,  sortOrder: 22 },
        { key: 'claude-opus-4-7',         name: 'Claude Opus 4.7',         mediaType: 'text', creditsPerUnit: 6,  sortOrder: 23 },
        { key: 'claude-opus-4-6',         name: 'Claude Opus 4.6',         mediaType: 'text', creditsPerUnit: 5,  sortOrder: 24 },
        { key: 'claude-sonnet-5-5',       name: 'Claude Sonnet 5.5',       mediaType: 'text', creditsPerUnit: 5,  sortOrder: 25 },
        { key: 'claude-sonnet-5',         name: 'Claude Sonnet 5',         mediaType: 'text', creditsPerUnit: 4,  sortOrder: 26 },
        { key: 'claude-sonnet-4-6',       name: 'Claude Sonnet 4.6',       mediaType: 'text', creditsPerUnit: 3,  sortOrder: 27 },
        { key: 'claude-fable-5-2',        name: 'Claude Fable 5.2',        mediaType: 'text', creditsPerUnit: 4,  sortOrder: 28 },
        { key: 'claude-fable-5-1',        name: 'Claude Fable 5.1',        mediaType: 'text', creditsPerUnit: 3,  sortOrder: 29 },
        { key: 'claude-fable-5',          name: 'Claude Fable 5',          mediaType: 'text', creditsPerUnit: 3,  sortOrder: 30 },
        { key: 'claude-haiku-5-5',        name: 'Claude Haiku 5.5',        mediaType: 'text', creditsPerUnit: 2,  sortOrder: 31 },
        { key: 'claude-haiku-4-5',        name: 'Claude Haiku 4.5',        mediaType: 'text', creditsPerUnit: 1,  sortOrder: 32 },
        // Gemini series
        { key: 'gemini-4-argon',          name: 'Gemini 4 Argon',          mediaType: 'text', creditsPerUnit: 8,  sortOrder: 40 },
        { key: 'gemini-4-carbon',         name: 'Gemini 4 Carbon',         mediaType: 'text', creditsPerUnit: 8,  sortOrder: 41 },
        { key: 'gemini-4-hydrogen',       name: 'Gemini 4 Hydrogen',       mediaType: 'text', creditsPerUnit: 6,  sortOrder: 42 },
        { key: 'gemini-4-neon',           name: 'Gemini 4 Neon',           mediaType: 'text', creditsPerUnit: 6,  sortOrder: 43 },
        { key: 'gemini-3.8-flash',        name: 'Gemini 3.8 Flash',        mediaType: 'text', creditsPerUnit: 2,  sortOrder: 44 },
        { key: 'gemini-3.7-flash',        name: 'Gemini 3.7 Flash',        mediaType: 'text', creditsPerUnit: 2,  sortOrder: 45 },
        { key: 'gemini-3.6-flash',        name: 'Gemini 3.6 Flash',        mediaType: 'text', creditsPerUnit: 2,  sortOrder: 46 },
        { key: 'gemini-3.5-flash',        name: 'Gemini 3.5 Flash',        mediaType: 'text', creditsPerUnit: 1,  sortOrder: 47 },
        { key: 'gemini-3.5-flash-lite',   name: 'Gemini 3.5 Flash Lite',   mediaType: 'text', creditsPerUnit: 1,  sortOrder: 48 },
        { key: 'gemini-3.1-pro',          name: 'Gemini 3.1 Pro',          mediaType: 'text', creditsPerUnit: 4,  sortOrder: 49 },
        { key: 'gemini-3.1-flash-lite',   name: 'Gemini 3.1 Flash Lite',   mediaType: 'text', creditsPerUnit: 1,  sortOrder: 50 },
        { key: 'gemini-3-pro',            name: 'Gemini 3 Pro',            mediaType: 'text', creditsPerUnit: 3,  sortOrder: 51 },
        { key: 'gemini-3-flash',          name: 'Gemini 3 Flash',          mediaType: 'text', creditsPerUnit: 1,  sortOrder: 52 },
        // Grok series
        { key: 'grok-4.7',               name: 'Grok 4.7',                mediaType: 'text', creditsPerUnit: 6,  sortOrder: 55 },
        { key: 'grok-4.6',               name: 'Grok 4.6',                mediaType: 'text', creditsPerUnit: 5,  sortOrder: 56 },
        { key: 'grok-4.5',               name: 'Grok 4.5',                mediaType: 'text', creditsPerUnit: 4,  sortOrder: 57 },
        { key: 'grok-4-20-non-reasoning', name: 'Grok 4 (Non Reasoning)', mediaType: 'text', creditsPerUnit: 3,  sortOrder: 58 },
        // DeepSeek series
        { key: 'deepseek-v4.1-flash',     name: 'DeepSeek V4.1 Flash',     mediaType: 'text', creditsPerUnit: 1,  sortOrder: 60 },
        { key: 'deepseek-v4.1-flash-1017',name: 'DeepSeek V4.1 Flash 1017',mediaType: 'text', creditsPerUnit: 1,  sortOrder: 61 },
        { key: 'deepseek-v4-flash',       name: 'DeepSeek V4 Flash',       mediaType: 'text', creditsPerUnit: 1,  sortOrder: 62 },
        { key: 'deepseek-v4-pro',         name: 'DeepSeek V4 Pro',         mediaType: 'text', creditsPerUnit: 3,  sortOrder: 63 },
        { key: 'deepseek-v4-pro-0813',    name: 'DeepSeek V4 Pro 0813',    mediaType: 'text', creditsPerUnit: 3,  sortOrder: 64 },
        // Qwen series
        { key: 'qwen4-max',               name: 'Qwen4 Max',               mediaType: 'text', creditsPerUnit: 4,  sortOrder: 65 },
        { key: 'qwen3.8-max',             name: 'Qwen3.8 Max',             mediaType: 'text', creditsPerUnit: 3,  sortOrder: 66 },
        { key: 'qwen3.8-flash',           name: 'Qwen3.8 Flash',           mediaType: 'text', creditsPerUnit: 1,  sortOrder: 67 },
        { key: 'qwen3.8-omni-flash',      name: 'Qwen3.8 Omni Flash',      mediaType: 'text', creditsPerUnit: 1,  sortOrder: 68 },
        { key: 'qwen3.7-max',             name: 'Qwen3.7 Max',             mediaType: 'text', creditsPerUnit: 3,  sortOrder: 69 },
        { key: 'qwen3.7-plus',            name: 'Qwen3.7 Plus',            mediaType: 'text', creditsPerUnit: 2,  sortOrder: 70 },
        { key: 'qwen3.7-flash',           name: 'Qwen3.7 Flash',           mediaType: 'text', creditsPerUnit: 1,  sortOrder: 71 },
        { key: 'qwen3.6-plus',            name: 'Qwen3.6 Plus',            mediaType: 'text', creditsPerUnit: 2,  sortOrder: 72 },
        { key: 'qwen3.5-omni-flash',      name: 'Qwen3.5 Omni Flash',      mediaType: 'text', creditsPerUnit: 1,  sortOrder: 73 },
        // GLM series
        { key: 'glm-5.3',                 name: 'GLM 5.3',                 mediaType: 'text', creditsPerUnit: 3,  sortOrder: 75 },
        { key: 'glm-5.3-flash',           name: 'GLM 5.3 Flash',           mediaType: 'text', creditsPerUnit: 1,  sortOrder: 76 },
        { key: 'glm-5.3-flashx',          name: 'GLM 5.3 FlashX',          mediaType: 'text', creditsPerUnit: 1,  sortOrder: 77 },
        { key: 'glm-5.2',                 name: 'GLM 5.2',                 mediaType: 'text', creditsPerUnit: 2,  sortOrder: 78 },
        // Other chat
        { key: 'minimax-m3',              name: 'MiniMax M3',              mediaType: 'text', creditsPerUnit: 3,  sortOrder: 80 },
        { key: 'minimax-m3.1-flash',      name: 'MiniMax M3.1 Flash',      mediaType: 'text', creditsPerUnit: 1,  sortOrder: 81 },
        { key: 'kimi-k3.1-pro',           name: 'Kimi K3.1 Pro',           mediaType: 'text', creditsPerUnit: 3,  sortOrder: 82 },
        { key: 'kimi-k3',                 name: 'Kimi K3',                 mediaType: 'text', creditsPerUnit: 2,  sortOrder: 83 },
        { key: 'doubao-seed-2-1-pro',     name: 'Doubao Seed 2.1 Pro',     mediaType: 'text', creditsPerUnit: 2,  sortOrder: 84 },
        { key: 'doubao-seed-2-0-pro',     name: 'Doubao Seed 2.0 Pro',     mediaType: 'text', creditsPerUnit: 2,  sortOrder: 85 },
        { key: 'hy4',                     name: 'Hunyuan Hy4',             mediaType: 'text', creditsPerUnit: 2,  sortOrder: 86 },
        { key: 'omni-flash-1-2',          name: 'Omni Flash 1.2',          mediaType: 'text', creditsPerUnit: 2,  sortOrder: 87 },
        { key: 'omni-flash-1-1',          name: 'Omni Flash 1.1',          mediaType: 'text', creditsPerUnit: 1,  sortOrder: 88 },
        { key: 'mimo-v2.6-pro',           name: 'MiMo V2.6 Pro',           mediaType: 'text', creditsPerUnit: 2,  sortOrder: 89 },
        { key: 'muse-spark-1.3',          name: 'Muse Spark 1.3',          mediaType: 'text', creditsPerUnit: 2,  sortOrder: 90 },

        // ── IMAGE models (sortOrder 100–199) ──────────────────────────────────────
        // GPT Image series
        { key: 'gpt-image-2.6-sunburst',  name: 'GPT Image 2.6 Sunburst',  mediaType: 'image', creditsPerUnit: 10, sortOrder: 100 },
        { key: 'gpt-image-2.6-flare',     name: 'GPT Image 2.6 Flare',     mediaType: 'image', creditsPerUnit: 10, sortOrder: 101 },
        { key: 'gpt-image-2.5-sunburst',  name: 'GPT Image 2.5 Sunburst',  mediaType: 'image', creditsPerUnit: 8,  sortOrder: 102 },
        { key: 'gpt-image-2.5-flare',     name: 'GPT Image 2.5 Flare',     mediaType: 'image', creditsPerUnit: 8,  sortOrder: 103 },
        { key: 'gpt-image-2',             name: 'GPT Image 2',             mediaType: 'image', creditsPerUnit: 5,  sortOrder: 104 },
        { key: 'gpt-image-2-official',    name: 'GPT Image 2 Official',    mediaType: 'image', creditsPerUnit: 6,  sortOrder: 105 },
        { key: 'gpt-image-2-c',           name: 'GPT Image 2 C',           mediaType: 'image', creditsPerUnit: 5,  sortOrder: 106 },
        { key: 'gpt-image-1.5-all',       name: 'GPT Image 1.5',           mediaType: 'image', creditsPerUnit: 8,  sortOrder: 107 },
        // Doubao Seedream series
        { key: 'doubao-seedream-5-5',     name: 'Doubao Seedream 5.5',     mediaType: 'image', creditsPerUnit: 6,  sortOrder: 110 },
        { key: 'doubao-seedream-5-0-pro', name: 'Doubao Seedream 5.0 Pro', mediaType: 'image', creditsPerUnit: 4,  sortOrder: 111 },
        { key: 'doubao-seedream-5-0',     name: 'Doubao Seedream 5.0',     mediaType: 'image', creditsPerUnit: 3,  sortOrder: 112 },
        { key: 'doubao-seedream-4-5',     name: 'Doubao Seedream 4.5',     mediaType: 'image', creditsPerUnit: 2,  sortOrder: 113 },
        // Flux series
        { key: 'flux-3',                  name: 'FLUX 3',                  mediaType: 'image', creditsPerUnit: 4,  sortOrder: 115 },
        { key: 'flux-2',                  name: 'FLUX 2',                  mediaType: 'image', creditsPerUnit: 2,  sortOrder: 116 },
        { key: 'flux-kontext',            name: 'FLUX Kontext',            mediaType: 'image', creditsPerUnit: 5,  sortOrder: 117 },
        // Gemini Image series
        { key: 'gemini-3-pro-image',      name: 'Gemini 3 Pro Image',      mediaType: 'image', creditsPerUnit: 5,  sortOrder: 120 },
        { key: 'gemini-3.1-flash-image',  name: 'Gemini 3.1 Flash Image',  mediaType: 'image', creditsPerUnit: 3,  sortOrder: 121 },
        { key: 'gemini-3.1-flash-lite-image', name: 'Gemini 3.1 Flash Lite Image', mediaType: 'image', creditsPerUnit: 2, sortOrder: 122 },
        { key: 'gemini-nano-banana-2.1-image', name: 'Gemini NB 2.1 Image', mediaType: 'image', creditsPerUnit: 2, sortOrder: 123 },
        // Grok Imagine series
        { key: 'grok-imagine-image-2.0',  name: 'Grok Imagine Image 2.0', mediaType: 'image', creditsPerUnit: 6,  sortOrder: 125 },
        { key: 'grok-imagine-image',      name: 'Grok Imagine Image',      mediaType: 'image', creditsPerUnit: 4,  sortOrder: 126 },
        // Kling Image series
        { key: 'kling-image-4.0',         name: 'Kling Image 4.0',         mediaType: 'image', creditsPerUnit: 8,  sortOrder: 130 },
        { key: 'kling-image-o3',          name: 'Kling Image O3',          mediaType: 'image', creditsPerUnit: 6,  sortOrder: 131 },
        // Other image
        { key: 'minimax-h3-image',        name: 'MiniMax H3 Image',        mediaType: 'image', creditsPerUnit: 5,  sortOrder: 135 },
        { key: 'mj_imagine',              name: 'Midjourney',              mediaType: 'image', creditsPerUnit: 10, sortOrder: 136 },
        { key: 'muse-image',              name: 'Muse Image',              mediaType: 'image', creditsPerUnit: 5,  sortOrder: 137 },
        { key: 'qwen-image-3.0',          name: 'Qwen Image 3.0',          mediaType: 'image', creditsPerUnit: 4,  sortOrder: 138 },
        { key: 'qwen-image-2.0',          name: 'Qwen Image 2.0',          mediaType: 'image', creditsPerUnit: 3,  sortOrder: 139 },
        { key: 'wan2.7-image',            name: 'Wan 2.7 Image',           mediaType: 'image', creditsPerUnit: 3,  sortOrder: 140 },
        { key: 'face-repaint',            name: 'Face Repaint',            mediaType: 'image', creditsPerUnit: 4,  sortOrder: 141 },
        { key: 'aliyun-image-superres',   name: 'Image Upscale (Aliyun)',  mediaType: 'image', creditsPerUnit: 4,  sortOrder: 142 },

        // ── VIDEO models (sortOrder 200–299) ──────────────────────────────────────
        // Veo series
        { key: 'veo-4-omni',              name: 'Veo 4 Omni',              mediaType: 'video', creditsPerUnit: 50, sortOrder: 200 },
        { key: 'veo-4-omni-v2v',          name: 'Veo 4 Omni V2V',          mediaType: 'video', creditsPerUnit: 50, sortOrder: 201 },
        { key: 'veo-3.1',                 name: 'Veo 3.1',                 mediaType: 'video', creditsPerUnit: 30, sortOrder: 202 },
        { key: 'veo-3-1-manju-special',   name: 'Veo 3.1 Manju Special',   mediaType: 'video', creditsPerUnit: 15, sortOrder: 203 },
        // Seedance series
        { key: 'seedance-2-5',            name: 'Seedance 2.5',            mediaType: 'video', creditsPerUnit: 40, sortOrder: 210 },
        { key: 'seedance-2-5-promo',      name: 'Seedance 2.5 Promo',      mediaType: 'video', creditsPerUnit: 20, sortOrder: 211 },
        { key: 'seedance-2-5-special',    name: 'Seedance 2.5 Special',    mediaType: 'video', creditsPerUnit: 15, sortOrder: 212 },
        { key: 'seedance-2-0-official',   name: 'Seedance 2.0',            mediaType: 'video', creditsPerUnit: 30, sortOrder: 213 },
        { key: 'seedance-2-0-promo',      name: 'Seedance 2.0 Promo',      mediaType: 'video', creditsPerUnit: 15, sortOrder: 214 },
        { key: 'seedance-2-0-special',    name: 'Seedance 2.0 Special',    mediaType: 'video', creditsPerUnit: 10, sortOrder: 215 },
        { key: 'seedance-2-0-manju-special', name: 'Seedance 2.0 Manju',  mediaType: 'video', creditsPerUnit: 10, sortOrder: 216 },
        { key: 'seedance-2-0-9tu-special',name: 'Seedance 2.0 9-shot',     mediaType: 'video', creditsPerUnit: 12, sortOrder: 217 },
        { key: 'seedance-2-0-ecom-special',name: 'Seedance 2.0 Ecom',      mediaType: 'video', creditsPerUnit: 12, sortOrder: 218 },
        { key: 'seedance-video-edit',     name: 'Seedance Video Edit',     mediaType: 'video', creditsPerUnit: 15, sortOrder: 219 },
        // Kling series
        { key: 'kling-v4',                name: 'Kling V4',                mediaType: 'video', creditsPerUnit: 30, sortOrder: 220 },
        { key: 'kling-v3',                name: 'Kling V3',                mediaType: 'video', creditsPerUnit: 20, sortOrder: 221 },
        { key: 'kling-v3-motion-control', name: 'Kling V3 Motion Control', mediaType: 'video', creditsPerUnit: 25, sortOrder: 222 },
        { key: 'kling-v3-omni-cankao',    name: 'Kling V3 Omni Reference', mediaType: 'video', creditsPerUnit: 20, sortOrder: 223 },
        { key: 'kling-3.0-turbo',         name: 'Kling 3.0 Turbo',         mediaType: 'video', creditsPerUnit: 10, sortOrder: 224 },
        { key: 'kling-avatar',            name: 'Kling Avatar',            mediaType: 'video', creditsPerUnit: 20, sortOrder: 225 },
        { key: 'kling-lip-sync',          name: 'Kling Lip Sync',          mediaType: 'video', creditsPerUnit: 15, sortOrder: 226 },
        // Grok Imagine Video series
        { key: 'grok-imagine-1-5-7tu-special', name: 'Grok Imagine 1.5 Pro',  mediaType: 'video', creditsPerUnit: 20, sortOrder: 230 },
        { key: 'grok-imagine-1.5',        name: 'Grok Imagine 1.5',        mediaType: 'video', creditsPerUnit: 15, sortOrder: 231 },
        { key: 'grok-imagine-1.5-special',name: 'Grok Imagine 1.5 Special',mediaType: 'video', creditsPerUnit: 10, sortOrder: 232 },
        { key: 'grok-imagine-video',      name: 'Grok Imagine Video',      mediaType: 'video', creditsPerUnit: 15, sortOrder: 233 },
        { key: 'grok-imagine-video-special', name: 'Grok Imagine Video Special', mediaType: 'video', creditsPerUnit: 10, sortOrder: 234 },
        // Wan series
        { key: 'wan-3-0',                 name: 'Wan 3.0',                 mediaType: 'video', creditsPerUnit: 15, sortOrder: 240 },
        { key: 'wan-3-0-special',         name: 'Wan 3.0 Special',         mediaType: 'video', creditsPerUnit: 10, sortOrder: 241 },
        // MiniMax Video series
        { key: 'minimax-h3',              name: 'MiniMax H3',              mediaType: 'video', creditsPerUnit: 25, sortOrder: 245 },
        { key: 'minimax-hailuo-2-3',      name: 'MiniMax Hailuo 2.3',      mediaType: 'video', creditsPerUnit: 20, sortOrder: 246 },
        // Vidu series
        { key: 'viduq4',                  name: 'Vidu Q4',                 mediaType: 'video', creditsPerUnit: 20, sortOrder: 250 },
        { key: 'viduq3',                  name: 'Vidu Q3',                 mediaType: 'video', creditsPerUnit: 15, sortOrder: 251 },
        // Pixverse series
        { key: 'pixverse-v6',             name: 'Pixverse V6',             mediaType: 'video', creditsPerUnit: 15, sortOrder: 255 },
        { key: 'pixverse-c1',             name: 'Pixverse C1',             mediaType: 'video', creditsPerUnit: 10, sortOrder: 256 },
        // Flux Video
        { key: 'flux-3-video',            name: 'FLUX 3 Video',            mediaType: 'video', creditsPerUnit: 20, sortOrder: 260 },
        // Other video
        { key: 'muse-video',              name: 'Muse Video',              mediaType: 'video', creditsPerUnit: 20, sortOrder: 265 },
        { key: 'happyhorse-1-1',          name: 'Happy Horse 1.1',         mediaType: 'video', creditsPerUnit: 15, sortOrder: 266 },
        { key: 'aliyun-video-superres',   name: 'Video Upscale (Aliyun)',  mediaType: 'video', creditsPerUnit: 5,  sortOrder: 267 },
        { key: 'video-desubtitle',        name: 'Video Desubtitle',        mediaType: 'video', creditsPerUnit: 5,  sortOrder: 268 },

        // ── AUDIO models (sortOrder 300–399) ──────────────────────────────────────
        // Music
        { key: 'music',                   name: 'Suno Music',              mediaType: 'audio', creditsPerUnit: 10, sortOrder: 300 },
        // TTS / Speech
        { key: 'speech-2.8',              name: 'MiniMax Speech 2.8',      mediaType: 'audio', creditsPerUnit: 3,  sortOrder: 310 },
        { key: 'gpt-4o-mini-tts',         name: 'GPT-4o Mini TTS',         mediaType: 'audio', creditsPerUnit: 2,  sortOrder: 311 },
        { key: 'doubao-tts-2.0',          name: 'Doubao TTS 2.0',          mediaType: 'audio', creditsPerUnit: 2,  sortOrder: 312 },
        { key: 'gemini-2.5-pro-tts',      name: 'Gemini 2.5 Pro TTS',      mediaType: 'audio', creditsPerUnit: 3,  sortOrder: 313 },
        { key: 'gemini-3.8-flash-tts',    name: 'Gemini 3.8 Flash TTS',    mediaType: 'audio', creditsPerUnit: 1,  sortOrder: 314 },
        // Voice
        { key: 'voice-clone',             name: 'Voice Clone',             mediaType: 'audio', creditsPerUnit: 5,  sortOrder: 320 },
        { key: 'voice-design',            name: 'Voice Design',            mediaType: 'audio', creditsPerUnit: 3,  sortOrder: 321 },
        // Transcription
        { key: 'whisper-1',               name: 'Whisper 1',               mediaType: 'audio', creditsPerUnit: 1,  sortOrder: 330 },
    ];

    for (const m of models) {
        await prisma.aiModel.create({ data: m });
    }

    console.log(`Seed complete: ${models.length} models created.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
