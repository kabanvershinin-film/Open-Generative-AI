import { getT2vModels, getI2vModels, getV2vModels } from './models.js';

// Internal helper to get model metadata from either T2V or I2V lists.
function getVideoModelById(id) {
    const all = [...getT2vModels(), ...getI2vModels(), ...getV2vModels()];
    return all.find((m) => m.id === id);
}
function getI2VModelById(id) {
    return getI2vModels().find((m) => m.id === id);
}

function notifyAuthRequired(status, message) {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('muapi:auth-required', { detail: { status, message } });
        window.dispatchEvent(event);
    }
}

/**
 * Ark Seedance 2.0 (Volcano Engine) generation.
 * This model has a custom multimodal protocol and is called via a direct proxy
 * at /api/ark/seedance instead of the unified Memefast /run path.
 */
async function generateSeedanceArk(apiKey, modelInfo, params) {
    const fast = /fast/.test(modelInfo?.apiId || modelInfo?.id || '');
    
    // Ark handles face_asset for trusted assets.
    // We pass the face asset URI in face_asset field of each image, 
    // but for image_urls we must use a real HTTP URL (thumbnail) to avoid validation errors.
    const faceAsset = params.face_asset;
    const faceThumb = params.face_thumbnail;
    const uploadedUrl = params.image_url;
    const initialImages = Array.isArray(params.image_urls) ? [...params.image_urls] : [];
    
    // Construct the final images array.
    // In Seedance 2.0, character (trusted asset) MUST be 图片1 to be reliably recognized.
    let finalImages = [];
    
    // 1. Primary character (if exists) -> Always 图片1
    // Ark requires a valid HTTP URL in the 'url' field.
    // We use the uploaded image as base, or the character's thumbnail if no upload.
    // The 'face_asset' (asset://) provides the identity, but 'url' provides the pixels.
    if (faceAsset) {
        finalImages.push({ 
            url: uploadedUrl || faceThumb || faceAsset, 
            face_asset: faceAsset 
        });
    } else if (uploadedUrl) {
        // No character, just use the main uploaded image as 图片1
        finalImages.push(typeof uploadedUrl === 'string' ? { url: uploadedUrl } : uploadedUrl);
    } else if (faceThumb) {
        // Fallback to thumbnail if no uploadedUrl and no faceAsset
        finalImages.push({ url: faceThumb });
    }
    
    // 2. Additional reference images from refFiles (initialImages)
    initialImages.forEach(img => {
        const url = typeof img === 'string' ? img : img.url;
        // Skip if this image was already used as the primary one
        const primaryUrl = finalImages[0]?.url;
        if (url && url !== primaryUrl && url !== faceThumb && url !== uploadedUrl) {
            finalImages.push(typeof img === 'string' ? { url: img } : img);
        }
    });

    const body = {
        fast,
        model: modelInfo?.apiId || modelInfo?.id || undefined,
        is_i2v: params.is_i2v ?? false,
        prompt: params.prompt || '',
        image_url: finalImages[0] || undefined,
        image_urls: finalImages.length > 1 ? finalImages.slice(1) : undefined,
        video_url: params.video_url || undefined,
        video_urls: Array.isArray(params.video_urls) ? params.video_urls : undefined,
        audio_url: params.audio_url || undefined,
        audio_urls: Array.isArray(params.audio_urls) ? params.audio_urls : undefined,
        resolution: params.resolution || undefined,
        ratio: params.aspect_ratio || undefined,
        duration: params.duration || undefined,
        face_asset: params.face_asset || undefined,
        last_image_url: params.last_image_url || undefined,
    };

    // Step 1: submit task (fast — just creates the Ark task and returns taskId)
    const submit = await fetch('/api/ark/seedance', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
    });
    const submitData = await submit.json().catch(() => ({}));
    if (!submit.ok) {
        if (submit.status === 401) {
            notifyAuthRequired(401, submitData.error);
            throw new Error(submitData.error || 'Войдите в аккаунт, чтобы генерировать.');
        }
        if (submit.status === 402) {
            throw new Error(`Недостаточно средств. Нужно ${submitData.required ?? ''}₽, на балансе ${submitData.balance ?? 0}₽.`);
        }
        
        let errorMsg = submitData.error || submit.status;
        if (String(errorMsg).includes('real person')) {
            errorMsg = "Ошибка безопасности: обнаружен реальный человек. Если вы используете персонажа, убедитесь, что в промпте есть тег 图片1 (или соответствующий номер).";
        }
        throw new Error(`Ark: ${errorMsg}`);
    }
    const taskId = submitData.taskId;
    if (!taskId) throw new Error('Ark: задача не создана (нет taskId).');

    // Notify the caller as soon as we have a taskId so it can persist it for
    // resumption if the user navigates away before polling finishes. The bill
    // token rides along so a resumed poll can still refund on failure.
    params.onTaskId?.(taskId, submitData.bill);
    if (params.onRequestId) params.onRequestId(taskId);

    return pollArkTask(apiKey, taskId, submitData.bill);
}

// Poll an already-submitted Ark Seedance task.
// Exported so VideoStudio can resume an in-progress task after navigation.
// `bill` (optional) is the signed charge token; passed back so an async failure
// refunds the right amount.
export async function pollArkTask(apiKey, taskId, bill) {
    const billQs = bill ? `&bill=${encodeURIComponent(bill)}` : '';
    for (let attempt = 0; attempt < 600; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = await fetch(`/api/ark/seedance?taskId=${encodeURIComponent(taskId)}${billQs}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        const status = (data.status || '').toLowerCase();
        if (status === 'succeeded' || status === 'success') {
            if (!data.url) throw new Error('Ark: видео готово, но URL не получен.');
            return { url: data.url, id: taskId };
        }
        if (status === 'failed' || status === 'error' || status === 'expired' || status === 'cancelled') {
            throw new Error(`Ark: генерация не удалась (${data.error || status}).`);
        }
    }
    throw new Error('Ark: превышено время ожидания генерации.');
}

// ── Video generation (routes by platform) ─────────────────────────────────────

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

    // unified format (pixverse, veo, grok, wan, happyhorse, minimax, seedance, etc.)
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

    // unified format
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

// ── Generic unified video submission (pixverse, veo, etc.) ────────────────────

async function submitUnifiedVideo(apiKey, payload, onRequestId) {
    const r = await fetch('/api/mf/v1/video/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
        if (r.status === 401) notifyAuthRequired(401, data.error);
        throw new Error(data.error || `Error ${r.status}`);
    }
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);

    // Poll for result
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = await fetch(`/api/mf/v1/video/generations/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const pd = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (pd.status === 'succeeded' || pd.status === 'success') {
            return { url: pd.output?.url || pd.url, id: requestId };
        }
        if (pd.status === 'failed' || pd.status === 'error') {
            throw new Error(pd.error || 'Generation failed');
        }
    }
    throw new Error('Timeout');
}

// ── Kling-specific submission ──────────────────────────────────────────────────

async function submitKlingT2V(apiKey, payload, onRequestId) {
    const r = await fetch('/api/mf/v1/video/kling/t2v', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Kling error ${r.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollKling(apiKey, requestId);
}

async function submitKlingI2V(apiKey, payload, onRequestId) {
    const r = await fetch('/api/mf/v1/video/kling/i2v', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Kling error ${r.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollKling(apiKey, requestId);
}

async function pollKling(apiKey, requestId) {
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = await fetch(`/api/mf/v1/video/kling/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const pd = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (pd.status === 'succeeded' || pd.status === 'success') {
            return { url: pd.output?.url || pd.url, id: requestId };
        }
        if (pd.status === 'failed' || pd.status === 'error') {
            throw new Error(pd.error || 'Kling generation failed');
        }
    }
    throw new Error('Timeout');
}

// ── Luma-specific submission ───────────────────────────────────────────────────

async function submitLumaVideo(apiKey, payload, onRequestId) {
    const r = await fetch('/api/mf/v1/video/luma', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Luma error ${r.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollLuma(apiKey, requestId);
}

async function pollLuma(apiKey, requestId) {
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = await fetch(`/api/mf/v1/video/luma/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const pd = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (pd.status === 'succeeded' || pd.status === 'success') {
            return { url: pd.output?.url || pd.url, id: requestId };
        }
        if (pd.status === 'failed' || pd.status === 'error') {
            throw new Error(pd.error || 'Luma generation failed');
        }
    }
    throw new Error('Timeout');
}

// ── Sora-specific submission ───────────────────────────────────────────────────

async function submitSoraVideo(apiKey, payload, onRequestId) {
    const r = await fetch('/api/mf/v1/video/sora', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Sora error ${r.status}`);
    const requestId = data.id;
    if (onRequestId) onRequestId(requestId);
    return pollSora(apiKey, requestId);
}

async function pollSora(apiKey, requestId) {
    for (let attempt = 0; attempt < 300; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        const poll = await fetch(`/api/mf/v1/video/sora/${requestId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const pd = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        if (pd.status === 'succeeded' || pd.status === 'success') {
            return { url: pd.output?.url || pd.url, id: requestId };
        }
        if (pd.status === 'failed' || pd.status === 'error') {
            throw new Error(pd.error || 'Sora generation failed');
        }
    }
    throw new Error('Timeout');
}

// ── Video-to-Video processing (unified path) ──────────────────────────────────

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

// ── Persistence & Assets ───────────────────────────────────────────────────────

export async function uploadFile(apiKey, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    const r = await fetch('/api/mf/v1/assets/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Upload failed');
    return data.url;
}

export async function persistImageToTOS(url) {
    try {
        const r = await fetch('/api/upload-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        const data = await r.json().catch(() => ({}));
        return data.url || url;
    } catch {
        return url;
    }
}

export async function getUserWorkflows(apiKey) {
    const r = await fetch('/api/workflow/list', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await r.json().catch(() => []);
    return Array.isArray(data) ? data : [];
}

export async function getUserBalance(apiKey) {
    const r = await fetch('/api/user/balance', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await r.json().catch(() => ({ balance: 0 }));
    return data.balance ?? 0;
}
