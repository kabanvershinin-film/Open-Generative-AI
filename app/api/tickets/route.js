import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const where = { userId: user.id };
    if (status) where.status = status;
    const tickets = await prisma.ticket.findMany({ where, orderBy: { createdAt: 'desc' } });
    return Response.json({ tickets, total: tickets.length });
}

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const { title, body: ticketBody } = await request.json().catch(() => ({}));
    if (!title?.trim()) return Response.json({ error: 'title required' }, { status: 400 });
    const ticket = await prisma.ticket.create({ data: {
        userId: user.id, title: title.trim().slice(0, 300), body: (ticketBody || '').trim(),
    }});
    return Response.json({ ticket }, { status: 201 });
}
