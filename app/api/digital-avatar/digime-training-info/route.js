import { NextResponse } from 'next/server';
import { callVolcServiceAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

const VISUAL_API_CONFIG = {
  host: 'visual.volcengineapi.com',
  service: 'cv',
  region: 'cn-north-1',
};

function parseRespData(respData) {
  if (typeof respData !== 'string') return {};
  try {
    return JSON.parse(respData);
  } catch {
    return {};
  }
}

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
      action: 'CVGetResult',
      version: '2022-08-31',
      body: {
        req_key: 'realman_avatar_training_task_streaming',
        task_id: taskId,
      },
      ...VISUAL_API_CONFIG,
    });

    const data = result?.data || result || {};
    const status = data?.status || null;
    const respData = parseRespData(data?.resp_data);
    const resourceId = respData?.resource_id || null;
    const frontendPic = respData?.frontend_pic || null;
    const progress = Number(respData?.progress || 0);

    return NextResponse.json({
      taskId,
      status,
      progress,
      state: status === 'done' && resourceId ? 2 : status === 'failed' ? 3 : 1,
      resourceId,
      assetUri: resourceId ? `asset://${resourceId}` : null,
      frontendPic,
      raw: result,
    });
  } catch (err) {
    console.error('[digime-training-info] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
