// Demo AI adapter — returns fake results without calling real APIs.
// Real providers are added when the owner supplies confirmed API keys.

const DEMO_IMAGES = [
    'https://images.unsplash.com/photo-1693660929427-e9a66d0ad05e?w=800',
    'https://images.unsplash.com/photo-1686002359940-6a51b0d64c68?w=800',
    'https://images.unsplash.com/photo-1699063399682-6a51b0d64c68?w=800',
];

const DEMO_VIDEOS = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
];

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function runDemo(modelKey, params) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    if (modelKey.includes('video')) {
        return { status: 'success', outputUrl: pick(DEMO_VIDEOS), type: 'video' };
    }
    if (modelKey.includes('audio')) {
        return { status: 'success', outputUrl: null, type: 'audio', text: 'Демо аудио (провайдер не подключён)' };
    }
    if (modelKey.includes('text') || modelKey.includes('doubao') || modelKey.includes('elspy') || modelKey.includes('tokengo')) {
        const prompt = params?.prompt || '';
        return {
            status: 'success',
            outputUrl: null,
            type: 'text',
            text: `[Демо ответ] Запрос: "${prompt.slice(0, 100)}"\n\nЭто демонстрационный режим. Подключите реальный провайдер для генерации.`,
        };
    }
    // Default: image
    return { status: 'success', outputUrl: pick(DEMO_IMAGES), type: 'image' };
}

export function getCreditsForModel(creditsPerUnit, params) {
    // Video: multiply by duration/ratio
    const duration = Number(params?.duration || 5);
    if (params?.mediaType === 'video') return creditsPerUnit * Math.ceil(duration / 5);
    return creditsPerUnit;
}
