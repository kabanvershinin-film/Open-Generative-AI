import { NextResponse } from 'next/server';
import { callVolcOpenAPI } from '../../../_lib/volc-sign.js';

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

    // We'll use DigimeTrainingInfo with multiple confNames if we have them,
    // but for now we'll just return an empty list with a placeholder
    // (in real scenario you'd store created digimes in DB/localStorage)
    return NextResponse.json({ digimes: [] });
  } catch (err) {
    console.error('[list-digimes] error:', err.message);
    return NextResponse.json({ error: err.message, digimes: [] }, { status: 500 });
  }
}
