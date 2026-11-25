import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // image|video|audio
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Number(searchParams.get('limit') || 50));
    const from = (page - 1) * limit;

    const sb = getAdminClient();
    let q = sb.from('media_files').select('*', { count: 'exact' }).eq('user_id', user.id);
    if (type) q = q.eq('type', type);
    q = q.order('created_at', { ascending: false }).range(from, from + limit - 1);
    const { data, count, error: dbErr } = await q;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ files: data, total: count });
}

export async function DELETE(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sb = getAdminClient();
    const { error: dbErr } = await sb.from('media_files').delete().eq('id', id).eq('user_id', user.id);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
