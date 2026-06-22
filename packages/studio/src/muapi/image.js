import { getI2iModels, getT2iModels } from '../models.js';
import { fetchWithTimeout, formatApiError, notifyAuthRequired } from './core.js';

function getImageModelById(id) {
    const all = [...getT2iModels(), ...getI2iModels()];
    return all.find((model) => model.id === id);
}

function getI2IModelById(id) {
    return getI2iModels().find((model) => model.id === id);
}

function computeImageSize(aspectRatio, imageSize) {
    if (imageSize) return imageSize;
    const sizes = {
        '1:1': '1024x1024',
        '16:9': '1792x1024',
        '9:16': '1024x1792',
        '4:3': '1024x768',
        '3:4': '768x1024',
        '3:2': '1536x1024',
        '2:3': '1024x1536',
        '21:9': '2048x878',
    };
    return sizes[aspectRatio] || '1024x1024';
}

function applyImageRouting(modelId, routing) {
    return routing && routing !== 'default' ? `${modelId}:${routing}` : modelId;
}

const CHAT_IMAGE_MODELS = new Set([
    'gemini-3.1-flash-image-preview',
    'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-preview-edit',
    'gemini-3-pro-image-preview-edit',
]);

function isChatImageModel(modelId) {
    return CHAT_IMAGE_MODELS.has(modelId);
}

function getImageUrlFromResponse(data) {
    const item = data?.data?.[0];
    return item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : '') || data?.url || data?.output?.url || data?.outputs?.[0] || '';
}

function normalizeImageResult(data, fallbackId) {
    const url = getImageUrlFromResponse(data);
    return { ...data, id: data?.id || data?.request_id || fallbackId, url };
}

function getImageUrlFromText(text) {
    return String(text || '').match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)?.[0]
        || String(text || '').match(/https?:\/\/\S+\.(png|jpg|jpeg|webp|gif)/i)?.[0]
        || '';
}

function getChatImageUrlFromResponse(data) {
    const message = data?.choices?.[0]?.message;
    const content = message?.content;
    if (Array.isArray(content)) {
        for (const part of content) {
            const url = part?.image_url?.url || part?.image_url || part?.url || getImageUrlFromText(part?.text);
            if (url) return url;
        }
    }
    const directUrl = message?.image_url?.url || message?.image_url || message?.url || data?.url || data?.output?.url;
    if (directUrl) return directUrl;
    const fromText = getImageUrlFromText(typeof content === 'string' ? content : data?.choices?.[0]?.text);
    if (fromText) return fromText;

    const parts = data?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        const inline = part?.inlineData || part?.inline_data;
        if (inline?.data) {
            const mime = inline.mimeType || inline.mime_type || 'image/png';
            return `data:${mime};base64,${inline.data}`;
        }
    }
    return getImageUrlFromText(parts.find((part) => typeof part?.text === 'string')?.text);
}

function getChatImageReferences(params) {
    return [
        ...(Array.isArray(params.images_list) ? params.images_list : []),
        params.image_url,
    ].filter(Boolean).filter((image, index, list) => list.indexOf(image) === index);
}

function buildChatImageContent(params) {
    const images = getChatImageReferences(params);
    if (!images.length) return params.prompt || '';
    return [
        { type: 'text', text: params.prompt || '' },
        ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
    ];
}

function normalizeChatImageResult(data, fallbackId) {
    return { ...data, id: data?.id || data?.request_id || fallbackId, url: getChatImageUrlFromResponse(data) };
}

async function generateChatImage(apiKey, modelId, params) {
    const body = {
        model: modelId,
        messages: [{ role: 'user', content: buildChatImageContent(params) }],
        stream: false,
    };
    if (params.aspect_ratio) body.aspect_ratio = params.aspect_ratio;
    if (params.imageSize) body.imageSize = params.imageSize;

    const response = await fetchWithTimeout('/api/mf/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    }, 5 * 60 * 1000);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) notifyAuthRequired(401, formatApiError(data.error, 'Войдите в аккаунт, чтобы генерировать.'));
        if (response.status === 402) throw new Error(`Недостаточно средств. Нужно ${data.required ?? ''}₽, на балансе ${data.balance ?? 0}₽.`);
        throw new Error(formatApiError(data.error || data.detail, `Gemini Image API ${response.status}`));
    }
    const result = normalizeChatImageResult(data);
    if (!result.url) throw new Error('Gemini Image API не вернул изображение.');
    return result;
}

async function dataUrlToBlob(image) {
    const response = await fetch(image);
    if (!response.ok && response.status) throw new Error(`Не удалось прочитать data URL изображения (${response.status}).`);
    return response.blob();
}

async function imageReferenceToEditFile(image, index, forceDownload = false) {
    if (image instanceof Blob) {
        const ext = (image.type.split('/')[1] || 'png').split('+')[0];
        return { blob: image, filename: `reference-${index + 1}.${ext}` };
    }

    if (typeof image === 'string' && image.startsWith('data:')) {
        const blob = await dataUrlToBlob(image);
        const ext = (blob.type.split('/')[1] || 'png').split('+')[0];
        return { blob, filename: `reference-${index + 1}.${ext}` };
    }

    if (typeof image === 'string' && /^https?:\/\//i.test(image)) {
        if (forceDownload) {
            const response = await fetch(image);
            if (!response.ok) throw new Error(`Не удалось скачать изображение (${response.status}).`);
            const blob = await response.blob();
            const ext = (blob.type.split('/')[1] || 'png').split('+')[0];
            return { blob, filename: `reference-${index + 1}.${ext}` };
        }
        return image;
    }

    return image;
}

export async function generateImage(apiKey, params) {
    const modelInfo = getImageModelById(params.model);
    const rawModelId = modelInfo?.apiId || params.model;
    const modelId = applyImageRouting(rawModelId, params.routing);
    if (isChatImageModel(params.model) || isChatImageModel(rawModelId)) {
        return generateChatImage(apiKey, modelId, params);
    }
    const body = {
        model: modelId,
        prompt: params.prompt || '',
        n: 1,
        size: computeImageSize(params.aspect_ratio, params.imageSize || params.size),
        response_format: 'url',
    };
    if (params.quality) body.quality = params.quality;
    if (params.format) body.format = params.format;
    if (params.image_url) body.image_url = params.image_url;

    const response = await fetchWithTimeout('/api/mf/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    }, 5 * 60 * 1000);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) notifyAuthRequired(401, formatApiError(data.error, 'Войдите в аккаунт, чтобы генерировать.'));
        if (response.status === 402) throw new Error(`Недостаточно средств. Нужно ${data.required ?? ''}₽, на балансе ${data.balance ?? 0}₽.`);
        throw new Error(formatApiError(data.error || data.detail, `Image API ${response.status}`));
    }
    return normalizeImageResult(data);
}

export async function generateI2I(apiKey, params) {
    const modelInfo = getI2IModelById(params.model) || getImageModelById(params.model);
    const modelId = applyImageRouting(modelInfo?.apiId || params.model, params.routing);
    if (isChatImageModel(params.model) || isChatImageModel(modelInfo?.apiId || params.model)) {
        return generateChatImage(apiKey, modelId, params);
    }

    const images = [
        ...(Array.isArray(params.images_list) ? params.images_list : []),
        params.image_url,
    ].filter(Boolean).filter((image, index, list) => list.indexOf(image) === index);

    const form = new FormData();
    form.append('model', modelId);
    form.append('prompt', params.prompt || '');
    form.append('n', '1');
    form.append('size', computeImageSize(params.aspect_ratio, params.imageSize || params.size));
    if (params.quality) form.append('quality', params.quality);
    if (params.format) form.append('format', params.format);
    if (params.background) form.append('background', params.background);
    if (params.moderation) form.append('moderation', params.moderation);
    if (params.name) form.append('name', params.name);

    for (let index = 0; index < images.length; index += 1) {
        const uploadable = await imageReferenceToEditFile(images[index], index, true);
        const fieldName = index === 0 ? 'image' : 'image[]';
        if (uploadable?.blob) {
            form.append(fieldName, uploadable.blob, uploadable.filename);
        } else {
            form.append(fieldName, uploadable);
        }
    }

    const response = await fetchWithTimeout('/api/mf/v1/images/edits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: form,
    }, 5 * 60 * 1000);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401) notifyAuthRequired(401, formatApiError(data.error, 'Войдите в аккаунт, чтобы генерировать.'));
        if (response.status === 402) throw new Error(`Недостаточно средств. Нужно ${data.required ?? ''}₽, на балансе ${data.balance ?? 0}₽.`);
        throw new Error(formatApiError(data.error || data.detail, `Image Edit API ${response.status}`));
    }
    return normalizeImageResult(data);
}
