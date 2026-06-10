import { NextResponse } from 'next/server';

const YANDEX_USERINFO_URL = 'https://login.yandex.ru/info?format=json';

function getIncomingToken(request) {
    const auth = request.headers.get('authorization') || '';
    if (!auth) return '';

    if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
    if (auth.startsWith('OAuth ')) return auth.slice(6).trim();
    return auth.trim();
}

function normalizeProfile(profile) {
    const id = profile?.id || profile?.uid || null;
    const defaultEmail = profile?.default_email || null;
    const emails = Array.isArray(profile?.emails)
        ? profile.emails.filter(Boolean)
        : defaultEmail
            ? [defaultEmail]
            : [];
    const firstName = profile?.first_name || null;
    const lastName = profile?.last_name || null;
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || profile?.real_name || null;

    return {
        ...profile,
        sub: id,
        id,
        uid: profile?.uid || id,
        email: defaultEmail || emails[0] || null,
        emails,
        name: fullName,
        preferred_username: profile?.login || null,
    };
}

export async function GET(request) {
    const token = getIncomingToken(request);
    if (!token) {
        return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    const upstream = await fetch(YANDEX_USERINFO_URL, {
        method: 'GET',
        headers: {
            Authorization: `OAuth ${token}`,
            Accept: 'application/json',
        },
        cache: 'no-store',
    });

    const text = await upstream.text();
    let payload = null;

    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = null;
    }

    if (!upstream.ok) {
        return NextResponse.json(
            {
                error: 'Yandex userinfo request failed',
                upstream_status: upstream.status,
                upstream_body: payload || text || null,
            },
            { status: upstream.status }
        );
    }

    return NextResponse.json(normalizeProfile(payload || {}), {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
    });
}
