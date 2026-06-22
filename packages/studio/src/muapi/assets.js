import { createUploadError } from './core.js';
import { validateImageUploadFile } from './files.js';

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
        const response = await fetch('/api/mf/v1/assets/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData,
        });
        const data = await response.json().catch(() => ({}));
        const uploadedUrl = data.url || data.file_url || data.data?.url;
        if (response.ok && uploadedUrl) return uploadedUrl;
        throw createUploadError(data.error || data.detail, `Сервер загрузки вернул ошибку ${response.status}.`);
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
        const response = await fetch('/api/upload-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
        const data = await response.json().catch(() => ({}));
        return data.url || url;
    } catch {
        return url;
    }
}
