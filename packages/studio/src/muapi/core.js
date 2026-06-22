export function createUploadError(error, fallback) {
    if (typeof error === 'string' && error.trim()) return new Error(error);
    if (error?.message) return new Error(error.message);
    return new Error(fallback);
}

export function formatApiError(error, fallback) {
    if (!error) return fallback;
    let msg;
    if (typeof error === 'string') {
        msg = error;
    } else if (typeof error === 'object') {
        msg = error.message || error.detail || error.error || error.code || JSON.stringify(error);
    } else {
        msg = String(error);
    }
    if (msg.includes('copyright restrictions') || msg.includes('content restrictions') || msg.includes('violates policy')) {
        return 'Ошибка: видео не удалось создать — возможно, оно связано с авторскими правами или нарушением политики контента.';
    }
    return msg;
}

export function notifyAuthRequired(status, message) {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('muapi:auth-required', { detail: { status, message } });
        window.dispatchEvent(event);
    }
}

export function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
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
