import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserForGallery } from '@/app/api/_lib/balance';
import { buildAdminNotificationRecord } from '@/lib/adminNotifications';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
    }

    try {
        const user = await getUserForGallery(request);
        if (!user?.id) {
            return NextResponse.json({ ok: true, ignored: 'unauthenticated' });
        }

        let body = {};
        try {
            body = await request.json();
        } catch {}

        const record = buildAdminNotificationRecord({
            type: body?.type,
            title: body?.title,
            message: body?.message,
            user,
            payload: body?.payload,
            dedupeKey: body?.dedupeKey,
        });

        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
        const { error } = await admin
            .from('admin_notifications')
            .upsert(record, { onConflict: 'event_key' });

        if (error) throw new Error(error.message);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('admin/notifications/report error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
