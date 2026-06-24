import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildLegacyWorkflowStorageKey,
    buildUserMediaKey,
    buildUserTosRoot,
    buildWorkflowStorageKey,
} from '../tosPaths.js';

test('buildUserTosRoot возвращает корень пользователя и anonymous fallback', () => {
    assert.strictEqual(buildUserTosRoot('user-1'), 'users/user-1');
    assert.strictEqual(buildUserTosRoot(null), 'users/anonymous');
});

test('buildUserMediaKey строит путь с папкой, расширением и префиксом', () => {
    const key = buildUserMediaKey('user-1', 'images', 'png', 'preview');

    assert.match(key, /^users\/user-1\/images\/preview_\d+_[a-z0-9]+\.png$/);
});

test('buildWorkflowStorageKey и buildLegacyWorkflowStorageKey формируют ожидаемые ключи', () => {
    assert.strictEqual(buildWorkflowStorageKey('user-1', 'wf-1'), 'users/user-1/workflows/wf-1.json');
    assert.strictEqual(buildLegacyWorkflowStorageKey('wf-1'), 'workflows/wf-1.json');
});
