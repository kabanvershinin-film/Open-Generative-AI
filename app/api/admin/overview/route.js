import { NextResponse } from 'next/server';
import { requireAdmin, getAdminClient } from '@/lib/supabaseServer';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const sb = getAdminClient();
    const [
        { count: totalUsers },
        { count: totalGenerations },
        { count: activeSubscriptions },
        { count: openTickets },
        { data: recentGenerations },
        { data: recentUsers },
    ] = await Promise.all([
        sb.from('profiles').select('*', { count: 'exact', head: true }),
        sb.from('generations').select('*', { count: 'exact', head: true }),
        sb.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        sb.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        sb.from('generations').select('id, model_key, status, credits_cost, created_at').order('created_at', { ascending: false }).limit(5),
        sb.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    // Revenue: sum of capture ledger entries this month
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const { data: ledger } = await sb
        .from('credit_ledger')
        .select('amount')
        .eq('type', 'capture')
        .gte('created_at', monthStart.toISOString());
    const creditsSpentMonth = (ledger || []).reduce((s, r) => s + Number(r.amount), 0);

    return NextResponse.json({
        totalUsers: totalUsers || 0,
        totalGenerations: totalGenerations || 0,
        activeSubscriptions: activeSubscriptions || 0,
        openTickets: openTickets || 0,
        creditsSpentMonth,
        recentGenerations: recentGenerations || [],
        recentUsers: recentUsers || [],
    });
}
