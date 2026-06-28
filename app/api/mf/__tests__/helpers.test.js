import test from 'node:test';
import assert from 'node:assert/strict';

import { buildImageChargeMeta, buildMfImageGalleryDedupeKey } from '../helpers.js';

test('buildImageChargeMeta берет usage из ответа провайдера', () => {
  const meta = buildImageChargeMeta(
    ['v1', 'images', 'generations'],
    'gpt-image-2',
    { usage: { prompt_tokens: 62, completion_tokens: 765 } },
  );

  assert.deepStrictEqual(meta, {
    source: 'fixed',
    model: 'gpt-image-2',
    path: '/v1/images/generations',
    usage: { prompt_tokens: 62, completion_tokens: 765 },
  });
});

test('buildImageChargeMeta возвращает null usage, если провайдер его не прислал', () => {
  const meta = buildImageChargeMeta(
    ['v1', 'images', 'generations'],
    'gpt-image-2',
    {},
  );

  assert.deepStrictEqual(meta, {
    source: 'fixed',
    model: 'gpt-image-2',
    path: '/v1/images/generations',
    usage: null,
  });
});

test('buildMfImageGalleryDedupeKey строит одинаковый ключ для одной и той же исходной картинки', () => {
  const first = buildMfImageGalleryDedupeKey('https://cdn.example.com/raw-image.png');
  const second = buildMfImageGalleryDedupeKey('https://cdn.example.com/raw-image.png');
  const third = buildMfImageGalleryDedupeKey('https://cdn.example.com/other-image.png');

  assert.strictEqual(first, 'mf-image:https://cdn.example.com/raw-image.png');
  assert.strictEqual(second, first);
  assert.notStrictEqual(third, first);
  assert.strictEqual(buildMfImageGalleryDedupeKey(''), '');
});
