import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';

async function ownsWorkflow(sb, userId, id) {
    const { data } = await sb.from('workflows').select('id').eq('id', id).eq('user_id', userId).single();
    return !!data;
}

export async function GET(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    const { data: wf } = await sb.from('workflows').select('*').eq('id', params.id).eq('user_id', user.id).single();
    if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const { data: nodes } = await sb.from('workflow_nodes').select('*').eq('workflow_id', wf.id).order('created_at');
    return NextResponse.json({ workflow: wf, nodes: nodes || [] });
}

export async function PATCH(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    if (!await ownsWorkflow(sb, user.id, params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const patch = {};
    if (body.name) patch.name = String(body.name).slice(0, 200);
    patch.updated_at = new Date().toISOString();
    const { data, error: dbErr } = await sb.from('workflows').update(patch).eq('id', params.id).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ workflow: data });
}

export async function DELETE(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    if (!await ownsWorkflow(sb, user.id, params.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await sb.from('workflows').delete().eq('id', params.id);
    return NextResponse.json({ ok: true });
}
