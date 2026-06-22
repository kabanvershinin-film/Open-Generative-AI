import test from 'node:test';
import assert from 'node:assert/strict';

import { uploadFile } from '../muapi.js';

function createImageFile() {
    const file = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
    Object.defineProperty(file, 'name', { value: 'test.jpg' });
    return file;
}

test('studio uploadFile uploads through presigned TOS URL', async (t) => {
    const progress = [];
    let businessCalls = 0;
    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
        if (String(url).startsWith('http://127.0.0.1:7778/event')) {
            return { ok: true, json: async () => ({}) };
        }
        businessCalls += 1;
        if (String(url).startsWith('/api/upload-file?')) {
            return {
                ok: true,
                json: async () => ({ putUrl: 'https://tos-upload.example.com/signed', publicUrl: 'https://tos.example.com/ref/test.jpg' }),
            };
        }
        if (url === 'https://tos-upload.example.com/signed') {
            assert.strictEqual(options.method, 'PUT');
            assert.strictEqual(options.headers['Content-Type'], 'image/jpeg');
            assert.strictEqual(options.body.name, 'test.jpg');
            return { ok: true, json: async () => ({}) };
        }
        throw new Error(`Unexpected URL: ${url}`);
    });

    const url = await uploadFile('test-key', createImageFile(), (pct) => progress.push(pct));

    assert.strictEqual(url, 'https://tos.example.com/ref/test.jpg');
    assert.deepStrictEqual(progress, [5, 15, 35, 100]);
    assert.strictEqual(businessCalls, 2);
});

test('studio uploadFile falls back to asset upload when presigned upload is unavailable', async (t) => {
    const progress = [];
    let businessCalls = 0;
    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
        if (String(url).startsWith('http://127.0.0.1:7778/event')) {
            return { ok: true, json: async () => ({}) };
        }
        businessCalls += 1;
        if (String(url).startsWith('/api/upload-file?')) {
            return {
                ok: false,
                status: 503,
                json: async () => ({ error: 'Storage not configured' }),
            };
        }
        if (url === '/api/mf/v1/assets/upload') {
            assert.strictEqual(options.method, 'POST');
            assert.strictEqual(options.headers.Authorization, 'Bearer test-key');
            return {
                ok: true,
                json: async () => ({ url: 'https://cdn.example.com/test.jpg' }),
            };
        }
        throw new Error(`Unexpected URL: ${url}`);
    });

    const url = await uploadFile('test-key', createImageFile(), (pct) => progress.push(pct));

    assert.strictEqual(url, 'https://cdn.example.com/test.jpg');
    assert.deepStrictEqual(progress, [5, 15, 70, 100]);
    assert.strictEqual(businessCalls, 2);
});

test('studio uploadFile throws when presigned and asset uploads fail', async (t) => {
    const progress = [];
    let businessCalls = 0;
    t.mock.method(globalThis, 'fetch', async (url) => {
        if (String(url).startsWith('http://127.0.0.1:7778/event')) {
            return { ok: true, json: async () => ({}) };
        }
        businessCalls += 1;
        if (String(url).startsWith('/api/upload-file?')) {
            return {
                ok: false,
                status: 503,
                json: async () => ({ error: 'Storage not configured' }),
            };
        }
        if (url === '/api/mf/v1/assets/upload') {
            return {
                ok: false,
                status: 413,
                json: async () => ({ error: 'Payload too large' }),
            };
        }
        throw new Error(`Unexpected URL: ${url}`);
    });

    await assert.rejects(
        uploadFile('test-key', createImageFile(), (pct) => progress.push(pct)),
        /Storage not configured.*Payload too large/,
    );
    assert.deepStrictEqual(progress, [5, 15, 70, 0]);
    assert.strictEqual(businessCalls, 2);
});
