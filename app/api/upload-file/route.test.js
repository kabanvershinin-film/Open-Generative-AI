import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildUploadTarget,
    getExtensionFromContentType,
    getExtensionFromFilename,
    getUploadFolder,
    isExistingTosUrl,
    resolveUploadSource,
} from './logic.js';

test('getUploadFolder выбирает папку по content-type', () => {
    assert.strictEqual(getUploadFolder('image/png'), 'images');
    assert.strictEqual(getUploadFolder('video/mp4'), 'videos');
    assert.strictEqual(getUploadFolder('audio/wav'), 'audio');
});

test('getExtensionFromContentType извлекает расширение и убирает суффикс', () => {
    assert.strictEqual(getExtensionFromContentType('image/svg+xml'), 'svg');
    assert.strictEqual(getExtensionFromContentType('audio/mpeg'), 'mpeg');
    assert.strictEqual(getExtensionFromContentType(''), 'png');
});

test('getExtensionFromFilename извлекает расширение и использует bin fallback', () => {
    assert.strictEqual(getExtensionFromFilename('clip.mp4'), 'mp4');
    assert.strictEqual(getExtensionFromFilename('archive.tar.gz'), 'gz');
    assert.strictEqual(getExtensionFromFilename('upload'), 'bin');
});

test('isExistingTosUrl распознаёт только url текущего TOS host', () => {
    assert.strictEqual(isExistingTosUrl('https://bucket.tos.example.com/users/u1/image.png', 'bucket.tos.example.com'), true);
    assert.strictEqual(isExistingTosUrl('https://cdn.example.com/image.png', 'bucket.tos.example.com'), false);
    assert.strictEqual(isExistingTosUrl('', 'bucket.tos.example.com'), false);
});

test('resolveUploadSource декодирует base64 payload', async () => {
    const result = await resolveUploadSource('data:image/png;base64,AQID');

    assert.strictEqual(result.contentType, 'image/png');
    assert.ok(Buffer.isBuffer(result.buffer));
    assert.deepStrictEqual([...result.buffer], [1, 2, 3]);
});

test('resolveUploadSource скачивает внешний url и возвращает content-type', async () => {
    let requestedUrl = null;

    const result = await resolveUploadSource('https://cdn.example.com/source.wav', async (url) => {
        requestedUrl = url;
        return {
            ok: true,
            headers: { get: (name) => (name === 'content-type' ? 'audio/wav' : null) },
            arrayBuffer: async () => new Uint8Array([4, 5, 6]).buffer,
        };
    });

    assert.strictEqual(requestedUrl, 'https://cdn.example.com/source.wav');
    assert.strictEqual(result.contentType, 'audio/wav');
    assert.deepStrictEqual([...result.buffer], [4, 5, 6]);
});

test('resolveUploadSource использует image/png fallback если сервер не прислал content-type', async () => {
    const result = await resolveUploadSource('https://cdn.example.com/source.bin', async () => ({
        ok: true,
        headers: { get: () => null },
        arrayBuffer: async () => new Uint8Array([7]).buffer,
    }));

    assert.strictEqual(result.contentType, 'image/png');
    assert.deepStrictEqual([...result.buffer], [7]);
});

test('resolveUploadSource бросает 400 для пустого значения', async () => {
    await assert.rejects(
        resolveUploadSource(''),
        (error) => error.message === 'Missing image/url' && error.status === 400,
    );
});

test('resolveUploadSource бросает 502 если скачивание завершилось ошибкой', async () => {
    await assert.rejects(
        resolveUploadSource('https://cdn.example.com/missing.png', async () => ({ ok: false })),
        (error) => error.message === 'Fetch failed' && error.status === 502,
    );
});

test('buildUploadTarget строит key для GET по filename', () => {
    const result = buildUploadTarget({
        filename: 'clip.mp4',
        contentType: 'video/mp4',
        userId: 'user-1',
        buildKey: (userId, folder, ext) => `${userId}/${folder}.${ext}`,
    });

    assert.deepStrictEqual(result, {
        folder: 'videos',
        ext: 'mp4',
        key: 'user-1/videos.mp4',
    });
});

test('buildUploadTarget строит key для POST по content-type', () => {
    const result = buildUploadTarget({
        contentType: 'audio/wav',
        userId: null,
        buildKey: (userId, folder, ext) => `${userId ?? 'anonymous'}/${folder}.${ext}`,
    });

    assert.deepStrictEqual(result, {
        folder: 'audio',
        ext: 'wav',
        key: 'anonymous/audio.wav',
    });
});
