import { NextResponse } from 'next/server';
import { BILLING_ENABLED, getUser, spendBalance, refundBalanceRpc, signBill, verifyBill } from '../../_lib/balance';
import { priceRub, ensureCnyRate } from '../../_lib/pricing';
import { buildContent } from './logic';

// Volcano Ark video generation (Seedance 2.0) — called directly, bypassing Memefast.
// Auth: long-lived Ark API Key (Bearer). Set ARK_API_KEY in env.
// Load balancing: round-robin across several inference endpoints (ep-...), set as a
// comma-separated list in ARK_SEEDANCE_ENDPOINTS. Falls back to the model id.
//
// Architecture: submit-and-poll from the BROWSER to avoid hanging long HTTP connections.
//   POST /api/ark/seedance         → submit task, returns { taskId, endpoint }
//   GET  /api/ark/seedance?taskId= → poll status, returns { status, url }
// Each request is short-lived (< 2s), so no Vercel timeout issues.

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3';
const ARK_API_KEY = process.env.ARK_API_KEY || '';

function parseEndpoints(envVal, fallback) {
  const list = (envVal || '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : fallback;
}

// Two separate endpoint pools — Seedance 2.0 (full) and Seedance 2.0 Fast.
// Each is round-robin load-balanced. Override via env (comma-separated ep- ids):
//   ARK_SEEDANCE_ENDPOINTS       — full (Doubao-Seedance-2.0)
//   ARK_SEEDANCE_FAST_ENDPOINTS  — fast (Doubao-Seedance-2.0-fast)
const FULL_ENDPOINTS = parseEndpoints(process.env.ARK_SEEDANCE_ENDPOINTS, [
  'ep-20260529025832-p9qqk',
  'ep-20260529025809-nv5bv',
  'ep-20260529025745-7qpzf',
  'ep-20260529025647-5xbjq',
  'ep-20260529022549-pwx2w',
]);
const FAST_ENDPOINTS = parseEndpoints(process.env.ARK_SEEDANCE_FAST_ENDPOINTS, [
  'ep-20260602191805-lkvlm',
  'ep-20260602191309-2d24d',
  'ep-20260602191215-9dpxn',
  'ep-20260602191152-xctn2',
  'ep-20260602190812-pqwdx',
]);

const FAST_MODEL_ID = 'doubao-seedance-2-0-fast-260128';
const STD_MODEL_ID  = 'doubao-seedance-2-0-260128';

// Per-pool round-robin index, seeded randomly so concurrent cold serverless
// instances don't all start on the same endpoint.
const rrIndex = {
  full: Math.floor(Math.random() * Math.max(1, FULL_ENDPOINTS.length)),
  fast: Math.floor(Math.random() * Math.max(1, FAST_ENDPOINTS.length)),
};
function pickEndpoint(fast) {
  const pool = fast ? FAST_ENDPOINTS : FULL_ENDPOINTS;
  const key  = fast ? 'fast' : 'full';
  if (pool.length === 0) return null;
  const ep = pool[rrIndex[key] % pool.length];
  rrIndex[key] = (rrIndex[key] + 1) % pool.length;
  return ep;
}

// POST /api/ark/seedance — submit a generation task, returns { taskId, endpoint, bill, balance }
export async function POST(request) {
  if (!ARK_API_KEY) {
    return NextResponse.json({ error: 'ARK_API_KEY not configured' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const {
      fast = false,
      prompt = '',
      image_url,
      image_urls,
      video_url,
      video_urls,
      audio_url,
      audio_urls,
      resolution,
      ratio,
      duration,
      generate_audio = true,
      face_asset,
      last_image_url,
    } = body;

    const content = buildContent({ 
      prompt, 
      image_url, 
      image_urls, 
      video_url, 
      video_urls, 
      audio_url, 
      audio_urls,
      face_asset,
      last_image_url,
    });
    if (content.length === 0) {
      return NextResponse.json({ error: 'Empty content' }, { status: 400 });
    }

    const modelId = fast ? FAST_MODEL_ID : STD_MODEL_ID;
    const model = pickEndpoint(fast) || modelId;

    // Billing: calculate cost and deduct balance before submitting to Ark.
    await ensureCnyRate();
    const cost = await priceRub('video', modelId, { resolution, video_url, duration, generate_audio });
    const charge = await spendBalance(request, cost, `ark_seedance_${modelId}`, { model: modelId, taskId: 'pending' });
    if (!charge.ok) {
      if (charge.error === 'insufficient') {
        return NextResponse.json({ error: 'insufficient_funds', required: cost, balance: charge.balance }, { status: 402 });
      }
      return NextResponse.json({ error: charge.error || 'Ошибка списания баланса' }, { status: 403 });
    }

    const payload = { model, content, generate_audio, watermark: false };
    if (face_asset) payload.face_asset = face_asset;
    if (resolution) {
      let res = String(resolution).toLowerCase();
      if (fast && res === '1080p') res = '720p';
      payload.resolution = res;
    }
    if (ratio) payload.ratio = ratio;
    if (duration != null && duration !== '') payload.duration = Math.max(4, Math.min(15, Number(duration) || 5));

    try {
      const r = await fetch(`${ARK_BASE}/contents/generations/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ARK_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        // Refund on submission failure.
        if (charge.ok && cost > 0) await refundBalanceRpc(request, cost, `refund_ark_seedance_${modelId}`);
        return NextResponse.json(
          { error: data?.error?.message || data?.message || `Ark error ${r.status}` },
          { status: r.status },
        );
      }
      
      // Return the taskId along with the bill token and remaining balance.
      return NextResponse.json({ 
        taskId: data.id, 
        endpoint: model,
        bill: signBill(cost, { model: modelId, taskId: data.id }),
        balance: charge.balance
      });
    } catch (e) {
      if (charge.ok && cost > 0) await refundBalanceRpc(request, cost, `refund_ark_seedance_${modelId}`);
      throw e;
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/ark/seedance?taskId=... — poll a task, returns { status, url }
export async function GET(request) {
  if (!ARK_API_KEY) {
    return NextResponse.json({ error: 'ARK_API_KEY not configured' }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  const bill = searchParams.get('bill');
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

  try {
    const r = await fetch(`${ARK_BASE}/contents/generations/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${ARK_API_KEY}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.message || `Ark error ${r.status}` },
        { status: r.status },
      );
    }
    const status = (data.status || 'running').toLowerCase();
    const url = data.content?.video_url || data.video_url || null;
    const error = data.error?.message || data.message || null;

    // Refund if task failed and a bill token was provided.
    if ((status === 'failed' || status === 'error' || status === 'expired' || status === 'cancelled') && bill) {
      const cost = verifyBill(bill);
      if (cost > 0) {
        await refundBalanceRpc(request, cost, `refund_ark_seedance_${taskId}`);
      }
    }

    return NextResponse.json({ status, url, error });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
