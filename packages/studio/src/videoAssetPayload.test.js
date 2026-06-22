import test from 'node:test';
import assert from 'node:assert';
import {
  buildSeedanceStudioPayload,
  ensureFaceAssetPromptTag,
  normalizeAssetUri,
  validateFaceAsset,
} from './videoAssetPayload.js';

test('normalizeAssetUri accepts asset URI and raw asset id', () => {
  assert.strictEqual(normalizeAssetUri('asset://character1'), 'asset://character1');
  assert.strictEqual(normalizeAssetUri('asset-character1'), 'asset://asset-character1');
  assert.strictEqual(normalizeAssetUri('https://example.com/face.jpg'), null);
  assert.strictEqual(normalizeAssetUri(''), null);
  assert.strictEqual(normalizeAssetUri(null), null);
});

test('ensureFaceAssetPromptTag appends or replaces character reference with 图片1', () => {
  const face = { uri: 'asset://character1', name: 'Жека' };

  assert.strictEqual(ensureFaceAssetPromptTag('ведёт машину', face), 'ведёт машину 图片1');
  assert.strictEqual(ensureFaceAssetPromptTag('Жека ведёт машину', face), '图片1 ведёт машину');
  assert.strictEqual(ensureFaceAssetPromptTag('图片1 ведёт машину', face), '图片1 ведёт машину');
  assert.strictEqual(ensureFaceAssetPromptTag('Жека ведёт машину 图片1', face), 'Жека ведёт машину 图片1'); // Если тег уже есть, не меняем
  assert.strictEqual(ensureFaceAssetPromptTag('', face), '图片1');
  assert.strictEqual(ensureFaceAssetPromptTag('ведёт машину', null), 'ведёт машину');
});

test('buildSeedanceStudioPayload carries face_asset and ready references', () => {
  const payload = buildSeedanceStudioPayload({
    model: 'seedance-2.0-fast-t2v',
    prompt: 'cinematic driving scene',
    aspectRatio: '16:9',
    uploadedImageUrl: 'https://cdn.example.com/base.jpg',
    uploadedVideoUrl: 'https://cdn.example.com/ref.mp4',
    uploadedAudioUrl: 'https://cdn.example.com/ref.mp3',
    refFiles: [
      { kind: 'image', url: 'https://cdn.example.com/i1.jpg' },
      { kind: 'image', url: null, uploading: true },
      { kind: 'video', url: 'https://cdn.example.com/v1.mp4' },
      { kind: 'audio', url: 'https://cdn.example.com/a1.mp3' },
    ],
    faceAsset: { uri: 'asset://character1', name: 'Hero', thumbnail: 'https://cdn.example.com/thumb.jpg', status: 'Active' },
    isI2V: false,
    seed: 42,
    returnLastFrame: true,
  });

  assert.strictEqual(payload.prompt, 'cinematic driving scene 图片1');
  assert.strictEqual(payload.face_asset, 'asset://character1');
  assert.strictEqual(payload.face_thumbnail, 'https://cdn.example.com/thumb.jpg');
  assert.deepStrictEqual(payload.image_urls, ['https://cdn.example.com/base.jpg', 'https://cdn.example.com/i1.jpg']);
  assert.deepStrictEqual(payload.video_urls, ['https://cdn.example.com/v1.mp4']);
  assert.deepStrictEqual(payload.audio_urls, ['https://cdn.example.com/a1.mp3']);
  assert.strictEqual(payload.video_url, 'https://cdn.example.com/ref.mp4');
  assert.strictEqual(payload.audio_url, 'https://cdn.example.com/ref.mp3');
  assert.strictEqual(payload.seed, 42);
  assert.strictEqual(payload.return_last_frame, true);
  assert.strictEqual('first_frame_image' in payload, false);
});

test('buildSeedanceStudioPayload works without face asset', () => {
  const payload = buildSeedanceStudioPayload({
    model: 'seedance-2.0-fast-t2v',
    prompt: 'cinematic scene',
    aspectRatio: '9:16',
    isI2V: false,
  });

  assert.strictEqual(payload.prompt, 'cinematic scene');
  assert.strictEqual(payload.face_asset, undefined);
  assert.strictEqual(payload.face_thumbnail, undefined);
});

test('buildSeedanceStudioPayload works in I2V mode', () => {
  const payload = buildSeedanceStudioPayload({
    model: 'seedance-2.0-i2v',
    prompt: 'animate this image',
    uploadedImageUrl: 'https://cdn.example.com/input.jpg',
    isI2V: true,
  });

  assert.strictEqual(payload.is_i2v, true);
  assert.deepStrictEqual(payload.image_urls, ['https://cdn.example.com/input.jpg']);
});

test('buildSeedanceStudioPayload omits optional fields when they are not provided', () => {
  const payload = buildSeedanceStudioPayload({
    model: 'seedance-2.0-fast-t2v',
    prompt: 'minimal prompt',
    refFiles: [{ kind: 'image', url: 'https://cdn.example.com/ready.jpg', uploading: false }],
  });

  assert.deepStrictEqual(payload.image_urls, ['https://cdn.example.com/ready.jpg']);
  assert.deepStrictEqual(payload.video_urls, []);
  assert.deepStrictEqual(payload.audio_urls, []);
  assert.strictEqual(payload.seed, undefined);
  assert.strictEqual(payload.return_last_frame, undefined);
  assert.strictEqual('first_frame_image' in payload, false);
});

test('validateFaceAsset rejects invalid formats and non-ready statuses', () => {
  assert.strictEqual(validateFaceAsset({ uri: 'http://example.com/face.jpg' }).ok, false);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', thumbnail: 'ftp://example.com/x.jpg' }).ok, false);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', status: 'Training' }).ok, false);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', status: 'Ready' }).ok, true);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', status: 'Active' }).ok, true);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', status: 'Succeeded' }).ok, true);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', status: 'Completed' }).ok, true);
});
