import test from 'node:test';
import assert from 'node:assert/strict';

import {
    applySavedPendingGalleryEntry,
    buildPendingGallerySaveInput,
    parsePendingGenerationFilters,
} from './logic.js';

test('parsePendingGenerationFilters нормализует studio и statuses', () => {
    const filters = parsePendingGenerationFilters('https://example.com/api/pending-generations?studio=video&statuses=running,%20completed,,failed');

    assert.deepStrictEqual(filters, {
        studio: 'video',
        statuses: ['running', 'completed', 'failed'],
    });
});

test('parsePendingGenerationFilters возвращает пустые фильтры без query', () => {
    const filters = parsePendingGenerationFilters('https://example.com/api/pending-generations');

    assert.deepStrictEqual(filters, {
        studio: undefined,
        statuses: [],
    });
});

test('buildPendingGallerySaveInput собирает payload из entry и верхнего уровня', () => {
    const payload = buildPendingGallerySaveInput('user-1', {
        status: 'completed',
        type: 'video',
        model: 'seedance-default',
        prompt: 'верхний prompt',
        entry: {
            url: 'https://cdn.example.com/video.mp4',
            type: 'image',
            model: 'gemini-image',
            prompt: 'кот',
        },
    });

    assert.deepStrictEqual(payload, {
        userId: 'user-1',
        url: 'https://cdn.example.com/video.mp4',
        type: 'image',
        model: 'gemini-image',
        prompt: 'кот',
    });
});

test('buildPendingGallerySaveInput использует дефолты для completed entry', () => {
    const payload = buildPendingGallerySaveInput('user-1', {
        status: 'completed',
        entry: {
            url: 'https://cdn.example.com/video.mp4',
        },
    });

    assert.deepStrictEqual(payload, {
        userId: 'user-1',
        url: 'https://cdn.example.com/video.mp4',
        type: 'video',
        model: '',
        prompt: '',
    });
});

test('buildPendingGallerySaveInput не создаёт payload для незавершённых или пустых задач', () => {
    assert.strictEqual(buildPendingGallerySaveInput('user-1', { status: 'running', entry: { url: 'https://cdn.example.com/video.mp4' } }), null);
    assert.strictEqual(buildPendingGallerySaveInput('user-1', { status: 'completed', entry: {} }), null);
    assert.strictEqual(buildPendingGallerySaveInput('', { status: 'completed', entry: { url: 'https://cdn.example.com/video.mp4' } }), null);
});

test('applySavedPendingGalleryEntry обновляет entry данными из галереи', () => {
    const result = applySavedPendingGalleryEntry(
        {
            status: 'completed',
            entry: {
                url: 'blob:preview',
                preview_url: 'blob:preview',
                model: 'seedance',
            },
        },
        {
            id: 'gallery-1',
            url: 'https://tos.example.com/final.mp4',
            created_at: '2026-06-24T00:00:00.000Z',
        },
    );

    assert.deepStrictEqual(result, {
        savedEntry: {
            id: 'gallery-1',
            url: 'https://tos.example.com/final.mp4',
            created_at: '2026-06-24T00:00:00.000Z',
        },
        nextBody: {
            status: 'completed',
            entry: {
                url: 'https://tos.example.com/final.mp4',
                preview_url: 'blob:preview',
                model: 'seedance',
                id: 'gallery-1',
                created_at: '2026-06-24T00:00:00.000Z',
            },
        },
    });
});

test('applySavedPendingGalleryEntry сохраняет существующий id если он уже задан', () => {
    const result = applySavedPendingGalleryEntry(
        {
            entry: {
                id: 'local-1',
                url: 'blob:preview',
            },
        },
        {
            id: 'gallery-1',
            url: 'https://tos.example.com/final.mp4',
            created_at: '2026-06-24T00:00:00.000Z',
        },
    );

    assert.strictEqual(result.nextBody.entry.id, 'local-1');
    assert.strictEqual(result.nextBody.entry.url, 'https://tos.example.com/final.mp4');
});

test('applySavedPendingGalleryEntry возвращает исходное тело без сохранения', () => {
    const body = { status: 'running', entry: { url: 'blob:preview' } };
    const result = applySavedPendingGalleryEntry(body, null);

    assert.deepStrictEqual(result, {
        nextBody: body,
        savedEntry: null,
    });
});
