import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Number(searchParams.get('limit') || 20));
    const from = (page - 1) * limit;
    const modelFilter = searchParams.get('model');
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    const sb = getAdminClient();
    let q = sb.from('generations').select('*', { count: 'exact' }).eq('user_id', user.id);
    if (modelFilter) q = q.eq('model_key', modelFilter);
    if (dateFrom) q = q.gte('created_at', dateFrom);
    if (dateTo) q = q.lte('created_at', dateTo);
    q = q.order('created_at', { ascending: false }).range(from, from + limit - 1);

    const { data, count, error: dbErr } = await q;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ generations: data, total: count, page, limit });
}
