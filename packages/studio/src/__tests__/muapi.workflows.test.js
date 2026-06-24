import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createWorkflow,
    deleteWorkflow,
    getAllNodeSchemas,
    getPublishedWorkflows,
    getUserWorkflows,
    getWorkflowData,
    getWorkflowInputs,
    getTemplateWorkflows,
} from '../muapi/workflows.js';

test('getUserWorkflows возвращает пустой массив для не-массива', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: true,
        json: async () => ({ items: [] }),
    }));

    const workflows = await getUserWorkflows('key');

    assert.deepStrictEqual(workflows, []);
});

test('getTemplateWorkflows всегда возвращает пустой массив', async () => {
    assert.deepStrictEqual(await getTemplateWorkflows('key'), []);
});

test('getPublishedWorkflows возвращает пустой массив при ошибке json', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: true,
        json: async () => {
            throw new Error('broken');
        },
    }));

    const workflows = await getPublishedWorkflows('key');

    assert.deepStrictEqual(workflows, []);
});

test('createWorkflow бросает ошибку при неуспешном ответе', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: 'boom' }),
    }));

    await assert.rejects(
        createWorkflow('key', { name: 'WF' }),
        /Failed to create workflow/,
    );
});

test('deleteWorkflow отправляет DELETE и возвращает success даже без ok', async (t) => {
    let request = null;

    t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
        request = { url, options };
        return {
            ok: false,
            status: 500,
        };
    });

    const result = await deleteWorkflow('key', 'wf-1');

    assert.deepStrictEqual(result, { success: true });
    assert.strictEqual(request.url, '/api/workflow/wf-1');
    assert.strictEqual(request.options.method, 'DELETE');
    assert.strictEqual(request.options.headers.Authorization, 'Bearer key');
});

test('getWorkflowData нормализует nodes из data и подставляет дефолты', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: true,
        json: async () => ({
            name: '',
            data: { nodes: [{ id: 'node-1' }] },
            edges: null,
            run_id: 'run-1',
            thumbnail: 'https://cdn.example.com/thumb.png',
        }),
    }));

    const workflow = await getWorkflowData('key', 'wf-2');

    assert.deepStrictEqual(workflow, {
        workflow_id: 'wf-2',
        id: 'wf-2',
        name: 'Untitled Workflow',
        data: { nodes: [{ id: 'node-1' }] },
        edges: [],
        is_owner: true,
        is_published: false,
        is_template: false,
        show_temp_button: false,
        can_edit: true,
        run_id: 'run-1',
        category: 'General',
        thumbnail: 'https://cdn.example.com/thumb.png',
    });
});

test('getWorkflowInputs читает prompt из data.formValues и фильтрует неподходящие image узлы', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => ({
        ok: true,
        json: async () => ({
            data: {
                nodes: [
                    {
                        id: 'text-1',
                        type: 'textNode',
                        data: { formValues: { prompt: 'Напиши текст' } },
                    },
                    {
                        id: 'image-1',
                        type: 'uploadNode',
                        category: 'image',
                        model: 'image-passthrough',
                        input_params: { image_url: 'https://cdn.example.com/source.png' },
                    },
                    {
                        id: 'image-2',
                        category: 'image',
                        model: 'seedance-image',
                        input_params: { image_url: 'https://cdn.example.com/ignore.png' },
                    },
                ],
            },
        }),
    }));

    const result = await getWorkflowInputs('key', 'wf-3');

    assert.deepStrictEqual(result, {
        properties: {
            'text-1': {
                type: 'string',
                title: 'text-1',
                description: 'Text input',
                default: 'Напиши текст',
                examples: ['Напиши текст'],
            },
            'image-1': {
                type: 'string',
                title: 'image-1 (image URL)',
                description: 'Image URL',
                field: 'image',
                default: 'https://cdn.example.com/source.png',
            },
        },
        required: [],
    });
});

test('getAllNodeSchemas возвращает fallback при сетевой ошибке', async (t) => {
    t.mock.method(globalThis, 'fetch', async () => {
        throw new Error('network');
    });

    const result = await getAllNodeSchemas('key', 'wf-4');

    assert.deepStrictEqual(result, { categories: {} });
});
