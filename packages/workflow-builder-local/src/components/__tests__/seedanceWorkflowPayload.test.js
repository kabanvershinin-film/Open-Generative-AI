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
  assert.deepStrictEqual(images.map((image) => image.url), [
    'asset://face-1',
    'asset://face-2',
  ]);
});

test('buildSeedanceWorkflowImages keeps assets first and preserves extra image references', () => {
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
    { url: 'asset://face-1', thumbnail: 'https://cdn.example.com/face-1.jpg' },
    { url: 'asset://face-2', thumbnail: 'https://cdn.example.com/face-2.jpg' },
    { url: 'https://cdn.example.com/base-1.jpg' },
    { url: 'https://cdn.example.com/base-2.jpg' },
    { url: 'https://cdn.example.com/base-3.jpg' },
  ]);
});

test('buildSeedanceWorkflowImages includes workflow images_list references', () => {
  const images = buildSeedanceWorkflowImages({
    connectedFaceAssets: [
      { uri: 'asset://face-1', thumbnail: 'https://cdn.example.com/face-1.jpg' },
    ],
    imageUrl: 'https://cdn.example.com/main-image.jpg',
    imageUrls: [
      'https://cdn.example.com/cat-ref.jpg',
      { url: 'https://cdn.example.com/extra-ref.jpg' },
      'https://cdn.example.com/main-image.jpg',
    ],
  });

  assert.deepStrictEqual(images, [
    { url: 'asset://face-1', thumbnail: 'https://cdn.example.com/face-1.jpg' },
    { url: 'https://cdn.example.com/main-image.jpg' },
    { url: 'https://cdn.example.com/cat-ref.jpg' },
    { url: 'https://cdn.example.com/extra-ref.jpg' },
  ]);
});

test('ensureSeedanceFaceTags appends missing tags for all face references', () => {
  const prompt = ensureSeedanceFaceTags('Кинематографичная сцена 图片1', [
    { url: 'asset://face-1' },
    { url: 'asset://face-2' },
  ]);

  assert.strictEqual(prompt, 'Кинематографичная сцена 图片1 图片2');
});

test('buildSeedanceWorkflowBody avoids collapsing multiple face assets into one top-level face_asset', () => {
  const body = buildSeedanceWorkflowBody({
    model: 'doubao-seedance-2-0-mini-260615',
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

  assert.strictEqual(body.image_urls.length, 2);
  assert.deepStrictEqual(body.image_urls.map((image) => image.url), ['asset://face-1', 'asset://face-2']);
  assert.match(body.prompt, /图片1/);
  assert.match(body.prompt, /图片2/);
});

test('buildSeedanceWorkflowBody keeps Seedance Mini model and studio-style flags', () => {
  const body = buildSeedanceWorkflowBody({
    model: 'doubao-seedance-2-0-mini-260615',
    prompt: 'Мини-видео',
    formValues: {
      resolution: '720p',
      duration: 6,
      aspect_ratio: '16:9',
      seed: 42,
      return_last_frame: true,
    },
  });

  assert.strictEqual(body.model, 'doubao-seedance-2-0-mini-260615');
  assert.strictEqual(body.seed, 42);
  assert.strictEqual(body.return_last_frame, true);
  assert.strictEqual(body.generate_audio, true);
});

test('buildSeedanceWorkflowBody forwards image_url and images_list into image_urls', () => {
  const body = buildSeedanceWorkflowBody({
    model: 'doubao-seedance-2-0-mini-260615',
    prompt: '图片1 стоит, 图片2 кот как референс',
    formValues: {
      image_url: 'https://cdn.example.com/main-image.jpg',
      images_list: ['https://cdn.example.com/cat-ref.jpg'],
    },
  });

  assert.deepStrictEqual(body.image_urls, [
    { url: 'https://cdn.example.com/main-image.jpg' },
    { url: 'https://cdn.example.com/cat-ref.jpg' },
  ]);
});
