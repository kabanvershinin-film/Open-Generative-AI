import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { data: authData, error: authError } = await publicSb.auth.getUser(token);
    if (authError || !authData?.user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const authUser = authData.user;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || null;
    const email = authUser.email || null;

    try {
        const { error } = await admin
            .from('admin_notifications')
            .upsert({
                event_key: `user_registered:${authUser.id}`,
                type: 'user_registered',
                title: 'Новый пользователь',
                message: fullName
                    ? `${fullName} зарегистрировался на сайте`
                    : `${email || 'Новый пользователь'} зарегистрировался на сайте`,
                user_id: authUser.id,
                email,
                full_name: fullName,
                payload: {
                    user_id: authUser.id,
                    email,
                    full_name: fullName,
                },
            }, {
                onConflict: 'event_key',
            });

        if (error) {
            throw new Error(error.message);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('admin/notifications/register error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
