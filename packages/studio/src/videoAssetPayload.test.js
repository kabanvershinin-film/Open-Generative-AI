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
});

test('ensureFaceAssetPromptTag appends or replaces character reference with 图片1', () => {
  const face = { uri: 'asset://character1', name: 'Жека' };

  assert.strictEqual(ensureFaceAssetPromptTag('ведёт машину', face), 'ведёт машину 图片1');
  assert.strictEqual(ensureFaceAssetPromptTag('Жека ведёт машину', face), '图片1 ведёт машину');
  assert.strictEqual(ensureFaceAssetPromptTag('图片1 ведёт машину', face), '图片1 ведёт машину');
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
  });

  assert.strictEqual(payload.prompt, 'cinematic driving scene 图片1');
  assert.strictEqual(payload.face_asset, 'asset://character1');
  assert.strictEqual(payload.face_thumbnail, 'https://cdn.example.com/thumb.jpg');
  assert.deepStrictEqual(payload.image_urls, ['https://cdn.example.com/i1.jpg']);
  assert.deepStrictEqual(payload.video_urls, ['https://cdn.example.com/v1.mp4']);
  assert.deepStrictEqual(payload.audio_urls, ['https://cdn.example.com/a1.mp3']);
  assert.strictEqual(payload.image_url, 'https://cdn.example.com/base.jpg');
  assert.strictEqual(payload.video_url, 'https://cdn.example.com/ref.mp4');
  assert.strictEqual(payload.audio_url, 'https://cdn.example.com/ref.mp3');
});

test('validateFaceAsset rejects invalid formats and non-ready statuses', () => {
  assert.strictEqual(validateFaceAsset({ uri: 'http://example.com/face.jpg' }).ok, false);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', thumbnail: 'ftp://example.com/x.jpg' }).ok, false);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', status: 'Training' }).ok, false);
  assert.strictEqual(validateFaceAsset({ uri: 'asset://character1', status: 'Ready' }).ok, true);
});
