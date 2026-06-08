import { NextResponse } from 'next/server';

const MEMEFAST_BASE_URL = 'https://memefast.top';

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
