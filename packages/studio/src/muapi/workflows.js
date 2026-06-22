export async function getUserWorkflows(apiKey) {
    const response = await fetch('/api/workflow/list', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data : [];
}

export async function getTemplateWorkflows(_apiKey) {
    return [];
}

export async function getPublishedWorkflows(apiKey) {
    try {
        const response = await fetch('/api/workflow/community', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!response.ok) return [];
        const data = await response.json().catch(() => []);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export async function createWorkflow(apiKey, data = {}) {
    const response = await fetch('/api/workflow/create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create workflow');
    return response.json();
}

export async function updateWorkflowName(apiKey, id, name) {
    const response = await fetch(`/api/workflow/${id}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) return {};
    return response.json();
}

export async function deleteWorkflow(apiKey, id) {
    await fetch(`/api/workflow/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return { success: true };
}

export async function getWorkflowData(apiKey, id) {
    try {
        const response = await fetch(`/api/workflow/${id}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (!response.ok) throw new Error('Not found');
        const workflow = await response.json();
        return {
            workflow_id: id,
            id,
            name: workflow.name || 'Untitled Workflow',
            data: { nodes: workflow.nodes || workflow.data?.nodes || [] },
            edges: workflow.edges || [],
            is_owner: workflow.is_owner ?? true,
            is_published: workflow.is_published ?? false,
            is_template: workflow.is_template ?? false,
            show_temp_button: workflow.show_temp_button ?? false,
            can_edit: workflow.can_edit ?? workflow.is_owner ?? true,
            run_id: workflow.run_id || null,
            category: workflow.category || 'General',
            thumbnail: workflow.thumbnail || null,
        };
    } catch {
        return {
            workflow_id: id,
            id,
            name: 'Untitled Workflow',
            data: { nodes: [] },
            edges: [],
            is_owner: true,
            can_edit: true,
            is_published: false,
            is_template: false,
            show_temp_button: false,
            run_id: null,
            category: 'General',
        };
    }
}

export async function getWorkflowInputs(apiKey, id) {
    try {
        const workflow = await getWorkflowData(apiKey, id);
        const nodes = workflow.data?.nodes || workflow.nodes || [];
        const properties = {};
        for (const node of nodes) {
            const category = node.category || node.type || '';
            const model = node.model || '';
            if (category === 'text' || node.type === 'textNode') {
                const prompt = node.input_params?.prompt || node.data?.formValues?.prompt || '';
                properties[node.id] = {
                    type: 'string',
                    title: node.id,
                    description: 'Text input',
                    default: prompt,
                    examples: [prompt],
                };
            } else if (model.includes('passthrough') && (category === 'image' || node.type === 'uploadNode')) {
                const url = node.input_params?.image_url || node.data?.formValues?.image_url || '';
                properties[node.id] = {
                    type: 'string',
                    title: `${node.id} (image URL)`,
                    description: 'Image URL',
                    field: 'image',
                    default: url,
                };
            }
        }
        return { properties, required: [] };
    } catch {
        return { properties: {}, required: [] };
    }
}

export async function getAllNodeSchemas(_apiKey, id) {
    try {
        const response = await fetch(`/api/workflow/${id}/node-schemas`);
        if (!response.ok) return { categories: {} };
        const data = await response.json().catch(() => ({ categories: {} }));
        return data && typeof data === 'object' ? data : { categories: {} };
    } catch {
        return { categories: {} };
    }
}

export async function getNodeSchemas(_apiKey) {
    return { categories: {} };
}

export async function calculateDynamicCost(_apiKey) {
    return { cost: 0 };
}

export async function executeWorkflow(apiKey, id, inputs) {
    const response = await fetch(`/api/workflow/${id}/run`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: inputs || {} }),
    });
    if (!response.ok) throw new Error('Failed to execute workflow');
    return response.json();
}
