import { NextResponse } from 'next/server';
import { priceRub, ensureCnyRate, CNY_TO_RUB, loadPlatformMarkup } from '../../_lib/pricing';
import { BILLING_ENABLED, spendBalance, getUserForGallery } from '../../_lib/balance';
import { saveGalleryEntry } from '../../_lib/tosGallery';
import { buildImageChargeMeta, buildMfImageGalleryDedupeKey } from '../helpers.js';
import { verifyToken } from '@/lib/jwt';

// Debug: log env vars (without exposing secrets)
console.log('MF route init', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
  hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  billingEnabled: BILLING_ENABLED
});

const MEMEFAST_BASE_URL = 'https://memefast.top';
const TOKENGO_BASE_URL = 'https://tokengo.love';

// Map Memefast/studio model IDs → TokenGo model IDs
const TOKENGO_MODEL_MAP = {
  'gemini-3.1-flash-image-preview': 'gemini-3-flash-image',
  'gemini-3-pro-image-preview':     'gemini-3-pro-image',
  'gpt-image-2':                    'gpt-image-2.6-sunburst',
  'gpt-4o-mini-tts':                'tts-gpt-4o-mini',
};
function mapModelForTokenGo(model) {
  return TOKENGO_MODEL_MAP[model] || model;
}

// Returns true if the bearer token is a valid platform JWT (not a Memefast API key)
async function isPlatformJwt(token) {
    if (!token || token.length < 20) return false;
    try {
        const payload = await verifyToken(token);
        return !!(payload?.sub);
    } catch { return false; }
}

function normalizeModelId(raw) {
    return String(raw || '').split(':')[0].trim();
}

function extractFirstImageUrl(data) {
    const item = Array.isArray(data?.data) ? data.data[0] : null;
    return item?.url || data?.url || data?.output?.url || data?.outputs?.[0] || '';
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
    
    let cost = 10;
    let source = 'fixed';
    console.log('maybeChargeImageSuccess: fixed cost 10 RUB');

    if (!(cost > 0)) {
        console.log('maybeChargeImageSuccess: no cost');
        return null;
    }

    await ensureCnyRate();
    console.log('maybeChargeImageSuccess: spending balance', cost, 'source', source);
    const charged = await spendBalance(
        request,
        cost,
        model,
        buildImageChargeMeta(pathParts, model, data),
    );

    if (!charged?.ok) {
        console.error('maybeChargeImageSuccess: failed to charge', charged);
    } else {
        console.log('maybeChargeImageSuccess: charged successfully', charged);
    }

    const imageUrl = extractFirstImageUrl(data);
    if (galleryUser?.id && imageUrl) {
        saveGalleryEntry({
            userId: galleryUser.id,
            url: imageUrl,
            type: 'image',
            model: model || '',
            prompt: payload?.params?.prompt || '',
            extra: {
                dedupeKey: buildMfImageGalleryDedupeKey(imageUrl),
            },
        }).catch(() => {});
    }

    return { cost, model, source };
}

function buildUpstreamUrl(request, pathParts, useTokengo) {
    const pathname = Array.isArray(pathParts) && pathParts.length ? `/${pathParts.join('/')}` : '/';
    const base = useTokengo ? TOKENGO_BASE_URL : MEMEFAST_BASE_URL;
    const url = new URL(pathname, base);
    const search = new URL(request.url).search;
    if (search) url.search = search;
    return url;
}

function getBearerKey(request) {
    const cookieKey = request.headers.get('cookie')?.match(/muapi_key=([^;]+)/)?.[1];
    const authHeader = request.headers.get('authorization');
    const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    return bearerKey || cookieKey || '';
}
// Keep old name for the billing code that calls it
function getApiKey(request) { return getBearerKey(request); }

function buildUpstreamHeaders(request, useTokengo) {
    const headers = new Headers(request.headers);
    if (useTokengo) {
        // Use server-side TokenGo key — never expose the client JWT upstream
        headers.set('Authorization', `Bearer ${process.env.TOKENGO_API_KEY || ''}`);
    } else {
        const apiKey = getBearerKey(request);
        if (apiKey) headers.set('Authorization', `Bearer ${apiKey}`);
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

// Convert Google v1beta generateContent request to OpenAI format for TokenGo.
// Returns { targetPath, body } where body is Uint8Array.
function convertGoogleToOpenAI(pathParts, billingPayload) {
    const rawModel = String(pathParts[2] || '');
    const model = mapModelForTokenGo(rawModel.replace(/:generateContent$/i, ''));
    const googleBody = billingPayload?.params || {};

    const prompt = (googleBody.contents || [])
        .flatMap(c => c.parts || [])
        .filter(p => p.text)
        .map(p => p.text)
        .join('\n');

    if (/image/i.test(model)) {
        return {
            targetPath: ['v1', 'images', 'generations'],
            body: new TextEncoder().encode(JSON.stringify({ model, prompt, n: 1 })),
        };
    }
    return {
        targetPath: ['v1', 'chat', 'completions'],
        body: new TextEncoder().encode(JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
        })),
    };
}

async function proxyRequest(request, { params }) {
    const { path = [] } = await params;
    const method = request.method.toUpperCase();

    // If the Authorization header carries a valid platform JWT, route to TokenGo
    // using the server-side TOKENGO_API_KEY. This lets logged-in users generate
    // without needing a Memefast/MuAPI key.
    const bearerToken = getBearerKey(request);
    const useTokengo = !!(process.env.TOKENGO_API_KEY) && await isPlatformJwt(bearerToken);

    // Read body FIRST, before anything else, and save billing payload
    let body = null;
    let billingPayload = null;
    const billingRequestClone = request.clone();

    if (method !== 'GET' && method !== 'HEAD') {
        body = await request.arrayBuffer();
        billingPayload = await getBillingPayload(billingRequestClone, path);
        console.log('MF proxy: billingPayload', billingPayload);
    }

    // When routing to TokenGo: convert formats and remap model IDs
    let targetPath = path;
    if (useTokengo && method === 'POST') {
        if (path[0] === 'v1beta' && path[1] === 'models') {
            // Google v1beta → OpenAI format
            const converted = convertGoogleToOpenAI(path, billingPayload);
            targetPath = converted.targetPath;
            body = converted.body;
            console.log('MF proxy: converted v1beta to OpenAI', { targetPath, model: billingPayload?.model });
        } else if (billingPayload?.model && TOKENGO_MODEL_MAP[billingPayload.model]) {
            // OpenAI format but model ID needs remapping (e.g. gpt-image-2 → gpt-image-2.6-sunburst)
            const mapped = mapModelForTokenGo(billingPayload.model);
            const newBodyObj = { ...billingPayload.params, model: mapped };
            body = new TextEncoder().encode(JSON.stringify(newBodyObj));
            console.log('MF proxy: remapped model for TokenGo', { from: billingPayload.model, to: mapped });
        }
    }

    const upstreamUrl = buildUpstreamUrl(request, targetPath, useTokengo);
    const headers = buildUpstreamHeaders(request, useTokengo);
    // When body was converted (v1beta→OpenAI), enforce JSON content-type
    if (targetPath !== path) headers.set('content-type', 'application/json');
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
            try {
                await maybeChargeImageSuccess(billingRequestClone, path, data, billingPayload);
            } catch (postProcessError) {
                console.error('Image post-processing failed:', postProcessError);
            }
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
