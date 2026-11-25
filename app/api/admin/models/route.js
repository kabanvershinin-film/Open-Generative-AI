import { NextResponse } from 'next/server';
import { requireAdmin, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const sb = getAdminClient();
    const { data } = await sb.from('ai_models').select('*').order('sort_order');
    return NextResponse.json({ models: data || [] });
}

export async function POST(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const body = await request.json().catch(() => ({}));
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb.from('ai_models').insert(body).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ model: data }, { status: 201 });
}

export async function PATCH(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const body = await request.json().catch(() => ({}));
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb.from('ai_models').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ model: data });
}

export async function DELETE(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sb = getAdminClient();
    await sb.from('ai_models').delete().eq('id', id);
    return NextResponse.json({ ok: true });
}
