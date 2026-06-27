import test from 'node:test';
import assert from 'node:assert/strict';
import { pollSeedanceTask, submitSeedanceTask } from '../route.handlers.js';

function createSubmitDeps(overrides = {}) {
  const calls = {
    fetch: [],
    signBill: [],
    ensureCnyRate: 0,
    priceRub: [],
    resolvePublic: [],
    pickEndpoint: [],
    pickMiniEndpoint: 0,
  };

  const deps = {
    arkApiKey: 'ark-key',
    arkBase: 'https://ark.example.com/api/v3',
    getUser: async () => ({ id: 'user-1' }),
    resolvePublic: async (value, userId) => {
      calls.resolvePublic.push([value, userId]);
      return typeof value === 'string' ? value.replace('data:', 'https://cdn.example.com/') : value;
    },
    buildContent: (input) => {
      if (!input.prompt && !input.image_url && !input.first_frame_image && !input.video_url) return [];
      return [{ type: 'text', text: input.prompt || 'fallback' }];
    },
    ensureCnyRate: async () => {
      calls.ensureCnyRate += 1;
    },
    priceRub: async (...args) => {
      calls.priceRub.push(args);
      return 321.45;
    },
    seedance2RateCny: () => 46,
    signBill: (...args) => {
      calls.signBill.push(args);
      return 'bill-token';
    },
    pickEndpoint: (fast) => {
      calls.pickEndpoint.push(fast);
      return fast ? 'ep-fast' : 'ep-std';
    },
    pickMiniEndpoint: () => {
      calls.pickMiniEndpoint += 1;
      return 'ep-mini';
    },
    fetchImpl: async (url, options) => {
      calls.fetch.push([url, options]);
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'task-1' }),
      };
    },
    fastModelId: 'doubao-seedance-2-0-fast-260128',
    stdModelId: 'doubao-seedance-2-0-260128',
    miniModelId: 'doubao-seedance-2-0-mini-260615',
    ...overrides,
  };

  return { deps, calls };
}

function createPollDeps(overrides = {}) {
  const calls = {
    fetch: [],
    verifyBillData: [],
    rubFromTokens: [],
    chargeForTask: [],
  };

  const deps = {
    arkApiKey: 'ark-key',
    arkBase: 'https://ark.example.com/api/v3',
    verifyBillData: (bill) => {
      calls.verifyBillData.push(bill);
      return {
        model: 'doubao-seedance-2-0-260128',
        resolution: '720p',
        hasVideoInput: false,
        userId: 'user-1',
      };
    },
    seedance2RateCny: () => 46,
    rubFromTokens: async (...args) => {
      calls.rubFromTokens.push(args);
      return 150.25;
    },
    chargeForTask: async (...args) => {
      calls.chargeForTask.push(args);
    },
    fetchImpl: async (url, options) => {
      calls.fetch.push([url, options]);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'succeeded',
          content: { video_url: 'https://cdn.example.com/video.mp4', last_frame_url: 'https://cdn.example.com/frame.jpg' },
          usage: { total_tokens: 1234 },
        }),
      };
    },
    ...overrides,
  };

  return { deps, calls };
}

test('submitSeedanceTask returns 503 when ARK_API_KEY is missing', async () => {
  const { deps } = createSubmitDeps({ arkApiKey: '' });
  const result = await submitSeedanceTask(deps, { prompt: 'кот' });
  assert.deepStrictEqual(result, { status: 503, body: { error: 'ARK_API_KEY not configured' } });
});

test('submitSeedanceTask returns 400 when content is empty', async () => {
  const { deps } = createSubmitDeps({
    buildContent: () => [],
  });
  const result = await submitSeedanceTask(deps, { prompt: '' });
  assert.deepStrictEqual(result, { status: 400, body: { error: 'Empty content' } });
});

test('submitSeedanceTask downgrades fast 1080p to 720p and returns bill metadata', async () => {
  const { deps, calls } = createSubmitDeps();
  const result = await submitSeedanceTask(deps, {
    fast: true,
    prompt: 'быстрая сцена',
    resolution: '1080p',
    duration: 8,
    generate_audio: false,
    seed: 42,
    return_last_frame: true,
  });

  assert.strictEqual(result.status, 200);
  assert.deepStrictEqual(result.body, {
    taskId: 'task-1',
    endpoint: 'ep-fast',
    bill: 'bill-token',
    estimatedCost: 321.45,
    rateCny: 46,
  });
  assert.strictEqual(calls.ensureCnyRate, 1);
  assert.deepStrictEqual(calls.signBill[0], [
    321.45,
    {
      model: 'doubao-seedance-2-0-fast-260128',
      resolution: '720p',
      hasVideoInput: false,
      userId: 'user-1',
    },
  ]);
  const [, fetchOptions] = calls.fetch[0];
  const payload = JSON.parse(fetchOptions.body);
  assert.strictEqual(payload.model, 'ep-fast');
  assert.strictEqual(payload.resolution, '720p');
  assert.strictEqual(payload.generate_audio, false);
  assert.strictEqual(payload.seed, 42);
  assert.strictEqual(payload.return_last_frame, true);
});

test('submitSeedanceTask routes mini through mini endpoint pool and keeps mini pricing', async () => {
  const { deps, calls } = createSubmitDeps({
    seedance2RateCny: () => 23,
  });
  const result = await submitSeedanceTask(deps, {
    model: 'doubao-seedance-2-0-mini-260615',
    prompt: 'мини ролик',
    resolution: '720p',
    duration: 6,
    video_url: 'https://cdn.example.com/ref.mp4',
  });

  assert.strictEqual(result.status, 200);
  assert.deepStrictEqual(result.body, {
    taskId: 'task-1',
    endpoint: 'ep-mini',
    bill: 'bill-token',
    estimatedCost: 321.45,
    rateCny: 23,
  });
  assert.deepStrictEqual(calls.pickEndpoint, []);
  assert.strictEqual(calls.pickMiniEndpoint, 1);
  assert.deepStrictEqual(calls.priceRub[0], [
    'video',
    'doubao-seedance-2-0-mini-260615',
    {
      resolution: '720p',
      video_url: 'https://cdn.example.com/ref.mp4',
      video_urls: undefined,
      duration: 6,
      generate_audio: true,
    },
  ]);
  assert.deepStrictEqual(calls.signBill[0], [
    321.45,
    {
      model: 'doubao-seedance-2-0-mini-260615',
      resolution: '720p',
      hasVideoInput: true,
      userId: 'user-1',
    },
  ]);
  const [, fetchOptions] = calls.fetch[0];
  const payload = JSON.parse(fetchOptions.body);
  assert.strictEqual(payload.model, 'ep-mini');
  assert.strictEqual(payload.resolution, '720p');
});

test('submitSeedanceTask treats video_urls as video input for mini pricing', async () => {
  const { deps, calls } = createSubmitDeps({
    seedance2RateCny: () => 14,
  });
  const result = await submitSeedanceTask(deps, {
    model: 'doubao-seedance-2-0-mini-260615',
    prompt: 'мини ролик с видео-референсом',
    resolution: '720p',
    duration: 6,
    video_urls: ['https://cdn.example.com/ref.mp4'],
  });

  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.body.rateCny, 14);
  assert.deepStrictEqual(calls.priceRub[0], [
    'video',
    'doubao-seedance-2-0-mini-260615',
    {
      resolution: '720p',
      video_url: undefined,
      video_urls: ['https://cdn.example.com/ref.mp4'],
      duration: 6,
      generate_audio: true,
    },
  ]);
  assert.deepStrictEqual(calls.signBill[0], [
    321.45,
    {
      model: 'doubao-seedance-2-0-mini-260615',
      resolution: '720p',
      hasVideoInput: true,
      userId: 'user-1',
    },
  ]);
});

test('submitSeedanceTask resolves face thumbnail and image references before content build', async () => {
  let capturedInput = null;
  const { deps, calls } = createSubmitDeps({
    buildContent: (input) => {
      capturedInput = input;
      return [{ type: 'text', text: input.prompt }];
    },
  });

  await submitSeedanceTask(deps, {
    prompt: 'портрет',
    image_url: 'data:image/png;base64,abc',
    face_asset: 'asset://hero',
    face_thumbnail: 'data:image/png;base64,thumb',
    last_image_url: 'data:image/png;base64,last',
  });

  assert.strictEqual(capturedInput.image_url, 'https://cdn.example.com/image/png;base64,abc');
  assert.strictEqual(capturedInput.face_thumbnail, 'https://cdn.example.com/image/png;base64,thumb');
  assert.strictEqual(capturedInput.last_image_url, 'https://cdn.example.com/image/png;base64,last');
  assert.ok(calls.resolvePublic.length >= 3);
});

test('submitSeedanceTask returns Ark API errors with original status', async () => {
  const { deps } = createSubmitDeps({
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      json: async () => ({ error: { message: 'Rate limited' } }),
    }),
  });

  const result = await submitSeedanceTask(deps, { prompt: 'кот' });
  assert.deepStrictEqual(result, { status: 429, body: { error: 'Rate limited' } });
});

test('pollSeedanceTask returns 400 when taskId is missing', async () => {
  const { deps } = createPollDeps();
  const result = await pollSeedanceTask(deps, { taskId: '' });
  assert.deepStrictEqual(result, { status: 400, body: { error: 'Missing taskId' } });
});

test('pollSeedanceTask returns 503 when ARK_API_KEY is missing', async () => {
  const { deps } = createPollDeps({ arkApiKey: '' });
  const result = await pollSeedanceTask(deps, { taskId: 'task-1' });
  assert.deepStrictEqual(result, { status: 503, body: { error: 'ARK_API_KEY not configured' } });
});

test('pollSeedanceTask returns success payload and charges by usage.total_tokens', async () => {
  const { deps, calls } = createPollDeps();
  const request = { headers: {} };
  const result = await pollSeedanceTask(deps, {
    request,
    taskId: 'task-1',
    bill: 'bill-token',
  });

  assert.deepStrictEqual(result, {
    status: 200,
    body: {
      status: 'succeeded',
      url: 'https://cdn.example.com/video.mp4',
      error: null,
      tokens: 1234,
      last_frame_url: 'https://cdn.example.com/frame.jpg',
    },
  });
  assert.deepStrictEqual(calls.verifyBillData, ['bill-token']);
  assert.deepStrictEqual(calls.rubFromTokens, [[1234, 46, 'user-1']]);
  assert.strictEqual(calls.chargeForTask.length, 1);
  assert.deepStrictEqual(calls.chargeForTask[0], [
    request,
    'task-1',
    150.25,
    'ark_seedance_doubao-seedance-2-0-260128',
    { model: 'doubao-seedance-2-0-260128', taskId: 'task-1', tokens: 1234 },
  ]);
});

test('pollSeedanceTask skips charging when bill token is invalid', async () => {
  const { deps, calls } = createPollDeps({
    verifyBillData: () => null,
  });
  const result = await pollSeedanceTask(deps, {
    request: {},
    taskId: 'task-2',
    bill: 'bad-bill',
  });

  assert.strictEqual(result.status, 200);
  assert.strictEqual(calls.chargeForTask.length, 0);
  assert.strictEqual(calls.rubFromTokens.length, 0);
});

test('pollSeedanceTask returns Ark polling errors with original status', async () => {
  const { deps } = createPollDeps({
    fetchImpl: async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Upstream failed' }),
    }),
  });

  const result = await pollSeedanceTask(deps, { taskId: 'task-3' });
  assert.deepStrictEqual(result, { status: 500, body: { error: 'Upstream failed' } });
});
