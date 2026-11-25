import { requireAdmin } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });
    return Response.json({ plans });
}

export async function POST(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { code, name, price_rub, credits, duration_days = 30, is_active = true, sort_order = 0 } = await request.json().catch(() => ({}));
    if (!code || !name || !price_rub || !credits) return Response.json({ error: 'code, name, price_rub, credits required' }, { status: 400 });
    const plan = await prisma.plan.create({ data: { code, name, priceRub: parseInt(price_rub), credits: parseFloat(credits), durationDays: parseInt(duration_days), isActive: !!is_active, sortOrder: parseInt(sort_order) } });
    return Response.json({ plan }, { status: 201 });
}

export async function PATCH(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { id, code, name, price_rub, credits, duration_days, is_active, sort_order } = await request.json().catch(() => ({}));
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const data = {};
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (price_rub !== undefined) data.priceRub = parseInt(price_rub);
    if (credits !== undefined) data.credits = parseFloat(credits);
    if (duration_days !== undefined) data.durationDays = parseInt(duration_days);
    if (is_active !== undefined) data.isActive = !!is_active;
    if (sort_order !== undefined) data.sortOrder = parseInt(sort_order);
    const plan = await prisma.plan.update({ where: { id: parseInt(id) }, data });
    return Response.json({ plan });
}
