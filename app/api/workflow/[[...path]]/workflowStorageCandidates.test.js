import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkflowCandidateKeys } from './workflowStorageCandidates.js';

test('buildWorkflowCandidateKeys adds anonymous fallback for logged-in users', () => {
    const keys = buildWorkflowCandidateKeys('wf_123', { userId: 'user-1' });

    assert.deepStrictEqual(keys, [
        'users/user-1/workflows/wf_123.json',
        'users/anonymous/workflows/wf_123.json',
        'workflows/wf_123.json',
    ]);
});

test('buildWorkflowCandidateKeys keeps owner path and deduplicates repeated candidates', () => {
    const keys = buildWorkflowCandidateKeys('wf_123', { userId: 'user-1', ownerId: 'user-1' });

    assert.deepStrictEqual(keys, [
        'users/user-1/workflows/wf_123.json',
        'users/anonymous/workflows/wf_123.json',
        'workflows/wf_123.json',
    ]);
});

test('buildWorkflowCandidateKeys omits anonymous fallback for anonymous viewer', () => {
    const keys = buildWorkflowCandidateKeys('wf_123');

    assert.deepStrictEqual(keys, [
        'users/anonymous/workflows/wf_123.json',
        'workflows/wf_123.json',
    ]);
});
