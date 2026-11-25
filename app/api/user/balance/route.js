import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ balance: 0 });

    const rows = await prisma.creditLedger.findMany({ where: { userId: user.id } });
    const balance = rows.reduce((sum, r) => {
        if (['credit', 'refund'].includes(r.type)) return sum + r.amount;
        if (['charge', 'capture'].includes(r.type)) return sum - r.amount;
        return sum;
    }, 0);

    return Response.json({ balance });
}
