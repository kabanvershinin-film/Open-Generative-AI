const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Plans
    await prisma.plan.upsert({ where: { code: 'basic' }, update: {}, create: { code: 'basic', name: 'Базовая', priceRub: 100000, credits: 2000, durationDays: 30, sortOrder: 1 } });
    await prisma.plan.upsert({ where: { code: 'extended' }, update: {}, create: { code: 'extended', name: 'Расширенная', priceRub: 300000, credits: 6000, durationDays: 30, sortOrder: 2 } });
    await prisma.plan.upsert({ where: { code: 'studio' }, update: {}, create: { code: 'studio', name: 'Студийная', priceRub: 500000, credits: 10000, durationDays: 30, sortOrder: 3 } });

    // AI Models — keys match TokenGo model IDs (https://tokengo.love)
    const models = [
        // Image
        { key: 'gt-image-2',              name: 'GPT Image 2',          mediaType: 'image', creditsPerUnit: 2,  sortOrder: 1 },
        { key: 'gt-image-2.5-flare',      name: 'GPT Image 2.5 Flare',  mediaType: 'image', creditsPerUnit: 4,  sortOrder: 2 },
        { key: 'doubao-seedream-5-0',      name: 'Seedream 5.0',         mediaType: 'image', creditsPerUnit: 2,  sortOrder: 3 },
        { key: 'dall-e-3',                name: 'DALL·E 3',             mediaType: 'image', creditsPerUnit: 4,  sortOrder: 4 },
        { key: 'flux-schnell',            name: 'FLUX Schnell',         mediaType: 'image', creditsPerUnit: 1,  sortOrder: 5 },
        { key: 'flux-dev',                name: 'FLUX Dev',             mediaType: 'image', creditsPerUnit: 2,  sortOrder: 6 },
        // Video
        { key: 'seedance-2-5',            name: 'Seedance 2.5',         mediaType: 'video', creditsPerUnit: 20, sortOrder: 10 },
        { key: 'vo-3.1',                  name: 'Veo 3.1',              mediaType: 'video', creditsPerUnit: 30, sortOrder: 11 },
        { key: 'wan2.1-t2v-turbo',        name: 'Wan T2V Turbo',        mediaType: 'video', creditsPerUnit: 10, sortOrder: 12 },
        { key: 'wan2.1-i2v-turbo',        name: 'Wan I2V Turbo',        mediaType: 'video', creditsPerUnit: 15, sortOrder: 13 },
        { key: 'minimax-video-01',        name: 'Minimax Video 01',     mediaType: 'video', creditsPerUnit: 25, sortOrder: 14 },
        // Text
        { key: 'gpt-4o-mini',             name: 'GPT-4o mini',          mediaType: 'text',  creditsPerUnit: 1,  sortOrder: 20 },
        { key: 'claude-haiku-4-5',        name: 'Claude Haiku 4.5',     mediaType: 'text',  creditsPerUnit: 1,  sortOrder: 21 },
        { key: 'gt-5.6-sol',              name: 'GT 5.6 Sol',           mediaType: 'text',  creditsPerUnit: 2,  sortOrder: 22 },
    ];
    for (const m of models) {
        await prisma.aiModel.upsert({ where: { key: m.key }, update: { name: m.name, creditsPerUnit: m.creditsPerUnit, sortOrder: m.sortOrder }, create: m });
    }

    console.log('Seed complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
