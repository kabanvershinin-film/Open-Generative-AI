import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AUTH_STORAGE_OWNER_KEY,
  clearStudioStorageForAccountChange,
  reconcileStudioStorageOwner,
  shouldResetStudioStorage,
} from '../storageIsolation.js';

function createStorage(initialEntries = {}) {
  const store = new Map(Object.entries(initialEntries));
  return {
    get length() {
      return store.size;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test('shouldResetStudioStorage срабатывает только при смене владельца', () => {
  assert.equal(shouldResetStudioStorage('', ''), false);
  assert.equal(shouldResetStudioStorage('user-1', 'user-1'), false);
  assert.equal(shouldResetStudioStorage('user-1', 'user-2'), true);
  assert.equal(shouldResetStudioStorage('user-1', ''), true);
  assert.equal(shouldResetStudioStorage('', 'user-2'), true);
});

test('clearStudioStorageForAccountChange удаляет только студийные ключи', () => {
  const storage = createStorage({
    mf_video_studio_persistent: '{"localHistory":[1]}',
    'mf_image_studio_persistent:user-1': '{"localHistory":[2]}',
    muapi_key: 'secret',
    other_key: 'keep',
  });

  const cleared = clearStudioStorageForAccountChange(storage);

  assert.equal(cleared, 2);
  assert.equal(storage.getItem('mf_video_studio_persistent'), null);
  assert.equal(storage.getItem('mf_image_studio_persistent:user-1'), null);
  assert.equal(storage.getItem('muapi_key'), 'secret');
  assert.equal(storage.getItem('other_key'), 'keep');
});

test('reconcileStudioStorageOwner очищает старый студийный кэш при новом аккаунте', () => {
  const storage = createStorage({
    [AUTH_STORAGE_OWNER_KEY]: 'user-old',
    mf_video_studio_persistent: '{"localHistory":[1]}',
    mf_image_studio_recent_results: '{"entries":[1]}',
  });

  const result = reconcileStudioStorageOwner(storage, 'user-new');

  assert.equal(result.previousOwnerId, 'user-old');
  assert.equal(result.nextOwnerId, 'user-new');
  assert.equal(result.cleared, 2);
  assert.equal(storage.getItem(AUTH_STORAGE_OWNER_KEY), 'user-new');
  assert.equal(storage.getItem('mf_video_studio_persistent'), null);
  assert.equal(storage.getItem('mf_image_studio_recent_results'), null);
});

test('reconcileStudioStorageOwner не трогает кэш, если аккаунт тот же', () => {
  const storage = createStorage({
    [AUTH_STORAGE_OWNER_KEY]: 'user-1',
    mf_video_studio_persistent: '{"localHistory":[1]}',
  });

  const result = reconcileStudioStorageOwner(storage, 'user-1');

  assert.equal(result.cleared, 0);
  assert.equal(storage.getItem('mf_video_studio_persistent'), '{"localHistory":[1]}');
  assert.equal(storage.getItem(AUTH_STORAGE_OWNER_KEY), 'user-1');
});
