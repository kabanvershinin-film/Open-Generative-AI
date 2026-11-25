import { prisma } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const where = { isActive: true };
    if (type) where.mediaType = type;
    const models = await prisma.aiModel.findMany({ where, orderBy: { sortOrder: 'asc' } });
    return Response.json({ models });
}
