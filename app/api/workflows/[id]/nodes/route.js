import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';

async function ownsWorkflow(userId, workflowId) {
    return prisma.workflow.findFirst({ where: { id: parseInt(workflowId), userId } });
}

export async function POST(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    if (!await ownsWorkflow(user.id, params.id)) return Response.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const { name = 'Node', type = 'image', modelKey, pos_x = 100, pos_y = 100 } = body;
    const node = await prisma.workflowNode.create({ data: {
        workflowId: parseInt(params.id), name, type, modelKey: modelKey || '', posX: pos_x, posY: pos_y,
    }});
    return Response.json({ node }, { status: 201 });
}

export async function PATCH(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    if (!await ownsWorkflow(user.id, params.id)) return Response.json({ error: 'Not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const { nodeId, name, modelKey, pos_x, pos_y, outputUrl } = body;
    if (!nodeId) return Response.json({ error: 'nodeId required' }, { status: 400 });
    const data = {};
    if (name !== undefined) data.name = name;
    if (modelKey !== undefined) data.modelKey = modelKey;
    if (pos_x !== undefined) data.posX = pos_x;
    if (pos_y !== undefined) data.posY = pos_y;
    if (outputUrl !== undefined) data.outputUrl = outputUrl;
    const node = await prisma.workflowNode.update({ where: { id: parseInt(nodeId) }, data });
    return Response.json({ node });
}

export async function DELETE(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });
    if (!await ownsWorkflow(user.id, params.id)) return Response.json({ error: 'Not found' }, { status: 404 });
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    if (!nodeId) return Response.json({ error: 'nodeId required' }, { status: 400 });
    await prisma.workflowNode.delete({ where: { id: parseInt(nodeId) } });
    return Response.json({ ok: true });
}
