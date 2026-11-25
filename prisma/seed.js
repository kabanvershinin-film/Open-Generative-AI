const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Plans
    await prisma.plan.upsert({ where: { code: 'basic' }, update: {}, create: { code: 'basic', name: 'Базовая', priceRub: 100000, credits: 2000, durationDays: 30, sortOrder: 1 } });
    await prisma.plan.upsert({ where: { code: 'extended' }, update: {}, create: { code: 'extended', name: 'Расширенная', priceRub: 300000, credits: 6000, durationDays: 30, sortOrder: 2 } });
    await prisma.plan.upsert({ where: { code: 'studio' }, update: {}, create: { code: 'studio', name: 'Студийная', priceRub: 500000, credits: 10000, durationDays: 30, sortOrder: 3 } });

    // AI Models
    const models = [
        { key: 'flux-schnell', name: 'FLUX Schnell', mediaType: 'image', creditsPerUnit: 1, sortOrder: 1 },
        { key: 'flux-dev', name: 'FLUX Dev', mediaType: 'image', creditsPerUnit: 2, sortOrder: 2 },
        { key: 'sdxl', name: 'Stable Diffusion XL', mediaType: 'image', creditsPerUnit: 1, sortOrder: 3 },
        { key: 'dall-e-3', name: 'DALL·E 3', mediaType: 'image', creditsPerUnit: 4, sortOrder: 4 },
        { key: 'wan-t2v', name: 'Wan T2V', mediaType: 'video', creditsPerUnit: 10, sortOrder: 5 },
        { key: 'wan-i2v', name: 'Wan I2V', mediaType: 'video', creditsPerUnit: 15, sortOrder: 6 },
        { key: 'seedance', name: 'Seedance', mediaType: 'video', creditsPerUnit: 20, sortOrder: 7 },
        { key: 'minimax-video', name: 'Minimax Video', mediaType: 'video', creditsPerUnit: 25, sortOrder: 8 },
        { key: 'gpt-4o-mini', name: 'GPT-4o mini', mediaType: 'text', creditsPerUnit: 1, sortOrder: 9 },
        { key: 'claude-haiku', name: 'Claude Haiku', mediaType: 'text', creditsPerUnit: 1, sortOrder: 10 },
    ];
    for (const m of models) {
        await prisma.aiModel.upsert({ where: { key: m.key }, update: {}, create: m });
    }

    console.log('Seed complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
