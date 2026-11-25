import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

async function owns(userId, id) {
    return prisma.workflow.findFirst({ where: { id: parseInt(id), userId } });
}

export async function GET(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const wf = await prisma.workflow.findFirst({
        where: { id: parseInt(params.id), userId: user.id },
        include: { nodes: { orderBy: { createdAt: 'asc' } } },
    });
    if (!wf) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ workflow: wf, nodes: wf.nodes });
}

export async function PATCH(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    if (!await owns(user.id, params.id)) return Response.json({ error: 'Not found' }, { status: 404 });
    const { name } = await request.json().catch(() => ({}));
    const wf = await prisma.workflow.update({ where: { id: parseInt(params.id) }, data: { name: String(name || '').slice(0, 200) } });
    return Response.json({ workflow: wf });
}

export async function DELETE(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    if (!await owns(user.id, params.id)) return Response.json({ error: 'Not found' }, { status: 404 });
    await prisma.workflow.delete({ where: { id: parseInt(params.id) } });
    return Response.json({ ok: true });
}
