export function parsePendingGenerationFilters(requestUrl) {
    const { searchParams } = new URL(requestUrl);
    const studio = searchParams.get('studio') || undefined;
    const statuses = (searchParams.get('statuses') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    return { studio, statuses };
}

function getPendingGalleryDedupeKey(body = {}) {
    return [
        body?.entry?.dedupeKey,
        body?.entry?.dedupe_key,
        body?.dedupeKey,
        body?.dedupe_key,
    ].find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

export function buildPendingGallerySaveInput(userId, body = {}) {
    if (!userId) return null;
    if (body?.status !== 'completed') return null;
    if (!body?.entry?.url) return null;

    const dedupeKey = getPendingGalleryDedupeKey(body);
    return {
        userId,
        url: body.entry.url,
        type: body.entry.type || body.type || 'video',
        model: body.entry.model || body.model || '',
        prompt: body.entry.prompt || body.prompt || '',
        extra: dedupeKey ? { dedupeKey } : {},
    };
}

export function applySavedPendingGalleryEntry(body = {}, galleryEntry) {
    const nextBody = { ...(body || {}) };
    if (!galleryEntry) return { nextBody, savedEntry: null };

    nextBody.entry = {
        ...(nextBody.entry || {}),
        id: nextBody.entry?.id || galleryEntry.id,
        url: galleryEntry.url,
        created_at: galleryEntry.created_at,
        dedupeKey: nextBody.entry?.dedupeKey || nextBody.entry?.dedupe_key || galleryEntry.dedupe_key,
        dedupe_key: nextBody.entry?.dedupe_key || galleryEntry.dedupe_key,
    };

    return {
        nextBody,
        savedEntry: galleryEntry,
    };
}
