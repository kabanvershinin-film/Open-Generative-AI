import { NextResponse } from 'next/server';
import { callVolcOpenAPI } from '../../_lib/volc-sign.js';

const VOLC_AK = process.env.VOLC_ACCESS_KEY;
const VOLC_SK = process.env.VOLC_SECRET_KEY;

export async function POST(request) {
  try {
    if (!VOLC_AK || !VOLC_SK) {
      return NextResponse.json({ error: 'VOLC ключи не настроены' }, { status: 500 });
    }

    const { groupId, url, assetType, name } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'url обязателен' }, { status: 400 });
    }

    const body = {
      URL: url,
      AssetType: assetType || 'Image',
      Name: name || '',
      ProjectName: 'default',
    };
    if (groupId) {
      body.GroupId = groupId;
    }

    const result = await callVolcOpenAPI({
      accessKeyId: VOLC_AK,
      secretAccessKey: VOLC_SK,
      action: 'CreateAsset',
      version: '2024-01-01',
      body,
    });

    return NextResponse.json({ assetId: result.Id || result.AssetId || result.id });
  } catch (err) {
    console.error('[create-asset] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
