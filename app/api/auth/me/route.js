import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });

    const balance = await prisma.creditLedger.findMany({ where: { userId: user.id } })
        .then(rows => rows.reduce((s, r) => {
            if (['credit', 'refund'].includes(r.type)) return s + r.amount;
            if (['charge', 'capture'].includes(r.type)) return s - r.amount;
            return s;
        }, 0));

    return Response.json({ user: { ...user, balance } });
}

export async function PATCH(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });

    const { full_name } = await request.json().catch(() => ({}));
    const updated = await prisma.user.update({
        where: { id: user.id },
        data: { fullName: full_name },
    });
    return Response.json({ user: { id: updated.id, email: updated.email, full_name: updated.fullName } });
}
