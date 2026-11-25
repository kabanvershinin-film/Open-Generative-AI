import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sb = getAdminClient();
    let q = sb.from('ai_models').select('*').eq('is_active', true).order('sort_order');
    if (type) q = q.eq('media_type', type);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ models: data || [] });
}
