import { NextResponse } from 'next/server';
import { callVolcServiceAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

const VISUAL_API_CONFIG = {
  host: 'visual.volcengineapi.com',
  service: 'cv',
  region: 'cn-north-1',
};

function extractResourceId(result) {
  const data = result?.data || result || {};
  const respData = data?.resp_data;
  if (typeof respData === 'string') {
    try {
      const parsed = JSON.parse(respData);
      return parsed?.resource_id || null;
    } catch {}
  }
  return null;
}

export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC keys not configured' }, { status: 500 });
    }

    const { taskId } = await request.json();
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    const result = await callVolcServiceAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'CVGetResult',
      version: '2022-08-31',
      body: {
        req_key: 'realman_avatar_picture_create_role',
        task_id: taskId,
      },
      ...VISUAL_API_CONFIG,
    });

    console.log('[photo-to-avatar-status] Volcengine result:', JSON.stringify(result, null, 2));

    const data = result?.data || result || {};
    const status = data?.status || null;
    const resourceId = extractResourceId(result);

    console.log('[photo-to-avatar-status] resourceId:', resourceId);

    return NextResponse.json({
      taskId,
      status,
      resourceId,
      assetUri: resourceId ? `asset://${resourceId}` : null,
      done: status === 'done' && !!resourceId,
      raw: result,
    });
  } catch (err) {
    console.error('[digital-avatar/photo-to-avatar-status] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
