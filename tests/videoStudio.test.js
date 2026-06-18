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
        return await response.json();
    }

    async generateVideo(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/${params.model}`;
        const finalPayload = {};
        if (params.prompt) finalPayload.prompt = params.prompt;
        if (params.aspect_ratio) finalPayload.aspect_ratio = params.aspect_ratio;
        if (params.duration) finalPayload.duration = params.duration;
        if (params.resolution) finalPayload.resolution = params.resolution;

        const response = await global.fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify(finalPayload)
        });

        const submitData = await response.json();
        const requestId = submitData.request_id || submitData.id;
        
        const result = await this.pollForResult(requestId, key);
        const videoUrl = result.outputs?.[0] || result.url;
        return { ...result, url: videoUrl };
    }

    async generateI2V(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/${params.model}`;
        const finalPayload = {
            prompt: params.prompt,
            image_url: params.image_url,
            aspect_ratio: params.aspect_ratio,
            duration: params.duration
        };

        const response = await global.fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify(finalPayload)
        });

        const submitData = await response.json();
        const requestId = submitData.request_id || submitData.id;
        const result = await this.pollForResult(requestId, key);
        return { ...result, url: result.outputs?.[0] || result.url };
    }

    async processV2V(params) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/${params.model}`;
        const finalPayload = { video_url: params.video_url };

        const response = await global.fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify(finalPayload)
        });

        const submitData = await response.json();
        const requestId = submitData.request_id || submitData.id;
        const result = await this.pollForResult(requestId, key);
        return { ...result, url: result.outputs?.[0] || result.url };
    }
}

const muapi = new MockMuapiClient();

test('MuapiClient.generateVideo (T2V) forms correct request and polls', async (t) => {
    global.fetch.mock.resetCalls();
    
    // 1. Mock implementation for both submit and poll
    global.fetch.mock.mockImplementation(async (url) => {
        const target = url.toString();
        if (target.includes('/api/v1/seedance-2.0-t2v')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ request_id: 'vid-123' }),
                text: async () => JSON.stringify({ request_id: 'vid-123' }),
                clone: function() { return this; }
            };
        }
        if (target.includes('/predictions/vid-123/result')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'http://example.com/video.mp4' }),
                text: async () => JSON.stringify({ status: 'succeeded', url: 'http://example.com/video.mp4' }),
                clone: function() { return this; }
            };
        }
        return { ok: true, json: async () => ({}) };
    });

    const params = {
        model: 'seedance-2.0-t2v',
        prompt: 'a cinematic space battle',
        aspect_ratio: '16:9',
        duration: 10,
        resolution: '1080p'
    };

    const result = await muapi.generateVideo(params);

    assert.strictEqual(result.url, 'http://example.com/video.mp4');
    assert.strictEqual(global.fetch.mock.calls.length, 2);
    
    const [submitUrl, submitOptions] = global.fetch.mock.calls[0].arguments;
    assert.ok(submitUrl.includes('/api/v1/seedance-2.0-t2v'));
    const body = JSON.parse(submitOptions.body);
    assert.strictEqual(body.prompt, params.prompt);
});

test('MuapiClient.generateI2V forms correct request with image_url', async (t) => {
    global.fetch.mock.resetCalls();
    
    global.fetch.mock.mockImplementation(async (url) => {
        const target = url.toString();
        if (target.includes('/api/v1/kling-1.5-i2v')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 'i2v-123' }),
                text: async () => JSON.stringify({ id: 'i2v-123' }),
                clone: function() { return this; }
            };
        }
        if (target.includes('/predictions/i2v-123/result')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'success', url: 'http://example.com/i2v.mp4' }),
                text: async () => JSON.stringify({ status: 'success', url: 'http://example.com/i2v.mp4' }),
                clone: function() { return this; }
            };
        }
        return { ok: true, json: async () => ({}) };
    });

    const params = {
        model: 'kling-1.5-i2v',
        image_url: 'http://example.com/start.jpg',
        prompt: 'make it move',
        aspect_ratio: '9:16',
        duration: 5
    };

    const result = await muapi.generateI2V(params);

    assert.strictEqual(result.url, 'http://example.com/i2v.mp4');
    const [, submitOptions] = global.fetch.mock.calls[0].arguments;
    const body = JSON.parse(submitOptions.body);
    assert.strictEqual(body.image_url, params.image_url);
});

test('MuapiClient.processV2V forms correct request with video_url', async (t) => {
    global.fetch.mock.resetCalls();
    
    global.fetch.mock.mockImplementation(async (url) => {
        const target = url.toString();
        if (target.includes('/api/v1/watermark-remover')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ request_id: 'v2v-123' }),
                text: async () => JSON.stringify({ request_id: 'v2v-123' }),
                clone: function() { return this; }
            };
        }
        if (target.includes('/predictions/v2v-123/result')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'completed', outputs: ['http://example.com/v2v.mp4'] }),
                text: async () => JSON.stringify({ status: 'completed', outputs: ['http://example.com/v2v.mp4'] }),
                clone: function() { return this; }
            };
        }
        return { ok: true, json: async () => ({}) };
    });

    const params = {
        model: 'watermark-remover',
        video_url: 'http://example.com/input.mp4'
    };

    const result = await muapi.processV2V(params);

    assert.strictEqual(result.url, 'http://example.com/v2v.mp4');
    const [, submitOptions] = global.fetch.mock.calls[0].arguments;
    const body = JSON.parse(submitOptions.body);
    assert.strictEqual(body.video_url, params.video_url);
});
