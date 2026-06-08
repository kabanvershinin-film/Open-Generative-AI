import { NextResponse } from 'next/server';

// Require Supabase auth on generation routes when Supabase is configured.
const AUTH_REQUIRED = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

function hasAuthToken(request) {
    const cookie = request.headers.get('cookie') || '';
    if (cookie.includes('sb_access_token=')) return true;
    return !!request.headers.get('x-sb-token');
}

export function middleware(request) {
    const url = request.nextUrl;

    // Keep auth protection for /api/mf/*, but let the local route handler proxy
    // the request server-side instead of relying on Vercel external rewrites.
    if (url.pathname.startsWith('/api/mf/')) {
        if (AUTH_REQUIRED && !hasAuthToken(request)) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Войдите в аккаунт, чтобы генерировать.' },
                { status: 401 },
            );
        }
        return NextResponse.next();
    }

    // Catch requests to /api/workflow, /api/app, and /api/v1 (legacy Muapi paths)
    const isMuApi = url.pathname.startsWith('/api/workflow') ||
                    url.pathname.startsWith('/api/app') ||
                    url.pathname.startsWith('/api/v1');

    if (isMuApi) {
        const isHandledByRoute = url.pathname.startsWith('/api/v1/creative-agent') ||
                                url.pathname.startsWith('/api/v1/get_upload_url') ||
                                url.pathname.startsWith('/api/v1/upload-binary');

        if (url.pathname.startsWith('/api/v1') && !isHandledByRoute) {
            const targetUrl = new URL(url.pathname + url.search, 'https://api.muapi.ai');
            return NextResponse.rewrite(targetUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/mf/:path*',
        '/api/workflow/:path*',
        '/api/app/:path*',
        '/api/v1/:path*'
    ],
};
