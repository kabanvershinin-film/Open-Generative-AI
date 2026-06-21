import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
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

function createFile(name, type, size) {
    const file = new Blob([new Uint8Array(size)], { type });
    Object.defineProperty(file, 'name', { value: name });
    return file;
}

test('validateImageReferenceUploadFile accepts various image formats under 50MB and rejects others', () => {
    assert.strictEqual(muapi.validateImageReferenceUploadFile(createFile('ref.png', 'image/png', 1024)), true);
    assert.strictEqual(muapi.validateImageReferenceUploadFile(createFile('ref.jpg', 'image/jpeg', 1024)), true);
    assert.strictEqual(muapi.validateImageReferenceUploadFile(createFile('ref.tiff', 'image/tiff', 1024)), true);
    assert.throws(() => muapi.validateImageReferenceUploadFile(createFile('ref.png', 'image/png', 51 * 1024 * 1024)), /50 МБ/);
});

test('optimizeImageUploadFile leaves small images unchanged', async () => {
    const file = createFile('small.png', 'image/png', 1024);
    const result = await muapi.optimizeImageUploadFile(file);
    assert.strictEqual(result, file);
});

test('optimizeImageUploadFile compresses large images when browser runtime is available', async () => {
    class MockFile extends Blob {
        constructor(parts, name, options) {
            super(parts, options);
            Object.defineProperty(this, 'name', { value: name });
        }
    }

    class MockFileReader {
        readAsDataURL() {
            this.onload?.({ target: { result: 'data:image/png;base64,AQID' } });
        }
    }

    class MockImage {
        constructor() {
            this.width = 4096;
            this.height = 3072;
        }

        set src(_value) {
            this.onload?.();
        }
    }

    const runtime = {
        File: MockFile,
        FileReader: MockFileReader,
        Image: MockImage,
        document: {
            createElement(tag) {
                assert.strictEqual(tag, 'canvas');
                return {
                    width: 0,
                    height: 0,
                    getContext: () => ({ drawImage: () => {} }),
                    toBlob: (callback, type) => {
                        callback(new Blob([new Uint8Array(1024)], { type }));
                    },
                };
            },
        },
    };

    const file = createFile('large.png', 'image/png', 6 * 1024 * 1024);
    const result = await muapi.optimizeImageUploadFile(file, {}, runtime);
    assert.notStrictEqual(result, file);
    assert.strictEqual(result.type, 'image/jpeg');
    assert.strictEqual(result.name, 'large.jpg');
    assert.ok(result.size < file.size);
});

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
    global.fetch.mock.mockImplementation(async (url) => {
        if (url === '/api/mf/v1/images/edits') {
            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 'edit-1', data: [{ url: 'http://example.com/edit.jpg' }] }),
            };
        }
        throw new Error(`Unexpected fetch: ${url}`);
    });

    const imageBlob = new Blob(['image-bytes'], { type: 'image/jpeg' });
    const result = await muapi.generateI2I('key', {
        model: 'gpt-image-2-edit',
        prompt: 'измени фон',
        image_url: imageBlob,
    });

    assert.strictEqual(result.url, 'http://example.com/edit.jpg');
    const [url, options] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(url, '/api/mf/v1/images/edits');
    assert.strictEqual(options.method, 'POST');
    assert.ok(options.body instanceof FormData);
});

test('generateI2I sends http image references as string parameters', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url) => {
        if (url === '/api/mf/v1/images/edits') {
            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 'edit-2', data: [{ url: 'http://example.com/edit2.jpg' }] }),
            };
        }
        throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await muapi.generateI2I('key', {
        model: 'gpt-image-2-edit',
        prompt: 'измени фон',
        image_url: 'http://example.com/source.jpg',
    });

    assert.strictEqual(result.url, 'http://example.com/edit2.jpg');
    const [, editOptions] = global.fetch.mock.calls[0].arguments;
    const imageEntries = editOptions.body.getAll('image');
    assert.strictEqual(imageEntries.length, 1);
    assert.strictEqual(imageEntries[0], 'http://example.com/source.jpg');
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

test('generateI2I routes Gemini edit models to chat completions with image reference', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
            id: 'chat-edit-1',
            choices: [{ message: { content: [{ image_url: { url: 'http://example.com/gemini-edit.png' } }] } }],
        }),
    }));

    const result = await muapi.generateI2I('key', {
        model: 'gemini-3.1-flash-image-preview-edit',
        prompt: 'сделай рыжим',
        images_list: ['http://example.com/source.jpg'],
        image_url: 'http://example.com/source.jpg',
        aspect_ratio: '1:1',
    });

    assert.strictEqual(result.url, 'http://example.com/gemini-edit.png');
    const [url, options] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(url, '/api/mf/v1/chat/completions');
    const body = JSON.parse(options.body);
    assert.strictEqual(body.model, 'gemini-3.1-flash-image-preview');
    assert.deepEqual(body.messages, [{
        role: 'user',
        content: [
            { type: 'text', text: 'сделай рыжим' },
            { type: 'image_url', image_url: { url: 'http://example.com/source.jpg' } },
        ],
    }]);
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
