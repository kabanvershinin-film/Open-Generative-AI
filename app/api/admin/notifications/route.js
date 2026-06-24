import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin';
import { isIncidentNotification } from '@/lib/adminNotifications';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_NOTIFICATIONS = 25;

function formatStoredNotification(item) {
    return {
        id: item.id,
        type: item.type,
        createdAt: item.created_at,
        userId: item.user_id,
        fullName: item.full_name,
        email: item.email,
        title: item.title,
        message: item.message,
        payload: item.payload || {},
    };
}

function formatAuthNotification(item, profile) {
    const fullName = profile?.full_name || item.user_metadata?.full_name || item.user_metadata?.name || null;
    const email = profile?.email || item.email || null;
    const createdAt = item.created_at;

    return {
        id: `user_registered:${item.id}`,
        type: 'user_registered',
        createdAt,
        userId: item.id,
        fullName,
        email,
        title: 'Новый пользователь',
        message: fullName
            ? `${fullName} зарегистрировался на сайте`
            : `${email || 'Новый пользователь'} зарегистрировался на сайте`,
    };
}

async function loadStoredNotifications(admin, scope = 'registrations') {
    let query = admin
        .from('admin_notifications')
        .select('id, type, created_at, user_id, full_name, email, title, message, payload')
        .order('created_at', { ascending: false })
        .limit(MAX_NOTIFICATIONS);

    if (scope === 'registrations') {
        query = query.eq('type', 'user_registered');
    } else if (scope === 'incidents') {
        query = query.neq('type', 'user_registered');
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(formatStoredNotification);
}

async function loadAuthFallbackNotifications(admin) {
    const authUsers = [];
    let page = 1;

    while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error('Failed to list auth users: ' + error.message);

        const users = data?.users || [];
        authUsers.push(...users);

        if (users.length < 1000) break;
        page += 1;
    }

    const latestUsers = authUsers
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, MAX_NOTIFICATIONS);

    const ids = latestUsers.map((item) => item.id).filter(Boolean);
    let profilesById = new Map();

    if (ids.length) {
        const { data: profiles, error: profilesError } = await admin
            .from('profiles')
            .select('id, email, full_name')
            .in('id', ids);

        if (profilesError) throw new Error('Failed to load profiles: ' + profilesError.message);
        profilesById = new Map((profiles || []).map((item) => [item.id, item]));
    }

    return latestUsers.map((item) => formatAuthNotification(item, profilesById.get(item.id)));
}

function isMissingNotificationsTable(error) {
    const message = String(error?.message || '').toLowerCase();
    const code = String(error?.code || '').toLowerCase();
    return code === '42p01' || message.includes('admin_notifications') || message.includes('does not exist');
}

export async function GET(request) {
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

    if (!isAdminEmail(authData.user.email || '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
        const { searchParams } = new URL(request.url);
        const scope = searchParams.get('scope') || 'registrations';
        let notifications;

        try {
            notifications = await loadStoredNotifications(admin, scope);
        } catch (error) {
            if (!isMissingNotificationsTable(error)) throw error;
            notifications = scope === 'all' || scope === 'registrations'
                ? await loadAuthFallbackNotifications(admin)
                : [];
        }

        return NextResponse.json({
            notifications,
            latestCreatedAt: notifications[0]?.createdAt || null,
            incidentCount: notifications.filter((item) => isIncidentNotification(item.type)).length,
        });
    } catch (error) {
        console.error('admin/notifications error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
