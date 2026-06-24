import test from 'node:test';
import assert from 'node:assert/strict';

import { mergePendingTasks, normalizePendingTask } from '../tosPending.js';

test('normalizePendingTask заполняет обязательные поля', () => {
    const task = normalizePendingTask({
        id: 'task-1',
        studio: 'video',
        provider: 'ark',
        model: 'seedance-v2.0-t2v',
        task_id: 'ark-123',
        meta: { duration: 5 },
    });

    assert.strictEqual(task.id, 'task-1');
    assert.strictEqual(task.studio, 'video');
    assert.strictEqual(task.provider, 'ark');
    assert.strictEqual(task.task_id, 'ark-123');
    assert.strictEqual(task.status, 'running');
    assert.deepStrictEqual(task.meta, { duration: 5 });
    assert.ok(task.created_at);
    assert.ok(task.updated_at);
});

test('mergePendingTasks обновляет существующую задачу без потери meta', () => {
    const first = normalizePendingTask({
        id: 'task-1',
        provider: 'unified',
        request_id: 'req-1',
        meta: { duration: 5, aspect_ratio: '16:9' },
    });

    const merged = mergePendingTasks([first], {
        id: 'task-1',
        status: 'completed',
        entry: { id: 'result-1', url: 'https://cdn.example.com/video.mp4' },
        meta: { resolution: '720p' },
    });

    assert.strictEqual(merged.length, 1);
    assert.strictEqual(merged[0].status, 'completed');
    assert.deepStrictEqual(merged[0].meta, {
        duration: 5,
        aspect_ratio: '16:9',
        resolution: '720p',
    });
    assert.strictEqual(merged[0].entry.url, 'https://cdn.example.com/video.mp4');
});

test('mergePendingTasks ограничивает список и сортирует по updated_at', () => {
    const older = {
        ...normalizePendingTask({ id: 'older' }),
        updated_at: '2024-01-01T00:00:00.000Z',
    };
    const newer = {
        ...normalizePendingTask({ id: 'newer' }),
        updated_at: '2025-01-01T00:00:00.000Z',
    };

    const merged = mergePendingTasks([older], newer);

    assert.deepStrictEqual(merged.map((task) => task.id), ['newer', 'older']);
});
