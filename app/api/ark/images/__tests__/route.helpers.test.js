import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildArkImagePayload,
  extractArkImageError,
  normalizeArkImageField,
} from '../route.helpers.js';

test('normalizeArkImageField убирает пустые значения и схлопывает один image', () => {
  assert.strictEqual(normalizeArkImageField('https://cdn.example.com/a.png'), 'https://cdn.example.com/a.png');
  assert.strictEqual(normalizeArkImageField(['', 'https://cdn.example.com/a.png', '   ']), 'https://cdn.example.com/a.png');
  assert.deepStrictEqual(normalizeArkImageField([
    'https://cdn.example.com/a.png',
    'https://cdn.example.com/b.png',
  ]), [
    'https://cdn.example.com/a.png',
    'https://cdn.example.com/b.png',
  ]);
});

test('buildArkImagePayload собирает documented single-image payload', () => {
  const payload = buildArkImagePayload({
    model: 'doubao-seedream-5-0-260128',
    prompt: 'кот',
    image: 'https://cdn.example.com/cat.png',
    size: '2048x2048',
    output_format: 'png',
  });

  assert.deepStrictEqual(payload, {
    model: 'doubao-seedream-5-0-260128',
    prompt: 'кот',
    image: 'https://cdn.example.com/cat.png',
    size: '2048x2048',
    output_format: 'png',
    response_format: 'url',
    sequential_image_generation: 'disabled',
    stream: false,
    watermark: false,
  });
});

test('buildArkImagePayload сохраняет multi-image массив и явные флаги', () => {
  const payload = buildArkImagePayload({
    model: 'doubao-seedream-5-0-260128',
    prompt: 'коллаж',
    image: ['https://cdn.example.com/1.png', 'https://cdn.example.com/2.png'],
    stream: true,
    watermark: true,
  });

  assert.deepStrictEqual(payload.image, [
    'https://cdn.example.com/1.png',
    'https://cdn.example.com/2.png',
  ]);
  assert.strictEqual(payload.stream, true);
  assert.strictEqual(payload.watermark, true);
  assert.strictEqual(payload.response_format, 'url');
});

test('extractArkImageError вытаскивает сообщение в приоритетном порядке', () => {
  assert.strictEqual(extractArkImageError({ error: { message: 'bad request' } }, 400), 'bad request');
  assert.strictEqual(extractArkImageError({ error: 'plain error' }, 400), 'plain error');
  assert.strictEqual(extractArkImageError({}, 503), 'Ark image error 503');
});
