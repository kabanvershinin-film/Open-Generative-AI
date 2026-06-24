export function getUploadFolder(contentType = '') {
    if (contentType.startsWith('video/')) return 'videos';
    if (contentType.startsWith('audio/')) return 'audio';
    return 'images';
}

export function getExtensionFromContentType(contentType = '') {
    return (contentType.split('/')[1] || 'png').split('+')[0];
}

export function getExtensionFromFilename(filename = '') {
    if (!filename.includes('.')) return 'bin';
    return filename.split('.').pop()?.toLowerCase() || 'bin';
}

export function isExistingTosUrl(src, tosHost) {
    return Boolean(src && tosHost && src.startsWith(`https://${tosHost}/`));
}

function createUploadError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

export async function resolveUploadSource(src, fetchImpl = fetch) {
    if (!src || typeof src !== 'string') {
        throw createUploadError('Missing image/url', 400);
    }

    const match = src.match(/^data:([^;]+);base64,(.+)$/s);
    if (match) {
        return {
            contentType: match[1],
            buffer: Buffer.from(match[2], 'base64'),
        };
    }

    const response = await fetchImpl(src);
    if (!response.ok) {
        throw createUploadError('Fetch failed', 502);
    }

    return {
        contentType: response.headers.get('content-type') || 'image/png',
        buffer: Buffer.from(await response.arrayBuffer()),
    };
}

export function buildUploadTarget({ filename = '', contentType = 'application/octet-stream', userId = null, buildKey }) {
    const folder = getUploadFolder(contentType);
    const ext = filename ? getExtensionFromFilename(filename) : getExtensionFromContentType(contentType);
    return {
        folder,
        ext,
        key: buildKey(userId, folder, ext),
    };
}
