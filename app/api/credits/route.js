import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';
import { getBalance } from '@/lib/credits';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    const balance = await getBalance(sb, user.id);
    const { data: ledger } = await sb
        .from('credit_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
    return NextResponse.json({ balance, ledger: ledger || [] });
}
