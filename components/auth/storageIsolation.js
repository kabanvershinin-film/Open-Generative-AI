export const AUTH_STORAGE_OWNER_KEY = 'mf_auth_storage_owner';

export const STUDIO_STORAGE_KEY_PREFIXES = [
  'mf_image_studio_persistent',
  'mf_image_studio_refs',
  'mf_image_studio_recent_results',
  'mf_image_studio_pending',
  'mf_image_studio_pending_result',
  'mf_video_studio_persistent',
  'mf_video_active_ark_task',
  'mf_video_studio_pending',
  'mf_video_studio_pending_result',
  'mf_lipsync_studio_persistent',
  'mf_lipsync_studio_pending',
  'mf_lipsync_studio_pending_result',
  'mf_marketing_studio_persistent',
  'mf_vibe_motion_studio_persistent',
  'mf_cinema_studio_persistent',
  'mf_clipping_studio_persistent',
  'mf_pending_workflow_image',
];

function normalizeOwnerId(value) {
  return String(value || '').trim();
}

export function shouldResetStudioStorage(previousOwnerId, nextOwnerId) {
  const previous = normalizeOwnerId(previousOwnerId);
  const next = normalizeOwnerId(nextOwnerId);
  if (!previous && !next) return false;
  return previous !== next;
}

export function clearStudioStorageForAccountChange(storage) {
  if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') {
    return 0;
  }

  const keysToDelete = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    if (STUDIO_STORAGE_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => storage.removeItem(key));
  return keysToDelete.length;
}

export function reconcileStudioStorageOwner(storage, nextOwnerId) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { previousOwnerId: '', nextOwnerId: normalizeOwnerId(nextOwnerId), cleared: 0 };
  }

  const previousOwnerId = normalizeOwnerId(storage.getItem(AUTH_STORAGE_OWNER_KEY));
  const normalizedNextOwnerId = normalizeOwnerId(nextOwnerId);
  const cleared = shouldResetStudioStorage(previousOwnerId, normalizedNextOwnerId)
    ? clearStudioStorageForAccountChange(storage)
    : 0;

  if (normalizedNextOwnerId) {
    storage.setItem(AUTH_STORAGE_OWNER_KEY, normalizedNextOwnerId);
  } else {
    storage.removeItem(AUTH_STORAGE_OWNER_KEY);
  }

  return { previousOwnerId, nextOwnerId: normalizedNextOwnerId, cleared };
}
