// Payment backend ported from creator-club (Точка Bank acquiring + Supabase).
//   POST /api/payments/create        — create a top-up payment, returns paymentUrl
//   POST /api/payments/verify        — verify one order, credit balance (atomic)
//   POST /api/payments/webhook       — provider callback / server-side finalize
//   GET  /api/payments/poll-pending  — cron: sweep pending payments, credit paid
//
// Env vars (add to Vercel — same values as creator-club):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   TOCHKA_TOKEN, TOCHKA_CUSTOMER_CODE, PUBLIC_BASE_URL, CRON_SECRET
//   TOCHKA_WEBHOOK_SECRET  (optional: protect /api/payments/webhook)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { creditBalance, getBalance } from '../../_lib/balance';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TOCHKA_BASE_URL = 'https://enter.tochka.com/uapi';
const TOCHKA_CUSTOMER_CODE = process.env.TOCHKA_CUSTOMER_CODE || '305723470';
const TOCHKA_TOKEN = process.env.TOCHKA_TOKEN?.trim();
const CRON_SECRET = process.env.CRON_SECRET;
const TOCHKA_WEBHOOK_SECRET = process.env.TOCHKA_WEBHOOK_SECRET?.trim();

function anon() { return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }); }
function admin() { return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }); }

async function getUser(request) {
    const auth = request.headers.get('authorization') || '';
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!jwt) return null;
    try {
        const { data, error } = await anon().auth.getUser(jwt);
        if (error || !data?.user) return null;
        return data.user;
    } catch { return null; }
}

function isPaidStatus(status) {
    return ['APPROVED', 'PAID', 'CONFIRMED'].includes((status || '').toUpperCase());
}

function isFailedStatus(status) {
    return ['REJECTED', 'CANCELLED', 'EXPIRED', 'FAILED'].includes((status || '').toUpperCase());
}

async function fetchOperationStatus(operationId) {
    const tochkaResp = await fetch(
        `${TOCHKA_BASE_URL}/acquiring/v1.0/payments/${encodeURIComponent(operationId)}`,
        { headers: { 'Authorization': `Bearer ${TOCHKA_TOKEN}`, 'CustomerCode': TOCHKA_CUSTOMER_CODE } }
    );
    const tochkaData = await tochkaResp.json();
    const op = tochkaData?.Data?.Operation?.[0] || tochkaData?.Data;
    return { status: (op?.status || '').toUpperCase(), raw: tochkaData };
}

async function finalizePayment(db, payment, meta = {}) {
    if (!payment) return { status: 'missing' };
    if (payment.status === 'paid') return { status: 'paid', credited: false };
    if (!payment.operation_id) return { status: 'error', error: 'operation_id missing' };

    const { status } = await fetchOperationStatus(payment.operation_id);
    if (isPaidStatus(status)) {
        const { data: claimed, error: claimErr } = await db
            .from('payments')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', payment.id)
            .neq('status', 'paid')
            .select();
        if (claimErr) return { status: 'error', error: claimErr.message };
        if (!claimed || claimed.length === 0) return { status: 'paid', credited: false };

        const credited = await creditBalance(payment.user_id, Number(payment.amount), 'payment', {
            orderId: payment.id,
            operationId: payment.operation_id,
            ...meta,
        });
        if (!credited.ok) {
            await db.from('payments')
                .update({ status: 'pending', paid_at: null })
                .eq('id', payment.id);
            return { status: 'paid', credited: false };
        }
        return { status: 'paid', credited: true, balance: credited.balance };
    }

    if (isFailedStatus(status)) {
        await db.from('payments').update({ status: 'failed' }).eq('id', payment.id);
        return { status: 'failed' };
    }
    return { status: 'pending', tochkaStatus: status };
}

function extractLookup(payload) {
    const direct = payload && typeof payload === 'object' ? payload : {};
    const data = direct.Data && typeof direct.Data === 'object' ? direct.Data : {};
    const operation = Array.isArray(data.Operation) ? (data.Operation[0] || {}) : {};

    const orderId =
        direct.orderId ||
        direct.order_id ||
        direct.paymentLinkId ||
        direct.payment_link_id ||
        data.orderId ||
        data.order_id ||
        data.paymentLinkId ||
        data.payment_link_id ||
        operation.orderId ||
        operation.order_id ||
        operation.paymentLinkId ||
        operation.payment_link_id ||
        null;

    const operationId =
        direct.operationId ||
        direct.operation_id ||
        data.operationId ||
        data.operation_id ||
        operation.operationId ||
        operation.operation_id ||
        null;

    return {
        orderId: orderId ? String(orderId) : null,
        operationId: operationId ? String(operationId) : null,
    };
}

function isWebhookAuthorized(request) {
    if (!TOCHKA_WEBHOOK_SECRET) return true;
    const auth = request.headers.get('authorization') || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const headerSecret = request.headers.get('x-webhook-secret') || request.headers.get('x-tochka-webhook-secret') || '';
    const querySecret = request.nextUrl.searchParams.get('secret') || '';
    return [bearer, headerSecret, querySecret].some((value) => value === TOCHKA_WEBHOOK_SECRET);
}

async function parseWebhookPayload(request) {
    const raw = await request.text().catch(() => '');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        const params = new URLSearchParams(raw);
        const entries = Object.fromEntries(params.entries());
        return Object.keys(entries).length ? entries : null;
    }
}

async function createPayment(request) {
    if (!TOCHKA_TOKEN) return NextResponse.json({ error: 'TOCHKA_TOKEN missing' }, { status: 500 });
    if (!SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });

    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const amountNum = Number(body.amount);
    if (!Number.isFinite(amountNum) || amountNum < 100 || amountNum > 100000) {
        return NextResponse.json({ error: 'Сумма должна быть от 100 до 100000 руб' }, { status: 400 });
    }

    const db = admin();
    try {
        // 1. merchantId
        const retailersResp = await fetch(
            `${TOCHKA_BASE_URL}/acquiring/v1.0/retailers?customerCode=${TOCHKA_CUSTOMER_CODE}`,
            { headers: { 'Authorization': `Bearer ${TOCHKA_TOKEN}`, 'CustomerCode': TOCHKA_CUSTOMER_CODE } }
        );
        const retailersData = await retailersResp.json();
        const list = retailersData.Data?.Retailer || retailersData.Data?.retailers || [];
        const arr = Array.isArray(list) ? list : [list];
        const retailer = arr.find(r => r?.isActive === true || r?.isActive === 'true') || arr[0];
        const merchantId = retailer?.merchantId;
        if (!merchantId) return NextResponse.json({ error: 'merchantId not found', raw: retailersData }, { status: 502 });

        // 2. DB record
        const orderId = `cc-${user.id.slice(0, 8)}-${Date.now()}`;
        const { error: insErr } = await db.from('payments').insert({
            id: orderId, user_id: user.id, amount: amountNum, status: 'pending',
        });
        if (insErr) return NextResponse.json({ error: 'DB insert error', message: insErr.message }, { status: 500 });

        // 3. Tochka payment
        const origin = process.env.PUBLIC_BASE_URL || new URL(request.url).origin;
        const response = await fetch(`${TOCHKA_BASE_URL}/acquiring/v1.0/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOCHKA_TOKEN}`, 'CustomerCode': TOCHKA_CUSTOMER_CODE },
            body: JSON.stringify({
                Data: {
                    customerCode: TOCHKA_CUSTOMER_CODE, amount: amountNum,
                    purpose: `Пополнение баланса, ${user.email || user.id}`,
                    merchantId, paymentMode: ['card', 'sbp'],
                    redirectUrl: `${origin}/?payment=success&order=${encodeURIComponent(orderId)}`,
                    failRedirectUrl: `${origin}/?payment=fail&order=${encodeURIComponent(orderId)}`,
                    paymentLinkId: orderId,
                }
            }),
        });
        const data = JSON.parse(await response.text());
        if (!data.Data?.paymentLink) {
            await db.from('payments').update({ status: 'failed' }).eq('id', orderId);
            return NextResponse.json({ error: 'Tochka API error', detail: data }, { status: 502 });
        }
        if (data.Data?.operationId) {
            await db.from('payments').update({ operation_id: data.Data.operationId }).eq('id', orderId);
        }
        return NextResponse.json({ paymentUrl: data.Data.paymentLink, orderId });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function verifyPayment(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId;
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const db = admin();
    try {
        const { data: payment, error: selErr } = await db.from('payments').select('*').eq('id', orderId).single();
        if (selErr || !payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        if (payment.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const result = await finalizePayment(db, payment, { source: 'verify' });
        if (result.status === 'error') return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function paymentWebhook(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
    if (!isWebhookAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await parseWebhookPayload(request);
    if (!payload || typeof payload !== 'object') {
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const { orderId, operationId } = extractLookup(payload);
    if (!orderId && !operationId) {
        return NextResponse.json({ accepted: true, ignored: true, reason: 'No orderId/operationId in payload' });
    }

    const db = admin();
    let query = db.from('payments').select('*').maybeSingle();
    query = orderId ? query.eq('id', orderId) : query.eq('operation_id', operationId);
    const { data: payment, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!payment) {
        return NextResponse.json({ accepted: true, ignored: true, reason: 'Payment not found', orderId, operationId });
    }

    const result = await finalizePayment(db, payment, {
        source: 'webhook',
        webhookOrderId: orderId,
        webhookOperationId: operationId,
    });
    if (result.status === 'error') return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ accepted: true, paymentId: payment.id, ...result });
}

async function pollPending(request) {
    const auth = request.headers.get('authorization') || '';
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}` && !isVercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!TOCHKA_TOKEN || !SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'config missing' }, { status: 500 });
    }
    const db = admin();
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const { data: pending, error: selErr } = await db
        .from('payments').select('id, user_id, amount, operation_id')
        .eq('status', 'pending').not('operation_id', 'is', null)
        .lt('created_at', oneMinAgo).gt('created_at', sevenDaysAgo).limit(100);
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!pending?.length) return NextResponse.json({ checked: 0, credited: 0 });

    let credited = 0;
    for (const p of pending) {
        try {
            const result = await finalizePayment(db, p, { source: 'cron' });
            if (result.credited) credited++;
        } catch { /* skip */ }
    }
    return NextResponse.json({ checked: pending.length, credited });
}

export async function POST(request, { params }) {
    const { action = [] } = await params;
    const a = action[0];
    if (a === 'create') return createPayment(request);
    if (a === 'verify') return verifyPayment(request);
    if (a === 'webhook') return paymentWebhook(request);
    if (a === 'poll-pending') return pollPending(request);
    return NextResponse.json({ error: 'Unknown action' }, { status: 404 });
}

export async function GET(request, { params }) {
    const { action = [] } = await params;
    if (action[0] === 'poll-pending') return pollPending(request);
    if (action[0] === 'balance') {
        // Identified via the sb_access_token cookie (sent same-origin), so it
        // never collides with the memefast key in the Authorization header.
        const balance = await getBalance(request);
        return NextResponse.json({ balance });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 404 });
}
