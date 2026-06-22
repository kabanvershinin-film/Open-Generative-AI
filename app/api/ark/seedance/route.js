import { NextResponse } from 'next/server';
import { getUser, signBill, verifyBillData, chargeForTask } from '../../_lib/balance';
import { priceRub, ensureCnyRate, seedance2RateCny, rubFromTokens } from '../../_lib/pricing';
import { buildContent } from './logic';
import { buildUserMediaKey } from '../../_lib/tosPaths';
import { createRoundRobinPicker, parseEndpoints } from './route.helpers.js';
import { pollSeedanceTask, submitSeedanceTask } from './route.handlers.js';

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
const pickEndpoint = createRoundRobinPicker(FULL_ENDPOINTS, FAST_ENDPOINTS, rrIndex);

const routeDeps = {
  arkApiKey: ARK_API_KEY,
  arkBase: ARK_BASE,
  getUser,
  resolvePublic,
  buildContent,
  ensureCnyRate,
  priceRub,
  seedance2RateCny,
  signBill,
  verifyBillData,
  rubFromTokens,
  chargeForTask,
  pickEndpoint,
  fetchImpl: fetch,
  fastModelId: FAST_MODEL_ID,
  stdModelId: STD_MODEL_ID,
};

// POST /api/ark/seedance — submit a generation task, returns { taskId, endpoint, bill, balance }
export async function POST(request) {
  try {
    const body = await request.json();
    const result = await submitSeedanceTask(routeDeps, body, { request });
    return NextResponse.json(result.body, { status: result.status });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/ark/seedance?taskId=... — poll a task, returns { status, url }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await pollSeedanceTask(routeDeps, {
      request,
      taskId: searchParams.get('taskId'),
      bill: searchParams.get('bill'),
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
