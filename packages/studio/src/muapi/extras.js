import { getLipSyncModelById } from '../models.js';

function featureGap(name) {
    throw new Error(`${name} пока не перенесён в packages/studio/src/muapi.js`);
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ([]));
    if (!response.ok) {
        throw new Error(data?.error || data?.message || `Ошибка запроса ${response.status}`);
    }
    return data;
}

export async function getTemplateAgents(apiKey) {
    const data = await fetchJson('/api/agents?is_template=true', {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    return Array.isArray(data) ? data : [];
}

export async function getUserAgents(apiKey) {
    const data = await fetchJson('/api/agents', {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    return Array.isArray(data) ? data : [];
}

export async function getUserConversations(_apiKey) {
    return [];
}

export async function registerAppInterest(apiKey, name) {
    return fetchJson('/api/app/interests', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
}

export async function getAppInterests(apiKey) {
    const data = await fetchJson('/api/app/interests', {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    return Array.isArray(data) ? data : [];
}

export async function generateAudio(apiKey, params) {
    const response = await fetch('/api/mf/v1/audio/generations', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.error || data?.message || `Audio API ${response.status}`);
    }
    return data;
}

export async function processLipSync(apiKey, params) {
    const modelInfo = getLipSyncModelById(params.model);
    if (!modelInfo?.endpoint) {
        throw new Error('LipSync модели пока не настроены для нового muapi-слоя');
    }
    const response = await fetch(`/api/app/${modelInfo.endpoint}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.error || data?.message || `LipSync API ${response.status}`);
    }
    return data;
}

export async function runClipping() {
    featureGap('runClipping');
}

export async function generateMarketingStudioAd() {
    featureGap('generateMarketingStudioAd');
}

export async function runMotionGraphics() {
    featureGap('runMotionGraphics');
}

export async function runMotionGraphicsEdit() {
    featureGap('runMotionGraphicsEdit');
}
