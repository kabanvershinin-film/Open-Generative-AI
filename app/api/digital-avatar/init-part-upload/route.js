
import { NextResponse } from 'next/server';
import { callVolcOpenAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;
const VOLC_APP_ID = process.env.VOLC_APP_ID;

export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC ключи не настроены' }, { status: 500 });
    }
    if (!VOLC_APP_ID) {
      return NextResponse.json({ error: 'VOLC_APP_ID не настроен в env' }, { status: 500 });
    }

    const { confName, roleShowName, type = 1, fileSuffix = 'mp4' } = await request.json();
    if (!confName || !roleShowName) {
      return NextResponse.json({ error: 'confName и roleShowName обязательны' }, { status: 400 });
    }

    const result = await callVolcOpenAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'InitPartUpload',
      version: '2024-01-01',
      body: {
        AppId: VOLC_APP_ID,
        ConfName: confName,
        RoleShowName: roleShowName,
        Type: type,
        FileSuffix: fileSuffix,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[init-part-upload] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
