import { requireAdmin } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const [totalUsers, totalGenerations, activeSubscriptions, openTickets, recentGenerations, recentUsers, monthLedger] = await Promise.all([
        prisma.user.count(),
        prisma.generation.count(),
        prisma.userSubscription.count({ where: { status: 'active' } }),
        prisma.ticket.count({ where: { status: 'open' } }),
        prisma.generation.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { email: true } } } }),
        prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, email: true, fullName: true, createdAt: true } }),
        prisma.creditLedger.findMany({ where: { type: 'capture', createdAt: { gte: monthStart } } }),
    ]);

    const creditsSpentMonth = monthLedger.reduce((s, r) => s + r.amount, 0);
    return Response.json({ totalUsers, totalGenerations, activeSubscriptions, openTickets, creditsSpentMonth, recentGenerations, recentUsers });
}
