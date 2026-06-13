import { NextResponse } from 'next/server';
import { callVolcServiceAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

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

    const { videoUrl } = await request.json();
    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl обязателен' }, { status: 400 });
    }

    const result = await callVolcServiceAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'CVSync2AsyncSubmitTask',
      version: '2022-08-31',
      body: {
        req_key: 'url2vid',
        video_url: videoUrl,
      },
      ...VISUAL_API_CONFIG,
    });

    return NextResponse.json({
      taskId: result?.data?.task_id || result?.task_id || null,
      raw: result,
    });
  } catch (err) {
    console.error('[digital-avatar/url-to-vid] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
