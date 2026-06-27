import { buildLegacyWorkflowStorageKey, buildWorkflowStorageKey } from '../../_lib/tosPaths.js';

export function buildWorkflowCandidateKeys(workflowId, options = {}) {
    const preferredUserId = options.userId || null;
    const indexedOwnerId = options.ownerId || null;
    const candidates = [
        buildWorkflowStorageKey(preferredUserId, workflowId),
        indexedOwnerId ? buildWorkflowStorageKey(indexedOwnerId, workflowId) : null,
        preferredUserId ? buildWorkflowStorageKey(null, workflowId) : null,
        buildLegacyWorkflowStorageKey(workflowId),
    ].filter(Boolean);

    return [...new Set(candidates)];
}
