import { requireAuth } from '@/lib/supabaseServer';
import { prisma } from '@/lib/db';
import { captureReserve } from '@/lib/credits';
import { pollTask } from '@/lib/tokengoProvider';

// GET /api/generate/:id — polls TokenGo task status for async (video/audio) generations.
export async function GET(request, { params }) {
    const { user, error } = await requireAuth(request);
    if (error) return Response.json({ error }, { status: 401 });

    const { id } = await params;
    const gen = await prisma.generation.findFirst({ where: { id: parseInt(id), userId: user.id } });
    if (!gen) return Response.json({ error: 'Not found' }, { status: 404 });

    // Already done
    if (gen.status !== 'pending') return Response.json({ generation: gen });

    const storedParams = JSON.parse(gen.params || '{}');
    const taskId = storedParams._tokengoTaskId;
    const reserveId = storedParams._reserveId;

    if (!taskId) return Response.json({ generation: gen });

    let task;
    try {
        task = await pollTask(taskId);
    } catch (e) {
        return Response.json({ error: e.message }, { status: 502 });
    }

    // task.is_final indicates terminal state
    if (!task.is_final) return Response.json({ generation: gen, task });

    if (task.status === 'completed') {
        const outputUrl = task.output_url || task.result_url || task.data?.result_url || null;
        const { _tokengoTaskId, _reserveId, ...cleanParams } = storedParams;

        if (reserveId) {
            await captureReserve(null, user.id, reserveId, gen.creditsCost, `Генерация ${gen.modelKey}`).catch(() => {});
        }

        const updated = await prisma.generation.update({
            where: { id: gen.id },
            data: { status: 'success', outputUrl, params: JSON.stringify(cleanParams) },
        });

        if (outputUrl) {
            const model = await prisma.aiModel.findUnique({ where: { key: gen.modelKey } }).catch(() => null);
            const mtype = model?.mediaType === 'audio' ? 'audio' : 'video';
            await prisma.mediaFile.create({ data: {
                userId: user.id, type: mtype,
                filename: `gen_${gen.id}.${mtype === 'audio' ? 'mp3' : 'mp4'}`,
                mimeType: mtype === 'audio' ? 'audio/mpeg' : 'video/mp4',
                sizeBytes: 0, url: outputUrl,
            }}).catch(() => {});
        }

        return Response.json({ generation: updated, task });
    }

    // Failed
    const { _tokengoTaskId, _reserveId, ...cleanParams } = storedParams;
    const errMsg = task.error?.message || task.error_message || 'Ошибка генерации';

    if (reserveId) {
        await prisma.creditLedger.update({ where: { id: parseInt(reserveId) }, data: { type: 'refund', description: 'Возврат: ошибка генерации' } }).catch(() => {});
    }

    const updated = await prisma.generation.update({
        where: { id: gen.id },
        data: { status: 'failed', errorMsg: errMsg, params: JSON.stringify(cleanParams) },
    });

    return Response.json({ generation: updated, task });
}
