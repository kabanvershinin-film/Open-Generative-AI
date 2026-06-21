import { NextResponse } from 'next/server';
import { BILLING_ENABLED, getUser, spendBalance, refundBalanceRpc, signBill, verifyBill } from '../../_lib/balance';
import { priceRub, ensureCnyRate } from '../../_lib/pricing';
import { buildContent } from './logic';
import { buildUserMediaKey } from '../../_lib/tosPaths';

const TOS_AK = process.env.TOS_ACCESS_KEY || '';
const TOS_SK = process.env.TOS_SECRET_KEY || '';
const TOS_ENDPOINT = process.env.TOS_ENDPOINT || 'tos-cn-beijing.volces.com';
const TOS_REGION = process.env.TOS_REGION || 'cn-beijing';
const TOS_BUCKET = process.env.TOS_BUCKET || '';
const TOS_ENABLED = !!(TOS_AK && TOS_SK && TOS_BUCKET);

import { createHmac, createHash } from 'crypto';
function sha256hex(data) { return createHash('sha256').update(data).digest('hex'); }
function hmac(key, data)  { return createHmac('sha256', key).update(data).digest(); }

async function tosUpload(key, buffer, contentType) {
  if (!TOS_ENABLED) return null;
  try {
    const now = new Date();
    const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const date = iso.slice(0, 8);
    const datetime = iso;
    const host = `${TOS_BUCKET}.${TOS_ENDPOINT}`;
    const path = `/${key}`;
    const payloadHash = sha256hex(buffer);
    const canonHeaders = `content-length:${buffer.length}\ncontent-type:${contentType}\nhost:${host}\nx-tos-content-sha256:${payloadHash}\nx-tos-date:${datetime}\n`;
    const signedHeaders = 'content-length;content-type;host;x-tos-content-sha256;x-tos-date';
    const canonical = `PUT\n${path}\n\n${canonHeaders}\n${signedHeaders}\n${payloadHash}`;
    const scope = `${date}/${TOS_REGION}/tos/request`;
    const strToSign = `TOS4-HMAC-SHA256\n${datetime}\n${scope}\n${sha256hex(canonical)}`;
    const sigKey = hmac(hmac(hmac(hmac(TOS_SK, date), TOS_REGION), 'tos'), 'request');
    const sig = createHmac('sha256', sigKey).update(strToSign).digest('hex');
    const auth = `TOS4-HMAC-SHA256 Credential=${TOS_AK}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
    const r = await fetch(`https://${host}${path}`, {
      method: 'PUT',
      headers: { 'Authorization': auth, 'Content-Type': contentType, 'Content-Length': buffer.length, 'X-Tos-Content-Sha256': payloadHash, 'X-Tos-Date': datetime },
      body: buffer,
    });
    if (!r.ok) { const t = await r.text(); console.error('TOS error:', r.status, t); return null; }
    return `https://${host}${path}`;
  } catch (e) { console.error('TOS upload error:', e.message); return null; }
}

async function maybeUploadToTOS(dataUrl, userId = null) {
  if (!dataUrl || !dataUrl.startsWith('data:') || !TOS_ENABLED) return dataUrl;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return dataUrl;
  const contentType = m[1];
  const ext = contentType.split('/')[1]?.split('+')[0] || 'bin';
  const buffer = Buffer.from(m[2], 'base64');
  const tosKey = buildUserMediaKey(userId, 'images', ext);
  return (await tosUpload(tosKey, buffer, contentType)) || dataUrl;
}

async function resolvePublic(u, userId = null) {
  if (!u || typeof u !== 'string') return undefined;
  if (!u.startsWith('data:')) return u;
  const uploaded = await maybeUploadToTOS(u, userId);
  return uploaded || u; // If TOS upload fails, return original data URL
}

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
    const user = await getUser(request);
    const userId = user?.id || null;

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

    // Resolve any base64 URLs (like face thumbnails or uploads) to public TOS URLs.
    const resolvedImageUrl = typeof image_url === 'object' 
        ? { ...image_url, url: await resolvePublic(image_url.url, userId) }
        : await resolvePublic(image_url, userId);
    
    const resolvedImageUrls = Array.isArray(image_urls)
        ? await Promise.all(image_urls.map(async u => 
            typeof u === 'object' ? { ...u, url: await resolvePublic(u.url, userId) } : await resolvePublic(u, userId)
          ))
        : undefined;

    const content = buildContent({ 
      prompt, 
      image_url: resolvedImageUrl, 
      image_urls: resolvedImageUrls, 
      video_url, 
      video_urls, 
      audio_url, 
      audio_urls,
      face_asset,
      last_image_url: await resolvePublic(last_image_url, userId),
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

    const payload = {
      model,
      content,
      generate_audio,
      watermark: false,
      // Pass face_asset at top level for some Ark versions
      ...(face_asset ? { face_asset } : {}),
    };
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
