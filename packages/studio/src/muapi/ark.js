import { fetchWithTimeout, formatApiError, notifyAuthRequired } from './core.js';

async function generateSeedanceArk(apiKey, modelInfo, params) {
    const fast = /fast/.test(modelInfo?.apiId || modelInfo?.id || '');
    const uploadedUrl = params.image_url;
    const initialImages = Array.isArray(params.image_urls) ? [...params.image_urls] : [];

    const finalImages = [];
    if (uploadedUrl) {
        finalImages.push(typeof uploadedUrl === 'string' ? { url: uploadedUrl } : uploadedUrl);
    }
    initialImages.forEach((img) => {
        const url = typeof img === 'string' ? img : img.url;
        if (url) {
            finalImages.push(typeof img === 'string' ? { url: img } : img);
        }
    });

    const body = {
        fast,
        model: modelInfo?.apiId || modelInfo?.id || undefined,
        is_i2v: params.is_i2v ?? false,
        prompt: params.prompt || '',
        image_urls: finalImages.length > 0 ? finalImages : undefined,
        video_url: params.video_url || undefined,
        video_urls: Array.isArray(params.video_urls) ? params.video_urls : undefined,
        audio_url: params.audio_url || undefined,
        audio_urls: Array.isArray(params.audio_urls) ? params.audio_urls : undefined,
        resolution: fast ? '720p' : (params.resolution || undefined),
        ratio: params.aspect_ratio || undefined,
        duration: params.duration || undefined,
        last_image_url: params.last_image_url || undefined,
        generate_audio: params.generate_audio || undefined,
        seed: params.seed !== undefined ? params.seed : undefined,
        return_last_frame: params.return_last_frame !== undefined ? params.return_last_frame : undefined,
    };

    console.info('[muapi] Submit Ark Seedance task', {
        model: body.model,
        assetRefs: (body.image_urls || []).filter((item) => String(item?.url || "").startsWith('asset://')).length,
        imageRefs: (body.image_urls || []).length,
        videoRefs: [body.video_url, ...(body.video_urls || [])].filter(Boolean).length,
        audioRefs: [body.audio_url, ...(body.audio_urls || [])].filter(Boolean).length,
    });

    const submit = await fetchWithTimeout('/api/ark/seedance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
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
            errorMsg = 'Ошибка безопасности: обнаружен реальный человек. Если вы используете персонажа, убедитесь, что в промпте есть тег 图片1 (или соответствующий номер).';
        }
        throw new Error(`Ark: ${errorMsg}`);
    }
    const taskId = submitData.taskId;
    if (!taskId) throw new Error('Ark: задача не создана (нет taskId).');

    params.onTaskId?.(taskId, submitData.bill);
    if (params.onRequestId) params.onRequestId(taskId);

    return pollArkTask(apiKey, taskId, submitData.bill);
}

export async function pollArkTask(apiKey, taskId, bill) {
    const resolvedApiKey = bill === undefined ? null : apiKey;
    const resolvedTaskId = bill === undefined ? apiKey : taskId;
    const resolvedBill = bill === undefined ? taskId : bill;
    const billQs = resolvedBill ? `&bill=${encodeURIComponent(resolvedBill)}` : '';

    for (let attempt = 0; attempt < 600; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const poll = await fetchWithTimeout(`/api/ark/seedance?taskId=${encodeURIComponent(resolvedTaskId)}${billQs}`, {
            headers: resolvedApiKey ? { 'Authorization': `Bearer ${resolvedApiKey}` } : undefined,
        }, 20000);
        const data = await poll.json().catch(() => ({}));
        if (!poll.ok) continue;
        const status = (data.status || '').toLowerCase();
        if (status === 'succeeded' || status === 'success') {
            if (!data.url) throw new Error('Ark: видео готово, но URL не получен.');
            return {
                url: data.url,
                id: resolvedTaskId,
                last_frame_url: data.last_frame_url || null,
            };
        }
        if (status === 'failed' || status === 'error' || status === 'expired' || status === 'cancelled') {
            throw new Error(`Ark: генерация не удалась (${formatApiError(data.error || status, status)}).`);
        }
    }
    throw new Error('Ark: превышено время ожидания генерации.');
}

export { generateSeedanceArk };
