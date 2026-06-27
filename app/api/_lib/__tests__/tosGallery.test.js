import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGalleryEntryId, mergeGalleryIndexEntries } from '../tosGallery.js';

test('buildGalleryEntryId делает стабильный id для одного dedupeKey', () => {
    const first = buildGalleryEntryId('user-1', 'image', 'mf-image:req-123');
    const second = buildGalleryEntryId('user-1', 'image', 'mf-image:req-123');
    const third = buildGalleryEntryId('user-1', 'image', 'mf-image:req-456');

    assert.strictEqual(first, second);
    assert.notStrictEqual(first, third);
    assert.match(first, /^dedupe_/);
});

test('mergeGalleryIndexEntries заменяет старую запись с тем же dedupeKey', () => {
    const next = mergeGalleryIndexEntries([
        {
            id: 'dedupe_old',
            url: 'https://cdn.example.com/raw.png',
            dedupe_key: 'mf-image:req-123',
            created_at: '2026-06-27T17:00:00.000Z',
        },
        {
            id: 'other',
            url: 'https://cdn.example.com/other.png',
            created_at: '2026-06-27T16:00:00.000Z',
        },
    ], {
        id: 'dedupe_new',
        url: 'https://tos.example.com/final.png',
        dedupe_key: 'mf-image:req-123',
        created_at: '2026-06-27T17:01:00.000Z',
    });

    assert.deepStrictEqual(next, [
        {
            id: 'dedupe_new',
            url: 'https://tos.example.com/final.png',
            dedupe_key: 'mf-image:req-123',
            created_at: '2026-06-27T17:01:00.000Z',
        },
        {
            id: 'other',
            url: 'https://cdn.example.com/other.png',
            created_at: '2026-06-27T16:00:00.000Z',
        },
    ]);
});

test('mergeGalleryIndexEntries заменяет старую запись с тем же url даже без dedupeKey', () => {
    const next = mergeGalleryIndexEntries([
        { id: 'img-1', url: 'https://cdn.example.com/same.png' },
        { id: 'img-2', url: 'https://cdn.example.com/other.png' },
    ], {
        id: 'img-3',
        url: 'https://cdn.example.com/same.png',
    });

    assert.deepStrictEqual(next, [
        { id: 'img-3', url: 'https://cdn.example.com/same.png' },
        { id: 'img-2', url: 'https://cdn.example.com/other.png' },
    ]);
});
