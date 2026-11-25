import { requireAdmin } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const rows = await prisma.siteSetting.findMany();
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    return Response.json({ settings });
}

export async function POST(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const body = await request.json().catch(() => ({}));
    const entries = Object.entries(body);
    if (!entries.length) return Response.json({ error: 'No settings provided' }, { status: 400 });
    await Promise.all(entries.map(([key, value]) =>
        prisma.siteSetting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } })
    ));
    return Response.json({ ok: true });
}
