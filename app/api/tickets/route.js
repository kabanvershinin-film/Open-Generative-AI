import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sb = getAdminClient();
    let q = sb.from('tickets').select('*', { count: 'exact' }).eq('user_id', user.id);
    if (status) q = q.eq('status', status);
    q = q.order('updated_at', { ascending: false });
    const { data, count, error: dbErr } = await q;
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ tickets: data || [], total: count });
}

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const { title, body: ticketBody } = await request.json().catch(() => ({}));
    if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb.from('tickets').insert({
        user_id: user.id,
        title: title.trim().slice(0, 300),
        body: (ticketBody || '').trim(),
    }).select().single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ ticket: data }, { status: 201 });
}
