import { requireAdmin } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

export async function GET(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const models = await prisma.aiModel.findMany({ orderBy: { sortOrder: 'asc' } });
    return Response.json({ models });
}

export async function POST(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { key, name, provider_key = '', media_type = 'image', credits_per_unit = 1, is_active = true, sort_order = 0, thumb_url = '', description = '' } = await request.json().catch(() => ({}));
    if (!key || !name) return Response.json({ error: 'key and name required' }, { status: 400 });
    const model = await prisma.aiModel.create({ data: { key, name, providerKey: provider_key, mediaType: media_type, creditsPerUnit: parseFloat(credits_per_unit), isActive: !!is_active, sortOrder: parseInt(sort_order), thumbUrl: thumb_url, description } });
    return Response.json({ model }, { status: 201 });
}

export async function PATCH(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { id, key, name, provider_key, media_type, credits_per_unit, is_active, sort_order, thumb_url, description } = await request.json().catch(() => ({}));
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const data = {};
    if (key !== undefined) data.key = key;
    if (name !== undefined) data.name = name;
    if (provider_key !== undefined) data.providerKey = provider_key;
    if (media_type !== undefined) data.mediaType = media_type;
    if (credits_per_unit !== undefined) data.creditsPerUnit = parseFloat(credits_per_unit);
    if (is_active !== undefined) data.isActive = !!is_active;
    if (sort_order !== undefined) data.sortOrder = parseInt(sort_order);
    if (thumb_url !== undefined) data.thumbUrl = thumb_url;
    if (description !== undefined) data.description = description;
    const model = await prisma.aiModel.update({ where: { id: parseInt(id) }, data });
    return Response.json({ model });
}

export async function DELETE(request) {
    const { error } = await requireAdmin(request);
    if (error) return Response.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    await prisma.aiModel.delete({ where: { id: parseInt(id) } });
    return Response.json({ ok: true });
}
