import { getT2vModels, getI2vModels, getV2vModels, getT2iModels, getI2iModels } from './models.js';

export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_REFERENCE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
export const LARGE_IMAGE_UPLOAD_OPTIMIZE_THRESHOLD_BYTES = 5 * 1024 * 1024;
export const LARGE_IMAGE_UPLOAD_TARGET_BYTES = 4.5 * 1024 * 1024;
export const SUPPORTED_IMAGE_UPLOAD_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'tif', 'tiff',
    'raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'raf', 'rw2', 'pef', 'srw',
]);
export const SUPPORTED_IMAGE_UPLOAD_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/x-tiff',
    'image/raw', 'image/x-raw', 'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-nikon-nef',
    'image/x-sony-arw', 'image/x-adobe-dng', 'image/x-olympus-orf', 'image/x-fuji-raf',
]);
export const SUPPORTED_IMAGE_REFERENCE_EXTENSIONS = SUPPORTED_IMAGE_UPLOAD_EXTENSIONS;
export const SUPPORTED_IMAGE_REFERENCE_MIME_TYPES = SUPPORTED_IMAGE_UPLOAD_MIME_TYPES;


function getFileExtension(file) {
    return String(file?.name || '').split('.').pop()?.toLowerCase() || '';
}

export function isSupportedImageUploadFile(file) {
    const type = String(file?.type || '').toLowerCase();
    const ext = getFileExtension(file);
    return SUPPORTED_IMAGE_UPLOAD_MIME_TYPES.has(type) || SUPPORTED_IMAGE_UPLOAD_EXTENSIONS.has(ext);
}

export function isSupportedImageReferenceFile(file) {
    const type = String(file?.type || '').toLowerCase();
    const ext = getFileExtension(file);
    return SUPPORTED_IMAGE_REFERENCE_MIME_TYPES.has(type) && SUPPORTED_IMAGE_REFERENCE_EXTENSIONS.has(ext);
}

export function validateImageReferenceUploadFile(file) {
    if (!file) throw new Error('Файл изображения не выбран.');
    if (!isSupportedImageReferenceFile(file)) {
        throw new Error(`Формат файла не поддерживается: ${file.name || 'без имени'}. Поддерживаются JPG, PNG, TIFF и RAW.`);
    }
    if (file.size > MAX_IMAGE_REFERENCE_UPLOAD_SIZE_BYTES) {
        throw new Error(`Файл слишком большой: ${file.name || 'без имени'}. Максимальный размер — 50 МБ.`);
    }
    return true;
}

export function validateImageUploadFile(file) {
    if (!file) throw new Error('Файл изображения не выбран.');
    if (!isSupportedImageUploadFile(file)) {
        throw new Error(`Формат файла не поддерживается: ${file.name || 'без имени'}. Поддерживаются JPG, PNG, TIFF и RAW.`);
    }
    if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
        throw new Error(`Файл слишком большой: ${file.name || 'без имени'}. Максимальный размер — 50 МБ.`);
    }
    return true;
}

function readFileAsDataUrl(file, FileReaderCtor) {
    return new Promise((resolve, reject) => {
        const reader = new FileReaderCtor();
        reader.onerror = () => reject(new Error('Не удалось прочитать изображение перед загрузкой.'));
        reader.onload = (event) => resolve(event?.target?.result || reader.result);
        reader.readAsDataURL(file);
    });
}

function loadImageElement(src, ImageCtor) {
    return new Promise((resolve, reject) => {
        const image = new ImageCtor();
        image.onerror = () => reject(new Error('Не удалось подготовить изображение к загрузке.'));
        image.onload = () => resolve(image);
        image.src = src;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob || null), type, quality);
    });
}

export async function optimizeImageUploadFile(file, options = {}, runtime = {}) {
    const optimizeAboveBytes = options.optimizeAboveBytes ?? LARGE_IMAGE_UPLOAD_OPTIMIZE_THRESHOLD_BYTES;
    const targetMaxBytes = options.targetMaxBytes ?? LARGE_IMAGE_UPLOAD_TARGET_BYTES;
    const maxWidth = options.maxWidth ?? 2048;
    const maxHeight = options.maxHeight ?? 2048;
    const outputType = options.outputType ?? 'image/jpeg';
    const qualitySteps = options.qualitySteps ?? [0.86, 0.78, 0.7];

    if (!file || !String(file.type || '').startsWith('image/') || file.size <= optimizeAboveBytes) {
        return file;
    }

    const FileReaderCtor = runtime.FileReader ?? globalThis.FileReader;
    const ImageCtor = runtime.Image ?? globalThis.Image;
    const documentRef = runtime.document ?? globalThis.document;
    const FileCtor = runtime.File ?? globalThis.File;

    if (typeof FileReaderCtor !== 'function' || typeof ImageCtor !== 'function' || !documentRef?.createElement) {
        return file;
    }

    try {
        const dataUrl = await readFileAsDataUrl(file, FileReaderCtor);
        const image = await loadImageElement(dataUrl, ImageCtor);
        const canvas = documentRef.createElement('canvas');
        const ctx = canvas?.getContext?.('2d');
        if (!ctx) return file;

        let width = image.width || maxWidth;
        let height = image.height || maxHeight;
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);

        let optimizedBlob = null;
        for (const quality of qualitySteps) {
            const blob = await canvasToBlob(canvas, outputType, quality);
            if (!blob) continue;
            optimizedBlob = blob;
            if (blob.size <= targetMaxBytes) break;
        }

        if (!optimizedBlob || optimizedBlob.size >= file.size) return file;

        const baseName = String(file.name || 'image').replace(/\.[^/.]+$/, '');
        const optimizedName = `${baseName}.jpg`;
        if (typeof FileCtor === 'function') {
            return new FileCtor([optimizedBlob], optimizedName, { type: optimizedBlob.type || outputType });
        }

        Object.defineProperty(optimizedBlob, 'name', {
            value: optimizedName,
            configurable: true,
        });
        return optimizedBlob;
    } catch {
        return file;
    }
}

function createUploadError(error, fallback) {
    if (typeof error === 'string' && error.trim()) return new Error(error);
    if (error?.message) return new Error(error.message);
    return new Error(fallback);
}

// Internal helper to get model metadata from either T2V or I2V lists.
function getVideoModelById(id) {
    const all = [...getT2vModels(), ...getI2vModels(), ...getV2vModels()];
    return all.find((m) => m.id === id);
}
function getI2VModelById(id) {
    return getI2vModels().find((m) => m.id === id);
}
function getImageModelById(id) {
    const all = [...getT2iModels(), ...getI2iModels()];
    return all.find((m) => m.id === id);
}
function getI2IModelById(id) {
    return getI2iModels().find((m) => m.id === id);
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

    const r = await fetch('/api/mf/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
        if (r.status === 401) notifyAuthRequired(401, formatApiError(data.error, 'Войдите в аккаунт, чтобы генерировать.'));
        if (r.status === 402) throw new Error(`Недостаточно средств. Нужно ${data.required ?? ''}₽, на балансе ${data.balance ?? 0}₽.`);
        throw new Error(formatApiError(data.error || data.detail, `Gemini Image API ${r.status}`));
    }
    const result = normalizeChatImageResult(data);
    if (!result.url) throw new Error('Gemini Image API не вернул изображение.');
    return result;
}

function formatApiError(error, fallback) {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    if (typeof error === 'object') {
        return error.message || error.detail || error.error || error.code || JSON.stringify(error);
    }
    return String(error);
}

function notifyAuthRequired(status, message) {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('muapi:auth-required', { detail: { status, message } });
        window.dispatchEvent(event);
    }
}

function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal })
        .catch((error) => {
            if (error?.name === 'AbortError') {
                throw new Error(`Таймаут соединения (${Math.round(timeoutMs / 1000)}с): ${url}`);
            }
            throw error;
        })
        .finally(() => clearTimeout(timeout));
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

    console.info('[muapi] Submit Ark Seedance task', {
        model: body.model,
        hasFaceAsset: !!body.face_asset,
        imageRefs: [body.image_url, ...(body.image_urls || [])].filter(Boolean).length,
        videoRefs: [body.video_url, ...(body.video_urls || [])].filter(Boolean).length,
        audioRefs: [body.audio_url, ...(body.audio_urls || [])].filter(Boolean).length,
    });

    // Step 1: submit task (fast — just creates the Ark task and returns taskId)
    const submit = await fetchWithTimeout('/api/ark/seedance', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
    }, 30000);
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
        const poll = await fetchWithTimeout(`/api/ark/seedance?taskId=${encodeURIComponent(taskId)}${billQs}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        }, 20000);
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

// ── Image generation ─────────────────────────────────────────────────────────

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

    const r = await fetch('/api/mf/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
        if (r.status === 401) notifyAuthRequired(401, formatApiError(data.error, 'Войдите в аккаунт, чтобы генерировать.'));
        if (r.status === 402) throw new Error(`Недостаточно средств. Нужно ${data.required ?? ''}₽, на балансе ${data.balance ?? 0}₽.`);
        throw new Error(formatApiError(data.error || data.detail, `Image API ${r.status}`));
    }
    return normalizeImageResult(data);
}

async function dataUrlToBlob(image) {
    const response = await fetch(image);
    if (!response.ok && response.status) throw new Error(`Не удалось прочитать data URL изображения (${response.status}).`);
    return response.blob();
}

async function imageReferenceToEditFile(image, index) {
    if (image instanceof Blob) {
        const ext = (image.type.split('/')[1] || 'png').split('+')[0];
        return { blob: image, filename: `reference-${index + 1}.${ext}` };
    }

    if (typeof image === 'string' && image.startsWith('data:')) {
        const blob = await dataUrlToBlob(image);
        const ext = (blob.type.split('/')[1] || 'png').split('+')[0];
        return { blob, filename: `reference-${index + 1}.${ext}` };
    }

    // If it's a URL, just return it as a string—let's send it directly instead of downloading!
    if (typeof image === 'string' && /^https?:\/\//i.test(image)) {
        return image;
    }

    return image;
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
        const image = images[index];
        const uploadable = await imageReferenceToEditFile(image, index);
        const fieldName = index === 0 ? 'image' : 'image[]';
        if (uploadable?.blob) {
            form.append(fieldName, uploadable.blob, uploadable.filename);
        } else {
            form.append(fieldName, uploadable);
        }
    }

    const r = await fetch('/api/mf/v1/images/edits', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: form,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
        if (r.status === 401) notifyAuthRequired(401, formatApiError(data.error, 'Войдите в аккаунт, чтобы генерировать.'));
        if (r.status === 402) throw new Error(`Недостаточно средств. Нужно ${data.required ?? ''}₽, на балансе ${data.balance ?? 0}₽.`);
        throw new Error(formatApiError(data.error || data.detail, `Image Edit API ${r.status}`));
    }
    return normalizeImageResult(data);
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
    validateImageUploadFile(file);
    const uploadViaPresignedUrl = async () => {
        const contentType = file.type || 'application/octet-stream';
        const sign = await fetch(`/api/upload-file?filename=${encodeURIComponent(file.name || 'image')}&type=${encodeURIComponent(contentType)}`);
        const signData = await sign.json().catch(() => ({}));
        if (!sign.ok) throw createUploadError(signData.error || signData.detail, `Не удалось подготовить загрузку (${sign.status}).`);
        if (!signData.putUrl || !signData.publicUrl) throw new Error('Сервер не вернул URL для загрузки изображения.');

        onProgress?.(35);

        if (typeof XMLHttpRequest !== 'function') {
            const put = await fetch(signData.putUrl, {
                method: 'PUT',
                headers: { 'Content-Type': contentType },
                body: file,
            });
            if (!put.ok) throw new Error(`Прямая загрузка изображения не удалась (${put.status}).`);
            onProgress?.(100);
            return signData.publicUrl;
        }

        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signData.putUrl);
            xhr.setRequestHeader('Content-Type', contentType);
            xhr.upload.onprogress = (event) => {
                if (!event?.lengthComputable || !event.total) return;
                const scaled = 35 + Math.round((event.loaded * 60) / event.total);
                onProgress?.(Math.min(95, scaled));
            };
            xhr.onload = () => {
                const ok = xhr.status >= 200 && xhr.status < 300;
                if (!ok) {
                    reject(new Error(`Прямая загрузка изображения не удалась (${xhr.status}).`));
                    return;
                }
                onProgress?.(100);
                resolve();
            };
            xhr.onerror = () => {
                reject(new Error('Прямая загрузка изображения не удалась (network error).'));
            };
            xhr.send(file);
        });
        return signData.publicUrl;
    };

    const uploadViaAssetApi = async () => {
        const formData = new FormData();
        formData.append('file', file, file.name || 'image');
        const r = await fetch('/api/mf/v1/assets/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData,
        });
        const data = await r.json().catch(() => ({}));
        const uploadedUrl = data.url || data.file_url || data.data?.url;
        if (r.ok && uploadedUrl) return uploadedUrl;
        throw createUploadError(data.error || data.detail, `Сервер загрузки вернул ошибку ${r.status}.`);
    };

    onProgress?.(5);
    let primaryError = null;
    try {
        onProgress?.(15);
        return await uploadViaPresignedUrl();
    } catch (error) {
        primaryError = error?.message || 'Ошибка сети при прямой загрузке изображения.';
    }

    try {
        onProgress?.(70);
        const assetUrl = await uploadViaAssetApi();
        onProgress?.(100);
        return assetUrl;
    } catch (fallbackError) {
        onProgress?.(0);
        throw new Error(`${primaryError} ${fallbackError?.message || ''}`.trim());
    }
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

export async function getTemplateWorkflows(_apiKey) {
    return [];
}

export async function getPublishedWorkflows(apiKey) {
    try {
        const r = await fetch('/api/workflow/community', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!r.ok) return [];
        const data = await r.json().catch(() => []);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export async function createWorkflow(apiKey, data = {}) {
    const r = await fetch('/api/workflow/create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to create workflow');
    return r.json();
}

export async function updateWorkflowName(apiKey, id, name) {
    const r = await fetch(`/api/workflow/${id}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    if (!r.ok) return {};
    return r.json();
}

export async function deleteWorkflow(apiKey, id) {
    await fetch(`/api/workflow/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return { success: true };
}

export async function getWorkflowData(apiKey, id) {
    try {
        const response = await fetch(`/api/workflow/${id}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error('Not found');
        const wf = await response.json();
        return {
            workflow_id: id,
            id,
            name: wf.name || 'Untitled Workflow',
            data: { nodes: wf.nodes || wf.data?.nodes || [] },
            edges: wf.edges || [],
            is_owner: wf.is_owner ?? true,
            is_published: wf.is_published ?? false,
            is_template: wf.is_template ?? false,
            show_temp_button: wf.show_temp_button ?? false,
            can_edit: wf.can_edit ?? wf.is_owner ?? true,
            run_id: wf.run_id || null,
            category: wf.category || 'General',
            thumbnail: wf.thumbnail || null,
        };
    } catch {
        return {
            workflow_id: id,
            id,
            name: 'Untitled Workflow',
            data: { nodes: [] },
            edges: [],
            is_owner: true,
            can_edit: true,
            is_published: false,
            is_template: false,
            show_temp_button: false,
            run_id: null,
            category: 'General',
        };
    }
}

export async function getWorkflowInputs(apiKey, id) {
    try {
        const wf = await getWorkflowData(apiKey, id);
        const nodes = wf.data?.nodes || wf.nodes || [];
        const properties = {};
        for (const node of nodes) {
            const cat = node.category || node.type || '';
            const model = node.model || '';
            if (cat === 'text' || node.type === 'textNode') {
                const prompt = node.input_params?.prompt || node.data?.formValues?.prompt || '';
                properties[node.id] = {
                    type: 'string',
                    title: node.id,
                    description: 'Text input',
                    default: prompt,
                    examples: [prompt],
                };
            } else if (model.includes('passthrough') && (cat === 'image' || node.type === 'uploadNode')) {
                const url = node.input_params?.image_url || node.data?.formValues?.image_url || '';
                properties[node.id] = {
                    type: 'string',
                    title: `${node.id} (image URL)`,
                    description: 'Image URL',
                    field: 'image',
                    default: url,
                };
            }
        }
        return { properties, required: [] };
    } catch {
        return { properties: {}, required: [] };
    }
}

export async function getAllNodeSchemas(_apiKey, id) {
    try {
        const response = await fetch(`/api/workflow/${id}/node-schemas`);
        if (!response.ok) return { categories: {} };
        const data = await response.json().catch(() => ({ categories: {} }));
        return data && typeof data === 'object' ? data : { categories: {} };
    } catch {
        return { categories: {} };
    }
}

export async function getNodeSchemas(_apiKey) {
    return { categories: {} };
}

export async function calculateDynamicCost(_apiKey) {
    return { cost: 0 };
}

export async function executeWorkflow(apiKey, id, inputs) {
    const response = await fetch(`/api/workflow/${id}/run`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: inputs || {} }),
    });
    if (!response.ok) throw new Error('Failed to execute workflow');
    return response.json();
}

export async function getUserBalance(apiKey) {
    const r = await fetch('/api/user/balance', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await r.json().catch(() => ({ balance: 0 }));
    return data.balance ?? 0;
}
