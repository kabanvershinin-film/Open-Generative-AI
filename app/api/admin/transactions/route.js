import { createClient } from '@supabase/supabase-js';
import { isAdminUser } from '@/app/api/_lib/balance';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Не указан userId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const { data: transactions, error } = await admin()
            .from('balance_transactions')
            .select('id, amount, reason, meta, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return new Response(JSON.stringify({ transactions }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
