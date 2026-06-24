import test from 'node:test';
import assert from 'node:assert/strict';

import { getManagedGalleryObjectKeys } from './mediaCleanup.js';

test('getManagedGalleryObjectKeys возвращает ключи фото и видео из нашего TOS', () => {
    const keys = getManagedGalleryObjectKeys({
        url: 'https://bucket.example.volces.com/users/user-1/images/photo.png?x-tos-process=image/resize,w_512',
        preview_url: 'https://bucket.example.volces.com/users/user-1/videos/clip.mp4',
    }, {
        host: 'bucket.example.volces.com',
        userId: 'user-1',
    });

    assert.deepStrictEqual(keys, [
        'users/user-1/images/photo.png',
        'users/user-1/videos/clip.mp4',
    ]);
});

test('getManagedGalleryObjectKeys игнорирует внешние и чужие URL', () => {
    const keys = getManagedGalleryObjectKeys({
        url: 'https://cdn.example.com/public/file.png',
        thumbnail: 'https://bucket.example.volces.com/users/user-2/images/other.png',
        previewUrl: 'not-a-url',
    }, {
        host: 'bucket.example.volces.com',
        userId: 'user-1',
    });

    assert.deepStrictEqual(keys, []);
});

test('getManagedGalleryObjectKeys удаляет дубликаты и декодирует путь', () => {
    const keys = getManagedGalleryObjectKeys({
        url: 'https://bucket.example.volces.com/users/user-1/images/file%20name.png',
        thumbnail_url: 'https://bucket.example.volces.com/users/user-1/images/file%20name.png',
        preview_url: 'https://bucket.example.volces.com/users/user-1/audio/voice.mp3?download=1',
    }, {
        host: 'bucket.example.volces.com',
        userId: 'user-1',
    });

    assert.deepStrictEqual(keys, [
        'users/user-1/images/file name.png',
        'users/user-1/audio/voice.mp3',
    ]);
});
