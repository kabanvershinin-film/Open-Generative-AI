import test from 'node:test';
import assert from 'node:assert/strict';

import {
    deletePendingGeneration,
    listPendingGenerations,
    savePendingGeneration,
    updatePendingGeneration,
} from '../muapi/pending.js';

test('listPendingGenerations собирает query string и возвращает tasks', async (t) => {
    let request = null;

    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
        request = { url, options };
        return {
            ok: true,
            status: 200,
            json: async () => ({ tasks: [{ id: 'task-1' }] }),
        };
    });

    const tasks = await listPendingGenerations({ studio: 'video', statuses: ['running', 'completed'] });

    assert.deepStrictEqual(tasks, [{ id: 'task-1' }]);
    assert.strictEqual(request.url, '/api/pending-generations?studio=video&statuses=running%2Ccompleted');
    assert.strictEqual(request.options.method, undefined);
    assert.ok(request.options.signal);
});

test('listPendingGenerations возвращает пустой массив для некорректного payload', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: true,
        status: 200,
        json: async () => ({ tasks: null }),
    }));

    const tasks = await listPendingGenerations();

    assert.deepStrictEqual(tasks, []);
});

test('savePendingGeneration отправляет POST и возвращает task', async (t) => {
    let request = null;

    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
        request = { url, options };
        return {
            ok: true,
            status: 200,
            json: async () => ({ task: { id: 'task-2', status: 'running' } }),
        };
    });

    const task = await savePendingGeneration({ id: 'task-2', studio: 'video' });

    assert.deepStrictEqual(task, { id: 'task-2', status: 'running' });
    assert.strictEqual(request.url, '/api/pending-generations');
    assert.strictEqual(request.options.method, 'POST');
    assert.deepStrictEqual(JSON.parse(request.options.body), { id: 'task-2', studio: 'video' });
});

test('savePendingGeneration пробрасывает текст ошибки сервера', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: false,
        status: 503,
        json: async () => ({ error: 'TOS not enabled' }),
    }));

    await assert.rejects(
        savePendingGeneration({ id: 'task-3' }),
        /TOS not enabled/,
    );
});

test('updatePendingGeneration возвращает весь ответ с task и entry', async (t) => {
    let request = null;

    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
        request = { url, options };
        return {
            ok: true,
            status: 200,
            json: async () => ({ task: { id: 'task-4' }, entry: { id: 'entry-1' } }),
        };
    });

    const result = await updatePendingGeneration({ id: 'task-4', status: 'completed' });

    assert.deepStrictEqual(result, { task: { id: 'task-4' }, entry: { id: 'entry-1' } });
    assert.strictEqual(request.options.method, 'PATCH');
    assert.deepStrictEqual(JSON.parse(request.options.body), { id: 'task-4', status: 'completed' });
});

test('deletePendingGeneration кодирует id и возвращает success', async (t) => {
    let request = null;

    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
        request = { url, options };
        return {
            ok: true,
            status: 200,
            json: async () => ({ success: 1 }),
        };
    });

    const result = await deletePendingGeneration('task 5/with spaces');

    assert.strictEqual(result, true);
    assert.strictEqual(request.url, '/api/pending-generations?id=task%205%2Fwith%20spaces');
    assert.strictEqual(request.options.method, 'DELETE');
});

test('deletePendingGeneration использует fallback сообщение при сломанном json', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: false,
        status: 500,
        json: async () => {
            throw new Error('broken');
        },
    }));

    await assert.rejects(
        deletePendingGeneration('task-6'),
        /Ошибка удаления задачи 500/,
    );
});
