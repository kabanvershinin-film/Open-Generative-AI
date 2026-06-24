import { createClient } from '@supabase/supabase-js';
import { isAdminUser } from '@/app/api/_lib/balance';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PAYMENTS_LIMIT = 100;

function admin() {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

async function getAdminUser(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await admin().auth.getUser(token);
    return data?.user || null;
}

export async function GET(request) {
    try {
        const adminUser = await getAdminUser(request);
        if (!adminUser || !isAdminUser(adminUser)) {
            return new Response(JSON.stringify({ error: 'Доступ запрещен' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        const { data: payments, error } = await admin()
            .from('payments')
            .select('id, user_id, amount, status, operation_id, created_at, paid_at')
            .order('created_at', { ascending: false })
            .limit(PAYMENTS_LIMIT);

        if (error) throw error;

        const userIds = [...new Set((payments || []).map((item) => item.user_id).filter(Boolean))];
        let profilesById = new Map();
        if (userIds.length > 0) {
            const { data: profiles, error: profilesError } = await admin()
                .from('profiles')
                .select('id, email, full_name')
                .in('id', userIds);
            if (profilesError) throw profilesError;
            profilesById = new Map((profiles || []).map((item) => [item.id, item]));
        }

        const rows = (payments || []).map((item) => {
            const profile = profilesById.get(item.user_id) || {};
            return {
                ...item,
                email: profile.email || null,
                full_name: profile.full_name || null,
            };
        });

        return new Response(JSON.stringify({ payments: rows }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Failed to fetch payments:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
