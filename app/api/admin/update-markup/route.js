import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
    }

    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const publicSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: u, error: uErr } = await publicSb.auth.getUser(token);
    if (uErr || !u?.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const adminEmail = (u.user.email || '').toLowerCase();
    if (!isAdminEmail(adminEmail)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId, markup } = body;
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    
    const m = markup === null ? null : Number(markup);
    if (m !== null && (!Number.isFinite(m) || m < 0)) {
        return NextResponse.json({ error: 'invalid markup' }, { status: 400 });
    }

    try {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

        const { data: authUser, error: aErr } = await admin.auth.admin.getUserById(userId);
        if (aErr || !authUser?.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { error: upErr } = await admin
            .from('profiles')
            .update({ markup: m })
            .eq('id', userId);
            
        if (upErr) throw new Error('update failed: ' + upErr.message);

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('update-markup error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
