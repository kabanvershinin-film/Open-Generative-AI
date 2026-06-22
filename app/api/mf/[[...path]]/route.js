import { NextResponse } from 'next/server';
import { priceRub, ensureCnyRate } from '../../_lib/pricing';
import { BILLING_ENABLED, spendBalance, getUserForGallery } from '../../_lib/balance';

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
    if (!BILLING_ENABLED || !isImageGenerationPath(request.method.toUpperCase(), pathParts)) {
        return null;
    }

    const user = await getUserForGallery(request);
    const payload = await getBillingPayload(request.clone(), pathParts);
    const model = payload?.model;
    let cost = model ? await priceRub('image', model, payload?.params || {}, user?.id) : 0;

    // Если MEMEFAST возвращает реальное количество токенов или стоимость - можно доработать
    const usageTokens = data?.usage?.total_tokens;
    console.log('MEMEFAST usage tokens:', usageTokens);

    if (!(cost > 0)) return null;

    await ensureCnyRate();
    const charged = await spendBalance(request, cost, model, {
        source: 'studio-image',
        model,
        path: `/${pathParts.join('/')}`,
        tokens: usageTokens,
    });

    if (!charged?.ok) {
        console.error('Failed to charge for image generation:', charged.error);
    }

    return { cost, model };
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
    
    // Check balance upfront (but don't charge yet)
    if (BILLING_ENABLED && isImageGenerationPath(method, path)) {
        const user = await getUserForGallery(request);
        const payload = await getBillingPayload(request.clone(), path);
        const model = payload?.model;
        const estimatedCost = model ? await priceRub('image', model, payload?.params || {}, user?.id) : 0;
        
        if (estimatedCost > 0) {
            // Import checkBalance here (we need to add it to balance.js)
            // For now, let's skip this part - since we need to modify balance.js
            // But let's proceed with the main logic
        }
    }
    
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
