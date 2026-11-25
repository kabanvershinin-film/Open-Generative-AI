import { requireAdmin } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Number(searchParams.get('limit') || 50));
    const [generations, total] = await Promise.all([
        prisma.generation.findMany({
            orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
            include: { user: { select: { email: true, fullName: true } } },
        }),
        prisma.generation.count(),
    ]);
    return Response.json({ generations, total });
}
