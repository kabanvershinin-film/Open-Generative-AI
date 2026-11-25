import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Number(searchParams.get('limit') || 20));
    const modelFilter = searchParams.get('model');
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    const where = { userId: user.id };
    if (modelFilter) where.modelKey = modelFilter;
    if (dateFrom || dateTo) where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);

    const [generations, total] = await Promise.all([
        prisma.generation.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.generation.count({ where }),
    ]);
    return Response.json({ generations, total, page, limit });
}
