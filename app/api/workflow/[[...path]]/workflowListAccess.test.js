import test from 'node:test';
import assert from 'node:assert/strict';

import { filterVisibleOwnerWorkflows } from './workflowListAccess.js';

test('filterVisibleOwnerWorkflows возвращает только свои и бесхозные воркфлоу', () => {
    const result = filterVisibleOwnerWorkflows([
        { id: 'mine', owner_id: 'user-1' },
        { id: 'shared-by-index', owner_id: 'user-2' },
        { id: 'legacy', owner_id: null },
        null,
    ], 'user-1');

    assert.deepStrictEqual(result.map((entry) => entry.id), ['mine', 'legacy']);
});

test('filterVisibleOwnerWorkflows не даёт админу видеть чужие воркфлоу в моих процессах', () => {
    const result = filterVisibleOwnerWorkflows([
        { id: 'admin-own', owner_id: 'admin-1' },
        { id: 'foreign-1', owner_id: 'user-2' },
        { id: 'foreign-2', owner_id: 'user-3' },
    ], 'admin-1');

    assert.deepStrictEqual(result.map((entry) => entry.id), ['admin-own']);
});
