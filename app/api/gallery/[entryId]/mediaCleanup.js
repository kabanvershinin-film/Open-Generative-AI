function toArray(values) {
    return values.filter((value) => typeof value === 'string' && value.trim());
}

function unique(values) {
    return [...new Set(values)];
}

function getTosObjectKey(url, host) {
    if (!url || !host) return null;
    try {
        const parsed = new URL(url);
        if (parsed.origin !== `https://${host}`) return null;
        return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    } catch {
        return null;
    }
}

export function getManagedGalleryObjectKeys(entry, { host, userId } = {}) {
    if (!entry || !host || !userId) return [];

    const allowedPrefixes = [
        `users/${userId}/images/`,
        `users/${userId}/videos/`,
        `users/${userId}/audio/`,
    ];

    const urls = toArray([
        entry.url,
        entry.thumbnail,
        entry.thumbnail_url,
        entry.thumbnailUrl,
        entry.preview_url,
        entry.previewUrl,
    ]);

    return unique(
        urls
            .map((url) => getTosObjectKey(url, host))
            .filter((key) => key && allowedPrefixes.some((prefix) => key.startsWith(prefix))),
    );
}
