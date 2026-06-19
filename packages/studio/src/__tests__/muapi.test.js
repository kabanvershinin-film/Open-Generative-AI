import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import * as muapi from '../muapi.js';

// Mock global environment
global.fetch = mock.fn();
global.setTimeout = (fn, ms) => fn(); // Fast-forward timeouts
global.CustomEvent = class {
    constructor(name, detail) {
        this.name = name;
        this.detail = detail;
    }
};
global.window = {
    dispatchEvent: mock.fn()
};

test('generateSeedanceArk forms correct request body and polls', async (t) => {
    const apiKey = 'test-api-key';
    const params = {
        model: 'seedance-2.0-t2v',
        prompt: 'test prompt',
        image_url: 'http://example.com/input.jpg',
        onRequestId: mock.fn(),
    };

    // 1. Mock implementation for both submit and poll
    global.fetch.mock.mockImplementation(async (url) => {
        const target = url.toString();
        if (target.includes('/api/ark/seedance') && !target.includes('taskId=')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'task-123', bill: 'signed-bill' }),
                text: async () => JSON.stringify({ taskId: 'task-123', bill: 'signed-bill' }),
                clone: function() { return this; }
            };
        }
        if (target.includes('taskId=task-123')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'http://example.com/output.mp4' }),
                text: async () => JSON.stringify({ status: 'succeeded', url: 'http://example.com/output.mp4' }),
                clone: function() { return this; }
            };
        }
        return { ok: true, status: 200, json: async () => ({}) };
    });

    // Use a custom setTimeout mock to avoid 5s wait
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn, ms) => fn();

    const result = await muapi.generateVideo(apiKey, params);
    
    global.setTimeout = originalSetTimeout;

    assert.strictEqual(result.url, 'http://example.com/output.mp4');
    assert.strictEqual(result.id, 'task-123');

    // Check submit call
    const [submitUrl, submitOptions] = global.fetch.mock.calls[0].arguments;
    assert.ok(submitUrl.includes('/api/ark/seedance'));
    assert.strictEqual(submitOptions.method, 'POST');
    const body = JSON.parse(submitOptions.body);
    assert.strictEqual(body.prompt, 'test prompt');
    assert.strictEqual(body.image_url.url, 'http://example.com/input.jpg');

    // Check poll call
    const [pollUrl] = global.fetch.mock.calls[1].arguments;
    assert.ok(pollUrl.includes('taskId=task-123'));
    assert.ok(pollUrl.includes('bill=signed-bill'));
});

test('generateSeedanceArk handles 401 and notifies auth', async (t) => {
    const apiKey = 'invalid-key';
    const params = { model: 'seedance-2.0-t2v' };

    global.fetch.mock.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Auth required' })
    }));

    await assert.rejects(
        muapi.generateVideo(apiKey, params),
        { message: 'Auth required' }
    );

    assert.strictEqual(global.window.dispatchEvent.mock.calls.length, 1);
});

test('generateSeedanceArk handles 402 Insufficient funds', async (t) => {
    const apiKey = 'valid-key';
    const params = { model: 'seedance-2.0-t2v' };

    global.fetch.mock.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 402,
        json: () => Promise.resolve({ required: 100, balance: 50 })
    }));

    await assert.rejects(
        muapi.generateVideo(apiKey, params),
        /Недостаточно средств/
    );
});

test('generateImage posts to image generation proxy and returns url', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: 'img-1', data: [{ url: 'http://example.com/image.jpg' }] }),
    }));

    const result = await muapi.generateImage('key', {
        model: 'gpt-image-2',
        prompt: 'кот',
        aspect_ratio: '1:1',
    });

    assert.strictEqual(result.url, 'http://example.com/image.jpg');
    const [url, options] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(url, '/api/mf/v1/images/generations');
    assert.strictEqual(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.strictEqual(body.model, 'gpt-image-2');
    assert.strictEqual(body.prompt, 'кот');
});

test('generateI2I posts multipart edit request and returns url', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: 'edit-1', data: [{ url: 'http://example.com/edit.jpg' }] }),
    }));

    const result = await muapi.generateI2I('key', {
        model: 'gpt-image-2-edit',
        prompt: 'измени фон',
        image_url: 'http://example.com/source.jpg',
    });

    assert.strictEqual(result.url, 'http://example.com/edit.jpg');
    const [url, options] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(url, '/api/mf/v1/images/edits');
    assert.strictEqual(options.method, 'POST');
    assert.ok(options.body instanceof FormData);
});

test('generateI2I sends data URL references as multipart files', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url) => {
        if (String(url).startsWith('data:')) {
            return { blob: async () => new Blob(['image'], { type: 'image/png' }) };
        }
        if (url === '/api/mf/v1/images/edits') {
            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 'edit-1', data: [{ url: 'http://example.com/edit.jpg' }] }),
            };
        }
        throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await muapi.generateI2I('key', {
        model: 'gpt-image-2-edit',
        prompt: 'измени фон',
        image_url: 'data:image/png;base64,aW1hZ2U=',
    });

    assert.strictEqual(result.url, 'http://example.com/edit.jpg');
    const [, editOptions] = global.fetch.mock.calls[1].arguments;
    const imageEntries = editOptions.body.getAll('image[]');
    assert.strictEqual(imageEntries.length, 1);
    assert.ok(imageEntries[0] instanceof Blob);
});

test('generateImage routes Gemini image models to chat completions', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
            id: 'chat-img-1',
            choices: [{ message: { content: [{ image_url: { url: 'http://example.com/gemini.png' } }] } }],
        }),
    }));

    const result = await muapi.generateImage('key', {
        model: 'gemini-3.1-flash-image-preview',
        prompt: 'кот',
        aspect_ratio: '1:1',
    });

    assert.strictEqual(result.url, 'http://example.com/gemini.png');
    const [url, options] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(url, '/api/mf/v1/chat/completions');
    const body = JSON.parse(options.body);
    assert.strictEqual(body.model, 'gemini-3.1-flash-image-preview');
    assert.deepEqual(body.messages, [{ role: 'user', content: 'кот' }]);
});

test('generateImage formats object API errors', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid image request' } }),
    }));

    await assert.rejects(
        muapi.generateImage('key', { model: 'gpt-image-2', prompt: 'кот' }),
        { message: 'Invalid image request' },
    );
});

test('getUserBalance returns numeric balance', async (t) => {
    global.fetch.mock.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ balance: 123.45 })
    }));

    const balance = await muapi.getUserBalance('key');
    assert.strictEqual(balance, 123.45);
});

test('getUserWorkflows returns array', async (t) => {
    const mockWorkflows = [{ id: 1, name: 'WF1' }];
    global.fetch.mock.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWorkflows)
    }));

    const workflows = await muapi.getUserWorkflows('key');
    assert.deepEqual(workflows, mockWorkflows);
});
