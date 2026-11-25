// TokenGo AI gateway provider — https://tokengo.love
// Set TOKENGO_API_KEY in .env.local to enable real generation.

const TOKENGO_BASE = 'https://tokengo.love';

export function isTokenGoEnabled() {
    return !!process.env.TOKENGO_API_KEY;
}

function authHeader() {
    return { Authorization: `Bearer ${process.env.TOKENGO_API_KEY}` };
}

async function tgPost(path, body) {
    const res = await fetch(`${TOKENGO_BASE}${path}`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res;
}

async function generateImage(modelKey, prompt, params = {}) {
    const { aspect_ratio, resolution, size, ...rest } = params;
    const body = { model: modelKey, prompt, n: 1, ...rest };
    if (size) body.size = size;
    else if (aspect_ratio || resolution) {
        if (aspect_ratio) body.aspect_ratio = aspect_ratio;
        if (resolution) body.resolution = resolution;
    }

    const res = await tgPost('/v1/images/generations', body);
    const data = await res.json().catch(() => ({}));
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    if (!res.ok) throw new Error(`TokenGo image error ${res.status}`);

    const url = data.data?.[0]?.url;
    if (!url) throw new Error('TokenGo: no image URL in response');
    return { status: 'success', outputUrl: url, type: 'image' };
}

async function generateVideo(modelKey, prompt, params = {}) {
    const res = await tgPost('/v1/videos/generations', {
        model: modelKey,
        prompt,
        ...params,
    });
    const data = await res.json().catch(() => ({}));
    if (data.error && !data.task_id && !data.id) {
        throw new Error(data.error.message || JSON.stringify(data.error));
    }
    if (!res.ok && !data.task_id && !data.id) {
        throw new Error(`TokenGo video error ${res.status}`);
    }
    const taskId = data.task_id || data.id;
    if (!taskId) throw new Error('TokenGo: no task_id in video response');
    return { status: 'pending', taskId, outputUrl: null, type: 'video' };
}

async function generateText(modelKey, prompt, params = {}) {
    const res = await tgPost('/v1/chat/completions', {
        model: modelKey,
        messages: [{ role: 'user', content: prompt }],
        ...params,
    });
    const data = await res.json().catch(() => ({}));
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    if (!res.ok) throw new Error(`TokenGo text error ${res.status}`);

    const text = data.choices?.[0]?.message?.content || '';
    return { status: 'success', outputUrl: null, type: 'text', text };
}

// Poll async task (video/audio). Returns TokenGo task object.
export async function pollTask(taskId) {
    const res = await fetch(`${TOKENGO_BASE}/v1/tasks/${taskId}`, {
        headers: authHeader(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `TokenGo poll error ${res.status}`);
    }
    return res.json();
}

// Main entry — dispatches by mediaType.
export async function run(modelKey, mediaType, prompt, params = {}) {
    if (!isTokenGoEnabled()) throw new Error('TOKENGO_API_KEY not set');

    if (mediaType === 'video') return generateVideo(modelKey, prompt, params);
    if (mediaType === 'audio') return generateVideo(modelKey, prompt, params); // audio uses same async path
    if (mediaType === 'text') return generateText(modelKey, prompt, params);
    return generateImage(modelKey, prompt, params);
}
