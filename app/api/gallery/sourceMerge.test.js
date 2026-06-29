import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGalleryEntriesFromCompletedTasks,
  buildGalleryEntriesFromTosMediaUrls,
  mergeGalleryEntriesWithFallback,
} from './sourceMerge.js';

test('buildGalleryEntriesFromCompletedTasks строит gallery entry из завершённой задачи', () => {
  const entries = buildGalleryEntriesFromCompletedTasks([
    {
      id: 'task-1',
      type: 'video',
      model: 'seedance',
      prompt: 'кот',
      updated_at: '2026-06-29T15:00:00.000Z',
      entry: {
        url: 'https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4?X-Tos-Expires=86400',
        last_frame_url: 'https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.jpg?X-Tos-Expires=86400',
        dedupeKey: 'mf-video:task-1',
      },
    },
  ], (value) => value.split('?')[0]);

  assert.deepStrictEqual(entries, [
    {
      id: 'task-1',
      type: 'video',
      url: 'https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.mp4',
      preview_url: undefined,
      thumbnail: undefined,
      last_frame_url: 'https://bucket.tos-cn-beijing.volces.com/users/1/videos/a.jpg',
      first_frame_url: undefined,
      model: 'seedance',
      prompt: 'кот',
      dedupe_key: 'mf-video:task-1',
      created_at: '2026-06-29T15:00:00.000Z',
    },
  ]);
});

test('mergeGalleryEntriesWithFallback добавляет недостающую запись из completed tasks', () => {
  const merged = mergeGalleryEntriesWithFallback(
    [
      { id: 'gallery-1', url: 'https://tos.example.com/existing.mp4', dedupe_key: 'mf-video:one' },
    ],
    [
      { id: 'task-1', url: 'https://tos.example.com/existing.mp4', dedupe_key: 'mf-video:one' },
      { id: 'task-2', url: 'https://tos.example.com/missing.mp4', dedupe_key: 'mf-video:two' },
    ],
  );

  assert.deepStrictEqual(merged, [
    { id: 'gallery-1', url: 'https://tos.example.com/existing.mp4', dedupe_key: 'mf-video:one' },
    { id: 'task-2', url: 'https://tos.example.com/missing.mp4', dedupe_key: 'mf-video:two' },
  ]);
});

test('buildGalleryEntriesFromTosMediaUrls строит карточки напрямую из TOS videos folder', () => {
  const entries = buildGalleryEntriesFromTosMediaUrls([
    'https://bucket.tos-cn-beijing.volces.com/users/user-1/videos/1712345678901_abcd1.mp4',
    'https://bucket.tos-cn-beijing.volces.com/users/user-1/videos/not-video.jpg',
  ]);

  assert.strictEqual(entries.length, 1);
  assert.strictEqual(entries[0].type, 'video');
  assert.strictEqual(entries[0].url, 'https://bucket.tos-cn-beijing.volces.com/users/user-1/videos/1712345678901_abcd1.mp4');
  assert.strictEqual(entries[0].created_at, '2024-04-05T19:34:38.901Z');
  assert.match(entries[0].id, /^tos-media-/);
});
