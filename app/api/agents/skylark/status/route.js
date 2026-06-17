import { NextResponse } from 'next/server';
import { callVolcServiceAPI } from '../../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY_AGENT || process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY_AGENT || process.env.VOLC_SECRET_KEY;

const VISUAL_API_CONFIG = {
  host: 'visual.volcengineapi.com',
  service: 'cv',
  region: 'cn-north-1',
};

export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC ключи не настроены' }, { status: 500 });
    }

    const { taskId } = await request.json();
    if (!taskId) {
      return NextResponse.json({ error: 'taskId обязателен' }, { status: 400 });
    }

    const result = await callVolcServiceAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'CVSync2AsyncGetResult',
      version: '2022-08-31',
      body: {
        req_key: 'pippit_iv2v_cvtob',
        task_id: taskId,
      },
      ...VISUAL_API_CONFIG,
    });

    return NextResponse.json({
      status: result?.data?.status || 'unknown',
      videoUrl: result?.data?.video_url || null,
      raw: result,
    });
  } catch (err) {
    console.error('[agents/skylark/status] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
