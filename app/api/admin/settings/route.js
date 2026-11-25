import { NextResponse } from 'next/server';
import { requireAdmin, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const sb = getAdminClient();
    const { data } = await sb.from('site_settings').select('*');
    const settings = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    return NextResponse.json({ settings });
}

export async function POST(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const body = await request.json().catch(() => ({}));
    const sb = getAdminClient();
    const rows = Object.entries(body).map(([key, value]) => ({ key, value: String(value), updated_at: new Date().toISOString() }));
    if (!rows.length) return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
    const { error: dbErr } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
