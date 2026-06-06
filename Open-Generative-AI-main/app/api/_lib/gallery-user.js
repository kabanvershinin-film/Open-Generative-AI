import { createHash } from 'crypto';
import { getUserForGallery } from './balance.js';

function extractApiKey(request) {
    if (!request?.headers) return '';
    const headers = request.headers;
    const auth = headers.get('authorization');
    if (auth) {
        const match = auth.match(/^bearer\s+(.+)$/i);
        if (match && match[1]) {
            const token = match[1].trim();
            if (token) return token;
        }
    }
    for (const name of ['x-api-key', 'x-muapi-key']) {
        const value = headers.get(name);
        if (value) {
            const trimmed = value.trim();
            if (trimmed) return trimmed;
        }
    }
    const cookie = headers.get('cookie');
    if (cookie) {
        const match = cookie.match(/(?:^|;\s*)muapi_key=([^;]+)/);
        if (match && match[1]) {
            try {
                const decoded = decodeURIComponent(match[1]);
                if (decoded) return decoded;
            } catch {
                const fallback = match[1].trim();
                if (fallback) return fallback;
            }
        }
    }
    return '';
}

async function resolveGalleryUser(request) {
    const supabaseUser = await getUserForGallery(request);
    if (supabaseUser?.id) {
        return { id: supabaseUser.id, source: 'supabase' };
    }
    const key = extractApiKey(request);
    if (key) {
        const hashed = createHash('sha256').update(key).digest('hex').slice(0, 32);
        return { id: `ak_${hashed}`, source: 'apiKey' };
    }
    return { id: null, source: 'none' };
}

export { extractApiKey, resolveGalleryUser };
