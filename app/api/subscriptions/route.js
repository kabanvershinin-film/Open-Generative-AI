import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';
import { addCredits } from '@/lib/credits';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const [plans, sub] = await Promise.all([
        prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.userSubscription.findFirst({
            where: { userId: user.id, status: 'active' },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    return Response.json({ plans, subscription: sub });
}

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const { planId } = await request.json().catch(() => ({}));
    if (!planId) return Response.json({ error: 'planId required' }, { status: 400 });

    const plan = await prisma.plan.findFirst({ where: { id: parseInt(planId), isActive: true } });
    if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 });

    const expiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
    await prisma.userSubscription.create({ data: { userId: user.id, planId: plan.id, expiresAt, status: 'active' } });
    await addCredits(null, user.id, plan.credits, `Подписка "${plan.name}" активирована (демо)`);
    return Response.json({ ok: true, message: 'Подписка активирована (демо-режим)' });
}
