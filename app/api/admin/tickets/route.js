import { requireAdmin } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
    });
    return Response.json({ tickets });
}

export async function PATCH(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { id, status } = await request.json().catch(() => ({}));
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const ticket = await prisma.ticket.update({ where: { id: parseInt(id) }, data: { status } });
    return Response.json({ ticket });
}
