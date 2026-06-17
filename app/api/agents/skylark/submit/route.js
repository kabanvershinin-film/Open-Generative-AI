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

    const body = await request.json();
    const { 
      prompt, 
      img_url_list = [], 
      video_url_list = [], 
      ratio = "auto", 
      duration = "auto", 
      language = "Chinese", 
      accent = "PuTongHua",
      enable_watermark = true 
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Промпт обязателен' }, { status: 400 });
    }

    const result = await callVolcServiceAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'CVSync2AsyncSubmitTask',
      version: '2022-08-31',
      body: {
        req_key: 'pippit_iv2v_cvtob',
        prompt,
        img_url_list,
        video_url_list,
        ratio,
        duration,
        language,
        accent,
        enable_watermark
      },
      ...VISUAL_API_CONFIG,
    });

    return NextResponse.json({
      taskId: result?.data?.task_id || result?.task_id || null,
      raw: result,
    });
  } catch (err) {
    console.error('[agents/skylark/submit] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
