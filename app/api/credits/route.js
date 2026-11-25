import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';
import { getBalance } from '@/lib/credits';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const [balance, ledger] = await Promise.all([
        getBalance(null, user.id),
        prisma.creditLedger.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    return Response.json({ balance, ledger });
}
