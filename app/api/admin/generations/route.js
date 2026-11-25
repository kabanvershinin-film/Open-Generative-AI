import { NextResponse } from 'next/server';
import { requireAdmin, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Number(searchParams.get('limit') || 50));
    const from = (page - 1) * limit;
    const sb = getAdminClient();
    const { data, count, error: dbErr } = await sb
        .from('generations')
        .select('*, user:profiles(id,email,full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ generations: data || [], total: count });
}
