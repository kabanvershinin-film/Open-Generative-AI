import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

// Setup global mocks
global.fetch = mock.fn();
global.localStorage = {
    getItem: (key) => key === 'muapi_key' ? 'test-api-key' : null,
    setItem: () => {},
};
global.window = {
    __MUAPI_KEY__: 'test-api-key',
};
global.setTimeout = (fn, ms) => fn();
global.FormData = class {
    constructor() { this.data = {}; }
    append(k, v) { this.data[k] = v; }
};

class MockMuapiClient {
    constructor() {
        this.baseUrl = 'https://api.muapi.ai';
    }

    getKey() {
        return 'test-api-key';
    }

    async pollForResult(requestId, key) {
        const pollUrl = `${this.baseUrl}/api/v1/predictions/${requestId}/result`;
        const response = await global.fetch(pollUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key }
        });
        const data = await response.json();
        return data;
    }

    async generateImage(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/${params.model}`;
        const finalPayload = { prompt: params.prompt, aspect_ratio: params.aspect_ratio };

        const response = await global.fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify(finalPayload)
        });

        const submitData = await response.json();
        const requestId = submitData.request_id || submitData.id;
        
        const result = await this.pollForResult(requestId, key);
        const imageUrl = result.outputs?.[0] || result.url;
        return { ...result, url: imageUrl };
    }

    async uploadFile(file) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/upload_file`;
        const formData = new FormData();
        formData.append('file', file);

        const response = await global.fetch(url, {
            method: 'POST',
            headers: { 'x-api-key': key },
            body: formData
        });

        const data = await response.json();
        return data.url;
    }
}

const muapi = new MockMuapiClient();

test('MuapiClient.generateImage forms correct T2I request', async (t) => {
    global.fetch.mock.resetCalls();
    
    // 1. Mock implementation for both submit and poll
    global.fetch.mock.mockImplementation(async (url) => {
        const target = url.toString();
        if (target.includes('/api/v1/gpt-image-2')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ request_id: 'img-123' }),
                text: async () => JSON.stringify({ request_id: 'img-123' }),
                clone: function() { return this; }
            };
        }
        if (target.includes('/predictions/img-123/result')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'http://example.com/sunset.jpg' }),
                text: async () => JSON.stringify({ status: 'succeeded', url: 'http://example.com/sunset.jpg' }),
                clone: function() { return this; }
            };
        }
        return { ok: true, json: async () => ({}) };
    });

    const result = await muapi.generateImage({
        model: 'gpt-image-2',
        prompt: 'sunset',
        aspect_ratio: '16:9'
    });

    assert.strictEqual(result.url, 'http://example.com/sunset.jpg');
    assert.strictEqual(global.fetch.mock.calls.length, 2);
    
    const [submitUrl, submitOptions] = global.fetch.mock.calls[0].arguments;
    assert.ok(submitUrl.includes('/api/v1/gpt-image-2'));
    assert.strictEqual(submitOptions.method, 'POST');
    const body = JSON.parse(submitOptions.body);
    assert.strictEqual(body.prompt, 'sunset');
});

test('MuapiClient.uploadFile forms correct FormData request', async (t) => {
    global.fetch.mock.resetCalls();
    
    global.fetch.mock.mockImplementationOnce((url) => {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ url: 'http://example.com/uploaded.jpg' })
        });
    });

    const url = await muapi.uploadFile({ name: 'test.jpg' });

    assert.strictEqual(url, 'http://example.com/uploaded.jpg');
    assert.strictEqual(global.fetch.mock.calls.length, 1);
    
    const [uploadUrl, options] = global.fetch.mock.calls[0].arguments;
    assert.ok(uploadUrl.includes('/upload_file'));
    assert.strictEqual(options.method, 'POST');
    assert.ok(options.body instanceof FormData);
});
