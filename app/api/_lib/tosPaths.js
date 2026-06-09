function randomSuffix() {
    return Math.random().toString(36).slice(2, 7);
}

export function buildUserTosRoot(userId) {
    return userId ? `users/${userId}` : 'users/anonymous';
}

export function buildUserMediaKey(userId, folder, ext, prefix = '') {
    const stem = `${Date.now()}_${randomSuffix()}`;
    const file = prefix ? `${prefix}_${stem}.${ext}` : `${stem}.${ext}`;
    return `${buildUserTosRoot(userId)}/${folder}/${file}`;
}

export function buildWorkflowStorageKey(userId, workflowId) {
    return `${buildUserTosRoot(userId)}/workflows/${workflowId}.json`;
}

export function buildLegacyWorkflowStorageKey(workflowId) {
    return `workflows/${workflowId}.json`;
}
