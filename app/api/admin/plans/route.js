import { NextResponse } from 'next/server';
import { requireAdmin, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const sb = getAdminClient();
    const { data } = await sb.from('plans').select('*').order('sort_order');
    return NextResponse.json({ plans: data || [] });
}

export async function POST(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const body = await request.json().catch(() => ({}));
    const { code, name, price_rub, credits, duration_days = 30, is_active = true, sort_order = 0 } = body;
    if (!code || !name || !price_rub || !credits) return NextResponse.json({ error: 'code, name, price_rub, credits required' }, { status: 400 });
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb.from('plans').insert({ code, name, price_rub, credits, duration_days, is_active, sort_order }).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ plan: data }, { status: 201 });
}

export async function PATCH(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const body = await request.json().catch(() => ({}));
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb.from('plans').update(rest).eq('id', id).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ plan: data });
}
