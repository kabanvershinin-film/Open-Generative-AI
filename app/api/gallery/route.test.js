import test from 'node:test';
import assert from 'node:assert';
import { paginateGalleryEntries } from './pagination.js';

test('paginateGalleryEntries returns requested video page with next cursor', () => {
  const entries = Array.from({ length: 25 }, (_, index) => ({
    id: `id-${index}`,
    type: index % 2 === 0 ? 'video' : 'image',
    url: `https://cdn.example.com/${index}.mp4`,
    thumbnail: `https://cdn.example.com/${index}.jpg`,
  }));

  const page = paginateGalleryEntries(entries, new URLSearchParams('type=video&limit=5&cursor=5'));

  assert.strictEqual(page.entries.length, 5);
  assert.strictEqual(page.total, 13);
  assert.strictEqual(page.nextCursor, 10);
  assert.strictEqual(page.entries[0].id, 'id-10');
  assert.strictEqual(page.entries[0].preview_url, 'https://cdn.example.com/10.jpg');
});

test('paginateGalleryEntries clamps invalid limits and cursors', () => {
  const entries = Array.from({ length: 60 }, (_, index) => ({ id: `id-${index}`, type: 'video', url: `u-${index}` }));

  const page = paginateGalleryEntries(entries, new URLSearchParams('limit=500&cursor=-10'));

  assert.strictEqual(page.limit, 50);
  assert.strictEqual(page.cursor, 0);
  assert.strictEqual(page.entries.length, 50);
  assert.strictEqual(page.nextCursor, 50);
});

test('paginateGalleryEntries falls back to null preview url', () => {
  const page = paginateGalleryEntries([{ id: '1', type: 'video', url: 'video.mp4' }], new URLSearchParams('type=video'));

  assert.strictEqual(page.entries.length, 1);
  assert.strictEqual(page.entries[0].preview_url, null);
  assert.strictEqual(page.nextCursor, null);
});
