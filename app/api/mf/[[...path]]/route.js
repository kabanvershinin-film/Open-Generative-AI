import { NextResponse } from 'next/server';
import { priceRub, ensureCnyRate, CNY_TO_RUB, loadPlatformMarkup } from '../../_lib/pricing';
import { BILLING_ENABLED, spendBalance, getUserForGallery, getUser } from '../../_lib/balance';

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

async function maybeChargeImageSuccess(request, pathParts, data) {
    const method = request.method.toUpperCase();
    const isImageGen = isImageGenerationPath(method, pathParts);
    console.log('maybeChargeImageSuccess called', { 
        BILLING_ENABLED, 
        method, 
        pathParts,
        isImageGen
    });
    
    if (!BILLING_ENABLED || !isImageGen) {
        console.log('maybeChargeImageSuccess: skipping', {
            billingDisabled: !BILLING_ENABLED,
            notImageGen: !isImageGen
        });
        return null;
    }

    // Like workflow: get galleryUser first, then check if billing user exists
    const galleryUser = await getUserForGallery(request);
    const user = BILLING_ENABLED ? galleryUser : null;
    console.log('maybeChargeImageSuccess: galleryUser', galleryUser?.id, 'billingUser', user?.id);
    
    if (!user?.id) {
        console.log('maybeChargeImageSuccess: no user');
        return null;
    }

    const payload = await getBillingPayload(request.clone(), pathParts);
    const model = payload?.model;
    console.log('maybeChargeImageSuccess: model', model);
    
    let cost = 0;
    let source = 'estimated';
    const usage = data?.usage;

    if (usage) {
        console.log('MEMEFAST usage:', usage);
    }

    if (!(cost > 0) && model) {
        cost = await priceRub('image', model, payload?.params || {}, user?.id);
        source = 'estimated';
        console.log('maybeChargeImageSuccess: estimated cost', cost);
    }

    if (!(cost > 0)) {
        console.log('maybeChargeImageSuccess: no cost');
        return null;
    }

    await ensureCnyRate();
    console.log('maybeChargeImageSuccess: spending balance', cost);
    const charged = await spendBalance(request, cost, model, {
        source: source,
        model,
        path: `/${pathParts.join('/')}`,
        usage: usage,
    });

    if (!charged?.ok) {
        console.error('maybeChargeImageSuccess: failed to charge', charged);
    } else {
        console.log('maybeChargeImageSuccess: charged successfully', charged);
    }

    return { cost, model, source };
}

function buildUpstreamUrl(request, pathParts) {
    const pathname = Array.isArray(pathParts) && pathParts.length ? `/${pathParts.join('/')}` : '/';
    const url = new URL(pathname, MEMEFAST_BASE_URL);
    const search = new URL(request.url).search;
    if (search) url.search = search;
    return url;
}

function getApiKey(request) {
    const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1];
    const authHeader = request.headers.get('authorization');
    const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    return bearerKey || cookieKey || '';
}

function buildUpstreamHeaders(request) {
    const headers = new Headers(request.headers);
    const apiKey = getApiKey(request);
    if (apiKey) {
        headers.set('Authorization', `Bearer ${apiKey}`);
    }
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
    
    // Clone request FIRST, before reading body
    const proxyRequest = request.clone();
    const headers = buildUpstreamHeaders(request);
    const init = {
        method,
        headers,
        redirect: 'manual',
    };

    if (method !== 'GET' && method !== 'HEAD') {
        const body = await proxyRequest.arrayBuffer();
        init.body = body;
    }

    try {
        const upstream = await fetch(upstreamUrl, init);
        const clonedResponse = upstream.clone();
        let data = null;
        try {
            const responseText = await clonedResponse.text();
            console.log('MEMEFAST response:', responseText);
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                data = null;
            }
        } catch (logErr) {
            console.error('Error logging MEMEFAST response:', logErr);
        }

        if (upstream.ok && data) {
            await maybeChargeImageSuccess(request, path, data);
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
        console.error('Upstream proxy error:', error);
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
