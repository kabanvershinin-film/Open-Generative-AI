import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getAnonClient() {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

export function getAdminClient() {
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

export async function requireAuth(request) {
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return { user: null, error: 'Unauthorized' };
    const sb = getAnonClient();
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return { user: null, error: 'Invalid session' };
    return { user: data.user, error: null };
}

export async function requireAdmin(request) {
    const { user, error } = await requireAuth(request);
    if (error || !user) return { user: null, error: error || 'Unauthorized' };
    const { isAdminEmail } = await import('@/lib/admin');
    if (!isAdminEmail(user.email)) return { user: null, error: 'Forbidden' };
    return { user, error: null };
}

export function getUserCredits(adminClient, userId) {
    return adminClient
        .from('credit_ledger')
        .select('amount, type')
        .eq('user_id', userId)
        .then(({ data }) => {
            if (!data) return 0;
            return data.reduce((sum, row) => {
                if (['credit', 'refund'].includes(row.type)) return sum + Number(row.amount);
                if (['charge', 'capture'].includes(row.type)) return sum - Number(row.amount);
                return sum; // reserve does not reduce balance
            }, 0);
        });
}
