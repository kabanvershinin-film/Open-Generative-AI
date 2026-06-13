import { NextResponse } from 'next/server';
import { callVolcServiceAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

const VISUAL_API_CONFIG = {
  host: 'visual.volcengineapi.com',
  service: 'cv',
  region: 'cn-north-1',
};

function extractVid(result) {
  const data = result?.data || result || {};
  const respData = data?.resp_data;
  if (typeof data?.vid === 'string' && data.vid) return data.vid;
  if (typeof respData === 'string') {
    try {
      const parsed = JSON.parse(respData);
      return parsed?.vid || null;
    } catch {}
  }
  return null;
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
      action: 'CVSync2AsyncGetResult',
      version: '2022-08-31',
      body: {
        req_key: 'url2vid',
        task_id: taskId,
      },
      ...VISUAL_API_CONFIG,
    });

    const data = result?.data || result || {};
    const status = data?.status || null;
    const vid = extractVid(result);

    return NextResponse.json({
      taskId,
      status,
      vid,
      done: status === 'done' && !!vid,
      raw: result,
    });
  } catch (err) {
    console.error('[digital-avatar/url-to-vid-status] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
