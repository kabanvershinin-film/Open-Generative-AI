import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';
import { getBalance, reserveCredits, captureReserve, refundCredits } from '@/lib/credits';
import { runDemo, getCreditsForModel } from '@/lib/demoProvider';
import { isTokenGoEnabled, run as runTokenGo } from '@/lib/tokengoProvider';

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { modelKey, prompt = '', params = {}, nodeId, workflowId } = body;
    if (!modelKey) return Response.json({ error: 'modelKey required' }, { status: 400 });

    if (workflowId) {
        const wf = await prisma.workflow.findFirst({ where: { id: parseInt(workflowId), userId: user.id } });
        if (!wf) return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const model = await prisma.aiModel.findUnique({ where: { key: modelKey } });
    const creditsPerUnit = model?.creditsPerUnit ?? 1;
    const cost = getCreditsForModel(creditsPerUnit, { ...params, mediaType: model?.mediaType });

    const balance = await getBalance(null, user.id);
    if (balance < cost) return Response.json({ error: `Недостаточно кредитов. Требуется ${cost}, доступно ${balance.toFixed(2)}` }, { status: 402 });

    let reserveId;
    try { reserveId = await reserveCredits(null, user.id, cost, `Резерв для ${modelKey}`); }
    catch (e) { return Response.json({ error: e.message }, { status: 402 }); }

    const gen = await prisma.generation.create({ data: {
        userId: user.id, nodeId: nodeId ? parseInt(nodeId) : null,
        workflowId: workflowId ? parseInt(workflowId) : null,
        modelKey, prompt, params: JSON.stringify(params), status: 'running', creditsCost: cost,
    }});

    let result;
    try {
        if (isTokenGoEnabled()) {
            result = await runTokenGo(modelKey, model?.mediaType || 'image', prompt, params);
        } else {
            result = await runDemo(modelKey, { prompt, ...params });
        }
    } catch (e) {
        await refundCredits(null, user.id, reserveId, 'Возврат: ошибка генерации');
        await prisma.generation.update({ where: { id: gen.id }, data: { status: 'failed', errorMsg: e.message } });
        return Response.json({ error: e.message }, { status: 500 });
    }

    // Video/audio returns pending with taskId — credits captured only on completion
    if (result.status === 'pending' && result.taskId) {
        const paramsWithTask = JSON.stringify({ ...params, _tokengoTaskId: result.taskId, _reserveId: reserveId });
        const updated = await prisma.generation.update({
            where: { id: gen.id },
            data: { status: 'pending', params: paramsWithTask },
        });
        return Response.json({ generation: updated, result });
    }

    // Sync result (image / text)
    await captureReserve(null, user.id, reserveId, cost, `Генерация ${modelKey}`);
    const updated = await prisma.generation.update({
        where: { id: gen.id },
        data: { status: result.status, outputUrl: result.outputUrl || null, errorMsg: result.status === 'failed' ? (result.error || 'Ошибка') : null },
    });

    if (result.outputUrl) {
        const type = result.type === 'video' ? 'video' : result.type === 'audio' ? 'audio' : 'image';
        await prisma.mediaFile.create({ data: {
            userId: user.id, type, filename: `gen_${gen.id}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'png'}`,
            mimeType: type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'image/png',
            sizeBytes: 0, url: result.outputUrl,
        }});
    }

    return Response.json({ generation: updated, result });
}
