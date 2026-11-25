import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Number(searchParams.get('limit') || 50));

    const where = { userId: user.id };
    if (type) where.type = type;
    const [files, total] = await Promise.all([
        prisma.mediaFile.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.mediaFile.count({ where }),
    ]);
    return Response.json({ files, total });
}

export async function DELETE(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const file = await prisma.mediaFile.findFirst({ where: { id: parseInt(id), userId: user.id } });
    if (!file) return Response.json({ error: 'Not found' }, { status: 404 });
    await prisma.mediaFile.delete({ where: { id: parseInt(id) } });
    return Response.json({ ok: true });
}
