import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verifyAdmin(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'SUPABASE_SERVICE_ROLE_KEY missing', status: 500 };
    }

    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return { error: 'Unauthorized', status: 401 };

    const publicSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: u, error: uErr } = await publicSb.auth.getUser(token);
    if (uErr || !u?.user) return { error: 'Invalid session', status: 401 };

    const email = (u.user.email || '').toLowerCase();
    if (!isAdminEmail(email)) {
        return { error: 'Forbidden', status: 403 };
    }

    return { ok: true, admin: createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }) };
}

export async function GET(request) {
    const result = await verifyAdmin(request);
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    try {
        const { data, error } = await result.admin
            .from('config')
            .select('*')
            .order('key');
        if (error) throw new Error('Failed to load config: ' + error.message);

        const config = {};
        (data || []).forEach(item => {
            config[item.key] = item.value;
        });

        return NextResponse.json({ config });
    } catch (err) {
        console.error('admin/config GET error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    const result = await verifyAdmin(request);
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const { data, error } = await result.admin
            .from('config')
            .upsert({ key, value, updated_at: new Date().toISOString() })
            .select()
            .single();

        if (error) throw new Error('Failed to update config: ' + error.message);

        return NextResponse.json({ ok: true, config: data });
    } catch (err) {
        console.error('admin/config POST error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
