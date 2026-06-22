import { NextResponse } from 'next/server';
import { priceRub, ensureCnyRate, CNY_TO_RUB, loadPlatformMarkup } from '../../_lib/pricing';
import { BILLING_ENABLED, spendBalance, getUserForGallery, getUser } from '../../_lib/balance';

// Debug: log env vars (without exposing secrets)
console.log('MF route init', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
  hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  billingEnabled: BILLING_ENABLED
});

const MEMEFAST_BASE_URL = 'https://memefast.top';

function normalizeModelId(raw) {
    return String(raw || '').split(':')[0].trim();
}

function isImageGenerationPath(method, pathParts) {
    if (method !== 'POST') return false;
    if (pathParts[0] === 'v1' && pathParts[1] === 'images' && ['generations', 'edits'].includes(pathParts[2])) {
        return true;
    }
    if (pathParts[0] === 'v1' && pathParts[1] === 'chat' && pathParts[2] === 'completions') {
        return true;
    }
    if (pathParts[0] === 'v1beta' && pathParts[1] === 'models' && /generatecontent$/i.test(pathParts[2] || '')) {
        return /image/i.test(pathParts[2] || '');
    }
    return false;
}

async function getBillingPayload(request, pathParts) {
    if (pathParts[0] === 'v1' && pathParts[1] === 'chat' && pathParts[2] === 'completions') {
        const body = await request.json().catch(() => null);
        const model = normalizeModelId(body?.model);
        if (!model) return null;
        return { model, params: body || {} };
    }

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

async function maybeChargeImageSuccess(request, pathParts, data, billingPayload) {
    const method = request.method.toUpperCase();
    const isImageGen = isImageGenerationPath(method, pathParts);
    console.log('maybeChargeImageSuccess called', { 
        BILLING_ENABLED, 
        method, 
        pathParts,
        isImageGen,
        billingPayload,
        data
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

    const payload = billingPayload;
    const model = payload?.model;
    console.log('maybeChargeImageSuccess: model', model);
    
    let cost = 0;
    let source = 'estimated';
    const usage = data?.usage;

    // Try actual cost from MEMEFAST first (highest priority)
    if (usage) {
        console.log('MEMEFAST usage:', usage);
        // If usage has cost in CNY, convert it to RUB
        const cnyCost = usage.cost_in_cny_ticks ? usage.cost_in_cny_ticks / 1000000 : (usage.cost_cny || null);
        const usdCost = usage.cost_in_usd_ticks ? usage.cost_in_usd_ticks / 1000000 : (usage.cost_usd || null);
        if (cnyCost) {
            await ensureCnyRate();
            const markup = await loadPlatformMarkup(user?.id);
            cost = cnyCost * CNY_TO_RUB * markup;
            source = 'actual';
            console.log('maybeChargeImageSuccess: actual cost (CNY)', cnyCost, '-> RUB', cost);
        } else if (usdCost) {
            console.log('maybeChargeImageSuccess: USD cost found, but no CNY rate for it', usdCost);
        }
    }

    // If no actual cost, try to calculate cost from token counts (MEMEFAST prices per 1M tokens)
    if (!(cost > 0) && usage) {
        const promptTokens = usage.prompt_tokens || 0;
        const completionTokens = usage.completion_tokens || 0;
        const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
        
        // Token-based pricing (¥ per 1M tokens) for common models
        let promptRateCny = 0; // ¥ per 1M prompt tokens
        let completionRateCny = 0; // ¥ per 1M completion tokens
        
        // Set rates based on model (from MEMEFAST docs)
        if (model?.includes('gpt-image-2')) {
            promptRateCny = 5.0; // ¥5 / 1M
            completionRateCny = 30.0; // ¥30 / 1M
        } else if (model?.includes('gemini')) {
            promptRateCny = 4.0; // Example rate for Gemini
            completionRateCny = 24.0;
        } else if (model?.includes('flux')) {
            promptRateCny = 3.0;
            completionRateCny = 18.0;
        }
        
        if (promptRateCny > 0 && completionRateCny > 0) {
            await ensureCnyRate();
            const markup = await loadPlatformMarkup(user?.id);
            
            // Calculate cost: (promptTokens / 1e6 * promptRate) + (completionTokens / 1e6 * completionRate)
            const cnyCost = 
                (promptTokens / 1_000_000 * promptRateCny) + 
                (completionTokens / 1_000_000 * completionRateCny);
            
            cost = cnyCost * CNY_TO_RUB * markup;
            source = 'tokens';
            
            console.log('maybeChargeImageSuccess: token cost', {
                promptTokens,
                completionTokens,
                totalTokens,
                promptRateCny,
                completionRateCny,
                cnyCost,
                rubCost: cost
            });
        }
    }

    // If no actual cost, use estimated
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
    console.log('maybeChargeImageSuccess: spending balance', cost, 'source', source);
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
    
    // Read body FIRST, before anything else, and save billing payload
    let body = null;
    let billingPayload = null;
    const billingRequestClone = request.clone();
    
    if (method !== 'GET' && method !== 'HEAD') {
        body = await request.arrayBuffer();
        billingPayload = await getBillingPayload(billingRequestClone, path);
        console.log('MF proxy: billingPayload', billingPayload);
    }

    const headers = buildUpstreamHeaders(request);
    const init = {
        method,
        headers,
        redirect: 'manual',
    };

    if (body) {
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
            await maybeChargeImageSuccess(billingRequestClone, path, data, billingPayload);
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
