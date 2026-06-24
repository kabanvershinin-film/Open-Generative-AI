import { fetchWithTimeout } from './core.js';

async function parseJson(response) {
    return response.json().catch(() => ({}));
}

export async function listPendingGenerations({ studio, statuses } = {}) {
    const params = new URLSearchParams();
    if (studio) params.set('studio', studio);
    if (Array.isArray(statuses) && statuses.length > 0) params.set('statuses', statuses.join(','));
    const query = params.toString();
    const response = await fetchWithTimeout(`/api/pending-generations${query ? `?${query}` : ''}`, {}, 30000);
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data.error || `Ошибка загрузки задач ${response.status}`);
    return Array.isArray(data.tasks) ? data.tasks : [];
}

export async function savePendingGeneration(task) {
    const response = await fetchWithTimeout('/api/pending-generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task || {}),
    }, 30000);
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data.error || `Ошибка сохранения задачи ${response.status}`);
    return data.task || null;
}

export async function updatePendingGeneration(task) {
    const response = await fetchWithTimeout('/api/pending-generations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task || {}),
    }, 30000);
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data.error || `Ошибка обновления задачи ${response.status}`);
    return data;
}

export async function deletePendingGeneration(id) {
    const response = await fetchWithTimeout(`/api/pending-generations?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    }, 30000);
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data.error || `Ошибка удаления задачи ${response.status}`);
    return !!data.success;
}
