import { getI2vModels, getT2vModels, getV2vModels } from '../models.js';
import { notifyAuthRequired } from './core.js';
import { generateSeedanceArk } from './ark.js';

function getVideoModelById(id) {
    const all = [...getT2vModels(), ...getI2vModels(), ...getV2vModels()];
    return all.find((model) => model.id === id);
}

function getI2VModelById(id) {
    return getI2vModels().find((model) => model.id === id);
}

async function submitUnifiedVideo(apiKey, payload, onRequestId) {
    const response = await fetch('/api/mf/v1/video/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) notifyAuthRequired(401, data.error);
        throw new Error(data.error || `Error ${response.status}`);
    }
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);

    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const poll = await fetch(`/api/mf/v1/video/generations/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const dataPoll = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (dataPoll.status === 'succeeded' || dataPoll.status === 'success') {
            return { url: dataPoll.output?.url || dataPoll.url, id: requestId };
        }
        if (dataPoll.status === 'failed' || dataPoll.status === 'error') {
            throw new Error(dataPoll.error || 'Generation failed');
        }
    }
    throw new Error('Timeout');
}

async function submitKlingT2V(apiKey, payload, onRequestId) {
    const response = await fetch('/api/mf/v1/video/kling/t2v', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Kling error ${response.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollKling(apiKey, requestId);
}

async function submitKlingI2V(apiKey, payload, onRequestId) {
    const response = await fetch('/api/mf/v1/video/kling/i2v', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Kling error ${response.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollKling(apiKey, requestId);
}

async function pollKling(apiKey, requestId) {
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const poll = await fetch(`/api/mf/v1/video/kling/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (data.status === 'succeeded' || data.status === 'success') {
            return { url: data.output?.url || data.url, id: requestId };
        }
        if (data.status === 'failed' || data.status === 'error') {
            throw new Error(data.error || 'Kling generation failed');
        }
    }
    throw new Error('Timeout');
}

async function submitLumaVideo(apiKey, payload, onRequestId) {
    const response = await fetch('/api/mf/v1/video/luma', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Luma error ${response.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollLuma(apiKey, requestId);
}

async function pollLuma(apiKey, requestId) {
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const poll = await fetch(`/api/mf/v1/video/luma/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (data.status === 'succeeded' || data.status === 'success') {
            return { url: data.output?.url || data.url, id: requestId };
        }
        if (data.status === 'failed' || data.status === 'error') {
            throw new Error(data.error || 'Luma generation failed');
        }
    }
    throw new Error('Timeout');
}

async function submitSoraVideo(apiKey, payload, onRequestId) {
    const response = await fetch('/api/mf/v1/video/sora', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Sora error ${response.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollSora(apiKey, requestId);
}

async function pollSora(apiKey, requestId) {
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const poll = await fetch(`/api/mf/v1/video/sora/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (data.status === 'succeeded' || data.status === 'success') {
            return { url: data.output?.url || data.url, id: requestId };
        }
        if (data.status === 'failed' || data.status === 'error') {
            throw new Error(data.error || 'Sora generation failed');
        }
    }
    throw new Error('Timeout');
}

export async function generateVideo(apiKey, params) {
    const modelInfo = getVideoModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;
    const platform = modelInfo?.platform || 'unified';

    if (modelInfo?.provider === 'ark') {
        return generateSeedanceArk(apiKey, modelInfo, params);
    }

    if (platform === 'kling') {
        const payload = {
            model_name: modelId,
            prompt: params.prompt || '',
        };
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.duration) payload.duration = String(params.duration);
        if (params.mode) payload.mode = params.mode;
        return submitKlingT2V(apiKey, payload, params.onRequestId);
    }

    if (platform === 'luma') {
        const payload = { model: modelId };
        if (params.prompt) payload.prompt = params.prompt;
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.loop != null) payload.loop = params.loop;
        return submitLumaVideo(apiKey, payload, params.onRequestId);
    }

    if (platform === 'sora') {
        const payload = { model: modelId };
        if (params.prompt) payload.prompt = params.prompt;
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.duration) payload.duration = params.duration;
        return submitSoraVideo(apiKey, payload, params.onRequestId);
    }

    const payload = { model: modelId };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (params.audio_url) payload.audio_url = params.audio_url;
    return submitUnifiedVideo(apiKey, payload, params.onRequestId);
}

export async function generateI2V(apiKey, params) {
    const modelInfo = getI2VModelById(params.model);
    const modelId = modelInfo?.apiId || params.model;
    const platform = modelInfo?.platform || 'unified';
    const imageField = modelInfo?.imageField || 'image_url';

    if (modelInfo?.provider === 'ark') {
        return generateSeedanceArk(apiKey, modelInfo, params);
    }

    if (platform === 'kling') {
        const payload = {
            model_name: modelId,
            prompt: params.prompt || '',
        };
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.duration) payload.duration = String(params.duration);
        if (params.mode) payload.mode = params.mode;
        if (params.image_url) payload[imageField] = params.image_url;
        return submitKlingI2V(apiKey, payload, params.onRequestId);
    }

    if (platform === 'luma') {
        const payload = { model: modelId };
        if (params.prompt) payload.prompt = params.prompt;
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.image_url) payload[imageField] = params.image_url;
        if (params.loop != null) payload.loop = params.loop;
        return submitLumaVideo(apiKey, payload, params.onRequestId);
    }

    if (platform === 'sora') {
        const payload = { model: modelId };
        if (params.prompt) payload.prompt = params.prompt;
        if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
        if (params.image_url) payload[imageField] = params.image_url;
        if (params.duration) payload.duration = params.duration;
        return submitSoraVideo(apiKey, payload, params.onRequestId);
    }

    const payload = { model: modelId };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.aspect_ratio) payload.aspect_ratio = params.aspect_ratio;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.mode) payload.mode = params.mode;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.video_url) payload.video_url = params.video_url;
    if (params.audio_url) payload.audio_url = params.audio_url;
    return submitUnifiedVideo(apiKey, payload, params.onRequestId);
}

export async function processV2V(apiKey, params) {
    const payload = {
        model: params.model,
        video_url: params.video_url,
    };
    if (params.prompt) payload.prompt = params.prompt;
    if (params.image_url) payload.image_url = params.image_url;
    if (params.duration) payload.duration = params.duration;
    if (params.resolution) payload.resolution = params.resolution;
    if (params.mode) payload.mode = params.mode;
    return submitUnifiedVideo(apiKey, payload, params.onRequestId);
}
