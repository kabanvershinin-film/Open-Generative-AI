import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';

async function ownsWorkflow(sb, userId, workflowId) {
    const { data } = await sb.from('workflows').select('id').eq('id', workflowId).eq('user_id', userId).single();
    return !!data;
}

export async function POST(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    if (!await ownsWorkflow(sb, user.id, params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const { name = 'Node', type = 'image', modelKey, pos_x = 100, pos_y = 100 } = body;
    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const { data, error: dbErr } = await sb.from('workflow_nodes').insert({
        workflow_id: params.id, name, slug, type, model_key: modelKey, pos_x, pos_y,
    }).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ node: data }, { status: 201 });
}

export async function PATCH(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    if (!await ownsWorkflow(sb, user.id, params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const { nodeId, ...rest } = body;
    if (!nodeId) return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
    const allowed = ['name', 'model_key', 'params', 'pos_x', 'pos_y'];
    const patch = Object.fromEntries(Object.entries(rest).filter(([k]) => allowed.includes(k)));
    patch.updated_at = new Date().toISOString();
    const { data, error: dbErr } = await sb.from('workflow_nodes').update(patch).eq('id', nodeId).eq('workflow_id', params.id).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ node: data });
}

export async function DELETE(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    if (!await ownsWorkflow(sb, user.id, params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    if (!nodeId) return NextResponse.json({ error: 'nodeId required' }, { status: 400 });
    await sb.from('workflow_nodes').delete().eq('id', nodeId).eq('workflow_id', params.id);
    return NextResponse.json({ ok: true });
}
