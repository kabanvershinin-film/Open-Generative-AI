import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';
import { addCredits } from '@/lib/credits';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const sb = getAdminClient();
    const [{ data: plans }, { data: sub }] = await Promise.all([
        sb.from('plans').select('*').eq('is_active', true).order('sort_order'),
        sb.from('user_subscriptions').select('*, plan:plans(*)').eq('user_id', user.id).single(),
    ]);
    return NextResponse.json({ plans: plans || [], subscription: sub || null });
}

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });
    const { planId } = await request.json().catch(() => ({}));
    if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

    const sb = getAdminClient();
    const { data: plan } = await sb.from('plans').select('*').eq('id', planId).eq('is_active', true).single();
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // Demo mode: activate subscription immediately (no real payment)
    const now = new Date();
    const ends = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    const { error: subErr } = await sb.from('user_subscriptions').upsert({
        user_id: user.id,
        plan_id: planId,
        starts_at: now.toISOString(),
        ends_at: ends.toISOString(),
        status: 'active',
    }, { onConflict: 'user_id' });
    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

    // Credit the plan's credits
    await addCredits(sb, user.id, plan.credits, `Подписка "${plan.name}" активирована (демо)`);

    return NextResponse.json({ ok: true, message: 'Подписка активирована (демо-режим)' });
}
