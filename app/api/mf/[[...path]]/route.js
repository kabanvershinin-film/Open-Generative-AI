import { NextResponse } from 'next/server';
import { priceRub, ensureCnyRate } from '../../_lib/pricing';
import { BILLING_ENABLED, spendBalance, refundBalanceRpc, getUserForGallery } from '../../_lib/balance';

const MEMEFAST_BASE_URL = 'https://memefast.top';

function normalizeModelId(raw) {
    return String(raw || '').split(':')[0].trim();
}

function isImageGenerationPath(method, pathParts) {
    if (method !== 'POST') return false;
    if (pathParts[0] === 'v1' && pathParts[1] === 'images' && ['generations', 'edits'].includes(pathParts[2])) {
        return true;
    }
    if (pathParts[0] === 'v1beta' && pathParts[1] === 'models' && /generatecontent$/i.test(pathParts[2] || '')) {
        return /image/i.test(pathParts[2] || '');
    }
    return false;
}

async function getBillingPayload(request, pathParts) {
    if (pathParts[0] === 'v1' && pathParts[1] === 'images' && pathParts[2] === 'generations') {
        const body = await request.json().catch(() => null);
        const model = normalizeModelId(body?.model);
        if (!model) return null;
        return { model, params: body || {} };
    }

    if (pathParts[0] === 'v1' && pathParts[1] === 'images' && pathParts[2] === 'edits') {
        const form = await request.formData().catch(() => null);
        const model = normalizeModelId(form?.get('model'));
        if (!model) return null;
        const params = {};
        for (const [key, value] of form.entries()) {
            if (typeof value === 'string') params[key] = value;
        }
        return { model, params };
    }

    if (pathParts[0] === 'v1beta' && pathParts[1] === 'models') {
        const rawModel = String(pathParts[2] || '');
        const model = normalizeModelId(rawModel.replace(/:generateContent$/i, ''));
        if (!model) return null;
        const body = await request.json().catch(() => null);
        return { model, params: body || {} };
    }

    return null;
}

async function maybeChargeImageRequest(request, pathParts) {
    if (!BILLING_ENABLED || !isImageGenerationPath(request.method.toUpperCase(), pathParts)) {
        return { ok: true, billed: false };
    }

    const user = await getUserForGallery(request);
    const payload = await getBillingPayload(request.clone(), pathParts);
    const model = payload?.model;
    const cost = model ? await priceRub('image', model, payload?.params || {}, user?.id) : 0;
    if (!(cost > 0)) return { ok: true, billed: false };

    await ensureCnyRate();
    const charged = await spendBalance(request, cost, model, {
        source: 'studio-image',
        model,
        path: `/${pathParts.join('/')}`,
    });

    if (!charged?.ok) {
        if (charged.error === 'insufficient') {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: 'insufficient_funds', required: cost, balance: charged.balance ?? 0 },
                    { status: 402 },
                ),
            };
        }
        if (charged.error === 'unauthorized') {
            return { ok: true, billed: false };
        }
        return { ok: true, billed: false };
    }

    return { ok: true, billed: true, cost, reason: model };
}

function buildUpstreamUrl(request, pathParts) {
    const pathname = Array.isArray(pathParts) && pathParts.length ? `/${pathParts.join('/')}` : '/';
    const url = new URL(pathname, MEMEFAST_BASE_URL);
    const search = new URL(request.url).search;
    if (search) url.search = search;
    return url;
}

function buildUpstreamHeaders(request) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    headers.delete('content-length');
    headers.delete('x-forwarded-for');
    headers.delete('x-forwarded-host');
    headers.delete('x-forwarded-port');
    headers.delete('x-forwarded-proto');
    return headers;
}

async function proxyRequest(request, { params }) {
    const { path = [] } = await params;
    const upstreamUrl = buildUpstreamUrl(request, path);
    const method = request.method.toUpperCase();
    const billing = await maybeChargeImageRequest(request, path);
    if (!billing.ok) return billing.response;
    const headers = buildUpstreamHeaders(request);
    const init = {
        method,
        headers,
        redirect: 'manual',
    };

    if (method !== 'GET' && method !== 'HEAD') {
        const body = await request.arrayBuffer();
        init.body = body;
    }

    try {
        const upstream = await fetch(upstreamUrl, init);
        if (!upstream.ok && billing.billed) {
            await refundBalanceRpc(request, billing.cost, billing.reason);
        }
        const responseHeaders = new Headers(upstream.headers);
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');
        responseHeaders.delete('transfer-encoding');
        return new NextResponse(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: responseHeaders,
        });
    } catch (error) {
        if (billing.billed) {
            await refundBalanceRpc(request, billing.cost, billing.reason);
        }
        return NextResponse.json(
            { error: 'Upstream proxy failed', detail: error?.message || 'Unknown error' },
            { status: 502 },
        );
    }
}

export async function GET(request, context) {
    return proxyRequest(request, context);
}

export async function POST(request, context) {
    return proxyRequest(request, context);
}

export async function PUT(request, context) {
    return proxyRequest(request, context);
}

export async function PATCH(request, context) {
    return proxyRequest(request, context);
}

export async function DELETE(request, context) {
    return proxyRequest(request, context);
}

export async function OPTIONS(request, context) {
    return proxyRequest(request, context);
}
