import { NextResponse } from 'next/server';
import { requireAuth, getAdminClient } from '@/lib/supabaseServer';
import { getBalance, reserveCredits, captureReserve, refundCredits } from '@/lib/credits';
import { runDemo, getCreditsForModel } from '@/lib/demoProvider';

export async function POST(request) {
    const { user, error } = await requireAuth(request);
    if (error) return NextResponse.json({ error }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { modelKey, prompt = '', params = {}, nodeId, workflowId } = body;
    if (!modelKey) return NextResponse.json({ error: 'modelKey required' }, { status: 400 });

    const sb = getAdminClient();

    // Verify user owns the node/workflow if provided
    if (workflowId) {
        const { data: wf } = await sb.from('workflows').select('id').eq('id', workflowId).eq('user_id', user.id).single();
        if (!wf) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get model cost
    const { data: model } = await sb.from('ai_models').select('credits_per_unit, is_active, media_type').eq('key', modelKey).single();
    const creditsPerUnit = model?.credits_per_unit ?? 1;
    const cost = getCreditsForModel(creditsPerUnit, { ...params, mediaType: model?.media_type });

    // Check & reserve credits
    const balance = await getBalance(sb, user.id);
    if (balance < cost) return NextResponse.json({ error: `Недостаточно кредитов. Требуется ${cost}, доступно ${balance.toFixed(2)}` }, { status: 402 });

    let reserveId;
    try {
        reserveId = await reserveCredits(sb, user.id, cost, `Резерв для ${modelKey}`);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 402 });
    }

    // Create generation record
    const { data: gen, error: genErr } = await sb.from('generations').insert({
        user_id: user.id,
        node_id: nodeId || null,
        workflow_id: workflowId || null,
        model_key: modelKey,
        prompt,
        params,
        status: 'running',
        credits_cost: cost,
    }).select().single();
    if (genErr) {
        await refundCredits(sb, user.id, reserveId, 'Возврат: ошибка создания записи');
        return NextResponse.json({ error: genErr.message }, { status: 500 });
    }

    // Run demo/real generation
    let result;
    try {
        result = await runDemo(modelKey, { prompt, ...params });
    } catch (e) {
        await refundCredits(sb, user.id, reserveId, 'Возврат: ошибка генерации');
        await sb.from('generations').update({ status: 'failed', error_msg: e.message }).eq('id', gen.id);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }

    // Capture credits & update generation
    await captureReserve(sb, user.id, reserveId, cost, `Генерация ${modelKey}`);
    const { data: updated } = await sb.from('generations').update({
        status: result.status,
        output_url: result.outputUrl || null,
        error_msg: result.status === 'failed' ? (result.error || 'Ошибка') : null,
        credits_cost: cost,
        updated_at: new Date().toISOString(),
    }).eq('id', gen.id).select().single();

    // If media produced, save to media_files
    if (result.outputUrl) {
        const type = result.type === 'video' ? 'video' : result.type === 'audio' ? 'audio' : 'image';
        await sb.from('media_files').insert({
            user_id: user.id,
            type,
            filename: `gen_${gen.id}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'png'}`,
            mime_type: type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'image/png',
            size_bytes: 0,
            url: result.outputUrl,
        });
    }

    return NextResponse.json({ generation: updated, result });
}
