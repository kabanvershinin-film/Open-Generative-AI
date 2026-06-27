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
    assert.strictEqual(body.image_urls.length, 1);
    assert.strictEqual(body.image_urls[0].url, 'http://example.com/input.jpg');

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
    assert.strictEqual(body.size, '1024x1024');
});

test('generateImage sends documented GPT fields output_format, background and moderation', async () => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: 'img-gpt-documented', data: [{ url: 'http://example.com/image-documented.jpg' }] }),
    }));

    await muapi.generateImage('key', {
        model: 'gpt-image-2',
        prompt: 'кот',
        aspect_ratio: '3:2',
        imageSize: '2K',
        format: 'png',
        background: 'opaque',
        moderation: 'low',
    });

    const [, options] = global.fetch.mock.calls[0].arguments;
    const body = JSON.parse(options.body);
    assert.strictEqual(body.size, '2048x1360');
    assert.strictEqual(body.output_format, 'png');
    assert.strictEqual(body.background, 'opaque');
    assert.strictEqual(body.moderation, 'low');
});

test('generateImage мапит GPT aspect ratio 16:9 в size формата Nano Banana', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: 'img-16x9', data: [{ url: 'http://example.com/wide.jpg' }] }),
    }));

    await muapi.generateImage('key', {
        model: 'gpt-image-2',
        prompt: 'панорама',
        aspect_ratio: '16:9',
    });

    const [, options] = global.fetch.mock.calls[0].arguments;
    const body = JSON.parse(options.body);
    assert.strictEqual(body.size, '1536x864');
});

test('generateImage мапит GPT preset 2K в корректный size для выбранной пропорции', async () => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ id: 'img-2k', data: [{ url: 'http://example.com/portrait-2k.jpg' }] }),
    }));

    await muapi.generateImage('key', {
        model: 'gpt-image-2',
        prompt: 'портрет',
        aspect_ratio: '9:16',
        imageSize: '2K',
    });

    const [, options] = global.fetch.mock.calls[0].arguments;
    const body = JSON.parse(options.body);
    assert.strictEqual(body.size, '1152x2048');
});

test('generateImage routes Seedream 5.0 Lite to Ark image proxy with documented payload', async () => {
  global.fetch.mock.resetCalls();
  global.fetch.mock.mockImplementationOnce(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ created: 123, data: [{ url: 'http://example.com/seedream.jpg', size: '4096x2304' }] }),
  }));

  const result = await muapi.generateImage('key', {
    model: 'seedream-5.0-lite',
    prompt: 'город будущего',
    aspect_ratio: '16:9',
    imageSize: '3K',
    format: 'png',
  });

  assert.strictEqual(result.url, 'http://example.com/seedream.jpg');
  const [url, options] = global.fetch.mock.calls[0].arguments;
  assert.strictEqual(url, '/api/ark/images');
  assert.strictEqual(options.method, 'POST');
  const body = JSON.parse(options.body);
  assert.strictEqual(body.model, 'doubao-seedream-5-0-260128');
  assert.strictEqual(body.prompt, 'город будущего');
  assert.strictEqual(body.size, '4096x2304');
  assert.strictEqual(body.output_format, 'png');
  assert.strictEqual(body.response_format, 'url');
  assert.strictEqual(body.sequential_image_generation, 'disabled');
  assert.strictEqual(body.stream, false);
  assert.strictEqual(body.watermark, false);
});

test('generateImage routes Seedream 5.0 Lite image set mode and returns multiple urls', async () => {
  global.fetch.mock.resetCalls();
  global.fetch.mock.mockImplementationOnce(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      created: 123,
      data: [
        { url: 'http://example.com/seedream-set-1.jpg' },
        { url: 'http://example.com/seedream-set-2.jpg' },
        { url: 'http://example.com/seedream-set-3.jpg' },
      ],
    }),
  }));

  const result = await muapi.generateImage('key', {
    model: 'seedream-5.0-lite',
    prompt: 'четыре сезона',
    aspect_ratio: '1:1',
    imageSize: '2K',
    image_set_mode: 'auto',
    image_set_max_images: 3,
  });

  assert.strictEqual(result.url, 'http://example.com/seedream-set-1.jpg');
  assert.deepStrictEqual(result.urls, [
    'http://example.com/seedream-set-1.jpg',
    'http://example.com/seedream-set-2.jpg',
    'http://example.com/seedream-set-3.jpg',
  ]);
  const [, options] = global.fetch.mock.calls[0].arguments;
  const body = JSON.parse(options.body);
  assert.strictEqual(body.sequential_image_generation, 'auto');
  assert.deepStrictEqual(body.sequential_image_generation_options, { max_images: 3 });
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

test('generateI2I sends additional references through image[] fields', async () => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url) => {
        if (url === '/api/mf/v1/images/edits') {
            return {
                ok: true,
                status: 200,
                json: async () => ({ id: 'edit-multi', data: [{ url: 'http://example.com/edit-multi.jpg' }] }),
            };
        }
        throw new Error(`Unexpected fetch: ${url}`);
    });

    const firstImage = new Blob(['first-image'], { type: 'image/jpeg' });
    const secondImage = new Blob(['second-image'], { type: 'image/png' });
    const thirdImage = new Blob(['third-image'], { type: 'image/webp' });

    const result = await muapi.generateI2I('key', {
        model: 'gpt-image-2-edit',
        prompt: 'смешай несколько референсов',
        image_url: firstImage,
        images_list: [firstImage, secondImage, thirdImage],
    });

    assert.strictEqual(result.url, 'http://example.com/edit-multi.jpg');

    const [, editOptions] = global.fetch.mock.calls[0].arguments;
    const primaryImages = editOptions.body.getAll('image');
    const extraImages = editOptions.body.getAll('image[]');

    assert.strictEqual(primaryImages.length, 1);
    assert.strictEqual(extraImages.length, 2);
    assert.ok(primaryImages[0] instanceof Blob);
    assert.ok(extraImages[0] instanceof Blob);
    assert.ok(extraImages[1] instanceof Blob);
});

test('generateI2I routes Seedream 5.0 Lite edit to Ark image proxy with multi-image input', async () => {
  global.fetch.mock.resetCalls();
  global.fetch.mock.mockImplementationOnce(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ created: 123, data: [{ url: 'http://example.com/seedream-edit.jpg' }] }),
  }));

  const result = await muapi.generateI2I('key', {
    model: 'seedream-5.0-lite-edit',
    prompt: 'смешай эти референсы',
    image_url: 'http://example.com/source-1.jpg',
    images_list: ['http://example.com/source-1.jpg', 'http://example.com/source-2.jpg'],
    aspect_ratio: '1:1',
    imageSize: '2K',
    format: 'jpeg',
  });

  assert.strictEqual(result.url, 'http://example.com/seedream-edit.jpg');
  const [url, options] = global.fetch.mock.calls[0].arguments;
  assert.strictEqual(url, '/api/ark/images');
  const body = JSON.parse(options.body);
  assert.strictEqual(body.model, 'doubao-seedream-5-0-260128');
  assert.strictEqual(body.size, '2048x2048');
  assert.deepStrictEqual(body.image, [
    'http://example.com/source-1.jpg',
    'http://example.com/source-2.jpg',
  ]);
});

test('generateImage routes Gemini image models to native generateContent', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
            candidates: [{
                content: {
                    parts: [{
                        inlineData: {
                            mimeType: 'image/png',
                            data: 'R0VNSU5J',
                        },
                    }],
                },
            }],
        }),
    }));

    const result = await muapi.generateImage('key', {
        model: 'gemini-3.1-flash-image-preview',
        prompt: 'кот',
        aspect_ratio: '1:1',
    });

    assert.strictEqual(result.url, 'data:image/png;base64,R0VNSU5J');
    const [url, options] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(url, '/api/mf/v1beta/models/gemini-3.1-flash-image-preview:generateContent');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.contents, [{ parts: [{ text: 'кот' }] }]);
    assert.deepEqual(body.generationConfig, {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
            aspectRatio: '1:1',
        },
    });
});

test('generateI2I routes Gemini edit models to native generateContent with inline image', async (t) => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(async (url) => {
        if (url === 'http://example.com/source.jpg') {
            return {
                ok: true,
                blob: async () => new Blob(['gemini-source'], { type: 'image/jpeg' }),
            };
        }
        if (url === '/api/mf/v1beta/models/gemini-3.1-flash-image-preview:generateContent') {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    candidates: [{
                        content: {
                            parts: [{
                                inlineData: {
                                    mimeType: 'image/png',
                                    data: 'RURJVA==',
                                },
                            }],
                        },
                    }],
                }),
            };
        }
        throw new Error(`Unexpected fetch: ${url}`);
    });

    const result = await muapi.generateI2I('key', {
        model: 'gemini-3.1-flash-image-preview-edit',
        prompt: 'сделай рыжим',
        images_list: ['http://example.com/source.jpg'],
        image_url: 'http://example.com/source.jpg',
        aspect_ratio: '1:1',
    });

    assert.strictEqual(result.url, 'data:image/png;base64,RURJVA==');
    assert.strictEqual(global.fetch.mock.calls.length, 2);
    const [url, options] = global.fetch.mock.calls[1].arguments;
    assert.strictEqual(url, '/api/mf/v1beta/models/gemini-3.1-flash-image-preview:generateContent');
    const body = JSON.parse(options.body);
    assert.strictEqual(body.contents.length, 1);
    assert.strictEqual(body.contents[0].parts[0].text, 'сделай рыжим');
    assert.ok(body.contents[0].parts[1].inline_data);
    assert.deepEqual(body.generationConfig, {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
            aspectRatio: '1:1',
        },
    });
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

test('generateImage показывает ошибку нехватки средств', async () => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementationOnce(async () => ({
        ok: false,
        status: 402,
        json: async () => ({ required: 100, balance: 0 }),
    }));

    await assert.rejects(
        muapi.generateImage('key', { model: 'gpt-image-2', prompt: 'кот' }),
        /Недостаточно средств/,
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

test('workflow community and CRUD helpers use expected endpoints', async () => {
    global.fetch.mock.resetCalls();
    const responses = [
        [{ id: 'wf-public', name: 'Public workflow' }],
        { id: 'wf-new', name: 'New workflow' },
        { success: true, name: 'Renamed workflow' },
        {
            name: 'Workflow 1',
            nodes: [{ id: 'node-1' }],
            edges: [{ id: 'edge-1' }],
            is_owner: false,
            can_edit: false,
        },
        { success: true },
        { run_id: 'run-1', status: 'queued' },
    ];
    global.fetch.mock.mockImplementation(() => {
        const payload = responses.shift();
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(payload),
        });
    });

    const published = await muapi.getPublishedWorkflows('key');
    const created = await muapi.createWorkflow('key', { name: 'New workflow' });
    const renamed = await muapi.updateWorkflowName('key', 'wf-new', 'Renamed workflow');
    const workflow = await muapi.getWorkflowData('key', 'wf-new');
    const removed = await muapi.deleteWorkflow('key', 'wf-new');
    const execution = await muapi.executeWorkflow('key', 'wf-new', { prompt: 'кот' });

    assert.deepStrictEqual(published, [{ id: 'wf-public', name: 'Public workflow' }]);
    assert.deepStrictEqual(created, { id: 'wf-new', name: 'New workflow' });
    assert.deepStrictEqual(renamed, { success: true, name: 'Renamed workflow' });
    assert.strictEqual(workflow.name, 'Workflow 1');
    assert.deepStrictEqual(workflow.data.nodes, [{ id: 'node-1' }]);
    assert.deepStrictEqual(workflow.edges, [{ id: 'edge-1' }]);
    assert.strictEqual(workflow.is_owner, false);
    assert.strictEqual(workflow.can_edit, false);
    assert.deepStrictEqual(removed, { success: true });
    assert.deepStrictEqual(execution, { run_id: 'run-1', status: 'queued' });

    const [communityUrl, communityOptions] = global.fetch.mock.calls[0].arguments;
    const [createUrl, createOptions] = global.fetch.mock.calls[1].arguments;
    const [renameUrl, renameOptions] = global.fetch.mock.calls[2].arguments;
    const [getUrl] = global.fetch.mock.calls[3].arguments;
    const [deleteUrl, deleteOptions] = global.fetch.mock.calls[4].arguments;
    const [runUrl, runOptions] = global.fetch.mock.calls[5].arguments;

    assert.strictEqual(communityUrl, '/api/workflow/community');
    assert.strictEqual(communityOptions.headers.Authorization, 'Bearer key');
    assert.strictEqual(createUrl, '/api/workflow/create');
    assert.strictEqual(createOptions.method, 'POST');
    assert.deepStrictEqual(JSON.parse(createOptions.body), { name: 'New workflow' });
    assert.strictEqual(renameUrl, '/api/workflow/wf-new');
    assert.strictEqual(renameOptions.method, 'POST');
    assert.deepStrictEqual(JSON.parse(renameOptions.body), { name: 'Renamed workflow' });
    assert.strictEqual(getUrl, '/api/workflow/wf-new');
    assert.strictEqual(deleteUrl, '/api/workflow/wf-new');
    assert.strictEqual(deleteOptions.method, 'DELETE');
    assert.strictEqual(runUrl, '/api/workflow/wf-new/run');
    assert.strictEqual(runOptions.method, 'POST');
    assert.deepStrictEqual(JSON.parse(runOptions.body), { inputs: { prompt: 'кот' } });
});

test('workflow helpers return safe fallbacks on errors', async () => {
    global.fetch.mock.resetCalls();
    let callIndex = 0;
    global.fetch.mock.mockImplementation(() => {
        callIndex += 1;
        if (callIndex === 1) return Promise.reject(new Error('network'));
        return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({}),
        });
    });

    const published = await muapi.getPublishedWorkflows('key');
    const renamed = await muapi.updateWorkflowName('key', 'wf-missing', 'Nope');
    const workflow = await muapi.getWorkflowData('key', 'wf-missing');

    assert.deepStrictEqual(published, []);
    assert.deepStrictEqual(renamed, {});
    assert.strictEqual(workflow.id, 'wf-missing');
    assert.strictEqual(workflow.name, 'Untitled Workflow');
    assert.deepStrictEqual(workflow.data.nodes, []);
    assert.deepStrictEqual(workflow.edges, []);
    assert.strictEqual(workflow.can_edit, true);
});

test('getWorkflowInputs extracts text and passthrough image inputs from workflow nodes', async () => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
            name: 'Workflow Inputs',
            data: {
                nodes: [
                    {
                        id: 'promptNode',
                        category: 'text',
                        input_params: { prompt: 'Напиши историю' },
                    },
                    {
                        id: 'uploadNode',
                        type: 'uploadNode',
                        category: 'image',
                        model: 'image-passthrough',
                        data: { formValues: { image_url: 'https://cdn.example.com/input.jpg' } },
                    },
                    {
                        id: 'ignoredNode',
                        category: 'video',
                        model: 'seedance-2.0-t2v',
                    },
                ],
            },
        }),
    }));

    const result = await muapi.getWorkflowInputs('key', 'wf-inputs');

    assert.deepStrictEqual(result, {
        properties: {
            promptNode: {
                type: 'string',
                title: 'promptNode',
                description: 'Text input',
                default: 'Напиши историю',
                examples: ['Напиши историю'],
            },
            uploadNode: {
                type: 'string',
                title: 'uploadNode (image URL)',
                description: 'Image URL',
                field: 'image',
                default: 'https://cdn.example.com/input.jpg',
            },
        },
        required: [],
    });
});

test('getWorkflowInputs returns empty schema when workflow loading fails', async () => {
    global.fetch.mock.resetCalls();
    global.fetch.mock.mockImplementation(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
    }));

    const result = await muapi.getWorkflowInputs('key', 'wf-missing');
    assert.deepStrictEqual(result, { properties: {}, required: [] });
});

test('getAllNodeSchemas returns categories payload and safe fallback on invalid responses', async () => {
    global.fetch.mock.resetCalls();
    const responses = [
        { ok: true, payload: { categories: { image: [{ id: 'node-1' }] } } },
        { ok: true, payload: 'broken' },
        { ok: false, payload: {} },
    ];
    global.fetch.mock.mockImplementation(() => {
        const current = responses.shift();
        return Promise.resolve({
            ok: current.ok,
            json: () => Promise.resolve(current.payload),
        });
    });

    const success = await muapi.getAllNodeSchemas('key', 'wf-schema');
    const invalid = await muapi.getAllNodeSchemas('key', 'wf-schema');
    const failed = await muapi.getAllNodeSchemas('key', 'wf-schema');

    assert.deepStrictEqual(success, { categories: { image: [{ id: 'node-1' }] } });
    assert.deepStrictEqual(invalid, { categories: {} });
    assert.deepStrictEqual(failed, { categories: {} });

    const [schemaUrl] = global.fetch.mock.calls[0].arguments;
    assert.strictEqual(schemaUrl, '/api/workflow/wf-schema/node-schemas');
});

test('getNodeSchemas and calculateDynamicCost keep stable zero-value fallbacks', async () => {
    assert.deepStrictEqual(await muapi.getNodeSchemas('key'), { categories: {} });
    assert.deepStrictEqual(await muapi.calculateDynamicCost('key'), { cost: 0 });
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
            const sentImageCount = (body.image_urls || []).length;
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
            assert.strictEqual(body.image_urls.length, 1);
            assert.strictEqual(body.image_urls[0].url, 'https://cdn.example.com/char.jpg');
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
