export function paginateGalleryEntries(entries, searchParams) {
    let filtered = Array.isArray(entries) ? entries : [];
    const type = searchParams.get('type');
    if (type) filtered = filtered.filter((e) => e.type === type);

    const parsedLimit = Number(searchParams.get('limit') || 18);
    const parsedCursor = Number(searchParams.get('cursor') || 0);
    const limit = Math.max(1, Math.min(50, Number.isFinite(parsedLimit) ? parsedLimit : 18));
    const cursor = Math.max(0, Number.isFinite(parsedCursor) ? parsedCursor : 0);
    const pagedEntries = filtered.slice(cursor, cursor + limit).map((entry) => ({
        ...entry,
        preview_url: entry.preview_url || entry.thumbnail || null,
    }));
    const nextCursor = cursor + pagedEntries.length < filtered.length ? cursor + pagedEntries.length : null;

    return { entries: pagedEntries, nextCursor, total: filtered.length, limit, cursor };
}
