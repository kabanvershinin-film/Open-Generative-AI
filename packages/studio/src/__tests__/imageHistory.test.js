import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeImageHistoryEntries } from '../components/imageHistory.js';

test('mergeImageHistoryEntries убирает дубли по id и url', () => {
  const result = mergeImageHistoryEntries(
    [
      { id: 'one', url: 'https://cdn.example.com/a.png', timestamp: '2026-06-24T10:00:00.000Z' },
      { id: 'two', url: 'https://cdn.example.com/b.png', timestamp: '2026-06-24T09:00:00.000Z' },
    ],
    [
      { id: 'one', url: 'https://cdn.example.com/a-new.png', timestamp: '2026-06-24T11:00:00.000Z' },
      { id: 'three', url: 'https://cdn.example.com/b.png', timestamp: '2026-06-24T08:00:00.000Z' },
      { id: 'four', url: '', timestamp: '2026-06-24T07:00:00.000Z' },
    ],
  );

  assert.deepStrictEqual(result.map((entry) => entry.id), ['one', 'two']);
  assert.deepStrictEqual(result.map((entry) => entry.url), [
    'https://cdn.example.com/a.png',
    'https://cdn.example.com/b.png',
  ]);
});

test('mergeImageHistoryEntries сортирует по времени и ограничивает размер истории', () => {
  const entries = Array.from({ length: 55 }, (_, index) => ({
    id: `id-${index}`,
    url: `https://cdn.example.com/${index}.png`,
    timestamp: new Date(Date.UTC(2026, 5, 24, 0, 0, index)).toISOString(),
  }));

  const result = mergeImageHistoryEntries(entries, []);

  assert.strictEqual(result.length, 50);
  assert.strictEqual(result[0].id, 'id-54');
  assert.strictEqual(result.at(-1).id, 'id-5');
});
