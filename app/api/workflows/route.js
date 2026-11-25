import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const workflows = await prisma.workflow.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { nodes: true } } },
    });
    return Response.json({ workflows });
}

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const { name } = await request.json().catch(() => ({}));
    const wf = await prisma.workflow.create({ data: { userId: user.id, name: (name || 'Новый проект').trim().slice(0, 200) } });
    return Response.json({ workflow: wf }, { status: 201 });
}
