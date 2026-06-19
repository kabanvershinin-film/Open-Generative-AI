import test from 'node:test';
import assert from 'node:assert/strict';

import { uploadFile } from '../packages/studio/src/muapi.js';

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
