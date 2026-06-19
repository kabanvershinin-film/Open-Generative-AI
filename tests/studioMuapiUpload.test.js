import test from 'node:test';
import assert from 'node:assert/strict';

import { generateI2I, uploadFile } from '../packages/studio/src/muapi.js';

function createImageFile() {
    return {
        name: 'test.jpg',
        type: 'image/jpeg',
        async arrayBuffer() {
            return new Uint8Array([1, 2, 3]).buffer;
        },
    };
}

test('studio uploadFile returns upstream asset url when upload succeeds', async (t) => {
    const progress = [];
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: true,
        json: async () => ({ url: 'https://cdn.example.com/test.jpg' }),
    }));

    const url = await uploadFile('test-key', createImageFile(), (pct) => progress.push(pct));

    assert.strictEqual(url, 'https://cdn.example.com/test.jpg');
    assert.deepStrictEqual(progress, [5, 100]);
    assert.strictEqual(globalThis.fetch.mock.calls.length, 1);
    const [requestUrl, options] = globalThis.fetch.mock.calls[0].arguments;
    assert.strictEqual(requestUrl, '/api/mf/v1/assets/upload');
    assert.strictEqual(options.method, 'POST');
    assert.strictEqual(options.headers.Authorization, 'Bearer test-key');
});

test('studio uploadFile falls back to local upload when upstream fails', async (t) => {
    const progress = [];
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        if (url === '/api/mf/v1/assets/upload') {
            return {
                ok: false,
                json: async () => ({ error: 'Upload failed' }),
            };
        }
        if (url === '/api/upload-file') {
            const body = JSON.parse(options.body);
            assert.match(body.image, /^data:image\/jpeg;base64,/);
            return {
                ok: true,
                json: async () => ({ url: 'https://tos.example.com/ref/test.jpg' }),
            };
        }
        throw new Error(`Unexpected URL: ${url}`);
    });

    const url = await uploadFile('test-key', createImageFile(), (pct) => progress.push(pct));

    assert.strictEqual(url, 'https://tos.example.com/ref/test.jpg');
    assert.deepStrictEqual(progress, [5, 100]);
    assert.strictEqual(globalThis.fetch.mock.calls.length, 2);
    assert.strictEqual(globalThis.fetch.mock.calls[1].arguments[0], '/api/upload-file');
});

test('studio uploadFile returns data url when both upload endpoints fail', async (t) => {
    const progress = [];
    t.mock.method(globalThis, 'fetch', async (url) => {
        if (url === '/api/mf/v1/assets/upload') {
            return {
                ok: false,
                json: async () => ({ error: 'Upload failed' }),
            };
        }
        if (url === '/api/upload-file') {
            return {
                ok: false,
                json: async () => ({ error: 'Upload failed' }),
            };
        }
        throw new Error(`Unexpected URL: ${url}`);
    });

    const url = await uploadFile('test-key', createImageFile(), (pct) => progress.push(pct));

    assert.match(url, /^data:image\/jpeg;base64,/);
    assert.deepStrictEqual(progress, [5, 100]);
    assert.strictEqual(globalThis.fetch.mock.calls.length, 2);
});

test('studio generateI2I sends data url references as file blobs', async (t) => {
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        if (String(url).startsWith('data:image/jpeg;base64,')) {
            return {
                blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
            };
        }
        if (url === '/api/mf/v1/images/edits') {
            const imageEntries = [...options.body.entries()].filter(([key]) => key === 'image[]');
            assert.strictEqual(imageEntries.length, 1);
            assert.ok(imageEntries[0][1] instanceof Blob);
            return {
                ok: true,
                json: async () => ({ url: 'https://cdn.example.com/edited.jpg' }),
            };
        }
        throw new Error(`Unexpected URL: ${url}`);
    });

    const result = await generateI2I('test-key', {
        model: 'gpt-image-2-edit',
        images_list: ['data:image/jpeg;base64,AQID'],
        image_url: 'data:image/jpeg;base64,AQID',
        prompt: 'edit',
        aspect_ratio: '1:1',
    });

    assert.strictEqual(result.url, 'https://cdn.example.com/edited.jpg');
    assert.strictEqual(globalThis.fetch.mock.calls.length, 2);
});
