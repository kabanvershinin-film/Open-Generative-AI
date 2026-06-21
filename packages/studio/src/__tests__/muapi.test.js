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

test('optimizeImageUploadFile leaves 5MB images unchanged (exact limit)', async () => {
    const file = createFile('exact-size.png', 'image/png', 5 * 1024 * 1024);
    const result = await muapi.optimizeImageUploadFile(file);
    assert.strictEqual(result, file);
});

test('optimizeImageUploadFile falls back to original file on errors', async () => {
    // Simulate browser runtime, but canvas/toBlob fails
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
        set src(_value) {
            this.onload?.();
        }
    }

    const runtime = {
        File: MockFile,
        FileReader: MockFileReader,
        Image: MockImage,
        document: {
            createElement() {
                throw new Error('Canvas error');
            },
        },
    };

    const file = createFile('error-case.png', 'image/png', 6 * 1024 * 1024);
    const result = await muapi.optimizeImageUploadFile(file, {}, runtime);
    assert.strictEqual(result, file); // Should return original file instead of crashing
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
    assert.strictEqual(body.first_frame_image.url, 'http://example.com/input.jpg');

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

test('generateI2I downloads http image references and sends them as file blobs', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url) => {
        if (url === 'http://example.com/source.jpg') {
            return {
                ok: true,
                blob: async () => new Blob(['image-source-bytes'], { type: 'image/jpeg' }),
            };
        }
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

    // Should have 2 fetches: download image, then submit edit
    assert.strictEqual(global.fetch.mock.calls.length, 2);

    // First call: download source image
    const [downloadUrl] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(downloadUrl, 'http://example.com/source.jpg');

    // Second call: submit edit
    const [editUrl, editOptions] = global.fetch.mock.calls[1].arguments;
    assert.strictEqual(editUrl, '/api/mf/v1/images/edits');
    const imageEntries = editOptions.body.getAll('image');
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

test('Seedance 2.0 Text-to-Video (T2V) generation', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url) => {
        if (url.includes('/api/ark/seedance') && !url.includes('taskId=')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 't2v-test-123', bill: 'bill-123' }),
                text: async () => JSON.stringify({ taskId: 't2v-test-123', bill: 'bill-123' }),
                clone: function() { return this; }
            };
        } else if (url.includes('taskId=t2v-test-123')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://cdn.example.com/t2v.mp4' }),
                text: async () => JSON.stringify({ status: 'succeeded', url: 'https://cdn.example.com/t2v.mp4' }),
                clone: function() { return this; }
            };
        }
        return { ok: true, json: async () => ({}) };
    });

    const result = await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: 'A cinematic slow-motion shot of a golden eagle soaring through a mountain valley at sunrise.',
        aspect_ratio: '16:9',
        resolution: '720p',
        duration: 8,
        generate_audio: true
    });

    assert.strictEqual(result.url, 'https://cdn.example.com/t2v.mp4');
});

test('Seedance 2.0 Native Audio Generation', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (url.includes('/api/ark/seedance') && !url.includes('taskId=')) {
            const body = JSON.parse(options.body);
            assert.strictEqual(body.generate_audio, true);
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'audio-test-123', bill: 'bill-456' }),
                text: async () => JSON.stringify({ taskId: 'audio-test-123', bill: 'bill-456' }),
                clone: function() { return this; }
            };
        }
        return { ok: true, json: async () => ({ status: 'succeeded', url: 'https://cdn.example.com/with-audio.mp4' }) };
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: 'A peaceful river flowing through a forest with birds singing.',
        aspect_ratio: '16:9',
        resolution: '720p',
        duration: 8,
        generate_audio: true
    });
});



test('Seedance 2.0 Text prompt with quotes (dialogs)', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            assert.strictEqual(body.prompt, '图片1 says "Привет! Как дела?". Then they smile.');
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'dialog-test-123', bill: 'bill-dialog' }),
                clone: function() { return this; }
            };
        } else {
            // GET request for polling task status
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: '图片1 says "Привет! Как дела?". Then they smile.'
    });
});

test('Seedance 2.0 Up to 9 reference images', async (t) => {
    global.fetch.mock.resetCalls();
    const imageUrls = Array.from({ length: 9 }, (_, i) => `https://cdn.example.com/img${i + 1}.jpg`);
    
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            const sentImageCount = [body.first_frame_image, ...(body.image_urls || [])].filter(Boolean).length;
            assert.strictEqual(sentImageCount, 9);
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: '9img-test-123', bill: 'bill-9img' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: 'Use all these images',
        image_url: imageUrls[0],
        image_urls: imageUrls.slice(1),
    });
});

test('Seedance 2.0 Up to 3 reference videos', async (t) => {
    global.fetch.mock.resetCalls();
    const videoUrls = Array.from({ length: 3 }, (_, i) => `https://cdn.example.com/video${i + 1}.mp4`);
    
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            const sentVideoCount = [body.video_url, ...(body.video_urls || [])].filter(Boolean).length;
            assert.strictEqual(sentVideoCount, 3);
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: '3vid-test-123', bill: 'bill-3vid' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: 'Use all these videos',
        video_url: videoUrls[0],
        video_urls: videoUrls.slice(1),
    });
});

test('Seedance 2.0 Up to 3 reference audios', async (t) => {
    global.fetch.mock.resetCalls();
    const audioUrls = Array.from({ length: 3 }, (_, i) => `https://cdn.example.com/audio${i + 1}.mp3`);
    
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            const sentAudioCount = [body.audio_url, ...(body.audio_urls || [])].filter(Boolean).length;
            assert.strictEqual(sentAudioCount, 3);
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: '3aud-test-123', bill: 'bill-3aud' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: 'Use all these audios',
        audio_url: audioUrls[0],
        audio_urls: audioUrls.slice(1),
    });
});

test('Seedance 2.0 Total up to 12 files (image + video + audio)', async (t) => {
    global.fetch.mock.resetCalls();
    const imageUrls = Array.from({ length: 8 }, (_, i) => `https://cdn.example.com/img${i + 1}.jpg`);
    const videoUrls = Array.from({ length: 2 }, (_, i) => `https://cdn.example.com/video${i + 1}.mp4`);
    const audioUrls = Array.from({ length: 2 }, (_, i) => `https://cdn.example.com/audio${i + 1}.mp3`);
    
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            const sentImageCount = [body.first_frame_image, ...(body.image_urls || [])].filter(Boolean).length;
            const sentVideoCount = [body.video_url, ...(body.video_urls || [])].filter(Boolean).length;
            const sentAudioCount = [body.audio_url, ...(body.audio_urls || [])].filter(Boolean).length;
            assert.strictEqual(sentImageCount + sentVideoCount + sentAudioCount, 12);
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: '12refs-test-123', bill: 'bill-12refs' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: 'Mix all references',
        image_url: imageUrls[0],
        image_urls: imageUrls.slice(1),
        video_url: videoUrls[0],
        video_urls: videoUrls.slice(1),
        audio_url: audioUrls[0],
        audio_urls: audioUrls.slice(1),
    });
});

test('Seedance 2.0 @ syntax in prompt', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            assert.strictEqual(body.prompt, '@image1 is the character, @video1 controls camera, @audio1 is background music');
            assert.strictEqual(body.first_frame_image.url, 'https://cdn.example.com/char.jpg');
            assert.strictEqual(body.video_url, 'https://cdn.example.com/cam.mp4');
            assert.strictEqual(body.audio_url, 'https://cdn.example.com/music.mp3');
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'atsyntax-test-123', bill: 'bill-atsyntax' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-t2v',
        prompt: '@image1 is the character, @video1 controls camera, @audio1 is background music',
        image_url: 'https://cdn.example.com/char.jpg',
        video_url: 'https://cdn.example.com/cam.mp4',
        audio_url: 'https://cdn.example.com/music.mp3',
    });
});

// Also fix the other Seedance 2.0 tests that were failing (All Aspect Ratios, All Resolutions, Duration, Fast model)
test('Seedance 2.0 All Aspect Ratios support', async (t) => {
    const ratios = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'];
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'ratio-test-123', bill: 'bill-ratio' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    for (const ratio of ratios) {
        await assert.doesNotThrow(async () => {
            await muapi.generateVideo('test-key', {
                model: 'seedance-2.0-t2v',
                prompt: 'Test video',
                aspect_ratio: ratio
            });
        });
    }
});

test('Seedance 2.0 All Resolutions support', async (t) => {
    const resolutions = ['480p', '720p', '1080p'];
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'res-test-123', bill: 'bill-res' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    for (const resolution of resolutions) {
        await assert.doesNotThrow(async () => {
            await muapi.generateVideo('test-key', {
                model: 'seedance-2.0-t2v',
                prompt: 'Test video',
                resolution: resolution
            });
        });
    }
});

test('Seedance 2.0 Duration options support', async (t) => {
    const durations = [4, 8, 12, 15];
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'duration-test-123', bill: 'bill-duration' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    for (const duration of durations) {
        await assert.doesNotThrow(async () => {
            await muapi.generateVideo('test-key', {
                model: 'seedance-2.0-t2v',
                prompt: 'Test video',
                duration: duration
            });
        });
    }
});

test('Seedance 2.0 Fast model vs Standard model', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') {
            const body = JSON.parse(options.body);
            assert.strictEqual(body.fast, true);
            assert.strictEqual(body.resolution, '720p'); // Fast model converts 1080p to 720p
            return {
                ok: true,
                status: 200,
                json: async () => ({ taskId: 'fast-test-123', bill: 'bill-fast' }),
                clone: function() { return this; }
            };
        } else {
            return {
                ok: true,
                status: 200,
                json: async () => ({ status: 'succeeded', url: 'https://example.com/test-video.mp4' }),
                clone: function() { return this; }
            };
        }
    });

    await muapi.generateVideo('test-key', {
        model: 'seedance-2.0-fast-t2v',
        prompt: 'Quick preview generation',
        duration: 4,
        resolution: '1080p'
    });
});
