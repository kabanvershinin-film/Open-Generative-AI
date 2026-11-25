import { NextResponse } from 'next/server';
import { requireAdmin, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const sb = getAdminClient();
    const { data } = await sb.from('tickets').select('*, user:profiles(email,full_name)').order('updated_at', { ascending: false });
    return NextResponse.json({ tickets: data || [] });
}

export async function PATCH(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { id, status } = await request.json().catch(() => ({}));
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ ticket: data });
}
