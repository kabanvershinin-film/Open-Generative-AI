import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ workflows: data });
}

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const name = (body.name || 'Новый проект').trim().slice(0, 200);
    const sb = getAdminClient();
    const { data, error: dbErr } = await sb
        .from('workflows')
        .insert({ user_id: user.id, name })
        .select()
        .single();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ workflow: data }, { status: 201 });
}
