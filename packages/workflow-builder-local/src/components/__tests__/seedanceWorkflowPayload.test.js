import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSeedanceWorkflowBody,
  buildSeedanceWorkflowImages,
  ensureSeedanceFaceTags,
} from '../seedanceWorkflowPayload.js';

test('buildSeedanceWorkflowImages keeps two connected face assets', () => {
  const images = buildSeedanceWorkflowImages({
    connectedFaceAssets: [
      { uri: 'asset://face-1', thumbnail: 'https://cdn.example.com/face-1.jpg' },
      { uri: 'asset://face-2', thumbnail: 'https://cdn.example.com/face-2.jpg' },
    ],
  });

  assert.strictEqual(images.length, 2);
  assert.deepStrictEqual(images.map((image) => image.face_asset), ['asset://face-1', 'asset://face-2']);
  assert.deepStrictEqual(images.map((image) => image.url), [
    'https://cdn.example.com/face-1.jpg',
    'https://cdn.example.com/face-2.jpg',
  ]);
});

test('buildSeedanceWorkflowImages pairs multiple images with multiple face assets', () => {
  const images = buildSeedanceWorkflowImages({
    connectedImages: [
      { url: 'https://cdn.example.com/base-1.jpg' },
      { url: 'https://cdn.example.com/base-2.jpg' },
      { url: 'https://cdn.example.com/base-3.jpg' },
    ],
    connectedFaceAssets: [
      { uri: 'asset://face-1', thumbnail: 'https://cdn.example.com/face-1.jpg' },
      { uri: 'asset://face-2', thumbnail: 'https://cdn.example.com/face-2.jpg' },
    ],
  });

  assert.deepStrictEqual(images, [
    { url: 'https://cdn.example.com/base-1.jpg', face_asset: 'asset://face-1' },
    { url: 'https://cdn.example.com/base-2.jpg', face_asset: 'asset://face-2' },
    { url: 'https://cdn.example.com/base-3.jpg' },
  ]);
});

test('ensureSeedanceFaceTags appends missing tags for all face references', () => {
  const prompt = ensureSeedanceFaceTags('Кинематографичная сцена 图片1', [
    { url: 'https://cdn.example.com/a.jpg', face_asset: 'asset://face-1' },
    { url: 'https://cdn.example.com/b.jpg', face_asset: 'asset://face-2' },
  ]);

  assert.strictEqual(prompt, 'Кинематографичная сцена 图片1 图片2');
});

test('buildSeedanceWorkflowBody avoids collapsing multiple face assets into one top-level face_asset', () => {
  const body = buildSeedanceWorkflowBody({
    fast: true,
    prompt: 'Два персонажа',
    connectedFaceAssets: [
      { uri: 'asset://face-1', thumbnail: 'https://cdn.example.com/face-1.jpg' },
      { uri: 'asset://face-2', thumbnail: 'https://cdn.example.com/face-2.jpg' },
    ],
    formValues: {
      resolution: '720p',
      duration: 5,
      aspect_ratio: '16:9',
    },
  });

  assert.strictEqual(body.face_asset, undefined);
  assert.strictEqual(body.image_urls.length, 2);
  assert.match(body.prompt, /图片1/);
  assert.match(body.prompt, /图片2/);
});
